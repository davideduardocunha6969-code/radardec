import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScriptItem {
  id: string;
  label: string;
  description: string;
}

function buildScriptPrompt(transcript: string, leadName: string, leadContext: string, scriptItems: any) {
  const qualificacao: ScriptItem[] = scriptItems?.qualificacao || [];
  const apresentacao: ScriptItem[] = scriptItems?.apresentacao || [];
  const fechamento: ScriptItem[] = scriptItems?.fechamento || [];
  const qualList = qualificacao.map((q) => `   - ${q.id}: ${q.description || q.label}`).join("\n");
  const qualIds = qualificacao.map((q) => q.id).join(", ");
  const apresList = apresentacao.map((a) => `   - ${a.id}: ${a.description || a.label}`).join("\n");
  const apresIds = apresentacao.map((a) => a.id).join(", ");
  const fechList = fechamento.map((f) => `   - ${f.id}: ${f.description || f.label}`).join("\n");
  const fechIds = fechamento.map((f) => f.id).join(", ");

  return {
    system: `Você analisa transcrições de ligações SDR e identifica quais itens do script já foram cobertos.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

1. APRESENTAÇÃO (IDs válidos: ${apresIds || "nenhum"}):
${apresList || "   Nenhum item."}

2. QUALIFICAÇÃO (IDs válidos: ${qualIds || "nenhum"}):
${qualList || "   Nenhum item."}

3. FECHAMENTO (IDs válidos: ${fechIds || "nenhum"}):
${fechList || "   Nenhum item."}

REGRAS: Só marque como feito se houver evidência CLARA na transcrição.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_script",
        description: "IDs of script items completed by the SDR",
        parameters: {
          type: "object",
          properties: {
            apresentacao_done: { type: "array", items: { type: "string" } },
            qualification_done: { type: "array", items: { type: "string" } },
            fechamento_done: { type: "array", items: { type: "string" } },
          },
          required: ["apresentacao_done", "qualification_done", "fechamento_done"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_script" } },
  };
}

function buildRecaPrompt(transcript: string, leadName: string, leadContext: string, instructions: string) {
  return {
    system: `Você é um coach de vendas em tempo real. Sua ÚNICA função é seguir EXATAMENTE as instruções abaixo para gerar orientações de RECA (Razões Emocionais de Compra e Ação) para o SDR.

LEAD: ${leadName || "Desconhecido"}
${leadContext ? `CONTEXTO DO LEAD: ${leadContext}` : ""}

===== INSTRUÇÕES OBRIGATÓRIAS DO COACH (SIGA À RISCA) =====
${instructions || "Nenhuma instrução cadastrada."}
===== FIM DAS INSTRUÇÕES =====

COMO APLICAR:
1. Leia a transcrição da ligação INTEIRA para entender o que o lead disse, suas dores, medos e desejos.
2. Baseando-se EXCLUSIVAMENTE nas instruções do coach acima, gere itens de RECA que o SDR deve usar AGORA na conversa.
3. Cada item deve ser uma FALA PRONTA que o SDR pode usar, contextualizada com o que o lead REALMENTE disse.
4. NÃO gere itens genéricos. Cada item deve referenciar algo específico da conversa.
5. Marque "done: true" SOMENTE se o SDR já usou esse gatilho emocional na transcrição.
6. Gere entre 3 e 7 itens, priorizando os mais urgentes para o momento da conversa.

PROIBIÇÕES:
- NÃO invente informações sobre o lead.
- NÃO gere instruções que contradigam as instruções do coach.
- NÃO use frases genéricas como "entendo sua preocupação" sem contexto específico.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_reca",
        description: "Emotional triggers relevant to this lead based on coach instructions",
        parameters: {
          type: "object",
          properties: {
            reca_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string", description: "Título curto do gatilho emocional" },
                  description: { type: "string", description: "Fala pronta contextualizada para o SDR usar agora" },
                  done: { type: "boolean" },
                },
                required: ["id", "label", "description", "done"],
              },
            },
          },
          required: ["reca_items"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_reca" } },
  };
}

