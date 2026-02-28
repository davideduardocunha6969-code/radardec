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
    const { leadId, coachId, transcript } = await req.json();
    if (!leadId || !coachId || !transcript) {
      return new Response(JSON.stringify({ error: "leadId, coachId and transcript are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // 1. Fetch coach instrucoes_extrator
    const { data: coach, error: coachErr } = await sb
      .from("robos_coach")
      .select("instrucoes_extrator")
      .eq("id", coachId)
      .single();

    if (coachErr || !coach?.instrucoes_extrator) {
      return new Response(JSON.stringify({ error: "Coach not found or instrucoes_extrator empty" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch campo definitions
    const { data: campos } = await sb
      .from("crm_lead_campos")
      .select("key, nome, tipo, descricao")
      .order("ordem");

    // 3. Fetch current dados_extras
    const { data: lead } = await sb
      .from("crm_leads")
      .select("dados_extras")
      .eq("id", leadId)
      .single();

    const dadosAtuais = (lead?.dados_extras as Record<string, any>) || {};

    // Build context for AI
    const camposDisp = (campos || []).map((c: any) => ({
      key: c.key,
      nome: c.nome,
      tipo: c.tipo,
      descricao: c.descricao || "",
    }));

    const dadosResumo: Record<string, { valor: string; origem: string }> = {};
    for (const [k, v] of Object.entries(dadosAtuais)) {
      if (typeof v === "string") {
        dadosResumo[k] = { valor: v, origem: "legado" };
      } else if (v && typeof v === "object" && "valor" in v) {
        dadosResumo[k] = { valor: (v as any).valor, origem: (v as any).origem };
      }
    }

    const userPrompt = `## Transcrição recente
${transcript}

## Campos disponíveis para extração
${JSON.stringify(camposDisp, null, 2)}

## Dados atuais do lead
${JSON.stringify(dadosResumo, null, 2)}

Extraia os dados da transcrição acima seguindo as instruções do sistema. Retorne APENAS um JSON válido no formato:
{
  "extraidos": [
    { "key": "campo_key", "valor": "valor extraído", "confianca": "alta|media|baixa" }
  ]
}`;

    // 4. Call AI Gateway
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
          { role: "system", content: coach.instrucoes_extrator },
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

    // Parse JSON from response (strip markdown fences if present)
    let parsed: { extraidos: Array<{ key: string; valor: string; confianca: string }> };
    try {
      const jsonStr = rawContent.replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ extraidos: [], parseError: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extraidos = parsed.extraidos || [];
    const validKeys = new Set((campos || []).map((c: any) => c.key));

    // 5. Persist high-confidence fields, respecting manual
    const updatedDados = { ...dadosAtuais };
    const savedFields: typeof extraidos = [];

    for (const item of extraidos) {
      if (!validKeys.has(item.key) || !item.valor) continue;

      const existing = updatedDados[item.key];
      const isManual = existing && typeof existing === "object" && (existing as any).origem === "preenchimento_manual";

      if (isManual) continue; // Never overwrite manual

      const field = {
        valor: item.valor,
        origem: "extrator_automatico" as const,
        confianca: item.confianca || "media",
        turno_extracao: null,
        data_ultima_atualizacao: new Date().toISOString(),
      };

      if (item.confianca === "alta") {
        updatedDados[item.key] = field;
        savedFields.push(item);
      }
      // medium/low: returned but not saved — frontend shows for review
    }

    if (savedFields.length > 0) {
      await sb
        .from("crm_leads")
        .update({ dados_extras: updatedDados })
        .eq("id", leadId);
    }

    return new Response(JSON.stringify({ extraidos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-lead-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
