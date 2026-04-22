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

// Faz fetch + parse + descarta texto bruto. Reduz pico de memória
// porque o CSV string sai de escopo logo após o parse.
async function fetchAndParse(gid: number): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.log(`Sheet gid=${gid} not accessible: ${response.status}`);
    return [];
  }
  const text = await response.text();
  if (!text || text.trim().length < 10) return [];
  const parsed = parseCsvStd(text) as string[][];
  // Filtra linhas vazias e faz trim
  const cleaned: string[][] = [];
  for (const row of parsed) {
    const trimmed = row.map((c) => (c ?? '').trim());
    if (trimmed.some((cell) => cell !== '')) {
      cleaned.push(trimmed);
    }
  }
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing sheets sequentially to control memory...');

    // ---------- 1) Aba principal: fetch -> parse -> mapeia para arrays
    // de saída. Mantemos só `rows` final, não o CSV cru nem arrays intermediários.
    const mainParsed = await fetchAndParse(MAIN_SHEET_GID);
    if (mainParsed.length < 2) {
      throw new Error('Main sheet has no data rows');
    }
    const mainHeaders = mainParsed[0];
    // splice em vez de slice para liberar a referência do array original
    mainParsed.shift(); // remove header
    const mainRows: string[][] = mainParsed; // reusa o array
    const totalTasks = mainRows.length;
    console.log(`Main sheet: ${totalTasks} rows`);

    // ---------- 2) Sector mapping
    const sectorParsed = await fetchAndParse(SECTOR_MAPPING_GID);
    const sectorMapping: { tipoAcao: string; setor: string }[] = [];
    for (let i = 1; i < sectorParsed.length; i++) {
      const row = sectorParsed[i];
      if (row[0] && row[1]) {
        sectorMapping.push({
          tipoAcao: row[0].trim().toUpperCase(),
          setor: row[1].trim(),
        });
      }
    }
    sectorParsed.length = 0; // libera array
    console.log(`Sector mappings: ${sectorMapping.length}`);

    // ---------- 3) Conformity errors
    const conformityParsed = await fetchAndParse(CONFORMITY_ERRORS_GID);
    const conformityErrors: { date: string; recipient: string; rawRow: string[] }[] = [];
    for (let i = 1; i < conformityParsed.length; i++) {
      const row = conformityParsed[i];
      conformityErrors.push({
        date: row[1] || '',
        recipient: (row[10] || '').trim(),
        rawRow: row,
      });
    }
    console.log(`Conformity errors: ${conformityErrors.length}`);

    // ---------- 4) Deadline errors
    const deadlineParsed = await fetchAndParse(DEADLINE_ERRORS_GID);
    const deadlineErrors: { date: string; controller: string; processNumber: string; rawRow: string[] }[] = [];
    for (let i = 1; i < deadlineParsed.length; i++) {
      const row = deadlineParsed[i];
      deadlineErrors.push({
        date: row[1] || '',
        controller: (row[10] || '').trim(),
        processNumber: (row[12] || '').trim(),
        rawRow: row,
      });
    }
    console.log(`Deadline errors: ${deadlineErrors.length}`);

    // ---------- 5) Intimações previdenciário
    const intimacoesParsed = await fetchAndParse(INTIMACOES_PREVIDENCIARIO_GID);
    const intimacoesPrevidenciario: {
      dataCumprimento: string;
      prazoFatal: string;
      tipoCompromisso: string;
      destinatario: string;
      numeroProcesso: string;
      rawRow: string[];
    }[] = [];
    for (let i = 1; i < intimacoesParsed.length; i++) {
      const row = intimacoesParsed[i];
      intimacoesPrevidenciario.push({
        dataCumprimento: (row[3] || '').trim(),
        prazoFatal: (row[5] || '').trim(),
        tipoCompromisso: (row[7] || '').trim(),
        destinatario: (row[10] || '').trim(),
        numeroProcesso: (row[12] || '').trim(),
        rawRow: row,
      });
    }
    console.log(`Intimações previdenciário: ${intimacoesPrevidenciario.length}`);

    // ---------- Resposta em streaming (evita pico do JSON.stringify monolítico)
    const encoder = new TextEncoder();
    const lastUpdated = new Date().toISOString();

    const stream = new ReadableStream({
      start(controller) {
        try {
          const enq = (s: string) => controller.enqueue(encoder.encode(s));

          enq('{"success":true,"data":{');
          enq(`"sheets":[{"name":"TAREFAS","headers":${JSON.stringify(mainHeaders)},"rows":[`);
          for (let i = 0; i < mainRows.length; i++) {
            enq((i > 0 ? ',' : '') + JSON.stringify(mainRows[i]));
          }
          enq(']}],');
          enq(`"sectorMapping":${JSON.stringify(sectorMapping)},`);
          enq(`"conformityErrors":${JSON.stringify(conformityErrors)},`);
          enq(`"deadlineErrors":${JSON.stringify(deadlineErrors)},`);
          enq(`"intimacoesPrevidenciario":${JSON.stringify(intimacoesPrevidenciario)},`);
          enq(`"totalSheets":1,`);
          enq(`"totalTasks":${totalTasks},`);
          enq(`"totalConformityErrors":${conformityErrors.length},`);
          enq(`"totalDeadlineErrors":${deadlineErrors.length},`);
          enq(`"totalIntimacoesPrevidenciario":${intimacoesPrevidenciario.length},`);
          enq(`"lastUpdated":${JSON.stringify(lastUpdated)}`);
          enq('}}');

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching sheets:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
