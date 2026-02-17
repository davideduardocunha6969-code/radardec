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
    const { transcript, coachInstructions, leadName, leadContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `${coachInstructions}

CONTEXTO DA LIGAÇÃO:
- Lead: ${leadName}
${leadContext ? `- Informações do lead: ${leadContext}` : ""}

REGRAS:
- Analise a transcrição abaixo e forneça orientações práticas para o SDR.
- Responda em português, de forma direta e objetiva.
- IMPORTANTE: NÃO use jargões internos, siglas ou metodologias (como RECA, RALOCA, RAPOVECA, etc.). Use apenas linguagem simples e ações concretas.
- Responda SEMPRE e SOMENTE neste formato com exatamente 3 seções:

🎯 **Pergunta a fazer**
[A próxima pergunta que o SDR deve fazer ao lead agora, baseada no que foi dito]

➡️ **Sugestão da próxima pergunta**
[Uma pergunta de follow-up para manter a conversa fluindo após a resposta do lead]

🏁 **Sugestão de fechamento**
Se sim: [o que dizer se o lead demonstrar interesse]
Se não: [o que dizer se o lead apresentar objeção ou desinteresse]

- Se não houver contexto suficiente na transcrição, adapte as sugestões ao início de uma conversa de prospecção.
- NUNCA responda fora desse formato. NUNCA adicione seções extras.`;

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
    const insight = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ insight }), {
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
