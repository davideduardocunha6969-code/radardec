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
const INDICACOES_RECEBIDAS_GID = 2087539342;
const SANEAMENTO_GID = 1874749978;
const ADMINISTRATIVO_GID = 651337262;
const ADMINISTRATIVO2_GID = 1905290884;
const TESTEMUNHAS_GID = 774111166;
const DOCUMENTOS_FISICOS_GID = 186802545;

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
    
    // Fetch Indicações Recebidas sheet (GID 2087539342)
    // Coluna A = Responsável, Coluna B = Semana, Coluna E = Resultado
    let indicacoesRecebidasData: any[] = [];
    
    try {
      const indicacoesRecebidasCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${INDICACOES_RECEBIDAS_GID}`;
      console.log(`Fetching Indicações Recebidas sheet (gid=${INDICACOES_RECEBIDAS_GID})...`);
      
      const indicacoesRecebidasResponse = await fetch(indicacoesRecebidasCsvUrl);
      
      if (indicacoesRecebidasResponse.ok) {
        const indicacoesRecebidasCsvText = await indicacoesRecebidasResponse.text();
        
        if (indicacoesRecebidasCsvText && indicacoesRecebidasCsvText.trim().length > 10) {
          const indicacoesRecebidasRows = parseCSV(indicacoesRecebidasCsvText);
          
          if (indicacoesRecebidasRows.length >= 2) {
            const indicacoesRecebidasHeaders = indicacoesRecebidasRows[0];
            const indicacoesRecebidasDataRows = indicacoesRecebidasRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Indicações Recebidas sheet with ${indicacoesRecebidasDataRows.length} rows`);
            console.log('Indicações Recebidas Headers:', indicacoesRecebidasHeaders);
            
            // Mapeia os dados de indicações recebidas
            indicacoesRecebidasData = indicacoesRecebidasDataRows.map(row => ({
              responsavel: (row[0] || '').trim(),   // Coluna A
              semana: (row[1] || '').trim(),        // Coluna B
              resultado: (row[4] || '').trim(),     // Coluna E
            })).filter(d => d.responsavel !== '');
            
            console.log(`Indicações Recebidas data loaded: ${indicacoesRecebidasData.length} records`);
          }
        }
      } else {
        console.log('Indicações Recebidas sheet not accessible, continuing without it');
      }
    } catch (indicacoesRecebidasError) {
      console.error('Error fetching Indicações Recebidas sheet:', indicacoesRecebidasError);
      // Continue without Indicações Recebidas data
    }
    
    // Fetch Saneamento de Pastas sheet (GID 1874749978)
    let saneamentoData: any[] = [];
    let saneamentoHeaders: string[] = [];
    
    try {
      const saneamentoCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SANEAMENTO_GID}`;
      console.log(`Fetching Saneamento sheet (gid=${SANEAMENTO_GID})...`);
      
      const saneamentoResponse = await fetch(saneamentoCsvUrl);
      
      if (saneamentoResponse.ok) {
        const saneamentoCsvText = await saneamentoResponse.text();
        
        if (saneamentoCsvText && saneamentoCsvText.trim().length > 10) {
          const saneamentoRows = parseCSV(saneamentoCsvText);
          
          if (saneamentoRows.length >= 2) {
            saneamentoHeaders = saneamentoRows[0].map(h => h.trim());
            const saneamentoDataRows = saneamentoRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Saneamento sheet with ${saneamentoDataRows.length} rows`);
            console.log('Saneamento Headers:', saneamentoHeaders);
            
            // Mapeia os dados com colunas genéricas
            saneamentoData = saneamentoDataRows.map(row => {
              const record: Record<string, any> = {};
              saneamentoHeaders.forEach((header, index) => {
                record[`col${String.fromCharCode(65 + index)}`] = (row[index] || '').trim();
              });
              return record;
            });
            
            console.log(`Saneamento data loaded: ${saneamentoData.length} records`);
          }
        }
      } else {
        console.log('Saneamento sheet not accessible, continuing without it');
      }
    } catch (saneamentoError) {
      console.error('Error fetching Saneamento sheet:', saneamentoError);
      // Continue without Saneamento data
    }
    
    // Fetch Administrativo sheet (GID 651337262)
    let administrativoData: any[] = [];
    let administrativoHeaders: string[] = [];
    
    try {
      const administrativoCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${ADMINISTRATIVO_GID}`;
      console.log(`Fetching Administrativo sheet (gid=${ADMINISTRATIVO_GID})...`);
      
      const administrativoResponse = await fetch(administrativoCsvUrl);
      
      if (administrativoResponse.ok) {
        const administrativoCsvText = await administrativoResponse.text();
        
        if (administrativoCsvText && administrativoCsvText.trim().length > 10) {
          const administrativoRows = parseCSV(administrativoCsvText);
          
          if (administrativoRows.length >= 2) {
            administrativoHeaders = administrativoRows[0].map(h => h.trim());
            const administrativoDataRows = administrativoRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Administrativo sheet with ${administrativoDataRows.length} rows`);
            console.log('Administrativo Headers:', administrativoHeaders);
            
            // Mapeia os dados com colunas genéricas
            administrativoData = administrativoDataRows.map(row => {
              const record: Record<string, any> = {};
              administrativoHeaders.forEach((header, index) => {
                record[`col${String.fromCharCode(65 + index)}`] = (row[index] || '').trim();
              });
              return record;
            });
            
            console.log(`Administrativo data loaded: ${administrativoData.length} records`);
          }
        }
      } else {
        console.log('Administrativo sheet not accessible, continuing without it');
      }
    } catch (administrativoError) {
      console.error('Error fetching Administrativo sheet:', administrativoError);
      // Continue without Administrativo data
    }
    
    // Fetch Administrativo 2 sheet (GID 1905290884)
    let administrativo2Data: any[] = [];
    let administrativo2Headers: string[] = [];
    
    try {
      const administrativo2CsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${ADMINISTRATIVO2_GID}`;
      console.log(`Fetching Administrativo 2 sheet (gid=${ADMINISTRATIVO2_GID})...`);
      
      const administrativo2Response = await fetch(administrativo2CsvUrl);
      
      if (administrativo2Response.ok) {
        const administrativo2CsvText = await administrativo2Response.text();
        
        if (administrativo2CsvText && administrativo2CsvText.trim().length > 10) {
          const administrativo2Rows = parseCSV(administrativo2CsvText);
          
          if (administrativo2Rows.length >= 2) {
            administrativo2Headers = administrativo2Rows[0].map(h => h.trim());
            const administrativo2DataRows = administrativo2Rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Administrativo 2 sheet with ${administrativo2DataRows.length} rows`);
            console.log('Administrativo 2 Headers:', administrativo2Headers);
            
            // Mapeia os dados com colunas genéricas
            administrativo2Data = administrativo2DataRows.map(row => {
              const record: Record<string, any> = {};
              administrativo2Headers.forEach((header, index) => {
                record[`col${String.fromCharCode(65 + index)}`] = (row[index] || '').trim();
              });
              return record;
            });
            
            console.log(`Administrativo 2 data loaded: ${administrativo2Data.length} records`);
          }
        }
      } else {
        console.log('Administrativo 2 sheet not accessible, continuing without it');
      }
    } catch (administrativo2Error) {
      console.error('Error fetching Administrativo 2 sheet:', administrativo2Error);
      // Continue without Administrativo 2 data
    }
    
    // Fetch Testemunhas sheet (GID 774111166)
    // Coluna A = Semana, Coluna F = Status Aposentadoria, Coluna G = Tempo Contribuição
    // Coluna H = Trabalhou Agricultura, Coluna I = Lead Qualificado, Coluna J = SDR, Coluna K = Resultado
    let testemunhasData: any[] = [];
    let testemunhasHeaders: string[] = [];
    
    try {
      const testemunhasCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${TESTEMUNHAS_GID}`;
      console.log(`Fetching Testemunhas sheet (gid=${TESTEMUNHAS_GID})...`);
      
      const testemunhasResponse = await fetch(testemunhasCsvUrl);
      
      if (testemunhasResponse.ok) {
        const testemunhasCsvText = await testemunhasResponse.text();
        
        if (testemunhasCsvText && testemunhasCsvText.trim().length > 10) {
          const testemunhasRows = parseCSV(testemunhasCsvText);
          
          if (testemunhasRows.length >= 2) {
            testemunhasHeaders = testemunhasRows[0].map(h => h.trim());
            const testemunhasDataRows = testemunhasRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Testemunhas sheet with ${testemunhasDataRows.length} rows`);
            console.log('Testemunhas Headers:', testemunhasHeaders);
            
            // Mapeia os dados com colunas genéricas
            testemunhasData = testemunhasDataRows.map(row => {
              const record: Record<string, any> = {};
              testemunhasHeaders.forEach((header, index) => {
                record[`col${String.fromCharCode(65 + index)}`] = (row[index] || '').trim();
              });
              return record;
            });
            
            console.log(`Testemunhas data loaded: ${testemunhasData.length} records`);
          }
        }
      } else {
        console.log('Testemunhas sheet not accessible, continuing without it');
      }
    } catch (testemunhasError) {
      console.error('Error fetching Testemunhas sheet:', testemunhasError);
      // Continue without Testemunhas data
    }
    
    // Fetch Documentos Fisicos sheet (GID 186802545)
    // Coluna A = Nome do cliente, Coluna F = Digitalizado/Descartado (SIM), Coluna G = Entregue ao Cliente (SIM)
    let documentosFisicosData: any[] = [];
    let documentosFisicosHeaders: string[] = [];
    
    try {
      const documentosFisicosCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${DOCUMENTOS_FISICOS_GID}`;
      console.log(`Fetching Documentos Fisicos sheet (gid=${DOCUMENTOS_FISICOS_GID})...`);
      
      const documentosFisicosResponse = await fetch(documentosFisicosCsvUrl);
      
      if (documentosFisicosResponse.ok) {
        const documentosFisicosCsvText = await documentosFisicosResponse.text();
        
        if (documentosFisicosCsvText && documentosFisicosCsvText.trim().length > 10) {
          const documentosFisicosRows = parseCSV(documentosFisicosCsvText);
          
          if (documentosFisicosRows.length >= 2) {
            documentosFisicosHeaders = documentosFisicosRows[0].map(h => h.trim());
            const documentosFisicosDataRows = documentosFisicosRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Documentos Fisicos sheet with ${documentosFisicosDataRows.length} rows`);
            console.log('Documentos Fisicos Headers:', documentosFisicosHeaders);
            
            // Mapeia os dados com colunas genéricas
            documentosFisicosData = documentosFisicosDataRows.map(row => {
              const record: Record<string, any> = {};
              documentosFisicosHeaders.forEach((header, index) => {
                record[`col${String.fromCharCode(65 + index)}`] = (row[index] || '').trim();
              });
              return record;
            });
            
            console.log(`Documentos Fisicos data loaded: ${documentosFisicosData.length} records`);
          }
        }
      } else {
        console.log('Documentos Fisicos sheet not accessible, continuing without it');
      }
    } catch (documentosFisicosError) {
      console.error('Error fetching Documentos Fisicos sheet:', documentosFisicosError);
      // Continue without Documentos Fisicos data
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
          indicacoesRecebidasData,
          saneamentoData,
          saneamentoHeaders,
          administrativoData,
          administrativoHeaders,
          administrativo2Data,
          administrativo2Headers,
          testemunhasData,
          testemunhasHeaders,
          documentosFisicosData,
          documentosFisicosHeaders,
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
