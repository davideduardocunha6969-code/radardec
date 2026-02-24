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
  const qualList = qualificacao.map((q) => `   - ${q.id}: ${q.description || q.label}`).join("\n");
  const qualIds = qualificacao.map((q) => q.id).join(", ");
  const apresList = apresentacao.map((a) => `   - ${a.id}: ${a.description || a.label}`).join("\n");
  const apresIds = apresentacao.map((a) => a.id).join(", ");

  return {
    system: `Você analisa transcrições de ligações SDR e identifica quais itens do script já foram cobertos.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

1. APRESENTAÇÃO (IDs válidos: ${apresIds || "nenhum"}):
${apresList || "   Nenhum item."}

2. QUALIFICAÇÃO (IDs válidos: ${qualIds || "nenhum"}):
${qualList || "   Nenhum item."}

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
          },
          required: ["apresentacao_done", "qualification_done"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_script" } },
  };
}

function buildRecaPrompt(transcript: string, leadName: string, leadContext: string, instructions: string) {
  return {
    system: `Você é uma IA especialista em RAZÕES EMOCIONAIS (RECA) e âncoras emocionais em vendas.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH PARA RECA:
${instructions || "Identifique gatilhos emocionais relevantes para este lead."}

Analise a transcrição e:
- Identifique quais gatilhos emocionais são relevantes para ESTE lead específico
- Gere perguntas/falas que o SDR deveria usar para ativar esses gatilhos
- Marque como "done: true" se o SDR JÁ explorou esse gatilho na transcrição
- Adapte ao estado emocional detectado do lead
- Gere entre 3 e 7 itens priorizando os mais relevantes

REGRAS: Só marque como feito se houver evidência CLARA. Não invente fatos.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_reca",
        description: "Emotional triggers relevant to this lead",
        parameters: {
          type: "object",
          properties: {
            reca_items: {
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
          required: ["reca_items"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_reca" } },
  };
}

function buildRalocaPrompt(transcript: string, leadName: string, leadContext: string, instructions: string) {
  return {
    system: `Você é uma IA especialista em RAZÕES LÓGICAS (RALOCA) e argumentos racionais em vendas.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH PARA RALOCA:
${instructions || "Identifique argumentos lógicos relevantes para este lead."}

Analise a transcrição e:
- Identifique quais argumentos lógicos são relevantes para ESTE lead
- Gere falas/perguntas que o SDR deveria usar para trazer consciência lógica
- Marque como "done: true" se o SDR JÁ utilizou esse argumento
- Gere entre 3 e 7 itens priorizando os mais relevantes

REGRAS: Só marque como feito se houver evidência CLARA. Não invente fatos.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_raloca",
        description: "Logical arguments relevant to this lead",
        parameters: {
          type: "object",
          properties: {
            raloca_items: {
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
          required: ["raloca_items"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_raloca" } },
  };
}

function buildRadovecaPrompt(transcript: string, leadName: string, leadContext: string, instructions: string) {
  return {
    system: `Você é uma IA especialista em OBJEÇÕES (RADOVECA) e contorno de objeções em vendas.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH PARA OBJEÇÕES:
${instructions || "Identifique e sugira respostas para objeções do lead."}

Analise a transcrição e identifique TODAS as objeções do lead. Para cada:
- Crie um ID único em snake_case
- Descreva a objeção detectada
- Sugira uma resposta/pergunta para o SDR (linguagem simples, prefira perguntas que levem o lead a encontrar a resposta sozinho)
- Indique se o SDR JÁ respondeu adequadamente (addressed: true/false)

REGRAS: Só marque como addressed se houver evidência CLARA. Não invente fatos.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_objections",
        description: "Objections detected in the call",
        parameters: {
          type: "object",
          properties: {
            objections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  objection: { type: "string" },
                  suggested_response: { type: "string" },
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
    system: `Você é uma IA especialista em situações de NO-SHOW em vendas (quando o lead não aparece ou cancela).

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH PARA NO-SHOW:
${instructions || "Identifique sinais de no-show e sugira abordagens de recuperação."}

Analise a transcrição e:
- Identifique sinais de que o lead pode dar no-show (hesitação, desinteresse, adiamentos)
- Gere sugestões de falas/perguntas para prevenir o no-show
- Sugira estratégias de reengajamento se o no-show já ocorreu
- Marque como "done: true" se o SDR JÁ aplicou essa estratégia
- Gere entre 2 e 5 itens priorizando os mais relevantes

REGRAS: Só marque como feito se houver evidência CLARA. Não invente fatos.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_noshow",
        description: "No-show prevention and recovery strategies",
        parameters: {
          type: "object",
          properties: {
            noshow_items: {
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
          required: ["noshow_items"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "analyze_noshow" } },
  };
}

function buildShowratePrompt(transcript: string, leadName: string, leadContext: string, showRateItems: any[]) {
  const itemsList = (showRateItems || []).map((i: any) => `- ${i.label}: ${i.description || ""}`).join("\n");
  return {
    system: `Você é uma IA especialista em análise de SHOW RATE (probabilidade de comparecimento a reuniões agendadas).

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

FALAS DE SHOW RATE DISPONÍVEIS:
${itemsList || "Nenhuma fala cadastrada."}

Analise a transcrição e:
1. Calcule um SCORE de 0 a 100 representando a probabilidade do lead comparecer à reunião
2. Classifique: "alta" (>=75), "media" (55-74), "baixa" (35-54), "critica" (<35)
3. Identifique o risco dominante para não comparecimento
4. Sugira UMA fala curta (máximo 2 frases) para aumentar o comparecimento
5. Sugira UMA pergunta de confirmação de compromisso
6. Para cada item de show rate, marque "done: true" se o SDR JÁ utilizou

Fatores que AUMENTAM o score: compromisso verbal explícito, entusiasmo, perguntas sobre a reunião, mencionar disponibilidade.
Fatores que DIMINUEM o score: hesitação, "vou ver", "talvez", "não sei se consigo", falta de urgência, excesso de objeções não resolvidas.

REGRAS: Só marque como feito se houver evidência CLARA. Não invente fatos.`,
    tools: [{
      type: "function",
      function: {
        name: "analyze_showrate",
        description: "Show rate analysis with score and recommendations",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number", description: "Show rate probability 0-100" },
            classification: { type: "string", enum: ["alta", "media", "baixa", "critica"] },
            dominant_risk: { type: "string", description: "Main risk for no-show" },
            suggested_phrase: { type: "string", description: "Suggested phrase to increase show rate" },
            confirmation_question: { type: "string", description: "Commitment confirmation question" },
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
        promptConfig = buildShowratePrompt(transcript, leadName, leadContext, body.showRateItems);
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
        model: "google/gemini-2.5-flash-lite",
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
