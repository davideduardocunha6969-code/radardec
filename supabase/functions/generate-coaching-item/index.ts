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
    const { leadPhrase, type, leadName, coachInstructions } = await req.json();

    if (!leadPhrase || !type) {
      return new Response(JSON.stringify({ error: "leadPhrase and type are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeDescriptions: Record<string, string> = {
      reca: "RECA (Razão Emocional de Compra/Ação) — gere uma pergunta/fala que o SDR deveria usar para explorar o gatilho EMOCIONAL presente nessa frase do lead. Foque em sentimentos, frustrações, medos ou desejos implícitos.",
      raloca: "RALOCA (Razão Lógica de Compra/Ação) — gere uma fala/argumento LÓGICO que o SDR deveria usar para responder à questão racional presente nessa frase do lead. Foque em dados, fatos, comparações e benefícios concretos.",
      rapoveca: "RAPOVECA (Objeção) — identifique a objeção presente nessa frase do lead e gere uma resposta/pergunta que o SDR deveria usar para tratar essa objeção. Prefira perguntas que levem o lead a encontrar a resposta sozinho.",
    };

    const toolName = type === "rapoveca" ? "generate_objection" : "generate_item";

    const tools = type === "rapoveca"
      ? [{
          type: "function",
          function: {
            name: "generate_objection",
            description: "Generate a single objection item from the lead phrase",
            parameters: {
              type: "object",
              properties: {
                id: { type: "string", description: "Unique snake_case ID for this objection" },
                objection: { type: "string", description: "Description of the objection detected in the lead phrase" },
                suggested_response: { type: "string", description: "Suggested response/question for the SDR" },
              },
              required: ["id", "objection", "suggested_response"],
            },
          },
        }]
      : [{
          type: "function",
          function: {
            name: "generate_item",
            description: "Generate a single RECA or RALOCA coaching item from the lead phrase",
            parameters: {
              type: "object",
              properties: {
                id: { type: "string", description: "Unique snake_case ID" },
                label: { type: "string", description: "Short label for the item" },
                description: { type: "string", description: "Suggested question/phrase for the SDR to use" },
              },
              required: ["id", "label", "description"],
            },
          },
        }];

    const systemPrompt = `Você é um assistente de coaching de vendas SDR.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}

${coachInstructions ? `INSTRUÇÕES DO COACH:\n${coachInstructions}` : ""}

TAREFA: ${typeDescriptions[type] || typeDescriptions.reca}

Analise a frase exata do lead abaixo e gere EXATAMENTE 1 item correspondente. Seja preciso e baseie-se exclusivamente no conteúdo da frase.`;

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
          { role: "user", content: `Frase do lead: "${leadPhrase}"` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: toolName } },
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
      console.error("[generate-coaching-item] AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let item;
    try {
      item = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ item, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-coaching-item] error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