function buildRalocaPrompt(transcript: string, leadName: string, leadContext: string, instructions: string) {
  return {
    system: `Você é um coach de vendas em tempo real. Sua ÚNICA função é seguir EXATAMENTE as instruções abaixo para gerar orientações de RALOCA (Razões Lógicas de Compra e Ação) para o SDR.

LEAD: ${leadName || "Desconhecido"}
${leadContext ? `CONTEXTO DO LEAD: ${leadContext}` : ""}

===== INSTRUÇÕES OBRIGATÓRIAS DO COACH (SIGA À RISCA) =====
${instructions || "Nenhuma instrução cadastrada."}
===== FIM DAS INSTRUÇÕES =====

COMO APLICAR:
1. Leia a transcrição da ligação INTEIRA para entender a situação real do lead.
2. Baseando-se EXCLUSIVAMENTE nas instruções do coach acima, gere argumentos lógicos que o SDR deve usar AGORA.
3. Cada item deve ser uma FALA PRONTA contextualizada com o que o lead REALMENTE disse na conversa.
4. NÃO gere itens genéricos. Referencie dados, números ou situações mencionados pelo lead.
5. Marque "done: true" SOMENTE se o SDR já usou esse argumento lógico na transcrição.
6. Gere entre 3 e 7 itens, priorizando os mais urgentes.

PROIBIÇÕES:
- NÃO invente informações sobre o lead.
- NÃO gere instruções que contradigam as instruções do coach.
- NÃO use argumentos genéricos sem conexão com a conversa real.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_raloca",
        description: "Logical arguments based on coach instructions",
        parameters: {
          type: "object",
          properties: {
            raloca_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string", description: "Título curto do argumento lógico" },
                  description: { type: "string", description: "Fala pronta contextualizada para o SDR usar agora" },
                  done: { type: "boolean" },
                },
                required: ["id", "label", "description", "done"],
              },
            },
          },
          required: ["raloca_items"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_raloca" } },
  };
}

function buildRadovecaPrompt(transcript: string, leadName: string, leadContext: string, instructions: string) {
  return {
    system: `Você é um coach de vendas em tempo real. Sua ÚNICA função é seguir EXATAMENTE as instruções abaixo para gerar orientações de RADOVECA (contorno de objeções) para o SDR.

LEAD: ${leadName || "Desconhecido"}
${leadContext ? `CONTEXTO DO LEAD: ${leadContext}` : ""}

===== INSTRUÇÕES OBRIGATÓRIAS DO COACH (SIGA À RISCA) =====
${instructions || "Nenhuma instrução cadastrada."}
===== FIM DAS INSTRUÇÕES =====

COMO APLICAR:
1. Leia a transcrição INTEIRA e identifique objeções REAIS que o lead levantou.
2. Para cada objeção, siga as instruções do coach para formular a resposta.
3. A resposta sugerida deve ser uma FALA PRONTA que o SDR pode usar, usando a linguagem e abordagem definidas pelo coach.
4. NÃO invente objeções que o lead não fez. Só liste objeções com evidência na transcrição.
5. Marque "addressed: true" SOMENTE se o SDR já respondeu adequadamente.

PROIBIÇÕES:
- NÃO invente objeções que o lead não verbalizou.
- NÃO gere respostas genéricas desconectadas das instruções do coach.
- NÃO contradiga a metodologia definida nas instruções.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_objections",
        description: "Objections detected and responses based on coach methodology",
        parameters: {
          type: "object",
          properties: {
            objections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  objection: { type: "string", description: "A objeção real que o lead fez na conversa" },
                  suggested_response: { type: "string", description: "Fala pronta baseada nas instruções do coach" },
                  addressed: { type: "boolean" },
                },
                required: ["id", "objection", "suggested_response", "addressed"],
              },
            },
          },
          required: ["objections"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_objections" } },
  };
}

