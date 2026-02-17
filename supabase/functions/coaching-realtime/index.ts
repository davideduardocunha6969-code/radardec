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
    const qualList = qualificacao
      .map((q) => `   - ${q.id}: ${q.description || q.label}`)
      .join("\n");
    const qualIds = qualificacao.map((q) => q.id).join(", ");

    const systemPrompt = `Você é um assistente de análise em tempo real de ligações SDR.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH (siga rigorosamente para avaliar RECA, RALOCA e RAPOVECA):
${coachInstructions || "Sem instruções específicas."}

Analise a transcrição e identifique com precisão:

1. QUALIFICAÇÃO — Quais perguntas o SDR JÁ FEZ (IDs válidos: ${qualIds || "nenhum"}):
${qualList || "   Nenhuma pergunta cadastrada."}

2. OBJEÇÕES (RAPOVECA) — Com base nas instruções do coach, identifique TODAS as objeções do lead na transcrição. Para cada:
   - Crie um ID único em snake_case
   - Descreva a objeção detectada
   - Sugira uma resposta/pergunta para o SDR tratar essa objeção (linguagem simples, prefira perguntas que levem o lead a encontrar a resposta sozinho)
   - Indique se o SDR JÁ respondeu adequadamente (addressed: true/false)

3. RECA (Razões Emocionais) — Com base nas instruções do coach e na análise do perfil psicológico do lead:
   - Identifique quais gatilhos emocionais são relevantes para ESTE lead específico
   - Gere perguntas/falas que o SDR deveria usar para ativar esses gatilhos
   - Marque como "done: true" se o SDR JÁ explorou esse gatilho na transcrição
   - Adapte ao estado emocional detectado do lead (revoltado, resignado, pressionado, etc.)

4. RALOCA (Razões Lógicas) — Com base nas instruções do coach:
   - Identifique quais argumentos lógicos são relevantes para ESTE lead
   - Gere falas/perguntas que o SDR deveria usar para trazer consciência lógica
   - Marque como "done: true" se o SDR JÁ utilizou esse argumento na transcrição

REGRAS:
- Só marque como feito/addressed se houver evidência CLARA na transcrição.
- Não invente fatos sobre a transcrição. Se não está claro, não marque.
- Para RECA e RALOCA, gere itens DINAMICAMENTE com base no perfil do lead e nas instruções do coach.
- Para objeções, seja criativo nas sugestões de resposta.
- Gere entre 3 e 7 itens para RECA e RALOCA, priorizando os mais relevantes.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_call",
          description: "Return structured analysis of the SDR call transcript",
          parameters: {
            type: "object",
            properties: {
              qualification_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of qualification questions already asked. Valid IDs: ${qualIds}`,
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
            required: ["qualification_done", "objections", "reca_items", "raloca_items"],
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
        model: "google/gemini-2.5-flash",
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
