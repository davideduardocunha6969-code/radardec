import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse as parseCsvStd } from "https://deno.land/std@0.224.0/csv/parse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1EcJfg5-xr8YMMRVlnGgT8nKk0S3gE7RQvlnt58ErVHU';
const INICIAIS_GID = 0;
const SANEAMENTO_GID = 325813835;
const TRANSITO_JULGADO_GID = 642720152;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching bancario data (parallel)...');

    const [iniciaisCsv, saneamentoCsv, transitoCsv] = await Promise.all([
      fetchCsv(INICIAIS_GID),
      fetchCsv(SANEAMENTO_GID),
      fetchCsv(TRANSITO_JULGADO_GID),
    ]);

    // ===================== INICIAIS =====================
    let iniciaisData: any[] = [];
    let iniciaisHeaders: string[] = [];
    if (iniciaisCsv) {
      const rows = parseCSV(iniciaisCsv);
      if (rows.length >= 2) {
        iniciaisHeaders = rows[0];
        iniciaisData = rows.slice(1).map((row) => ({
          responsavel: (row[0] || '').trim(),
          tipoAcao: (row[1] || '').trim(),
          semana: parseInt((row[2] || '0').replace(/[^\d]/g, '')) || 0,
          cliente: (row[3] || '').trim(),
          reu: (row[4] || '').trim(),
          estado: (row[5] || '').trim(),
          numeroProcesso: (row[6] || '').trim(),
        }));
        console.log(`Iniciais: ${iniciaisData.length} rows`);
      }
    }

    // ===================== SANEAMENTO =====================
    let saneamentoData: any[] = [];
    let saneamentoHeaders: string[] = [];
    if (saneamentoCsv) {
      const rows = parseCSV(saneamentoCsv);
      if (rows.length >= 2) {
        saneamentoHeaders = rows[0];
        saneamentoData = rows.slice(1).map((row) => ({
          cliente: (row[0] || '').trim(),
          parteContraria: (row[1] || '').trim(),
          numeroProcesso: (row[6] || '').trim(),
          revisor: (row[8] || '').trim(),
          status: (row[9] || '').trim(),
          resultado: (row[10] || '').trim(),
        }));
        console.log(`Saneamento: ${saneamentoData.length} rows`);
      }
    }

    // ===================== TRÂNSITO EM JULGADO =====================
    let transitoData: any[] = [];
    let transitoHeaders: string[] = [];
    if (transitoCsv) {
      const rows = parseCSV(transitoCsv);
      if (rows.length >= 2) {
        transitoHeaders = rows[0];
        transitoData = rows.slice(1).map((row) => ({
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
        console.log(`Transito: ${transitoData.length} rows`);
      }
    }

    const uniqueWeeks = [...new Set(iniciaisData.map((d) => d.semana).filter((w) => w > 0))].sort((a, b) => a - b);

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching bancario data:', error);
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
