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
    const { transcript, radarPrompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um analisador de ligações de vendas (closer).
Analise a transcrição e retorne 5 indicadores de 0 a 10 com justificativa curta (1 frase).

${radarPrompt || "Avalie: prova técnica do caso, confiança do lead no escritório, convicção do lead em prosseguir, resistência/objeções restantes, e probabilidade de fechamento."}

Use a ferramenta analyze_radar para retornar os resultados.`;

    const tools = [{
      type: "function",
      function: {
        name: "analyze_radar",
        description: "Return 5 sales indicators from the call transcript",
        parameters: {
          type: "object",
          properties: {
            prova_tecnica: {
              type: "object",
              properties: { valor: { type: "number" }, justificativa: { type: "string" } },
              required: ["valor", "justificativa"],
            },
            confianca: {
              type: "object",
              properties: { valor: { type: "number" }, justificativa: { type: "string" } },
              required: ["valor", "justificativa"],
            },
            conviccao: {
              type: "object",
              properties: { valor: { type: "number" }, justificativa: { type: "string" } },
              required: ["valor", "justificativa"],
            },
            resistencia: {
              type: "object",
              properties: { valor: { type: "number" }, justificativa: { type: "string" } },
              required: ["valor", "justificativa"],
            },
            prob_fechamento: {
              type: "object",
              properties: { valor: { type: "number" }, justificativa: { type: "string" } },
              required: ["valor", "justificativa"],
            },
          },
          required: ["prova_tecnica", "confianca", "conviccao", "resistencia", "prob_fechamento"],
        },
      },
    }];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transcrição da ligação:\n\n${transcript}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "analyze_radar" } },
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
      console.error("[coaching-radar] AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[coaching-radar] No tool call:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let radar;
    try {
      radar = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      console.error("[coaching-radar] Parse error:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ radar }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[coaching-radar] error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
