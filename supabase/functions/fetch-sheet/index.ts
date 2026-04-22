import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse as parseCsvStd } from "https://deno.land/std@0.224.0/csv/parse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1zjLZCxj5FgwrzmUX2Jn3H7PUXBoTABQO_aRAXADyN5M';
const MAIN_SHEET_GID = 0;
const SECTOR_MAPPING_GID = 1319762905;
const CONFORMITY_ERRORS_GID = 1590941680;
const DEADLINE_ERRORS_GID = 1397357779;
const INTIMACOES_PREVIDENCIARIO_GID = 154449292;

// Parser CSV otimizado usando o módulo padrão do Deno.
// Mantém a mesma semântica do parser anterior (respeita aspas, escapes ""
// e quebras de linha dentro de células), mas é nativo e muito mais rápido.
function parseCSV(csvText: string): string[][] {
  if (!csvText) return [];
  const result = parseCsvStd(csvText) as string[][];
  // Normaliza: trim em cada célula e remove linhas totalmente vazias
  // (mesmo comportamento do parser antigo).
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
    console.log('Fetching all sheets in parallel...');

    // Dispara as 5 requisições simultaneamente.
    const [
      mainCsv,
      sectorCsv,
      conformityCsv,
      deadlineCsv,
      intimacoesCsv,
    ] = await Promise.all([
      fetchCsv(MAIN_SHEET_GID),
      fetchCsv(SECTOR_MAPPING_GID),
      fetchCsv(CONFORMITY_ERRORS_GID),
      fetchCsv(DEADLINE_ERRORS_GID),
      fetchCsv(INTIMACOES_PREVIDENCIARIO_GID),
    ]);

    if (!mainCsv) {
      throw new Error('Main sheet not found or inaccessible');
    }

    // Aba principal
    const mainRows = parseCSV(mainCsv);
    if (mainRows.length < 2) {
      throw new Error('Main sheet has no data rows');
    }
    const headers = mainRows[0];
    const dataRows = mainRows.slice(1);
    console.log(`Main sheet: ${dataRows.length} rows`);

    const mainSheet = {
      name: "TAREFAS",
      headers,
      rows: dataRows,
    };

    // Sector mapping
    let sectorMapping: { tipoAcao: string; setor: string }[] = [];
    if (sectorCsv) {
      const rows = parseCSV(sectorCsv);
      sectorMapping = rows.slice(1)
        .filter((row) => row[0] && row[1])
        .map((row) => ({
          tipoAcao: row[0].trim().toUpperCase(),
          setor: row[1].trim(),
        }));
      console.log(`Sector mappings: ${sectorMapping.length}`);
    }

    // Conformity errors
    let conformityErrors: { date: string; recipient: string; rawRow: string[] }[] = [];
    if (conformityCsv) {
      const rows = parseCSV(conformityCsv);
      conformityErrors = rows.slice(1).map((row) => ({
        date: row[1] || '',
        recipient: (row[10] || '').trim(),
        rawRow: row,
      }));
      console.log(`Conformity errors: ${conformityErrors.length}`);
    }

    // Deadline errors
    let deadlineErrors: { date: string; controller: string; processNumber: string; rawRow: string[] }[] = [];
    if (deadlineCsv) {
      const rows = parseCSV(deadlineCsv);
      deadlineErrors = rows.slice(1).map((row) => ({
        date: row[1] || '',
        controller: (row[10] || '').trim(),
        processNumber: (row[12] || '').trim(),
        rawRow: row,
      }));
      console.log(`Deadline errors: ${deadlineErrors.length}`);
    }

    // Intimações previdenciário
    let intimacoesPrevidenciario: {
      dataCumprimento: string;
      prazoFatal: string;
      tipoCompromisso: string;
      destinatario: string;
      numeroProcesso: string;
      rawRow: string[];
    }[] = [];
    if (intimacoesCsv) {
      const rows = parseCSV(intimacoesCsv);
      intimacoesPrevidenciario = rows.slice(1).map((row) => ({
        dataCumprimento: (row[3] || '').trim(),
        prazoFatal: (row[5] || '').trim(),
        tipoCompromisso: (row[7] || '').trim(),
        destinatario: (row[10] || '').trim(),
        numeroProcesso: (row[12] || '').trim(),
        rawRow: row,
      }));
      console.log(`Intimações previdenciário: ${intimacoesPrevidenciario.length}`);
    }

    const totalTasks = mainSheet.rows.length;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sheets: [mainSheet],
          sectorMapping,
          conformityErrors,
          deadlineErrors,
          intimacoesPrevidenciario,
          totalSheets: 1,
          totalTasks,
          totalConformityErrors: conformityErrors.length,
          totalDeadlineErrors: deadlineErrors.length,
          totalIntimacoesPrevidenciario: intimacoesPrevidenciario.length,
          lastUpdated: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching sheets:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
