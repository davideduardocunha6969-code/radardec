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
    const { transcript, coachInstructions, leadName, leadContext, existingItems } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build existing items context to prevent duplicates
    const existingObjections = (existingItems?.objections || []) as Array<{id: string; objection: string}>;
    const existingReca = (existingItems?.reca || []) as Array<{id: string; label: string}>;
    const existingRaloca = (existingItems?.raloca || []) as Array<{id: string; label: string}>;

    const existingContext = [
      existingObjections.length ? `OBJEÇÕES JÁ GERADAS (NÃO REPETIR o mesmo tema/gatilho):\n${existingObjections.map(o => `- ${o.id}: ${o.objection}`).join("\n")}` : "",
      existingReca.length ? `RECA JÁ GERADOS (NÃO REPETIR o mesmo tema/gatilho):\n${existingReca.map(i => `- ${i.id}: ${i.label}`).join("\n")}` : "",
      existingRaloca.length ? `RALOCA JÁ GERADOS (NÃO REPETIR o mesmo tema/gatilho):\n${existingRaloca.map(i => `- ${i.id}: ${i.label}`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    const systemPrompt = `Você é um assistente de coaching em tempo real de ligações SDR.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH (siga rigorosamente para avaliar RECA, RALOCA e RAPOVECA):
${coachInstructions || "Sem instruções específicas."}

${existingContext ? `\n--- ITENS JÁ EXISTENTES (NÃO GERAR DUPLICATAS) ---\n${existingContext}\n` : ""}

Analise a transcrição e identifique com precisão:

1. OBJEÇÕES (RAPOVECA) — SOMENTE liste objeções que o lead EXPLICITAMENTE verbalizou na transcrição. Para cada:
   - Crie um ID único em snake_case
   - Descreva a objeção detectada (cite a fala exata do lead como evidência)
   - Sugira uma resposta/pergunta para o SDR tratar essa objeção (linguagem simples, prefira perguntas que levem o lead a encontrar a resposta sozinho)
   - Indique se o SDR JÁ respondeu adequadamente (addressed: true/false)

2. RECA (Razões Emocionais) — SOMENTE gere itens quando houver evidência CLARA na transcrição de um gatilho emocional do lead:
   - Gere perguntas/falas que o SDR deveria usar para explorar esse gatilho DETECTADO
   - Marque como "done: true" se o SDR JÁ explorou esse gatilho na transcrição
   - NÃO gere itens preventivos ou especulativos. Se o lead não demonstrou emoção, retorne array vazio.

3. RALOCA (Razões Lógicas) — SOMENTE gere itens quando houver evidência CLARA na transcrição de uma questão lógica levantada pelo lead:
   - Gere falas/perguntas que o SDR deveria usar para responder a esse questionamento DETECTADO
   - Marque como "done: true" se o SDR JÁ utilizou esse argumento na transcrição
   - NÃO gere itens preventivos ou especulativos. Se o lead não levantou questões lógicas, retorne array vazio.

REGRAS CRÍTICAS:
- NUNCA gere um item sobre o MESMO TEMA ou GATILHO de um item já existente listado acima. Cada frase-gatilho do lead deve gerar NO MÁXIMO 1 item.
- Para OBJEÇÕES, RECA e RALOCA: seja RESTRITIVO. Só gere itens com evidência EXPLÍCITA na fala do lead.
- Não invente fatos sobre a transcrição. Se não está claro, não gere.
- NÃO gere objeções, RECA ou RALOCA especulativos ou preventivos. SOMENTE baseie-se em falas REAIS do lead.
- Se não há evidência suficiente, retorne arrays VAZIOS.
- Se um gatilho/tema JÁ EXISTE na lista acima, NÃO gere outro item para ele, mesmo com palavras diferentes.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_coaching",
          description: "Return coaching analysis of the SDR call transcript",
          parameters: {
            type: "object",
            properties: {
              objections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Unique snake_case ID for this objection" },
                    objection: { type: "string", description: "Description of the objection detected" },
                    suggested_response: { type: "string", description: "Suggested response/question for the SDR" },
                    addressed: { type: "boolean", description: "Whether the SDR already addressed this objection" },
                  },
                  required: ["id", "objection", "suggested_response", "addressed"],
                },
              },
              reca_items: {
                type: "array",
                description: "Dynamically generated emotional triggers relevant to this lead",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Unique snake_case ID" },
                    label: { type: "string", description: "Short label for the emotional trigger" },
                    description: { type: "string", description: "Suggested question/phrase for the SDR to use" },
                    done: { type: "boolean", description: "Whether the SDR already explored this trigger" },
                  },
                  required: ["id", "label", "description", "done"],
                },
              },
              raloca_items: {
                type: "array",
                description: "Dynamically generated logical arguments relevant to this lead",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Unique snake_case ID" },
                    label: { type: "string", description: "Short label for the logical argument" },
                    description: { type: "string", description: "Suggested phrase for the SDR to use" },
                    done: { type: "boolean", description: "Whether the SDR already used this argument" },
                  },
                  required: ["id", "label", "description", "done"],
                },
              },
            },
            required: ["objections", "reca_items", "raloca_items"],
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
          { role: "user", content: `Transcrição atual da ligação:\n\n${transcript}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "analyze_coaching" } },
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("[coaching-realtime] AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[coaching-realtime] No tool call:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[coaching-realtime] error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
