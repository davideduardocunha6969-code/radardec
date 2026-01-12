import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Planilha do Radar Previdenciário
const SPREADSHEET_ID = '1cjBtkZ4HCYKsvmQ7UGcEwQhYb_egmmnBhqP6GMxeVkQ';

// GIDs das abas
const GIDS = {
  peticoesIniciais: 1358203598,    // Aba 1 - Petições Iniciais
  evolucaoIncapacidade: 306675231, // Aba 2 - Evolução Incapacidade
  tarefas: 1379612642,             // Aba 3 - Tarefas
  aposentadorias: 0,               // Aba 4 - Aposentadorias
  pastasCorrecao: 731526977,       // Aba 5 - Pastas para Correção
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
    console.log('Starting to fetch Previdenciário data...');

    // Fetch all sheets in parallel
    const [
      peticoesData,
      evolucaoData,
      tarefasData,
      aposentadoriasData,
      pastasData
    ] = await Promise.all([
      fetchSheetData(GIDS.peticoesIniciais),
      fetchSheetData(GIDS.evolucaoIncapacidade),
      fetchSheetData(GIDS.tarefas),
      fetchSheetData(GIDS.aposentadorias),
      fetchSheetData(GIDS.pastasCorrecao),
    ]);

    console.log(`Fetched: ${peticoesData.length} petições, ${evolucaoData.length} evolução, ${tarefasData.length} tarefas, ${aposentadoriasData.length} aposentadorias, ${pastasData.length} pastas`);

    // Process Petições Iniciais (skip header)
    const peticoesIniciais = peticoesData.slice(1).map(row => ({
      responsavel: row[0] || '',
      semana: row[1] || '',
      mes: row[2] || '',
      cliente: row[3] || '',
      tipoBeneficio: row[4] || '',
      anoDER: row[5] || '',
      valorCausa: parseBrazilianCurrency(row[6] || ''),
      expectativaHonorarios: parseBrazilianCurrency(row[7] || ''),
      epiEficaz: row[8] || '',
      gps: row[9] || '',
      autonomo: row[10] || '',
      ruralMenor12: row[11] || '',
      situacao: row[12] || '',
      notaCorrecao: row[13] || '',
    }));

    // Process Evolução Incapacidade (skip header)
    const evolucaoIncapacidade = evolucaoData.slice(1).map(row => ({
      semana: row[0] || '',
      quantidadePendentes: parseInt(row[1] || '0', 10) || 0,
    }));

    // Process Tarefas (skip header)
    const tarefas = tarefasData.slice(1).map(row => ({
      semana: row[0] || '',
      responsavel: row[1] || '',
      tipoTarefa: row[2] || '',
      cliente: row[3] || '',
      dataRealizacao: row[4] || '',
      numeroProcesso: row[5] || '',
      revisor: row[6] || '',
      notaRevisao: row[7] || '',
    }));

    // Process Aposentadorias (skip header)
    const aposentadorias = aposentadoriasData.slice(1).map(row => ({
      dataAnalise: row[0] || '',
      responsavel: row[1] || '',
      semana: row[2] || '',
      cliente: row[3] || '',
      dataCadastro: row[4] || '',
      der: row[5] || '',
      rmi: parseBrazilianCurrency(row[6] || ''),
      mesesTramitacao: parseInt(row[7] || '0', 10) || 0,
      valorCausa: parseBrazilianCurrency(row[8] || ''),
      tipoAcao: row[9] || '',
      situacao: row[10] || '',
    }));

    // Process Pastas para Correção (skip header)
    const pastasCorrecao = pastasData.slice(1).map(row => ({
      cliente: row[0] || '',
      parteContraria: row[1] || '',
      tipoAcao: row[2] || '',
      dataRequerimento: row[3] || '',
      expectativaValorCausa: parseBrazilianCurrency(row[4] || ''),
      responsavel: row[5] || '',
      situacao: row[6] || '',
    }));

    // Calculate statistics
    const stats = {
      totalPeticoes: peticoesIniciais.length,
      peticoesPorSituacao: {} as Record<string, number>,
      peticoesPorBeneficio: {} as Record<string, number>,
      peticoesPorResponsavel: {} as Record<string, number>,
      totalTarefas: tarefas.length,
      tarefasPorResponsavel: {} as Record<string, number>,
      tarefasPorTipo: {} as Record<string, number>,
      totalAposentadorias: aposentadorias.length,
      aposentadoriasPorSituacao: {} as Record<string, number>,
      aposentadoriasPorTipo: {} as Record<string, number>,
      totalPastasCorrecao: pastasCorrecao.length,
      pastasPorSituacao: {} as Record<string, number>,
      valorTotalCausas: 0,
      valorTotalHonorarios: 0,
    };

    // Calculate petições stats
    peticoesIniciais.forEach(p => {
      if (p.situacao) {
        stats.peticoesPorSituacao[p.situacao] = (stats.peticoesPorSituacao[p.situacao] || 0) + 1;
      }
      if (p.tipoBeneficio) {
        stats.peticoesPorBeneficio[p.tipoBeneficio] = (stats.peticoesPorBeneficio[p.tipoBeneficio] || 0) + 1;
      }
      if (p.responsavel) {
        stats.peticoesPorResponsavel[p.responsavel] = (stats.peticoesPorResponsavel[p.responsavel] || 0) + 1;
      }
      stats.valorTotalCausas += p.valorCausa;
      stats.valorTotalHonorarios += p.expectativaHonorarios;
    });

    // Calculate tarefas stats
    tarefas.forEach(t => {
      if (t.responsavel) {
        stats.tarefasPorResponsavel[t.responsavel] = (stats.tarefasPorResponsavel[t.responsavel] || 0) + 1;
      }
      if (t.tipoTarefa) {
        stats.tarefasPorTipo[t.tipoTarefa] = (stats.tarefasPorTipo[t.tipoTarefa] || 0) + 1;
      }
    });

    // Calculate aposentadorias stats
    aposentadorias.forEach(a => {
      if (a.situacao) {
        stats.aposentadoriasPorSituacao[a.situacao] = (stats.aposentadoriasPorSituacao[a.situacao] || 0) + 1;
      }
      if (a.tipoAcao) {
        stats.aposentadoriasPorTipo[a.tipoAcao] = (stats.aposentadoriasPorTipo[a.tipoAcao] || 0) + 1;
      }
    });

    // Calculate pastas stats
    pastasCorrecao.forEach(p => {
      if (p.situacao) {
        stats.pastasPorSituacao[p.situacao] = (stats.pastasPorSituacao[p.situacao] || 0) + 1;
      }
    });

    const responseData = {
      peticoesIniciais,
      evolucaoIncapacidade,
      tarefas,
      aposentadorias,
      pastasCorrecao,
      stats,
    };

    console.log('Successfully processed all Previdenciário data');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching Previdenciário data:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
