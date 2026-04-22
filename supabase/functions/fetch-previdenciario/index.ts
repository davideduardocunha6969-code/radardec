import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse as parseCsvStd } from "https://deno.land/std@0.224.0/csv/parse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1cjBtkZ4HCYKsvmQ7UGcEwQhYb_egmmnBhqP6GMxeVkQ';

const GIDS = {
  peticoesIniciais: 1358203598,
  evolucaoIncapacidade: 306675231,
  tarefas: 1379612642,
  aposentadorias: 0,
  pastasCorrecao: 731526977,
};

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
  console.log(`Fetching gid=${gid}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet with GID ${gid}: ${response.status}`);
  }
  const text = await response.text();
  return parseCSV(text);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Previdenciário data (parallel)...');

    const [
      peticoesData,
      evolucaoData,
      tarefasData,
      aposentadoriasData,
      pastasData,
    ] = await Promise.all([
      fetchSheetData(GIDS.peticoesIniciais),
      fetchSheetData(GIDS.evolucaoIncapacidade),
      fetchSheetData(GIDS.tarefas),
      fetchSheetData(GIDS.aposentadorias),
      fetchSheetData(GIDS.pastasCorrecao),
    ]);

    console.log(`Fetched: ${peticoesData.length} petições, ${evolucaoData.length} evolução, ${tarefasData.length} tarefas, ${aposentadoriasData.length} aposentadorias, ${pastasData.length} pastas`);

    const peticoesIniciais = peticoesData.slice(1).map((row) => ({
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

    const evolucaoIncapacidade = evolucaoData.slice(1).map((row) => ({
      semana: row[0] || '',
      quantidadePendentes: parseInt(row[1] || '0', 10) || 0,
    }));

    const tarefas = tarefasData.slice(1).map((row) => ({
      semana: row[0] || '',
      responsavel: row[1] || '',
      tipoTarefa: row[2] || '',
      cliente: row[3] || '',
      dataRealizacao: row[4] || '',
      numeroProcesso: row[5] || '',
      revisor: row[6] || '',
      notaRevisao: row[7] || '',
    }));

    const aposentadorias = aposentadoriasData.slice(1).map((row) => ({
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

    const pastasCorrecao = pastasData.slice(1).map((row) => ({
      cliente: row[0] || '',
      parteContraria: row[1] || '',
      tipoAcao: row[2] || '',
      dataRequerimento: row[3] || '',
      expectativaValorCausa: parseBrazilianCurrency(row[4] || ''),
      responsavel: row[5] || '',
      situacao: row[6] || '',
    }));

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

    peticoesIniciais.forEach((p) => {
      if (p.situacao) stats.peticoesPorSituacao[p.situacao] = (stats.peticoesPorSituacao[p.situacao] || 0) + 1;
      if (p.tipoBeneficio) stats.peticoesPorBeneficio[p.tipoBeneficio] = (stats.peticoesPorBeneficio[p.tipoBeneficio] || 0) + 1;
      if (p.responsavel) stats.peticoesPorResponsavel[p.responsavel] = (stats.peticoesPorResponsavel[p.responsavel] || 0) + 1;
      stats.valorTotalCausas += p.valorCausa;
      stats.valorTotalHonorarios += p.expectativaHonorarios;
    });

    tarefas.forEach((t) => {
      if (t.responsavel) stats.tarefasPorResponsavel[t.responsavel] = (stats.tarefasPorResponsavel[t.responsavel] || 0) + 1;
      if (t.tipoTarefa) stats.tarefasPorTipo[t.tipoTarefa] = (stats.tarefasPorTipo[t.tipoTarefa] || 0) + 1;
    });

    aposentadorias.forEach((a) => {
      if (a.situacao) stats.aposentadoriasPorSituacao[a.situacao] = (stats.aposentadoriasPorSituacao[a.situacao] || 0) + 1;
      if (a.tipoAcao) stats.aposentadoriasPorTipo[a.tipoAcao] = (stats.aposentadoriasPorTipo[a.tipoAcao] || 0) + 1;
    });

    pastasCorrecao.forEach((p) => {
      if (p.situacao) stats.pastasPorSituacao[p.situacao] = (stats.pastasPorSituacao[p.situacao] || 0) + 1;
    });

    const responseData = {
      peticoesIniciais,
      evolucaoIncapacidade,
      tarefas,
      aposentadorias,
      pastasCorrecao,
      stats,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching Previdenciário data:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
