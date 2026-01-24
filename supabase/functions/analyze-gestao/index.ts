import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare context summary for AI
    const contextSummary = prepareContextSummary(context);
    
    const systemPrompt = `Você é um analista de dados especializado em gestão jurídica. Você tem acesso a dados de múltiplos setores:
- Comercial: atendimentos, contratos fechados, closers, SDRs, indicações
- Bancário: petições iniciais, saneamento, trânsito em julgado
- Controladoria: tarefas, prazos, conformidade
- Previdenciário: petições iniciais, aposentadorias, tarefas
- Trabalhista: petições iniciais, atividades

Sua tarefa é analisar a pergunta do usuário e gerar uma resposta estruturada com visualizações.

IMPORTANTE: Você DEVE responder em formato JSON válido com a seguinte estrutura:
{
  "summary": "Resumo textual da análise em português",
  "visualizations": [
    {
      "type": "metric",
      "title": "Título do métric card",
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
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
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      analysisResult = {
        summary: content,
        visualizations: [
          {
            type: "text",
            title: "Análise",
            data: { content: content }
          }
        ]
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
  
  // Commercial data
  if (context.commercial) {
    const comm = context.commercial as Record<string, unknown>;
    const records = comm.records as unknown[] || [];
    parts.push(`## DADOS COMERCIAIS (${records.length} registros)`);
    
    if (records.length > 0) {
      // Group by closer
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
      
      // List individual records for detailed queries
      parts.push("\n### Lista de Contratos Fechados:");
      records.filter((r: unknown) => 
        ((r as Record<string, unknown>).resultado as string)?.toLowerCase().includes("contrato fechado")
      ).forEach((r: unknown) => {
        const record = r as Record<string, unknown>;
        parts.push(`- Cliente: ${record.cliente}, Closer: ${record.responsavel}, Setor: ${record.setor}, Produto: ${record.produto}, Honorários: R$ ${record.honorariosExito || 0}`);
      });
    }
  }
  
  // Bancario data
  if (context.bancario) {
    const banc = context.bancario as Record<string, unknown>;
    const iniciais = banc.iniciaisData as unknown[] || [];
    const saneamento = banc.saneamentoData as unknown[] || [];
    const transito = banc.transitoData as unknown[] || [];
    
    parts.push(`\n## DADOS BANCÁRIO`);
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
  }
  
  // Controladoria data
  if (context.controladoria) {
    const ctrl = context.controladoria as Record<string, unknown>;
    const tasks = ctrl.tasks as unknown[] || [];
    const conformityErrors = ctrl.conformityErrors as unknown[] || [];
    const deadlineErrors = ctrl.deadlineErrors as unknown[] || [];
    
    parts.push(`\n## DADOS CONTROLADORIA`);
    parts.push(`- Total de Tarefas: ${tasks.length}`);
    parts.push(`- Erros de Conformidade: ${conformityErrors.length}`);
    parts.push(`- Erros de Prazo: ${deadlineErrors.length}`);
    
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
  
  // Previdenciario data
  if (context.previdenciario) {
    const prev = context.previdenciario as Record<string, unknown>;
    const peticoes = prev.peticoesIniciais as unknown[] || [];
    const aposentadorias = prev.aposentadorias as unknown[] || [];
    
    parts.push(`\n## DADOS PREVIDENCIÁRIO`);
    parts.push(`- Petições Iniciais: ${peticoes.length}`);
    parts.push(`- Aposentadorias: ${aposentadorias.length}`);
    
    if (peticoes.length > 0) {
      const byResp: Record<string, number> = {};
      peticoes.forEach((p: unknown) => {
        const resp = ((p as Record<string, unknown>).responsavel as string) || "Não identificado";
        byResp[resp] = (byResp[resp] || 0) + 1;
      });
      parts.push("\n### Petições por Responsável:");
      Object.entries(byResp).forEach(([resp, count]) => {
        parts.push(`- ${resp}: ${count}`);
      });
    }
  }
  
  // Trabalhista data
  if (context.trabalhista) {
    const trab = context.trabalhista as Record<string, unknown>;
    const iniciais = trab.iniciais as unknown[] || [];
    const atividades = trab.atividades as unknown[] || [];
    
    parts.push(`\n## DADOS TRABALHISTA`);
    parts.push(`- Petições Iniciais: ${iniciais.length}`);
    parts.push(`- Atividades: ${atividades.length}`);
    
    if (iniciais.length > 0) {
      const byResp: Record<string, number> = {};
      iniciais.forEach((i: unknown) => {
        const resp = ((i as Record<string, unknown>).responsavel as string) || "Não identificado";
        byResp[resp] = (byResp[resp] || 0) + 1;
      });
      parts.push("\n### Iniciais por Responsável:");
      Object.entries(byResp).forEach(([resp, count]) => {
        parts.push(`- ${resp}: ${count}`);
      });
    }
  }
  
  return parts.join("\n");
}
