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
    const { transcript, scriptItems } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apresentacao: ScriptItem[] = scriptItems?.apresentacao || [];
    const qualificacao: ScriptItem[] = scriptItems?.qualificacao || [];
    const showRate: ScriptItem[] = scriptItems?.show_rate || [];

    const apresList = apresentacao.map((a) => `- ${a.id}: ${a.description || a.label}`).join("\n");
    const apresIds = apresentacao.map((a) => a.id).join(", ");
    const qualList = qualificacao.map((q) => `- ${q.id}: ${q.description || q.label}`).join("\n");
    const qualIds = qualificacao.map((q) => q.id).join(", ");
    const showRateList = showRate.map((s) => `- ${s.id}: ${s.description || s.label}`).join("\n");
    const showRateIds = showRate.map((s) => s.id).join(", ");

    console.log("[script-checker] IDs recebidos:", { apresIds, qualIds, showRateIds });

    const systemPrompt = `Você é um verificador de script de ligação SDR. Sua ÚNICA tarefa é analisar a transcrição e identificar quais itens do script já foram cobertos pelo SDR.

REGRAS:
- Seja MUITO FLEXÍVEL na detecção. Se o SDR cobriu o MESMO TEMA ou INTENÇÃO de um item, mesmo com palavras completamente diferentes, marque como feito.
- Erre para o lado de MARCAR MAIS itens como feitos. Na dúvida, marque.
- Analise APENAS as falas marcadas como [SDR], ignore falas do [Lead] para detecção de script.
- Retorne TODOS os IDs que foram cobertos, mesmo que parcialmente.

APRESENTAÇÃO (IDs válidos: ${apresIds || "nenhum"}):
${apresList || "Nenhum item cadastrado."}

QUALIFICAÇÃO (IDs válidos: ${qualIds || "nenhum"}):
${qualList || "Nenhum item cadastrado."}

SHOW RATE (IDs válidos: ${showRateIds || "nenhum"}):
${showRateList || "Nenhum item cadastrado."}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "check_script",
          description: "Return which script items have been covered by the SDR",
          parameters: {
            type: "object",
            properties: {
              apresentacao_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of presentation items covered. Valid: ${apresIds}`,
              },
              qualification_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of qualification items covered. Valid: ${qualIds}`,
              },
              show_rate_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of show rate items covered. Valid: ${showRateIds}`,
              },
            },
            required: ["apresentacao_done", "qualification_done", "show_rate_done"],
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
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transcrição da ligação:\n\n${transcript}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "check_script" } },
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
      console.error("[script-checker] AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[script-checker] No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "No structured response" }), {
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
      console.error("[script-checker] Parse error:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[script-checker] IDs retornados:", JSON.stringify(analysis));

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[script-checker] error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
