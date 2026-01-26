import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisualizationSpec {
  type: "metric" | "chart" | "table" | "text";
  title?: string;
  data: unknown;
  config?: Record<string, unknown>;
}

interface AnalysisResponse {
  summary: string;
  visualizations: VisualizationSpec[];
}

interface IaProfile {
  persona: string;
  forma_pensar: string;
  formato_resposta: string;
  regras: string;
  postura: string;
}

interface ColunaDescricao {
  letra: string;
  nome: string;
  descricao: string;
}

interface IaDataContext {
  planilha_key: string;
  gid: string | null;
  nome: string;
  descricao: string | null;
  colunas: ColunaDescricao[];
}

interface IaOrganograma {
  nome: string;
  cargo: string;
  setor: string | null;
  funcao: string | null;
}

interface ExtendedIaContext {
  profile: IaProfile | null;
  dataContexts: IaDataContext[];
  organograma: IaOrganograma[];
}

async function getExtendedIaContext(): Promise<ExtendedIaContext> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  const result: ExtendedIaContext = {
    profile: null,
    dataContexts: [],
    organograma: [],
  };
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase credentials not found, using defaults");
    return result;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch IA Profile
  const { data: profileData, error: profileError } = await supabase
    .from("ia_profile")
    .select("persona, forma_pensar, formato_resposta, regras, postura")
    .eq("ativo", true)
    .single();

  if (!profileError && profileData) {
    result.profile = profileData;
  } else {
    console.error("Error fetching IA profile:", profileError);
  }

  // Fetch Data Contexts
  const { data: contextsData, error: contextsError } = await supabase
    .from("ia_data_context")
    .select("planilha_key, gid, nome, descricao, colunas")
    .order("planilha_key")
    .order("gid", { nullsFirst: true });

  if (!contextsError && contextsData) {
    result.dataContexts = contextsData as IaDataContext[];
  } else {
    console.error("Error fetching data contexts:", contextsError);
  }

  // Fetch Organograma
  const { data: orgData, error: orgError } = await supabase
    .from("ia_organograma")
    .select("nome, cargo, setor, funcao")
    .eq("ativo", true)
    .order("ordem");

  if (!orgError && orgData) {
    result.organograma = orgData;
  } else {
    console.error("Error fetching organograma:", orgError);
  }

  return result;
}

function buildDataContextPrompt(dataContexts: IaDataContext[]): string {
  if (!dataContexts || dataContexts.length === 0) {
    return "";
  }

  const bySheet: Record<string, IaDataContext[]> = {};
  dataContexts.forEach(ctx => {
    if (!bySheet[ctx.planilha_key]) {
      bySheet[ctx.planilha_key] = [];
    }
    bySheet[ctx.planilha_key].push(ctx);
  });

  let prompt = "\n\n## CONTEXTO DETALHADO DAS PLANILHAS (fornecido pelo usuário):\n";
  
  Object.entries(bySheet).forEach(([sheetKey, tabs]) => {
    prompt += `\n### Planilha: ${sheetKey.toUpperCase()}\n`;
    tabs.forEach(tab => {
      prompt += `\n**${tab.nome}** (GID ${tab.gid || 'principal'})`;
      if (tab.descricao) {
        prompt += `\n${tab.descricao}`;
      }
      if (tab.colunas && tab.colunas.length > 0) {
        prompt += "\nColunas:";
        tab.colunas.forEach(col => {
          prompt += `\n- Coluna ${col.letra}: ${col.nome}${col.descricao ? ` - ${col.descricao}` : ''}`;
        });
      }
      prompt += "\n";
    });
  });

  return prompt;
}

