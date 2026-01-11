import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1zjLZCxj5FgwrzmUX2Jn3H7PUXBoTABQO_aRAXADyN5M';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Google Sheet data...');
    
    // URL para exportar planilha pública como CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch sheet:', response.status, response.statusText);
      throw new Error(`Failed to fetch sheet: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('CSV data fetched successfully, parsing...');
    
    // Parse CSV
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      throw new Error('No data found in sheet');
    }
    
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
    
    console.log(`Parsed ${dataRows.length} rows with ${headers.length} columns`);
    console.log('Headers:', headers);
    
    // Calculate summary statistics
    const summary = calculateSummary(headers, dataRows);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          headers,
          rows: dataRows,
          summary,
          lastUpdated: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching sheet:', error);
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
  
  // Push last cell and row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}

function calculateSummary(headers: string[], rows: string[][]): Record<string, number> {
  const summary: Record<string, number> = {
    totalRows: rows.length,
  };
  
  // Try to find numeric columns and sum them
  headers.forEach((header, index) => {
    const lowerHeader = header.toLowerCase();
    
    // Check if this might be a value/money column
    if (lowerHeader.includes('valor') || 
        lowerHeader.includes('honorario') || 
        lowerHeader.includes('causa') ||
        lowerHeader.includes('total') ||
        lowerHeader.includes('proveito')) {
      
      let sum = 0;
      rows.forEach(row => {
        if (row[index]) {
          // Parse Brazilian currency format
          const value = parseFloat(
            row[index]
              .replace(/[R$\s]/g, '')
              .replace(/\./g, '')
              .replace(',', '.')
          );
          if (!isNaN(value)) {
            sum += value;
          }
        }
      });
      
      if (sum > 0) {
        summary[header] = sum;
      }
    }
  });
  
  return summary;
}
