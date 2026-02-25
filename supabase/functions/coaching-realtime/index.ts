import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newTranscript, coachingState, coachInstructions, leadName, leadContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build state context for the model
    const ativas = (coachingState?.sugestoes_ativas || []) as Array<{id: string; gatilho: string; classificacao: string; resposta_sugerida: string}>;
    const encerradas = (coachingState?.sugestoes_encerradas || []) as Array<{id: string; gatilho: string; classificacao: string; status: string}>;

    const stateContext = [
      ativas.length
        ? `SUGESTÕES ATIVAS (podem ter status atualizado):\n${ativas.map(s => `- [${s.classificacao}] id="${s.id}" | gatilho: "${s.gatilho}" | sugestão: "${s.resposta_sugerida}"`).join("\n")}`
        : "SUGESTÕES ATIVAS: nenhuma.",
      encerradas.length
        ? `SUGESTÕES ENCERRADAS (NÃO gerar novas sobre estes gatilhos):\n${encerradas.map(s => `- [${s.classificacao}] id="${s.id}" | gatilho: "${s.gatilho}" | status: ${s.status}`).join("\n")}`
        : "",
    ].filter(Boolean).join("\n\n");

    const systemPrompt = `Você é um assistente de coaching em tempo real de ligações SDR.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH:
${coachInstructions || "Sem instruções específicas."}

--- ESTADO ATUAL DAS SUGESTÕES ---
${stateContext}
--- FIM DO ESTADO ---

Você receberá APENAS as falas NOVAS da ligação (delta desde a última análise). Você tem DUAS responsabilidades:

1. **UPDATES** — Para cada sugestão ATIVA listada acima, avalie se algo mudou nas falas novas:
   - "DITO": o SDR já usou essa sugestão ou tratou o gatilho
   - "TIMING_PASSOU": o momento ideal para usar essa sugestão já passou
   - "MANTER": nada mudou, manter como está
   Retorne updates APENAS para itens cujo status mudou (DITO ou TIMING_PASSOU). Não retorne "MANTER".

2. **NEW_ITEMS** — Gere novas sugestões APENAS se houver gatilhos GENUINAMENTE NOVOS nas falas recebidas:

   a) OBJEÇÕES (RAPOVECA) — SOMENTE objeções que o lead EXPLICITAMENTE verbalizou. Cite a fala exata como evidência.
   b) RECA (Emocionais) — SOMENTE quando houver evidência CLARA de gatilho emocional do lead.
   c) RALOCA (Lógicos) — SOMENTE quando houver evidência CLARA de questão lógica do lead.

REGRAS CRÍTICAS:
- NUNCA gere um item sobre um gatilho que já existe nas sugestões ativas OU encerradas acima.
- Cada frase-gatilho do lead gera NO MÁXIMO 1 item.
- Seja RESTRITIVO. Só gere com evidência EXPLÍCITA na fala do lead.
- Se não há novos gatilhos, retorne arrays VAZIOS em new_items.
- NÃO invente fatos. NÃO gere itens especulativos ou preventivos.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_coaching",
          description: "Return coaching analysis with status updates and genuinely new items",
          parameters: {
            type: "object",
            properties: {
              updates: {
                type: "array",
                description: "Status updates for existing active suggestions (only DITO or TIMING_PASSOU)",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "ID of the existing suggestion" },
                    new_status: { type: "string", enum: ["DITO", "TIMING_PASSOU"], description: "New status" },
                  },
                  required: ["id", "new_status"],
                },
              },
              new_items: {
                type: "object",
                description: "Genuinely new suggestions based on new transcript content",
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
                required: ["objections", "reca_items", "raloca_items"],
              },
            },
            required: ["updates", "new_items"],
          },
        },
      },
    ];

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
          { role: "user", content: `Falas NOVAS da ligação (delta):\n\n${newTranscript}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "analyze_coaching" } },
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
      console.error("[coaching-realtime] AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[coaching-realtime] No tool call:", JSON.stringify(result));
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
      console.error("[coaching-realtime] Parse error:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[coaching-realtime] error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
