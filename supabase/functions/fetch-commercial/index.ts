import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse as parseCsvStd } from "https://deno.land/std@0.224.0/csv/parse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
const BANCARIO_AGENDAMENTOS_GID = 199327118;

function parseCSV(csvText: string): string[][] {
  if (!csvText) return [];
  const result = parseCsvStd(csvText) as string[][];
  const cleaned: string[][] = [];
  for (const row of result) {
    const trimmed = row.map((c) => (c ?? '').trim());
    if (trimmed.some((cell) => cell !== '')) {
      cleaned.push(trimmed);
    }
  }
  return cleaned;
}

async function fetchCsv(gid: number): Promise<string | null> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Sheet gid=${gid} not accessible: ${response.status}`);
      return null;
    }
    const text = await response.text();
    return text && text.trim().length >= 10 ? text : null;
  } catch (err) {
    console.error(`Error fetching gid=${gid}:`, err);
    return null;
  }
}

function genericRows(csv: string | null): { headers: string[]; data: any[] } {
  if (!csv) return { headers: [], data: [] };
  const rows = parseCSV(csv);
  if (rows.length < 2) return { headers: [], data: [] };
  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const record: Record<string, any> = {};
    headers.forEach((_, index) => {
      record[`col${String.fromCharCode(65 + index)}`] = (row[index] || '').trim();
    });
    return record;
  });
  return { headers, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching commercial data (parallel — 11 sheets)...');

    const [
      mainCsv,
      sdrCsv,
      sdrMsgCsv,
      indicacoesCsv,
      indicacoesRecebidasCsv,
      saneamentoCsv,
      administrativoCsv,
      administrativo2Csv,
      testemunhasCsv,
      documentosFisicosCsv,
      bancarioAgendamentosCsv,
    ] = await Promise.all([
      fetchCsv(MAIN_GID),
      fetchCsv(SDR_GID),
      fetchCsv(SDR_MESSAGES_GID),
      fetchCsv(INDICACOES_GID),
      fetchCsv(INDICACOES_RECEBIDAS_GID),
      fetchCsv(SANEAMENTO_GID),
      fetchCsv(ADMINISTRATIVO_GID),
      fetchCsv(ADMINISTRATIVO2_GID),
      fetchCsv(TESTEMUNHAS_GID),
      fetchCsv(DOCUMENTOS_FISICOS_GID),
      fetchCsv(BANCARIO_AGENDAMENTOS_GID),
    ]);

    if (!mainCsv) {
      throw new Error('Commercial sheet not found or inaccessible');
    }

    // ===================== MAIN =====================
    const mainRows = parseCSV(mainCsv);
    if (mainRows.length < 2) {
      throw new Error('Commercial sheet has no data rows');
    }
    const headers = mainRows[0];
    const dataRows = mainRows.slice(1);
    console.log(`Main: ${dataRows.length} rows`);

    const commercialData = dataRows.map((row) => ({
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
      honorariosExito: parseBrazilianCurrency(row[11] || '0'),
      honorariosIniciais: parseBrazilianCurrency(row[12] || '0'),
      tempoFechamento: parseInt((row[13] || '0').trim()) || 0,
      resultado: (row[14] || '').trim(),
      cadencia: (row[15] || '').trim(),
      anoAposentadoriaFutura: (row[16] || '').trim(),
      rawRow: row,
    }));

    const uniqueWeeks = [...new Set(commercialData.map((d) => d.semana).filter((w) => w > 0))].sort((a, b) => a - b);

    // ===================== SDR =====================
    let sdrData: any[] = [];
    let sdrHeaders: string[] = [];
    let sdrWeeks: number[] = [];
    if (sdrCsv) {
      const rows = parseCSV(sdrCsv);
      if (rows.length >= 2) {
        sdrHeaders = rows[0];
        sdrData = rows.slice(1).map((row) => ({
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
          rawRow: row,
        }));
        const set = new Set<number>();
        sdrData.forEach((d) => {
          const w = parseInt(d.colE) || 0;
          if (w > 0) set.add(w);
        });
        sdrWeeks = [...set].sort((a, b) => a - b);
      }
    }

    // ===================== SDR MESSAGES =====================
    let sdrMessagesData: any[] = [];
    let sdrMessagesSdrNames: string[] = [];
    if (sdrMsgCsv) {
      const rows = parseCSV(sdrMsgCsv);
      if (rows.length >= 2) {
        const sdrMsgHeaders = rows[0];
        sdrMessagesSdrNames = sdrMsgHeaders.slice(1).map((h) => h.trim()).filter((h) => h !== '');
        sdrMessagesData = rows.slice(1).map((row) => {
          const record: Record<string, any> = { semana: (row[0] || '').trim() };
          sdrMessagesSdrNames.forEach((name, idx) => {
            const colIndex = idx + 1;
            const value = parseInt((row[colIndex] || '0').replace(/[^\d]/g, '')) || 0;
            record[name] = value;
          });
          return record;
        }).filter((d) => d.semana !== '');
      }
    }

    // ===================== INDICAÇÕES =====================
    let indicacoesData: any[] = [];
    if (indicacoesCsv) {
      const rows = parseCSV(indicacoesCsv);
      if (rows.length >= 2) {
        indicacoesData = rows.slice(1).map((row) => ({
          clienteIndicador: (row[0] || '').trim(),
          acaoGanha: (row[1] || '').trim(),
          responsavel: (row[2] || '').trim(),
          semana: (row[3] || '').trim(),
        })).filter((d) => d.clienteIndicador !== '' || d.responsavel !== '');
      }
    }

    // ===================== INDICAÇÕES RECEBIDAS =====================
    let indicacoesRecebidasData: any[] = [];
    if (indicacoesRecebidasCsv) {
      const rows = parseCSV(indicacoesRecebidasCsv);
      if (rows.length >= 2) {
        indicacoesRecebidasData = rows.slice(1).map((row) => ({
          responsavel: (row[0] || '').trim(),
          semana: (row[1] || '').trim(),
          resultado: (row[4] || '').trim(),
        })).filter((d) => d.responsavel !== '');
      }
    }

    // ===================== Generic sheets =====================
    const saneamento = genericRows(saneamentoCsv);
    const administrativo = genericRows(administrativoCsv);
    const administrativo2 = genericRows(administrativo2Csv);
    const testemunhas = genericRows(testemunhasCsv);
    const documentosFisicos = genericRows(documentosFisicosCsv);
    const bancarioAgendamentos = genericRows(bancarioAgendamentosCsv);

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
          saneamentoData: saneamento.data,
          saneamentoHeaders: saneamento.headers,
          administrativoData: administrativo.data,
          administrativoHeaders: administrativo.headers,
          administrativo2Data: administrativo2.data,
          administrativo2Headers: administrativo2.headers,
          testemunhasData: testemunhas.data,
          testemunhasHeaders: testemunhas.headers,
          documentosFisicosData: documentosFisicos.data,
          documentosFisicosHeaders: documentosFisicos.headers,
          bancarioAgendamentosData: bancarioAgendamentos.data,
          bancarioAgendamentosHeaders: bancarioAgendamentos.headers,
          lastUpdated: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching commercial sheet:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

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
