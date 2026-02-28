import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { leadId, coachId, gaps } = await req.json();
    if (!leadId || !coachId || !gaps?.length) {
      return new Response(JSON.stringify({ error: "leadId, coachId and gaps are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // 1. Fetch coach instrucoes_lacunas
    const { data: coach, error: coachErr } = await sb
      .from("robos_coach")
      .select("instrucoes_lacunas")
      .eq("id", coachId)
      .single();

    if (coachErr || !coach?.instrucoes_lacunas) {
      return new Response(JSON.stringify({ error: "Coach not found or instrucoes_lacunas empty" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `## Lacunas identificadas (ordenadas por impacto financeiro estimado)
${JSON.stringify(gaps, null, 2)}

Analise as lacunas acima e gere perguntas sugeridas para o Closer fazer ao lead, seguindo as instruções do sistema. Retorne APENAS um JSON válido no formato:
{
  "lacunas_priorizadas": [
    {
      "key": "campo_key",
      "pergunta_sugerida": "Pergunta natural para o closer fazer",
      "prioridade": "alta|media|baixa",
      "justificativa": "Por que este campo é importante",
      "urgencia": "agora|proxima_ligacao|opcional",
      "contexto_para_o_closer": "Dica contextual para o closer"
    }
  ]
}`;

    // 2. Call AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: coach.instrucoes_lacunas },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", status, await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let parsed: { lacunas_priorizadas: any[] };
    try {
      const jsonStr = rawContent.replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ lacunas_priorizadas: [], parseError: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ lacunas_priorizadas: parsed.lacunas_priorizadas || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-gaps error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
