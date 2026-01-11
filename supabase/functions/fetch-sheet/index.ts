import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1zjLZCxj5FgwrzmUX2Jn3H7PUXBoTABQO_aRAXADyN5M';

// Aba principal com todas as tarefas (GID 0)
const MAIN_SHEET_GID = 0;

// Aba de mapeamento de tipos de ação -> setores
const SECTOR_MAPPING_GID = 1319762905;

// Aba de erros de conformidade (GID 1590941680)
const CONFORMITY_ERRORS_GID = 1590941680;

// Aba de erros de prazo (GID 1397357779)
const DEADLINE_ERRORS_GID = 1397357779;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching main sheet from Google Spreadsheet...');
    
    // Busca a aba principal (GID 0) com todas as tarefas
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${MAIN_SHEET_GID}`;
    console.log(`Fetching main sheet (gid=${MAIN_SHEET_GID})...`);
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error('Main sheet not found or inaccessible');
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length < 10) {
      throw new Error('Main sheet is empty');
    }
    
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      throw new Error('Main sheet has no data rows');
    }
    
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
    
    console.log(`Found main sheet with ${dataRows.length} rows`);
    
    const mainSheet = {
      name: "TAREFAS",
      headers,
      rows: dataRows
    };
    
    // Busca a aba de mapeamento de setores
    let sectorMapping: { tipoAcao: string; setor: string }[] = [];
    try {
      const sectorUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SECTOR_MAPPING_GID}`;
      console.log(`Fetching sector mapping (gid=${SECTOR_MAPPING_GID})...`);
      
      const sectorResponse = await fetch(sectorUrl);
      
      if (sectorResponse.ok) {
        const csvText = await sectorResponse.text();
        const rows = parseCSV(csvText);
        
        // Pula o header e mapeia coluna A -> B
        sectorMapping = rows.slice(1)
          .filter(row => row[0] && row[1])
          .map(row => ({
            tipoAcao: row[0].trim().toUpperCase(),
            setor: row[1].trim()
          }));
        
        console.log(`Found ${sectorMapping.length} sector mappings`);
      }
    } catch (err) {
      console.log('Error fetching sector mapping:', err);
    }
    
    // Busca a aba de erros de conformidade
    let conformityErrors: { date: string; recipient: string; rawRow: string[] }[] = [];
    try {
      const conformityUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${CONFORMITY_ERRORS_GID}`;
      console.log(`Fetching conformity errors (gid=${CONFORMITY_ERRORS_GID})...`);
      
      const conformityResponse = await fetch(conformityUrl);
      
      if (conformityResponse.ok) {
        const csvText = await conformityResponse.text();
        const rows = parseCSV(csvText);
        
        // Pula o header
        // Coluna B (1) = Data do erro
        // Coluna K (10) = Destinatário
        conformityErrors = rows.slice(1)
          .filter(row => row.some(cell => cell.trim() !== ''))
          .map(row => ({
            date: row[1] || '',
            recipient: (row[10] || '').trim(),
            rawRow: row
          }));
        
        console.log(`Found ${conformityErrors.length} conformity errors`);
      }
    } catch (err) {
      console.log('Error fetching conformity errors:', err);
    }
    
    // Busca a aba de erros de prazo
    let deadlineErrors: { date: string; controller: string; processNumber: string; rawRow: string[] }[] = [];
    try {
      const deadlineUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${DEADLINE_ERRORS_GID}`;
      console.log(`Fetching deadline errors (gid=${DEADLINE_ERRORS_GID})...`);
      
      const deadlineResponse = await fetch(deadlineUrl);
      
      if (deadlineResponse.ok) {
        const csvText = await deadlineResponse.text();
        const rows = parseCSV(csvText);
        
        // Pula o header
        // Coluna B (1) = Data do erro
        // Coluna K (10) = Controller responsável
        // Coluna M (12) = Número do processo
        deadlineErrors = rows.slice(1)
          .filter(row => row.some(cell => cell.trim() !== ''))
          .map(row => ({
            date: row[1] || '',
            controller: (row[10] || '').trim(),
            processNumber: (row[12] || '').trim(),
            rawRow: row
          }));
        
        console.log(`Found ${deadlineErrors.length} deadline errors`);
      }
    } catch (err) {
      console.log('Error fetching deadline errors:', err);
    }
    
    // Calcula estatísticas agregadas
    const totalTasks = mainSheet.rows.length;
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sheets: [mainSheet],
          sectorMapping,
          conformityErrors,
          deadlineErrors,
          totalSheets: 1,
          totalTasks,
          totalConformityErrors: conformityErrors.length,
          totalDeadlineErrors: deadlineErrors.length,
          lastUpdated: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching sheets:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      if (char === '\r') i++;
    } else if (char !== '\r') {
      currentCell += char;
    }
  }
  
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}
