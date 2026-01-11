import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1zjLZCxj5FgwrzmUX2Jn3H7PUXBoTABQO_aRAXADyN5M';

// Lista de GIDs conhecidos das abas (precisamos descobrir os GIDs reais)
// Por padrão, a primeira aba tem gid=0
const KNOWN_GIDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching all sheets from Google Spreadsheet...');
    
    const allSheets: { name: string; headers: string[]; rows: string[][] }[] = [];
    
    // Tenta buscar cada aba pelo GID
    for (const gid of KNOWN_GIDS) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
        console.log(`Fetching gid=${gid}...`);
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          console.log(`Sheet gid=${gid} not found or inaccessible`);
          continue;
        }
        
        const csvText = await response.text();
        
        // Verifica se tem conteúdo válido
        if (!csvText || csvText.trim().length < 10) {
          console.log(`Sheet gid=${gid} is empty`);
          continue;
        }
        
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) {
          console.log(`Sheet gid=${gid} has no data rows`);
          continue;
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
        
        // Tenta identificar o nome do colaborador (primeira coluna ou nome da aba)
        // Por convenção, usamos o primeiro valor único da primeira coluna como identificador
        let sheetName = `Colaborador ${gid + 1}`;
        
        // Se houver uma coluna de colaborador/responsável, usa o primeiro valor
        const colaboradorIndex = headers.findIndex(h => 
          h.toLowerCase().includes('colaborador') || 
          h.toLowerCase().includes('responsável') ||
          h.toLowerCase().includes('responsavel')
        );
        
        if (colaboradorIndex >= 0 && dataRows.length > 0) {
          const firstColaborador = dataRows[0][colaboradorIndex];
          if (firstColaborador && firstColaborador.trim()) {
            sheetName = firstColaborador.trim();
          }
        }
        
        console.log(`Found sheet "${sheetName}" with ${dataRows.length} rows`);
        
        allSheets.push({
          name: sheetName,
          headers,
          rows: dataRows
        });
        
      } catch (err) {
        console.log(`Error fetching gid=${gid}:`, err);
      }
    }
    
    if (allSheets.length === 0) {
      throw new Error('No sheets found in the spreadsheet');
    }
    
    console.log(`Successfully fetched ${allSheets.length} sheets`);
    
    // Calcula estatísticas agregadas
    const totalTasks = allSheets.reduce((acc, sheet) => acc + sheet.rows.length, 0);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sheets: allSheets,
          totalSheets: allSheets.length,
          totalTasks,
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
