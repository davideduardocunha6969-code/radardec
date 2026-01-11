import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Planilha de dados comerciais
const SHEET_ID = '1XJLkFSFVYT3lkugy4Dwyp68xsa0QTsMxP57yAhnWycA';
const MAIN_GID = 0;
const SDR_GID = 1631515229;
const SDR_MESSAGES_GID = 686842485;
const INDICACOES_GID = 290508236;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching commercial data from Google Spreadsheet...');
    
    // Fetch main commercial sheet
    const mainCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${MAIN_GID}`;
    console.log(`Fetching commercial sheet (gid=${MAIN_GID})...`);
    
    const mainResponse = await fetch(mainCsvUrl);
    
    if (!mainResponse.ok) {
      throw new Error('Commercial sheet not found or inaccessible');
    }
    
    const mainCsvText = await mainResponse.text();
    
    if (!mainCsvText || mainCsvText.trim().length < 10) {
      throw new Error('Commercial sheet is empty');
    }
    
    const mainRows = parseCSV(mainCsvText);
    
    if (mainRows.length < 2) {
      throw new Error('Commercial sheet has no data rows');
    }
    
    const headers = mainRows[0];
    const dataRows = mainRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
    
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
    
    // Log de exemplo para debug do ano de aposentadoria
    const exemploComAno = commercialData.find(d => d.anoAposentadoriaFutura);
    if (exemploComAno) {
      console.log('Exemplo com ano aposentadoria:', exemploComAno.cliente, '-', exemploComAno.anoAposentadoriaFutura);
    }
    
    // Extrai as semanas únicas disponíveis
    const uniqueWeeks = [...new Set(commercialData.map(d => d.semana).filter(w => w > 0))].sort((a, b) => a - b);
    
    console.log(`Found ${uniqueWeeks.length} unique weeks:`, uniqueWeeks);
    
    // Fetch SDR sheet (GID 1631515229)
    let sdrData: any[] = [];
    let sdrHeaders: string[] = [];
    let sdrWeeks: number[] = [];
    
    try {
      const sdrCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SDR_GID}`;
      console.log(`Fetching SDR sheet (gid=${SDR_GID})...`);
      
      const sdrResponse = await fetch(sdrCsvUrl);
      
      if (sdrResponse.ok) {
        const sdrCsvText = await sdrResponse.text();
        
        if (sdrCsvText && sdrCsvText.trim().length > 10) {
          const sdrRows = parseCSV(sdrCsvText);
          
          if (sdrRows.length >= 2) {
            sdrHeaders = sdrRows[0];
            const sdrDataRows = sdrRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found SDR sheet with ${sdrDataRows.length} rows`);
            console.log('SDR Headers:', sdrHeaders);
            
            // Mapeia os dados SDR - ajustar conforme estrutura real da aba
            // Por enquanto, assumimos estrutura similar ou mapeamos todas as colunas disponíveis
            sdrData = sdrDataRows.map(row => ({
              colA: (row[0] || '').trim(),
              colB: (row[1] || '').trim(),
              colC: (row[2] || '').trim(),
              colD: (row[3] || '').trim(),
              colE: (row[4] || '').trim(),
              colF: (row[5] || '').trim(),
              colG: (row[6] || '').trim(),
              colH: (row[7] || '').trim(),
              colI: (row[8] || '').trim(),
              colJ: (row[9] || '').trim(),
              colK: (row[10] || '').trim(),
              colL: (row[11] || '').trim(),
              colM: (row[12] || '').trim(),
              colN: (row[13] || '').trim(),
              colO: (row[14] || '').trim(),
              colP: (row[15] || '').trim(),
              colQ: (row[16] || '').trim(),
              colR: (row[17] || '').trim(),
              colS: (row[18] || '').trim(),
              colT: (row[19] || '').trim(),
              rawRow: row
            }));
            
            // Extrai semanas do SDR se houver coluna de semana
            const sdrWeeksSet = new Set<number>();
            sdrData.forEach(d => {
              const weekNum = parseInt(d.colE) || 0;
              if (weekNum > 0) sdrWeeksSet.add(weekNum);
            });
            sdrWeeks = [...sdrWeeksSet].sort((a, b) => a - b);
            
            console.log(`SDR data loaded: ${sdrData.length} records, ${sdrWeeks.length} weeks`);
          }
        }
      } else {
        console.log('SDR sheet not accessible, continuing without it');
      }
    } catch (sdrError) {
      console.error('Error fetching SDR sheet:', sdrError);
      // Continue without SDR data
    }
    
    // Fetch SDR Messages sheet (GID 686842485)
    // Coluna A = Semana, demais colunas = SDRs (nomes no cabeçalho)
    let sdrMessagesData: any[] = [];
    let sdrMessagesSdrNames: string[] = [];
    
    try {
      const sdrMsgCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SDR_MESSAGES_GID}`;
      console.log(`Fetching SDR Messages sheet (gid=${SDR_MESSAGES_GID})...`);
      
      const sdrMsgResponse = await fetch(sdrMsgCsvUrl);
      
      if (sdrMsgResponse.ok) {
        const sdrMsgCsvText = await sdrMsgResponse.text();
        
        if (sdrMsgCsvText && sdrMsgCsvText.trim().length > 10) {
          const sdrMsgRows = parseCSV(sdrMsgCsvText);
          
          if (sdrMsgRows.length >= 2) {
            const sdrMsgHeaders = sdrMsgRows[0];
            const sdrMsgDataRows = sdrMsgRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found SDR Messages sheet with ${sdrMsgDataRows.length} rows`);
            console.log('SDR Messages Headers:', sdrMsgHeaders);
            
            // Extrai nomes dos SDRs a partir das colunas B em diante (índice 1+)
            sdrMessagesSdrNames = sdrMsgHeaders.slice(1).map(h => h.trim()).filter(h => h !== '');
            console.log('SDR Names from headers:', sdrMessagesSdrNames);
            
            // Mapeia os dados de mensagens por SDR dinamicamente
            sdrMessagesData = sdrMsgDataRows.map(row => {
              const record: Record<string, any> = {
                semana: (row[0] || '').trim(),
              };
              
              // Adiciona cada SDR como propriedade dinâmica
              sdrMessagesSdrNames.forEach((sdrName, index) => {
                const colIndex = index + 1; // Colunas B, C, D... são índices 1, 2, 3...
                const value = parseInt((row[colIndex] || '0').replace(/[^\d]/g, '')) || 0;
                record[sdrName] = value;
              });
              
              return record;
            }).filter(d => d.semana !== '');
            
            console.log(`SDR Messages data loaded: ${sdrMessagesData.length} records for ${sdrMessagesSdrNames.length} SDRs`);
          }
        }
      } else {
        console.log('SDR Messages sheet not accessible, continuing without it');
      }
    } catch (sdrMsgError) {
      console.error('Error fetching SDR Messages sheet:', sdrMsgError);
      // Continue without SDR Messages data
    }
    
    // Fetch Indicações sheet (GID 290508236)
    // Coluna A = Cliente que indicou, Coluna B = Ação ganha, Coluna C = Responsável, Coluna D = Semana
    let indicacoesData: any[] = [];
    
    try {
      const indicacoesCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${INDICACOES_GID}`;
      console.log(`Fetching Indicações sheet (gid=${INDICACOES_GID})...`);
      
      const indicacoesResponse = await fetch(indicacoesCsvUrl);
      
      if (indicacoesResponse.ok) {
        const indicacoesCsvText = await indicacoesResponse.text();
        
        if (indicacoesCsvText && indicacoesCsvText.trim().length > 10) {
          const indicacoesRows = parseCSV(indicacoesCsvText);
          
          if (indicacoesRows.length >= 2) {
            const indicacoesHeaders = indicacoesRows[0];
            const indicacoesDataRows = indicacoesRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Indicações sheet with ${indicacoesDataRows.length} rows`);
            console.log('Indicações Headers:', indicacoesHeaders);
            
            // Mapeia os dados de indicações
            indicacoesData = indicacoesDataRows.map(row => ({
              clienteIndicador: (row[0] || '').trim(),
              acaoGanha: (row[1] || '').trim(),
              responsavel: (row[2] || '').trim(),
              semana: (row[3] || '').trim(),
            })).filter(d => d.clienteIndicador !== '' || d.responsavel !== '');
            
            console.log(`Indicações data loaded: ${indicacoesData.length} records`);
          }
        }
      } else {
        console.log('Indicações sheet not accessible, continuing without it');
      }
    } catch (indicacoesError) {
      console.error('Error fetching Indicações sheet:', indicacoesError);
      // Continue without Indicações data
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          records: commercialData,
          weeks: uniqueWeeks,
          totalRecords: commercialData.length,
          headers,
          sdrRecords: sdrData,
          sdrHeaders,
          sdrWeeks,
          sdrTotalRecords: sdrData.length,
          sdrMessagesData,
          sdrMessagesSdrNames,
          indicacoesData,
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
