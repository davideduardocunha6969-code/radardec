import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Planilha de dados comerciais
const SHEET_ID = '1XJLkFSFVYT3lkugy4Dwyp68xsa0QTsMxP57yAhnWycA';
const MAIN_GID = 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching commercial data from Google Spreadsheet...');
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${MAIN_GID}`;
    console.log(`Fetching commercial sheet (gid=${MAIN_GID})...`);
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error('Commercial sheet not found or inaccessible');
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length < 10) {
      throw new Error('Commercial sheet is empty');
    }
    
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      throw new Error('Commercial sheet has no data rows');
    }
    
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
    
    console.log(`Found commercial sheet with ${dataRows.length} rows`);
    console.log('Headers:', headers);
    
    // Mapeia os dados comerciais
    // Coluna A (0) = RESPONSAVEL
    // Coluna B (1) = SDR
    // Coluna C (2) = DATA ATENDIMENTO
    // Coluna D (3) = Data Fechamento
    // Coluna E (4) = SEMANA
    // Coluna F (5) = CLIENTE
    // Coluna G (6) = MODALIDADE DE ATENDIMENTO
    // Coluna H (7) = SETOR
    // Coluna I (8) = PRODUTO
    // Coluna J (9) = POSSUI DIREITO
    // Coluna K (10) = ORIGEM CLIENTE
    // Coluna L (11) = HONORÁRIOS DE ÊXITO ESTIMADOS
    // Coluna M (12) = HONORÁRIOS INICIAIS
    // Coluna N (13) = TEMPO PARA FECHAMENTO
    // Coluna O (14) = RESULTADO
    // Coluna P (15) = CADÊNCIA
    // Coluna Q (16) = ANO APOSENTADORIA FUTURA
    
    const commercialData = dataRows.map(row => ({
      responsavel: (row[0] || '').trim(),
      sdr: (row[1] || '').trim(),
      dataAtendimento: (row[2] || '').trim(),
      dataFechamento: (row[3] || '').trim(),
      semana: parseInt((row[4] || '0').trim()) || 0,
      cliente: (row[5] || '').trim(),
      modalidade: (row[6] || '').trim(),
      setor: (row[7] || '').trim(),
      produto: (row[8] || '').trim(),
      possuiDireito: (row[9] || '').trim().toUpperCase(),
      origemCliente: (row[10] || '').trim(),
      honorariosExito: parseFloat((row[11] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
      honorariosIniciais: parseFloat((row[12] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
      tempoFechamento: parseInt((row[13] || '0').trim()) || 0,
      resultado: (row[14] || '').trim(),
      cadencia: (row[15] || '').trim(),
      anoAposentadoriaFutura: (row[16] || '').trim(),
      rawRow: row
    }));
    
    // Extrai as semanas únicas disponíveis
    const uniqueWeeks = [...new Set(commercialData.map(d => d.semana).filter(w => w > 0))].sort((a, b) => a - b);
    
    console.log(`Found ${uniqueWeeks.length} unique weeks:`, uniqueWeeks);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          records: commercialData,
          weeks: uniqueWeeks,
          totalRecords: commercialData.length,
          headers,
          lastUpdated: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching commercial sheet:', error);
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
