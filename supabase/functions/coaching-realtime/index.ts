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

function buildSystemPrompt(
  qualificacao: ScriptItem[],
  reca: ScriptItem[],
  raloca: ScriptItem[],
  coachInstructions: string,
  leadName: string,
  leadContext?: string
): string {
  const qualList = qualificacao
    .map((q) => `   - ${q.id}: ${q.description || q.label}`)
    .join("\n");
  const recaList = reca
    .map((r) => `   - ${r.id}: ${r.description || r.label}`)
    .join("\n");
  const ralocaList = raloca
    .map((r) => `   - ${r.id}: ${r.description || r.label}`)
    .join("\n");

  const qualIds = qualificacao.map((q) => q.id).join(", ");
  const recaIds = reca.map((r) => r.id).join(", ");
  const ralocaIds = raloca.map((r) => r.id).join(", ");

  return `Você é um assistente de análise em tempo real de ligações SDR.

CONTEXTO:
- Lead: ${leadName}
${leadContext ? `- Info: ${leadContext}` : ""}

Analise a transcrição e identifique com precisão:

1. QUALIFICAÇÃO — Quais perguntas o SDR JÁ FEZ (IDs válidos: ${qualIds}):
${qualList}

2. OBJEÇÕES — Identifique TODAS as objeções do lead. Para cada:
   - Crie um ID único em snake_case
   - Descreva a objeção
   - Sugira uma resposta/pergunta para o SDR (linguagem simples, prefira perguntas que levem o lead a encontrar a resposta sozinho)
   - Indique se o SDR JÁ respondeu adequadamente

3. RECA — Gatilhos emocionais ativados pelo SDR (IDs válidos: ${recaIds}):
${recaList}

4. RALOCA — Argumentos lógicos usados pelo SDR (IDs válidos: ${ralocaIds}):
${ralocaList}

REGRAS:
- Só marque como feito se houver evidência CLARA na transcrição.
- Não invente. Se não está claro, não marque.
- Para objeções, seja criativo nas sugestões.

${coachInstructions ? `INSTRUÇÕES ADICIONAIS DO COACH:\n${coachInstructions}` : ""}`;
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
    const reca: ScriptItem[] = scriptItems?.reca || [];
    const raloca: ScriptItem[] = scriptItems?.raloca || [];

    if (!qualificacao.length && !reca.length && !raloca.length) {
      return new Response(JSON.stringify({ error: "No script items provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qualIds = qualificacao.map((q: ScriptItem) => q.id).join(", ");
    const recaIds = reca.map((r: ScriptItem) => r.id).join(", ");
    const ralocaIds = raloca.map((r: ScriptItem) => r.id).join(", ");

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
                    id: { type: "string" },
                    objection: { type: "string" },
                    suggested_response: { type: "string" },
                    addressed: { type: "boolean" },
                  },
                  required: ["id", "objection", "suggested_response", "addressed"],
                },
              },
              reca_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of emotional triggers activated. Valid IDs: ${recaIds}`,
              },
              raloca_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of logical arguments used. Valid IDs: ${ralocaIds}`,
              },
            },
            required: ["qualification_done", "objections", "reca_done", "raloca_done"],
          },
        },
      },
    ];

    const systemPrompt = buildSystemPrompt(
      qualificacao,
      reca,
      raloca,
      coachInstructions || "",
      leadName || "Desconhecido",
      leadContext
    );

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