function buildOrganogramaPrompt(organograma: IaOrganograma[]): string {
  if (!organograma || organograma.length === 0) {
    return "";
  }

  let prompt = "\n\n## ESTRUTURA ORGANIZACIONAL DO ESCRITÓRIO:\n";
  
  organograma.forEach(membro => {
    prompt += `\n**${membro.nome}** - ${membro.cargo}`;
    if (membro.setor) {
      prompt += ` (${membro.setor})`;
    }
    if (membro.funcao) {
      prompt += `\n  Responsabilidades: ${membro.funcao}`;
    }
  });

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context, selectedSources } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch IA profile and extended context from database
    const iaContext = await getExtendedIaContext();
    const iaProfile = iaContext.profile;
    const dataContextPrompt = buildDataContextPrompt(iaContext.dataContexts);
    const organogramaPrompt = buildOrganogramaPrompt(iaContext.organograma);

    // Prepare context summary for AI
    const contextSummary = prepareContextSummary(context);
    
    // Build source selection info
    const sourceInfo = selectedSources 
      ? `\n\n⚠️ IMPORTANTE: O usuário filtrou as fontes de dados. Você deve responder APENAS com base nas seguintes fontes selecionadas: ${selectedSources}\n\nNão mencione dados de fontes que não foram selecionadas. Se a pergunta exigir dados de fontes não selecionadas, informe que esses dados não estão disponíveis com a seleção atual.`
      : "";
    
    // Build system prompt with IA profile
    let systemPrompt: string;
    
    if (iaProfile) {
      systemPrompt = `## QUEM VOCÊ É
${iaProfile.persona}

## FORMA DE PENSAR (OBRIGATÓRIA)
${iaProfile.forma_pensar}

## REGRAS IMPORTANTES
${iaProfile.regras}

## POSTURA
${iaProfile.postura}
${organogramaPrompt}
${dataContextPrompt}

## DADOS DISPONÍVEIS - PLANILHAS COMERCIAL (11 abas):
- GID 0: Atendimentos e fechamentos de contratos (closers, resultados, honorários)
- GID 1631515229: SDR Agendamentos (leads, conversões)
- GID 686842485: SDR Mensagens (volume de contatos por semana)
- GID 290508236: Contatos de Indicações (indicações feitas a clientes antigos)
- GID 2087539342: Indicações Recebidas (resultado das indicações)
- GID 1874749978: Saneamento de Pastas Comercial
- GID 651337262: Avaliações Google (estrelas, feedback)
- GID 1905290884: Documentação ADVBOX (pastas salvas)
- GID 774111166: Abordagem de Testemunhas (agendamentos)
- GID 186802545: Documentos Físicos (digitalização)
- GID 199327118: Agendamentos Bancários

## DADOS DISPONÍVEIS - PLANILHAS BANCÁRIO (3 abas):
- GID 0: Petições Iniciais (protocolos, responsáveis, estados)
- GID 325813835: Saneamento de Pastas (revisão de processos)
- GID 642720152: Trânsito em Julgado (acordos, cumprimentos, honorários)

## DADOS DISPONÍVEIS - PLANILHAS CONTROLADORIA (5 abas):
- GID 0: Tarefas Principais (atividades diárias)
- GID 1319762905: Mapeamento de Setores
- GID 1590941680: Erros de Conformidade
- GID 1397357779: Erros de Prazo
- GID 154449292: Intimações Previdenciário

## DADOS DISPONÍVEIS - PLANILHAS PREVIDENCIÁRIO (5 abas):
- GID 1358203598: Petições Iniciais (benefícios, valores, responsáveis)
- GID 306675231: Evolução de Incapacidade (pendências semanais)
- GID 1379612642: Tarefas (revisões, notas)
- GID 0: Aposentadorias (DER, RMI, valores)
- GID 731526977: Pastas para Correção

## DADOS DISPONÍVEIS - PLANILHAS TRABALHISTA (2 abas):
- GID 1523237863: Petições Iniciais (valor causa, temas, situação)
- GID 52177345: Atividades (tarefas diárias, prazos)

## DADOS DO SISTEMA (Supabase):
- **Marketing - Atividades**: Kanban de atividades da equipe de marketing com prioridades e prazos
- **Marketing - Ideias**: Banco de ideias de conteúdo aguardando validação
- **Marketing - Conteúdos**: Calendário de conteúdo com status de produção (a gravar, gravado, editado, postado)
- **Robôs - Tipos de Produtos**: Base de conhecimento de produtos jurídicos por setor
- **Robôs - Transcrições**: Transcrições de audiências realizadas
- **Robôs - Modelagens**: Análises de conteúdo para modelagem
- **Comercial - Atendimentos Closers**: Gravações e transcrições de ligações com clientes

## FORMATO DAS RESPOSTAS (OBRIGATÓRIO)
${iaProfile.formato_resposta}

## FORMATO TÉCNICO DE SAÍDA
Você DEVE responder em formato JSON válido com a seguinte estrutura:
{
  "summary": "Resposta textual completa seguindo o formato acima, em Markdown",
  "visualizations": [
    {
      "type": "metric",
      "title": "Título do metric card",
      "data": { "value": 123, "label": "Descrição", "trend": "+10%", "trendUp": true }
    },
    {
      "type": "chart",
      "title": "Título do gráfico",
      "config": { "chartType": "bar" | "line" | "pie" },
      "data": [{ "name": "Label", "value": 100 }]
    },
    {
      "type": "table",
      "title": "Título da tabela",
      "data": { "headers": ["Col1", "Col2"], "rows": [["val1", "val2"]] }
    },
    {
      "type": "text",
      "title": "Título da seção",
      "data": { "content": "Texto explicativo ou análise detalhada" }
    }
  ]
}

Gere visualizações que sejam úteis para responder a pergunta. Use:
- metric: para KPIs e números importantes
- chart: para comparações e tendências
- table: para listar itens detalhados
- text: para explicações e insights

Responda APENAS com JSON válido, sem texto adicional antes ou depois.`;
    } else {
      // Fallback to default prompt if no profile is found
      systemPrompt = `Você é um analista de dados especializado em gestão jurídica e marketing. Você tem acesso a dados de múltiplos setores e fontes:

## DADOS DE PLANILHAS - COMERCIAL (11 abas):
- GID 0: Atendimentos e fechamentos de contratos (closers, resultados, honorários)
- GID 1631515229: SDR Agendamentos (leads, conversões)
- GID 686842485: SDR Mensagens (volume de contatos por semana)
- GID 290508236: Contatos de Indicações (indicações feitas a clientes antigos)
- GID 2087539342: Indicações Recebidas (resultado das indicações)
- GID 1874749978: Saneamento de Pastas Comercial
- GID 651337262: Avaliações Google (estrelas, feedback)
- GID 1905290884: Documentação ADVBOX (pastas salvas)
- GID 774111166: Abordagem de Testemunhas (agendamentos)
- GID 186802545: Documentos Físicos (digitalização)
- GID 199327118: Agendamentos Bancários

## DADOS DE PLANILHAS - BANCÁRIO (3 abas):
- GID 0: Petições Iniciais (protocolos, responsáveis, estados)
- GID 325813835: Saneamento de Pastas (revisão de processos)
- GID 642720152: Trânsito em Julgado (acordos, cumprimentos, honorários)

## DADOS DE PLANILHAS - CONTROLADORIA (5 abas):
- GID 0: Tarefas Principais (atividades diárias)
- GID 1319762905: Mapeamento de Setores
- GID 1590941680: Erros de Conformidade
- GID 1397357779: Erros de Prazo
- GID 154449292: Intimações Previdenciário

## DADOS DE PLANILHAS - PREVIDENCIÁRIO (5 abas):
- GID 1358203598: Petições Iniciais (benefícios, valores, responsáveis)
- GID 306675231: Evolução de Incapacidade (pendências semanais)
- GID 1379612642: Tarefas (revisões, notas)
- GID 0: Aposentadorias (DER, RMI, valores)
- GID 731526977: Pastas para Correção

## DADOS DE PLANILHAS - TRABALHISTA (2 abas):
- GID 1523237863: Petições Iniciais (valor causa, temas, situação)
- GID 52177345: Atividades (tarefas diárias, prazos)

## DADOS DO SISTEMA (Supabase):
- **Marketing - Atividades**: Kanban de atividades da equipe de marketing com prioridades e prazos
- **Marketing - Ideias**: Banco de ideias de conteúdo aguardando validação
- **Marketing - Conteúdos**: Calendário de conteúdo com status de produção (a gravar, gravado, editado, postado)
- **Robôs - Tipos de Produtos**: Base de conhecimento de produtos jurídicos por setor
- **Robôs - Transcrições**: Transcrições de audiências realizadas
- **Robôs - Modelagens**: Análises de conteúdo para modelagem
- **Comercial - Atendimentos Closers**: Gravações e transcrições de ligações com clientes

Sua tarefa é analisar a pergunta do usuário e gerar uma resposta estruturada com visualizações.

IMPORTANTE: Você DEVE responder em formato JSON válido com a seguinte estrutura:
{
  "summary": "Resumo textual da análise em português",
  "visualizations": [
    {
      "type": "metric",
      "title": "Título do metric card",
      "data": { "value": 123, "label": "Descrição", "trend": "+10%", "trendUp": true }
    },
    {
      "type": "chart",
      "title": "Título do gráfico",
      "config": { "chartType": "bar" | "line" | "pie" },
      "data": [{ "name": "Label", "value": 100 }]
    },
    {
      "type": "table",
      "title": "Título da tabela",
      "data": { "headers": ["Col1", "Col2"], "rows": [["val1", "val2"]] }
    },
    {
      "type": "text",
      "title": "Título da seção",
      "data": { "content": "Texto explicativo ou análise detalhada" }
    }
  ]
}

Gere visualizações que sejam úteis para responder a pergunta. Use:
- metric: para KPIs e números importantes
- chart: para comparações e tendências
- table: para listar itens detalhados
- text: para explicações e insights

Responda APENAS com JSON válido, sem texto adicional antes ou depois.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + sourceInfo },
          { 
            role: "user", 
            content: `DADOS DISPONÍVEIS:\n${contextSummary}\n\nPERGUNTA DO USUÁRIO: ${query}` 
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response
    let analysisResult: AnalysisResponse;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      
      // Remove various markdown code block formats
      const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        cleanContent = jsonMatch[1].trim();
      } else if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
        if (cleanContent.endsWith("```")) {
          cleanContent = cleanContent.slice(0, -3);
        }
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
        if (cleanContent.endsWith("```")) {
          cleanContent = cleanContent.slice(0, -3);
        }
      }
      cleanContent = cleanContent.trim();
      
      analysisResult = JSON.parse(cleanContent);
      
      // Validate the result has required fields
      if (!analysisResult.summary || typeof analysisResult.summary !== 'string') {
        throw new Error("Invalid summary field");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      
      // Try to extract summary from the raw content if it looks like JSON
      let extractedSummary = content;
      try {
        // Try to find and extract just the summary field from malformed JSON
        const summaryMatch = content.match(/"summary"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"visualizations|"\s*})/);
        if (summaryMatch) {
          extractedSummary = summaryMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
      } catch {
        // Keep original content
      }
      
      analysisResult = {
        summary: extractedSummary,
        visualizations: []
      };
    }

    return new Response(JSON.stringify({ success: true, data: analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-gestao error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function prepareContextSummary(context: Record<string, unknown>): string {
  const parts: string[] = [];
  
  // ============================================================
  // COMMERCIAL DATA (Planilha)
  // ============================================================
  if (context.commercial) {
    const comm = context.commercial as Record<string, unknown>;
    const records = comm.records as unknown[] || [];
    parts.push(`## DADOS COMERCIAIS - PLANILHA (${records.length} registros)`);
    
    if (records.length > 0) {
      const byCloser: Record<string, unknown[]> = {};
      const bySector: Record<string, number> = {};
      const byResult: Record<string, number> = {};
      
      records.forEach((r: unknown) => {
        const record = r as Record<string, unknown>;
        const closer = (record.responsavel as string) || "Não identificado";
        const sector = (record.setor as string) || "Não identificado";
        const result = (record.resultado as string) || "Não identificado";
        
        if (!byCloser[closer]) byCloser[closer] = [];
        byCloser[closer].push(record);
        
        bySector[sector] = (bySector[sector] || 0) + 1;
        byResult[result] = (byResult[result] || 0) + 1;
      });
      
      parts.push("\n### Atendimentos por Closer:");
      Object.entries(byCloser).forEach(([closer, recs]) => {
        const closedContracts = recs.filter(r => 
          ((r as Record<string, unknown>).resultado as string)?.toLowerCase().includes("contrato fechado")
        ).length;
        const totalHonorarios = recs.reduce((sum: number, r) => 
          sum + (((r as Record<string, unknown>).honorariosExito as number) || 0), 0
        );
        parts.push(`- ${closer}: ${recs.length} atendimentos, ${closedContracts} contratos fechados, R$ ${(totalHonorarios as number).toFixed(2)} em honorários`);
      });
      
      parts.push("\n### Por Setor:");
      Object.entries(bySector).forEach(([sector, count]) => {
        parts.push(`- ${sector}: ${count}`);
      });
      
      parts.push("\n### Por Resultado:");
      Object.entries(byResult).forEach(([result, count]) => {
        parts.push(`- ${result}: ${count}`);
      });
      
      parts.push("\n### Lista de Contratos Fechados:");
      records.filter((r: unknown) => 
        ((r as Record<string, unknown>).resultado as string)?.toLowerCase().includes("contrato fechado")
      ).forEach((r: unknown) => {
        const record = r as Record<string, unknown>;
        parts.push(`- Cliente: ${record.cliente}, Closer: ${record.responsavel}, Setor: ${record.setor}, Produto: ${record.produto}, Honorários: R$ ${record.honorariosExito || 0}`);
      });
    }

    // SDR Data
    const sdrData = comm.sdrData as unknown[] || [];
    if (sdrData.length > 0) {
      const bySDR: Record<string, number> = {};
      sdrData.forEach((r: unknown) => {
        const record = r as Record<string, unknown>;
        const sdr = (record.colA as string) || "Não identificado";
        bySDR[sdr] = (bySDR[sdr] || 0) + 1;
      });
      parts.push(`\n### Dados SDR: ${sdrData.length} registros de agendamentos`);
      Object.entries(bySDR).slice(0, 10).forEach(([sdr, count]) => {
        parts.push(`- ${sdr}: ${count}`);
      });
    }

    // SDR Messages
    const sdrMessagesData = comm.sdrMessagesData as unknown[] || [];
    const sdrNames = comm.sdrMessagesSdrNames as string[] || [];
    if (sdrMessagesData.length > 0) {
      parts.push(`\n### Mensagens SDR: ${sdrMessagesData.length} semanas de dados para ${sdrNames.length} SDRs (${sdrNames.join(", ")})`);
    }

    // Indicações
    const indicacoes = comm.indicacoesData as unknown[] || [];
    const indicacoesRecebidas = comm.indicacoesRecebidasData as unknown[] || [];
    if (indicacoes.length > 0 || indicacoesRecebidas.length > 0) {
      parts.push(`\n### Indicações: ${indicacoes.length} contatos, ${indicacoesRecebidas.length} indicações recebidas`);
      
      if (indicacoes.length > 0) {
        const byResp: Record<string, number> = {};
        indicacoes.forEach((i: unknown) => {
          const ind = i as Record<string, unknown>;
          const resp = (ind.responsavel as string) || "Não identificado";
          byResp[resp] = (byResp[resp] || 0) + 1;
        });
        parts.push("\n### Indicações por Responsável:");
        Object.entries(byResp).forEach(([resp, count]) => {
          parts.push(`- ${resp}: ${count}`);
        });
      }
    }

    // Saneamento Comercial
    const saneamentoComercial = comm.saneamentoData as unknown[] || [];
    if (saneamentoComercial.length > 0) {
      const saneados = saneamentoComercial.filter((s: unknown) => {
        const rec = s as Record<string, unknown>;
        const status = ((rec.Saneamento || rec.saneamento) as string || "").toLowerCase();
        return status.includes("saneado");
      }).length;
      parts.push(`\n### Saneamento Comercial: ${saneamentoComercial.length} pastas (${saneados} saneadas)`);
    }

    // Administrativo - Avaliações Google
    const adminData = comm.administrativoData as unknown[] || [];
    if (adminData.length > 0) {
      parts.push(`\n### Avaliações Google: ${adminData.length} avaliações registradas`);
    }

    // Testemunhas
    const testemunhas = comm.testemunhasData as unknown[] || [];
    if (testemunhas.length > 0) {
      parts.push(`\n### Abordagem de Testemunhas: ${testemunhas.length} registros`);
    }

    // Documentos Físicos
    const docsFisicos = comm.documentosFisicosData as unknown[] || [];
    if (docsFisicos.length > 0) {
      parts.push(`\n### Documentos Físicos: ${docsFisicos.length} registros`);
    }

    // ADVBOX (Administrativo 2)
    const advbox = comm.administrativo2Data as unknown[] || [];
    if (advbox.length > 0) {
      parts.push(`\n### Documentação ADVBOX: ${advbox.length} pastas registradas`);
    }

    // Agendamentos Bancários
    const bancarioAg = comm.bancarioAgendamentosData as unknown[] || [];
    if (bancarioAg.length > 0) {
      parts.push(`\n### Agendamentos Bancários: ${bancarioAg.length} registros`);
    }
  }
  
  // ============================================================
  // BANCARIO DATA (Planilha)
  // ============================================================
  if (context.bancario) {
    const banc = context.bancario as Record<string, unknown>;
    const iniciais = banc.iniciaisData as unknown[] || [];
    const saneamento = banc.saneamentoData as unknown[] || [];
    const transito = banc.transitoData as unknown[] || [];
    
    parts.push(`\n## DADOS BANCÁRIO - PLANILHA`);
    parts.push(`- Petições Iniciais: ${iniciais.length}`);
    parts.push(`- Saneamento: ${saneamento.length}`);
    parts.push(`- Trânsito em Julgado: ${transito.length}`);
    
    if (iniciais.length > 0) {
      const byResp: Record<string, number> = {};
      iniciais.forEach((r: unknown) => {
        const resp = ((r as Record<string, unknown>).responsavel as string) || "Não identificado";
        byResp[resp] = (byResp[resp] || 0) + 1;
      });
      parts.push("\n### Iniciais por Responsável:");
      Object.entries(byResp).forEach(([resp, count]) => {
        parts.push(`- ${resp}: ${count}`);
      });
    }

    if (transito.length > 0) {
      const byResult: Record<string, number> = {};
      transito.forEach((r: unknown) => {
        const result = ((r as Record<string, unknown>).resultadoFinal as string) || "Não identificado";
        byResult[result] = (byResult[result] || 0) + 1;
      });
      parts.push("\n### Trânsito por Resultado Final:");
      Object.entries(byResult).forEach(([result, count]) => {
        parts.push(`- ${result}: ${count}`);
      });
    }
  }
  
  // ============================================================
  // CONTROLADORIA DATA (Planilha)
  // ============================================================
  if (context.controladoria) {
    const ctrl = context.controladoria as Record<string, unknown>;
    const tasks = ctrl.tasks as unknown[] || [];
    const conformityErrors = ctrl.conformityErrors as unknown[] || [];
    const deadlineErrors = ctrl.deadlineErrors as unknown[] || [];
    const intimacoes = ctrl.intimacoesPrevidenciario as unknown[] || [];
    
    parts.push(`\n## DADOS CONTROLADORIA - PLANILHA`);
    parts.push(`- Total de Tarefas: ${tasks.length}`);
    parts.push(`- Erros de Conformidade: ${conformityErrors.length}`);
    parts.push(`- Erros de Prazo: ${deadlineErrors.length}`);
    parts.push(`- Intimações Previdenciário: ${intimacoes.length}`);
    
    if (tasks.length > 0) {
      const byController: Record<string, { total: number; completed: number }> = {};
      tasks.forEach((t: unknown) => {
        const task = t as Record<string, unknown>;
        const controller = (task.controller as string) || "Não identificado";
        if (!byController[controller]) byController[controller] = { total: 0, completed: 0 };
        byController[controller].total++;
        if (task.dataCumprimento) byController[controller].completed++;
      });
      parts.push("\n### Tarefas por Controller:");
      Object.entries(byController).forEach(([controller, data]) => {
        parts.push(`- ${controller}: ${data.total} tarefas (${data.completed} concluídas)`);
      });
    }
  }
  
  // ============================================================
  // PREVIDENCIARIO DATA (Planilha)
  // ============================================================
  if (context.previdenciario) {
    const prev = context.previdenciario as Record<string, unknown>;
    const peticoes = prev.peticoesIniciais as unknown[] || [];
    const aposentadorias = prev.aposentadorias as unknown[] || [];
    const tarefas = prev.tarefas as unknown[] || [];
    
    parts.push(`\n## DADOS PREVIDENCIÁRIO - PLANILHA`);
    parts.push(`- Petições Iniciais: ${peticoes.length}`);
    parts.push(`- Aposentadorias: ${aposentadorias.length}`);
    parts.push(`- Tarefas: ${(tarefas || []).length}`);
    
    if (peticoes.length > 0) {
      const byResp: Record<string, number> = {};
      const bySituacao: Record<string, number> = {};
      peticoes.forEach((p: unknown) => {
        const record = p as Record<string, unknown>;
        const resp = (record.responsavel as string) || "Não identificado";
        const situacao = (record.situacao as string) || "Não identificado";
        byResp[resp] = (byResp[resp] || 0) + 1;
        bySituacao[situacao] = (bySituacao[situacao] || 0) + 1;
      });
      parts.push("\n### Petições por Responsável:");
      Object.entries(byResp).forEach(([resp, count]) => {
        parts.push(`- ${resp}: ${count}`);
      });
      parts.push("\n### Petições por Situação:");
      Object.entries(bySituacao).forEach(([situacao, count]) => {
        parts.push(`- ${situacao}: ${count}`);
      });
    }
  }
  
  // ============================================================
  // TRABALHISTA DATA (Planilha)
  // ============================================================
  if (context.trabalhista) {
    const trab = context.trabalhista as Record<string, unknown>;
    const iniciais = trab.iniciais as unknown[] || [];
    const atividades = trab.atividades as unknown[] || [];
    
    parts.push(`\n## DADOS TRABALHISTA - PLANILHA`);
    parts.push(`- Petições Iniciais: ${iniciais.length}`);
    parts.push(`- Atividades: ${atividades.length}`);
    
    if (iniciais.length > 0) {
      const byResp: Record<string, number> = {};
      const byTipo: Record<string, number> = {};
      iniciais.forEach((i: unknown) => {
        const record = i as Record<string, unknown>;
        const resp = (record.responsavel as string) || "Não identificado";
        const tipo = (record.tipo as string) || "Não identificado";
        byResp[resp] = (byResp[resp] || 0) + 1;
        byTipo[tipo] = (byTipo[tipo] || 0) + 1;
      });
      parts.push("\n### Iniciais por Responsável:");
      Object.entries(byResp).forEach(([resp, count]) => {
        parts.push(`- ${resp}: ${count}`);
      });
      parts.push("\n### Iniciais por Tipo:");
      Object.entries(byTipo).forEach(([tipo, count]) => {
        parts.push(`- ${tipo}: ${count}`);
      });
    }
  }

  // ============================================================
  // MARKETING DATA (Supabase)
  // ============================================================
  if (context.marketing) {
    const mkt = context.marketing as Record<string, unknown>;
    const atividades = mkt.atividades as unknown[] || [];
    const colunas = mkt.colunas as unknown[] || [];
    const ideias = mkt.ideias as unknown[] || [];
    const conteudos = mkt.conteudos as unknown[] || [];

    parts.push(`\n## DADOS MARKETING - SISTEMA`);
    parts.push(`- Atividades Kanban: ${atividades.length}`);
    parts.push(`- Ideias de Conteúdo: ${ideias.length}`);
    parts.push(`- Conteúdos (Calendário): ${conteudos.length}`);

    if (atividades.length > 0) {
      const byPrioridade: Record<string, number> = {};
      const atrasadas: unknown[] = [];
      const today = new Date().toISOString().split('T')[0];

      atividades.forEach((a: unknown) => {
        const at = a as Record<string, unknown>;
        const prioridade = (at.prioridade as string) || "util";
        byPrioridade[prioridade] = (byPrioridade[prioridade] || 0) + 1;

        const prazo = at.prazo_fatal as string;
        if (prazo && prazo < today) {
          atrasadas.push(at);
        }
      });

      parts.push("\n### Atividades por Prioridade:");
      Object.entries(byPrioridade).forEach(([pri, count]) => {
        parts.push(`- ${pri}: ${count}`);
      });

      if (atrasadas.length > 0) {
        parts.push(`\n### ⚠️ Atividades Atrasadas: ${atrasadas.length}`);
        atrasadas.slice(0, 5).forEach((a: unknown) => {
          const at = a as Record<string, unknown>;
          parts.push(`- ${at.atividade} (prazo: ${at.prazo_fatal})`);
        });
      }
    }

    if (ideias.length > 0) {
      const pendentes = ideias.filter((i: unknown) => !(i as Record<string, unknown>).validado).length;
      const validadas = ideias.length - pendentes;
      parts.push(`\n### Ideias: ${pendentes} pendentes, ${validadas} validadas`);
    }

    if (conteudos.length > 0) {
      const byStatus: Record<string, number> = {};
      const bySetor: Record<string, number> = {};
      
      conteudos.forEach((c: unknown) => {
        const cont = c as Record<string, unknown>;
        const status = (cont.status as string) || "a_gravar";
        const setor = (cont.setor as string) || "Não identificado";
        byStatus[status] = (byStatus[status] || 0) + 1;
        bySetor[setor] = (bySetor[setor] || 0) + 1;
      });

      parts.push("\n### Conteúdos por Status:");
      Object.entries(byStatus).forEach(([status, count]) => {
        const label = status === "a_gravar" ? "A Gravar" : 
                      status === "gravado" ? "Gravado" :
                      status === "em_edicao" ? "Em Edição" :
                      status === "editado" ? "Editado" :
                      status === "postado" ? "Postado" : status;
        parts.push(`- ${label}: ${count}`);
      });

      parts.push("\n### Conteúdos por Setor:");
      Object.entries(bySetor).forEach(([setor, count]) => {
        parts.push(`- ${setor}: ${count}`);
      });
    }
  }

  // ============================================================
  // ROBÔS DATA (Supabase)
  // ============================================================
  if (context.robos) {
    const robos = context.robos as Record<string, unknown>;
    const produtos = robos.tiposProdutos as unknown[] || [];
    const transcricoes = robos.transcricoes as unknown[] || [];
    const modelagens = robos.modelagens as unknown[] || [];

    parts.push(`\n## DADOS ROBÔS - SISTEMA`);
    parts.push(`- Tipos de Produtos: ${produtos.length}`);
    parts.push(`- Transcrições de Audiências: ${transcricoes.length}`);
    parts.push(`- Modelagens de Conteúdo: ${modelagens.length}`);

    if (produtos.length > 0) {
      const bySetor: Record<string, number> = {};
      produtos.forEach((p: unknown) => {
        const prod = p as Record<string, unknown>;
        const setor = (prod.setor as string) || "Não identificado";
        bySetor[setor] = (bySetor[setor] || 0) + 1;
      });
      parts.push("\n### Produtos por Setor:");
      Object.entries(bySetor).forEach(([setor, count]) => {
        parts.push(`- ${setor}: ${count}`);
      });
    }

    if (transcricoes.length > 0) {
      const byStatus: Record<string, number> = {};
      transcricoes.forEach((t: unknown) => {
        const trans = t as Record<string, unknown>;
        const status = (trans.status as string) || "pendente";
        byStatus[status] = (byStatus[status] || 0) + 1;
      });
      parts.push("\n### Transcrições por Status:");
      Object.entries(byStatus).forEach(([status, count]) => {
        parts.push(`- ${status}: ${count}`);
      });
    }
  }

  // ============================================================
  // CLOSERS DATA (Supabase)
  // ============================================================
  if (context.closers) {
    const closers = context.closers as Record<string, unknown>;
    const atendimentos = closers.atendimentos as unknown[] || [];

    parts.push(`\n## DADOS ATENDIMENTOS CLOSERS - SISTEMA`);
    parts.push(`- Total de Atendimentos Gravados: ${atendimentos.length}`);

    if (atendimentos.length > 0) {
      const byStatus: Record<string, number> = {};
      let totalDuracao = 0;
      let countWithDuracao = 0;

      atendimentos.forEach((a: unknown) => {
        const at = a as Record<string, unknown>;
        const status = (at.status as string) || "pendente";
        byStatus[status] = (byStatus[status] || 0) + 1;
        
        const duracao = at.duracao_segundos as number;
        if (duracao && duracao > 0) {
          totalDuracao += duracao;
          countWithDuracao++;
        }
      });

      parts.push("\n### Atendimentos por Status:");
      Object.entries(byStatus).forEach(([status, count]) => {
        parts.push(`- ${status}: ${count}`);
      });

      if (countWithDuracao > 0) {
        const avgDuracao = totalDuracao / countWithDuracao;
        const minutos = Math.floor(avgDuracao / 60);
        const segundos = Math.floor(avgDuracao % 60);
        parts.push(`\n### Duração Média: ${minutos}m ${segundos}s`);
      }
    }
  }

  // ============================================================
  // PROFILES (referência)
  // ============================================================
  if (context.profiles) {
    const profiles = context.profiles as unknown[] || [];
    if (profiles.length > 0) {
      parts.push(`\n## USUÁRIOS DO SISTEMA: ${profiles.length}`);
      profiles.forEach((p: unknown) => {
        const profile = p as Record<string, unknown>;
        parts.push(`- ${profile.display_name}`);
      });
    }
  }
  
  return parts.join("\n");
}
