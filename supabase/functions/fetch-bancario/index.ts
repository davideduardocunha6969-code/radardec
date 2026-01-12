import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Planilha de dados bancários
const SHEET_ID = '1EcJfg5-xr8YMMRVlnGgT8nKk0S3gE7RQvlnt58ErVHU';
const INICIAIS_GID = 0;
const SANEAMENTO_GID = 325813835;
const TRANSITO_JULGADO_GID = 642720152;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching bancario data from Google Spreadsheet...');
    
    // ===================== ABA 1: INICIAIS (GID 0) =====================
    let iniciaisData: any[] = [];
    let iniciaisHeaders: string[] = [];
    
    try {
      const iniciaisCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${INICIAIS_GID}`;
      console.log(`Fetching Iniciais sheet (gid=${INICIAIS_GID})...`);
      console.log(`URL: ${iniciaisCsvUrl}`);
      
      const iniciaisResponse = await fetch(iniciaisCsvUrl);
      
      console.log(`Iniciais response status: ${iniciaisResponse.status}`);
      
      if (iniciaisResponse.ok) {
        const iniciaisCsvText = await iniciaisResponse.text();
        
        console.log(`Iniciais CSV length: ${iniciaisCsvText.length}`);
        
        if (iniciaisCsvText && iniciaisCsvText.trim().length > 10) {
          const iniciaisRows = parseCSV(iniciaisCsvText);
          
          if (iniciaisRows.length >= 2) {
            iniciaisHeaders = iniciaisRows[0].map(h => h.trim());
            const iniciaisDataRows = iniciaisRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Iniciais sheet with ${iniciaisDataRows.length} rows`);
            console.log('Iniciais Headers:', iniciaisHeaders);
            
            // Mapeia os dados:
            // Coluna A (0) = Responsável (quem fez e protocolou)
            // Coluna B (1) = Tipo da Ação
            // Coluna C (2) = Semana do Ajuizamento
            // Coluna D (3) = Nome do Cliente
            // Coluna E (4) = Réu da Ação
            // Coluna F (5) = Estado de Domicílio
            // Coluna G (6) = Número do Processo
            iniciaisData = iniciaisDataRows.map(row => ({
              responsavel: (row[0] || '').trim(),
              tipoAcao: (row[1] || '').trim(),
              semana: parseInt((row[2] || '0').replace(/[^\d]/g, '')) || 0,
              cliente: (row[3] || '').trim(),
              reu: (row[4] || '').trim(),
              estado: (row[5] || '').trim(),
              numeroProcesso: (row[6] || '').trim(),
            }));
            
            console.log(`Iniciais data loaded: ${iniciaisData.length} records`);
          }
        } else {
          console.log('Iniciais CSV is empty or too short');
        }
      } else {
        const errorText = await iniciaisResponse.text();
        console.log(`Iniciais sheet not accessible - Status: ${iniciaisResponse.status}, Error: ${errorText.substring(0, 200)}`);
      }
    } catch (iniciaisError) {
      console.error('Error fetching Iniciais sheet:', iniciaisError);
    }
    
    // ===================== ABA 2: SANEAMENTO (GID 325813835) =====================
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
            
            // Mapeia os dados:
            // Coluna A (0) = Nome do Cliente
            // Coluna B (1) = Parte Contrária
            // Coluna G (6) = Número do Processo
            // Coluna I (8) = Quem fez a revisão
            // Coluna J (9) = Se foi revisada ("saneado")
            // Coluna K (10) = Resultado (Arquivado, Cível, Cumprimento de sentença)
            saneamentoData = saneamentoDataRows.map(row => ({
              cliente: (row[0] || '').trim(),
              parteContraria: (row[1] || '').trim(),
              numeroProcesso: (row[6] || '').trim(),
              revisor: (row[8] || '').trim(),
              status: (row[9] || '').trim(),
              resultado: (row[10] || '').trim(),
            }));
            
            console.log(`Saneamento data loaded: ${saneamentoData.length} records`);
          }
        }
      } else {
        console.log('Saneamento sheet not accessible');
      }
    } catch (saneamentoError) {
      console.error('Error fetching Saneamento sheet:', saneamentoError);
    }
    
    // ===================== ABA 3: TRÂNSITO EM JULGADO (GID 642720152) =====================
    let transitoData: any[] = [];
    let transitoHeaders: string[] = [];
    
    try {
      const transitoCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${TRANSITO_JULGADO_GID}`;
      console.log(`Fetching Transito sheet (gid=${TRANSITO_JULGADO_GID})...`);
      
      const transitoResponse = await fetch(transitoCsvUrl);
      
      if (transitoResponse.ok) {
        const transitoCsvText = await transitoResponse.text();
        
        if (transitoCsvText && transitoCsvText.trim().length > 10) {
          const transitoRows = parseCSV(transitoCsvText);
          
          if (transitoRows.length >= 2) {
            transitoHeaders = transitoRows[0].map(h => h.trim());
            const transitoDataRows = transitoRows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
            
            console.log(`Found Transito sheet with ${transitoDataRows.length} rows`);
            console.log('Transito Headers:', transitoHeaders);
            
            // Mapeia os dados:
            // Coluna A (0) = Situação Atual
            // Coluna B (1) = Nome do Autor
            // Coluna C (2) = Nome do Réu
            // Coluna D (3) = Tipo de Ação
            // Coluna E (4) = Número do Processo
            // Coluna F (5) = Estado
            // Coluna G (6) = Grau do Trânsito (1º, 2º, acordo)
            // Coluna H (7) = Data de Ajuizamento
            // Coluna I (8) = Data da Sentença
            // Coluna J (9) = Data do Acordo
            // Coluna K (10) = Data do Acórdão
            // Coluna L (11) = Desembargador Relator
            // Coluna M (12) = Câmara
            // Coluna N (13) = Resultado do Acórdão
            // Coluna R (17) = Data Cumprimento de Sentença
            // Coluna S (18) = Status Cumprimento de Sentença (ajuizado, etc)
            // Coluna T (19) = Valor Liquidação Estimada
            // Coluna U (20) = Valor Sucumbência Estimado
            // Coluna V (21) = Valor Honorários Êxito Estimados
            // Coluna W (22) = Valor Total Honorários
            // Coluna X (23) = Resultado Final
            // Coluna Y (24) = Data do Pagamento
            transitoData = transitoDataRows.map(row => ({
              situacaoAtual: (row[0] || '').trim(),
              autor: (row[1] || '').trim(),
              reu: (row[2] || '').trim(),
              tipoAcao: (row[3] || '').trim(),
              numeroProcesso: (row[4] || '').trim(),
              estado: (row[5] || '').trim(),
              grauTransito: (row[6] || '').trim(),
              dataAjuizamento: (row[7] || '').trim(),
              dataSentenca: (row[8] || '').trim(),
              dataAcordo: (row[9] || '').trim(),
              dataAcordao: (row[10] || '').trim(),
              relator: (row[11] || '').trim(),
              camara: (row[12] || '').trim(),
              resultadoAcordao: (row[13] || '').trim(),
              dataCumprimentoSentenca: (row[17] || '').trim(),
              statusCumprimentoSentenca: (row[18] || '').trim(),
              valorLiquidacao: parseBrazilianCurrency(row[19] || '0'),
              valorSucumbencia: parseBrazilianCurrency(row[20] || '0'),
              valorHonorariosExito: parseBrazilianCurrency(row[21] || '0'),
              valorTotalHonorarios: parseBrazilianCurrency(row[22] || '0'),
              resultadoFinal: (row[23] || '').trim(),
              dataPagamento: (row[24] || '').trim(),
            }));
            
            // Debug: log acordos e cumprimentos
            const acordos = transitoData.filter((r: any) => r.dataAcordo && /\d/.test(r.dataAcordo));
            const cumprimentos = transitoData.filter((r: any) => r.statusCumprimentoSentenca?.toLowerCase().trim() === 'ajuizado');
            console.log(`Debug - Acordos com data (col J): ${acordos.length}`, acordos.map((r: any) => r.dataAcordo));
            console.log(`Debug - Cumprimentos ajuizados (col S): ${cumprimentos.length}`, cumprimentos.map((r: any) => r.statusCumprimentoSentenca));
            console.log(`Debug - Todos statusCumprimentoSentenca:`, transitoData.map((r: any) => r.statusCumprimentoSentenca));
            
            console.log(`Transito data loaded: ${transitoData.length} records`);
          }
        }
      } else {
        console.log('Transito sheet not accessible');
      }
    } catch (transitoError) {
      console.error('Error fetching Transito sheet:', transitoError);
    }
    
    // Extrai semanas únicas das iniciais
    const uniqueWeeks = [...new Set(iniciaisData.map(d => d.semana).filter(w => w > 0))].sort((a, b) => a - b);
    
    console.log(`Found ${uniqueWeeks.length} unique weeks in Iniciais`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          iniciaisData,
          iniciaisHeaders,
          saneamentoData,
          saneamentoHeaders,
          transitoData,
          transitoHeaders,
          weeks: uniqueWeeks,
          lastUpdated: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching bancario data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Parse Brazilian currency format (R$ 1.234,56 -> 1234.56)
function parseBrazilianCurrency(value: string): number {
  if (!value || value.trim() === '') return 0;

  let cleaned = value.replace(/[^\d,\.\-]/g, '');
  if (!cleaned || !/\d/.test(cleaned)) return 0;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      const integerPart = cleaned.slice(0, lastComma).replace(/\./g, '').replace(/,/g, '');
      const decimalPart = cleaned.slice(lastComma + 1);
      cleaned = `${integerPart}.${decimalPart}`;
    } else {
      const integerPart = cleaned.slice(0, lastDot).replace(/,/g, '').replace(/\./g, '');
      const decimalPart = cleaned.slice(lastDot + 1);
      cleaned = `${integerPart}.${decimalPart}`;
    }
  } else if (hasComma) {
    const lastComma = cleaned.lastIndexOf(',');
    const decimalPart = cleaned.slice(lastComma + 1);
    if (/^\d{1,2}$/.test(decimalPart)) {
      const integerPart = cleaned.slice(0, lastComma).replace(/,/g, '').replace(/\./g, '');
      cleaned = `${integerPart}.${decimalPart}`;
    } else {
      cleaned = cleaned.replace(/,/g, '').replace(/\./g, '');
    }
  } else if (hasDot) {
    const lastDot = cleaned.lastIndexOf('.');
    const decimalPart = cleaned.slice(lastDot + 1);
    if (/^\d{1,2}$/.test(decimalPart)) {
      const integerPart = cleaned.slice(0, lastDot).replace(/\./g, '').replace(/,/g, '');
      cleaned = `${integerPart}.${decimalPart}`;
    } else {
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const result = Number(cleaned);
  return Number.isFinite(result) ? result : 0;
}

// Parse CSV handling quoted fields with commas
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentField);
        if (currentLine.length > 0 && currentLine.some(f => f.trim() !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    if (currentLine.some(f => f.trim() !== '')) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}
