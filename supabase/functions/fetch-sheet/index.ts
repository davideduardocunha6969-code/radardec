import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1zjLZCxj5FgwrzmUX2Jn3H7PUXBoTABQO_aRAXADyN5M';

// Mapeamento de GIDs para nomes dos colaboradores
const SHEET_CONFIG = [
  { gid: 0, name: "DANIEL ARAÚJO" },
  { gid: 168471298, name: "ANA GIUSTI" },
  { gid: 1165923131, name: "Laura Radaspiel" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching all sheets from Google Spreadsheet...');
    
    const allSheets: { name: string; headers: string[]; rows: string[][] }[] = [];
    
    // Busca cada aba usando o mapeamento de GID -> nome
    for (const config of SHEET_CONFIG) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${config.gid}`;
        console.log(`Fetching "${config.name}" (gid=${config.gid})...`);
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          console.log(`Sheet "${config.name}" (gid=${config.gid}) not found or inaccessible`);
          continue;
        }
        
        const csvText = await response.text();
        
        // Verifica se tem conteúdo válido
        if (!csvText || csvText.trim().length < 10) {
          console.log(`Sheet "${config.name}" is empty`);
          continue;
        }
        
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) {
          console.log(`Sheet "${config.name}" has no data rows`);
          continue;
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
        
        console.log(`Found sheet "${config.name}" with ${dataRows.length} rows`);
        
        allSheets.push({
          name: config.name,
          headers,
          rows: dataRows
        });
        
      } catch (err) {
        console.log(`Error fetching "${config.name}":`, err);
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
