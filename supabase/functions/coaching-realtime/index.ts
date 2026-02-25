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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, coachInstructions, leadName, leadContext, scriptItems } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qualificacao: ScriptItem[] = scriptItems?.qualificacao || [];
    const apresentacao: ScriptItem[] = scriptItems?.apresentacao || [];
    const showRate: ScriptItem[] = scriptItems?.show_rate || [];
    const qualList = qualificacao
      .map((q) => `   - ${q.id}: ${q.description || q.label}`)
      .join("\n");
    const qualIds = qualificacao.map((q) => q.id).join(", ");
    const apresList = apresentacao
      .map((a) => `   - ${a.id}: ${a.description || a.label}`)
      .join("\n");
    const apresIds = apresentacao.map((a) => a.id).join(", ");
    const showRateList = showRate
      .map((s) => `   - ${s.id}: ${s.description || s.label}`)
      .join("\n");
    const showRateIds = showRate.map((s) => s.id).join(", ");

    const systemPrompt = `Você é um assistente de análise em tempo real de ligações SDR.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH (siga rigorosamente para avaliar RECA, RALOCA e RAPOVECA):
${coachInstructions || "Sem instruções específicas."}

Analise a transcrição e identifique com precisão:

1. APRESENTAÇÃO — Analise CADA fala de apresentação e marque como feita se o SDR disse algo com o MESMO SENTIDO (não precisa ser palavra por palavra, basta cobrir a intenção). IDs válidos: ${apresIds || "nenhum"}:
${apresList || "   Nenhuma fala de apresentação cadastrada."}

2. QUALIFICAÇÃO — Analise CADA pergunta e marque como feita se o SDR fez uma pergunta com o MESMO SENTIDO ou obteve a informação de outra forma. IDs válidos: ${qualIds || "nenhum"}:
${qualList || "   Nenhuma pergunta cadastrada."}

3. SHOW RATE — Analise CADA fala e marque como feita se o SDR cobriu o MESMO TEMA ou intenção. IDs válidos: ${showRateIds || "nenhum"}:
${showRateList || "   Nenhuma fala de show rate cadastrada."}

4. OBJEÇÕES (RAPOVECA) — SOMENTE liste objeções que o lead EXPLICITAMENTE verbalizou na transcrição. Para cada:
   - Crie um ID único em snake_case
   - Descreva a objeção detectada (cite a fala exata do lead como evidência)
   - Sugira uma resposta/pergunta para o SDR tratar essa objeção (linguagem simples, prefira perguntas que levem o lead a encontrar a resposta sozinho)
   - Indique se o SDR JÁ respondeu adequadamente (addressed: true/false)

5. RECA (Razões Emocionais) — SOMENTE gere itens quando houver evidência CLARA na transcrição de um gatilho emocional do lead (ex: o lead expressou medo, frustração, revolta, insegurança, etc.):
   - Gere perguntas/falas que o SDR deveria usar para explorar esse gatilho DETECTADO
   - Marque como "done: true" se o SDR JÁ explorou esse gatilho na transcrição
   - NÃO gere itens preventivos ou especulativos. Se o lead não demonstrou emoção, retorne array vazio.

6. RALOCA (Razões Lógicas) — SOMENTE gere itens quando houver evidência CLARA na transcrição de uma questão lógica levantada pelo lead (ex: o lead pediu dados, questionou valores, comparou alternativas, etc.):
   - Gere falas/perguntas que o SDR deveria usar para responder a esse questionamento DETECTADO
   - Marque como "done: true" se o SDR JÁ utilizou esse argumento na transcrição
   - NÃO gere itens preventivos ou especulativos. Se o lead não levantou questões lógicas, retorne array vazio.

REGRAS CRÍTICAS:
- Para APRESENTAÇÃO, QUALIFICAÇÃO e SHOW RATE: seja FLEXÍVEL na detecção. Se o SDR cobriu o mesmo tema/intenção de um item do script, mesmo com palavras diferentes, marque o ID como feito. Erre para o lado de MARCAR MAIS itens como feitos.
- Para OBJEÇÕES, RECA e RALOCA: seja RESTRITIVO. Só gere itens com evidência EXPLÍCITA na fala do lead.
- Não invente fatos sobre a transcrição. Se não está claro para objeções/RECA/RALOCA, não gere.
- NÃO gere objeções, RECA ou RALOCA especulativos ou preventivos. SOMENTE baseie-se em falas REAIS do lead.
- Se não há evidência suficiente, retorne arrays VAZIOS para objections, reca_items e raloca_items.
- Para objeções, seja criativo nas sugestões de resposta, mas SOMENTE para objeções que o lead realmente verbalizou.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_call",
          description: "Return structured analysis of the SDR call transcript",
          parameters: {
            type: "object",
            properties: {
              apresentacao_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of presentation items already done by the SDR. Valid IDs: ${apresIds}`,
              },
              qualification_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of qualification questions already asked. Valid IDs: ${qualIds}`,
              },
              show_rate_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of show rate items already done by the SDR. Valid IDs: ${showRateIds}`,
              },
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
            required: ["apresentacao_done", "qualification_done", "show_rate_done", "objections", "reca_items", "raloca_items"],
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
        tool_choice: { type: "function", function: { name: "analyze_call" } },
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
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(result));
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
      console.error("Failed to parse tool arguments:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("coaching-realtime error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