function buildNoshowPrompt(transcript: string, leadName: string, leadContext: string, instructions: string) {
  return {
    system: `Você é um coach de vendas em tempo real. Sua ÚNICA função é seguir EXATAMENTE as instruções abaixo para gerar orientações de prevenção de NO-SHOW para o SDR.

LEAD: ${leadName || "Desconhecido"}
${leadContext ? `CONTEXTO DO LEAD: ${leadContext}` : ""}

===== INSTRUÇÕES OBRIGATÓRIAS DO COACH (SIGA À RISCA) =====
${instructions || "Nenhuma instrução cadastrada."}
===== FIM DAS INSTRUÇÕES =====

COMO APLICAR:
1. Leia a transcrição INTEIRA e identifique sinais reais de risco de no-show (hesitação, adiamentos, desinteresse).
2. Baseando-se nas instruções do coach, gere FALAS PRONTAS que o SDR deve usar para prevenir o no-show.
3. Cada sugestão deve estar conectada ao que o lead realmente disse ou demonstrou.
4. Marque "done: true" SOMENTE se o SDR já aplicou essa estratégia.
5. Gere entre 2 e 5 itens.

PROIBIÇÕES:
- NÃO invente sinais de risco que não existem na transcrição.
- NÃO gere sugestões genéricas desconectadas da conversa.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_noshow",
        description: "No-show prevention based on coach instructions",
        parameters: {
          type: "object",
          properties: {
            noshow_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string", description: "Título curto da estratégia" },
                  description: { type: "string", description: "Fala pronta contextualizada para o SDR" },
                  done: { type: "boolean" },
                },
                required: ["id", "label", "description", "done"],
              },
            },
          },
          required: ["noshow_items"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_noshow" } },
  };
}

function buildShowratePrompt(transcript: string, leadName: string, leadContext: string, showRateItems: any[], coachInstructions?: string) {
  const itemsList = (showRateItems || []).map((i: any) => `- ${i.label}: ${i.description || ""}`).join("\n");
  return {
    system: `Você é um coach de vendas em tempo real. Sua ÚNICA função é analisar a probabilidade de SHOW RATE seguindo EXATAMENTE as instruções abaixo.

LEAD: ${leadName || "Desconhecido"}
${leadContext ? `CONTEXTO DO LEAD: ${leadContext}` : ""}

===== INSTRUÇÕES OBRIGATÓRIAS DO COACH (SIGA À RISCA) =====
${coachInstructions || "Nenhuma instrução cadastrada."}
===== FIM DAS INSTRUÇÕES =====

FALAS DE SHOW RATE CADASTRADAS:
${itemsList || "Nenhuma fala cadastrada."}

COMO APLICAR:
1. Leia a transcrição INTEIRA e avalie sinais reais de comprometimento ou desinteresse do lead.
2. Calcule um SCORE de 0 a 100 baseado em evidências concretas da conversa.
3. A fala sugerida e a pergunta de confirmação devem seguir a metodologia do coach e ser contextualizadas com a conversa real.
4. Para cada item de show rate cadastrado, marque "done: true" SOMENTE se o SDR já utilizou.

Fatores que AUMENTAM: compromisso verbal, entusiasmo, perguntas sobre a reunião, disponibilidade confirmada.
Fatores que DIMINUEM: hesitação, "vou ver", "talvez", falta de urgência, objeções não resolvidas.

PROIBIÇÕES:
- NÃO gere sugestões genéricas desconectadas da conversa.
- NÃO contradiga as instruções do coach.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_showrate",
        description: "Show rate analysis based on coach instructions",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number", description: "Probabilidade 0-100 baseada em evidências da conversa" },
            classification: { type: "string", enum: ["alta", "media", "baixa", "critica"] },
            dominant_risk: { type: "string", description: "Risco principal identificado na conversa real" },
            suggested_phrase: { type: "string", description: "Fala pronta contextualizada seguindo a metodologia do coach" },
            confirmation_question: { type: "string", description: "Pergunta de confirmação contextualizada" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  description: { type: "string" },
                  done: { type: "boolean" },
                },
                required: ["id", "label", "description", "done"],
              },
            },
          },
          required: ["score", "classification", "dominant_risk", "suggested_phrase", "confirmation_question", "items"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_showrate" } },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { transcript, leadName, leadContext, mode } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let promptConfig: { system: string; tools: any[]; toolChoice: any };

    switch (mode) {
      case "script":
        promptConfig = buildScriptPrompt(transcript, leadName, leadContext, body.scriptItems);
        break;
      case "reca":
        promptConfig = buildRecaPrompt(transcript, leadName, leadContext, body.coachInstructions);
        break;
      case "raloca":
        promptConfig = buildRalocaPrompt(transcript, leadName, leadContext, body.coachInstructions);
        break;
      case "radoveca":
        promptConfig = buildRadovecaPrompt(transcript, leadName, leadContext, body.coachInstructions);
        break;
      case "noshow":
        promptConfig = buildNoshowPrompt(transcript, leadName, leadContext, body.coachInstructions);
        break;
      case "showrate":
        promptConfig = buildShowratePrompt(transcript, leadName, leadContext, body.showRateItems, body.coachInstructions);
        break;
      default:
        // Legacy fallback — single combined call
        promptConfig = buildScriptPrompt(transcript, leadName, leadContext, body.scriptItems);
        break;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: promptConfig.system },
          { role: "user", content: `Transcrição atual da ligação:\n\n${transcript}` },
        ],
        tools: promptConfig.tools,
        tool_choice: promptConfig.toolChoice,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let analysis;
    try {
      analysis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      console.error("Failed to parse tool arguments:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("coaching-realtime error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
