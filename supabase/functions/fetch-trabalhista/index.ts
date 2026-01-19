import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Planilha do Radar Trabalhista
const SPREADSHEET_ID = '1c3yi6NQL4Jw6X0EVpHFwnbbExBl-9MLV08GmWdiu-9U';

// GIDs das abas
const GIDS = {
  iniciais: 1523237863,    // Aba Iniciais
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else {
        currentCell += char;
      }
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

function parseBrazilianCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

async function fetchSheetData(gid: number): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  console.log(`Fetching data from GID ${gid}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet with GID ${gid}: ${response.status}`);
  }
  
  const text = await response.text();
  return parseCSV(text);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting to fetch Trabalhista data...');

    // Fetch iniciais sheet
    const iniciaisData = await fetchSheetData(GIDS.iniciais);

    console.log(`Fetched: ${iniciaisData.length} iniciais`);

    // Process Iniciais (skip header)
    const iniciais = iniciaisData.slice(1).map(row => ({
      responsavel: row[0] || '',
      tipoInicial: row[1] || '',
      semana: row[2] || '',
      mesAno: row[3] || '',
      cliente: row[4] || '',
      profissao: row[5] || '',
      valorCausa: parseBrazilianCurrency(row[6] || ''),
      expectativaHonorarios: parseBrazilianCurrency(row[7] || ''),
      horasExtras: (row[8] || '').toLowerCase(),
      vinculoEmprego: (row[9] || '').toLowerCase(),
      acidenteTrabalho: (row[10] || '').toLowerCase(),
      insalubridadePericulosidade: (row[11] || '').toLowerCase(),
      situacao: row[12] || '',
    }));

    // Calculate statistics
    const stats = {
      totalIniciais: iniciais.length,
      iniciaisPorResponsavel: {} as Record<string, number>,
      iniciaisPorTipo: {} as Record<string, number>,
      iniciaisPorSemana: {} as Record<string, number>,
      iniciaisPorMesAno: {} as Record<string, number>,
      iniciaisPorProfissao: {} as Record<string, number>,
      iniciaisPorSituacao: {} as Record<string, number>,
      valorTotalCausasNicho: 0,
      honorariosTotalNicho: 0,
      temasDiscutidos: {
        horasExtras: 0,
        vinculoEmprego: 0,
        acidenteTrabalho: 0,
        insalubridadePericulosidade: 0,
        nenhumTema: 0,
      },
    };

    // Calculate stats
    iniciais.forEach(i => {
      if (i.responsavel) {
        stats.iniciaisPorResponsavel[i.responsavel] = (stats.iniciaisPorResponsavel[i.responsavel] || 0) + 1;
      }
      if (i.tipoInicial) {
        stats.iniciaisPorTipo[i.tipoInicial] = (stats.iniciaisPorTipo[i.tipoInicial] || 0) + 1;
      }
      if (i.semana) {
        stats.iniciaisPorSemana[i.semana] = (stats.iniciaisPorSemana[i.semana] || 0) + 1;
      }
      if (i.mesAno) {
        stats.iniciaisPorMesAno[i.mesAno] = (stats.iniciaisPorMesAno[i.mesAno] || 0) + 1;
      }
      if (i.profissao) {
        stats.iniciaisPorProfissao[i.profissao] = (stats.iniciaisPorProfissao[i.profissao] || 0) + 1;
      }
      if (i.situacao) {
        stats.iniciaisPorSituacao[i.situacao] = (stats.iniciaisPorSituacao[i.situacao] || 0) + 1;
      }

      // Soma valores apenas para ações de nicho
      if (i.tipoInicial.toLowerCase().includes('nicho')) {
        stats.valorTotalCausasNicho += i.valorCausa;
        stats.honorariosTotalNicho += i.expectativaHonorarios;
      }

      // Temas discutidos
      const temHorasExtras = i.horasExtras === 'sim';
      const temVinculo = i.vinculoEmprego === 'sim';
      const temAcidente = i.acidenteTrabalho === 'sim';
      const temInsalubridade = i.insalubridadePericulosidade === 'sim';

      if (temHorasExtras) stats.temasDiscutidos.horasExtras++;
      if (temVinculo) stats.temasDiscutidos.vinculoEmprego++;
      if (temAcidente) stats.temasDiscutidos.acidenteTrabalho++;
      if (temInsalubridade) stats.temasDiscutidos.insalubridadePericulosidade++;
      
      if (!temHorasExtras && !temVinculo && !temAcidente && !temInsalubridade) {
        stats.temasDiscutidos.nenhumTema++;
      }
    });

    const responseData = {
      iniciais,
      stats,
    };

    console.log('Successfully processed all Trabalhista data');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching Trabalhista data:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
