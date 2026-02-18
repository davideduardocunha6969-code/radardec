import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { chamadaId } = await req.json();
    if (!chamadaId) {
      return new Response(JSON.stringify({ error: "chamadaId is required" }), {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the chamada
    const { data: chamada, error: chamadaErr } = await supabase
      .from("crm_chamadas")
      .select("*")
      .eq("id", chamadaId)
      .single();

    if (chamadaErr || !chamada) {
      return new Response(JSON.stringify({ error: "Chamada not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!chamada.transcricao) {
      return new Response(JSON.stringify({ error: "No transcription available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the lead info
    const { data: lead } = await supabase
      .from("crm_leads")
      .select("nome, coluna_id")
      .eq("id", chamada.lead_id)
      .single();

    // Find the column's specific feedback coach via lead's coluna_id
    const { data: coluna } = await supabase
      .from("crm_colunas")
      .select("robo_feedback_id")
      .eq("id", lead?.coluna_id)
      .single();

    let coachInstructions = "";
    if (coluna?.robo_feedback_id) {
      const { data: feedbackCoach } = await supabase
        .from("robos_coach")
        .select("instrucoes")
        .eq("id", coluna.robo_feedback_id)
        .eq("ativo", true)
        .single();
      coachInstructions = feedbackCoach?.instrucoes || "";
    }

    // Fallback: if no column-specific coach, try any active feedback_sdr coach
    if (!coachInstructions) {
      const { data: fallbackCoach } = await supabase
        .from("robos_coach")
        .select("instrucoes")
        .eq("tipo", "feedback_sdr")
        .eq("ativo", true)
        .limit(1)
        .single();
      coachInstructions = fallbackCoach?.instrucoes || "";
    }

    

    let systemPrompt: string;

    if (coachInstructions) {
      // Use the coach's full instructions as-is, only append context metadata
      systemPrompt = `${coachInstructions}

CONTEXTO DA LIGAÇÃO:
- Lead: ${lead?.nome || "Desconhecido"}
- Canal: ${chamada.canal}
- Duração: ${chamada.duracao_segundos ? `${Math.floor(chamada.duracao_segundos / 60)}m${chamada.duracao_segundos % 60}s` : "N/A"}

IMPORTANTE: Siga EXATAMENTE o formato obrigatório descrito nas instruções acima. Não omita nenhuma seção.`;
    } else {
      // Fallback generic prompt when no coach is configured
      systemPrompt = `Você é um avaliador de atendimentos de SDR (Sales Development Representative).

Analise a transcrição da ligação abaixo e forneça:

1. Uma NOTA de 0 a 10 para o atendimento do SDR
2. Um FEEDBACK detalhado e construtivo

REGRAS:
- Responda em português, de forma direta e profissional.
- Use linguagem simples e ações concretas.

CONTEXTO:
- Lead: ${lead?.nome || "Desconhecido"}
- Canal: ${chamada.canal}
- Duração: ${chamada.duracao_segundos ? `${Math.floor(chamada.duracao_segundos / 60)}m${chamada.duracao_segundos % 60}s` : "N/A"}`;
    }

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
          { role: "user", content: `Transcrição da ligação:\n\n${chamada.transcricao}` },
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
    const feedback = result.choices?.[0]?.message?.content || "";
    const usage = result.usage || {};

    // Estimate AI cost based on tokens (Gemini 2.5 Flash pricing ~$0.15/1M input, $0.60/1M output)
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const aiCost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);

    // Extract nota - support both "NOTA: X" (0-10) and "Nota Final: XX/100" (0-100) formats
    const notaMatch100 = feedback.match(/Nota\s*Final:\s*(\d+)\s*\/\s*100/i);
    const notaMatch10 = feedback.match(/NOTA:\s*(\d+)/i);
    let nota: number | null = null;
    if (notaMatch100) {
      // Convert 0-100 scale to 0-10
      nota = Math.round(parseInt(notaMatch100[1], 10) / 10);
    } else if (notaMatch10) {
      nota = parseInt(notaMatch10[1], 10);
    }

    // Fetch existing custo_detalhado and update AI cost
    const { data: existingChamada } = await supabase
      .from("crm_chamadas")
      .select("custo_detalhado")
      .eq("id", chamadaId)
      .single();

    const custoDetalhado = (existingChamada?.custo_detalhado || {}) as Record<string, unknown>;
    custoDetalhado.lovable_ia_feedback = parseFloat(aiCost.toFixed(6));
    custoDetalhado.ia_tokens_input = inputTokens;
    custoDetalhado.ia_tokens_output = outputTokens;

    // Update the chamada with feedback + cost
    const { error: updateErr } = await supabase
      .from("crm_chamadas")
      .update({
        feedback_ia: feedback,
        nota_ia: nota,
        custo_detalhado: custoDetalhado,
      })
      .eq("id", chamadaId);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save feedback" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ feedback, nota }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("feedback-chamada error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
