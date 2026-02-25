import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckableItem {
  id: string;
  label: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, scriptItems, coachingItems, detectorPrompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Script items (from scripts_sdr)
    const apresentacao: CheckableItem[] = scriptItems?.apresentacao || [];
    const qualificacao: CheckableItem[] = scriptItems?.qualificacao || [];
    const showRate: CheckableItem[] = scriptItems?.show_rate || [];

    // Coaching dynamic items (from coaching cards currently on screen)
    const recaItems: CheckableItem[] = coachingItems?.reca || [];
    const ralocaItems: CheckableItem[] = coachingItems?.raloca || [];
    const objectionItems: CheckableItem[] = coachingItems?.objections || [];

    const formatList = (items: CheckableItem[]) =>
      items.map((i) => `- ${i.id}: ${i.description || i.label}`).join("\n") || "Nenhum item.";
    const formatIds = (items: CheckableItem[]) =>
      items.map((i) => i.id).join(", ") || "nenhum";

    console.log("[script-checker] IDs recebidos:", {
      apresentacao: formatIds(apresentacao),
      qualificacao: formatIds(qualificacao),
      showRate: formatIds(showRate),
      reca: formatIds(recaItems),
      raloca: formatIds(ralocaItems),
      objections: formatIds(objectionItems),
    });

    // Use stored detector prompt if available, otherwise use default
    const defaultPrompt = `Você é um detector de progresso de ligação SDR. Sua ÚNICA tarefa é analisar a transcrição e identificar quais itens JÁ FORAM DITOS ou COBERTOS pelo SDR.

REGRAS GERAIS:
- Seja MUITO FLEXÍVEL na detecção. Se o SDR cobriu o MESMO TEMA ou INTENÇÃO de um item, mesmo com palavras completamente diferentes, marque como feito.
- Erre para o lado de MARCAR MAIS itens como feitos. Na dúvida, marque.
- Analise APENAS as falas marcadas como [SDR] para itens de script (apresentação, qualificação, show rate).
- Para itens de coaching (RECA, RALOCA, objeções), verifique se o SDR JÁ UTILIZOU a sugestão dada ou abordou o tema.
- Retorne TODOS os IDs que foram cobertos, mesmo que parcialmente.
- Se um item foi coberto com sinônimos, paráfrases ou intenção similar, MARQUE COMO FEITO.
- NUNCA retorne IDs que não existem na lista fornecida.`;

    const systemPrompt = `${detectorPrompt || defaultPrompt}

--- ITENS PARA VERIFICAR ---

APRESENTAÇÃO (IDs válidos: ${formatIds(apresentacao)}):
${formatList(apresentacao)}

QUALIFICAÇÃO (IDs válidos: ${formatIds(qualificacao)}):
${formatList(qualificacao)}

SHOW RATE (IDs válidos: ${formatIds(showRate)}):
${formatList(showRate)}

RECA — Gatilhos Emocionais (IDs válidos: ${formatIds(recaItems)}):
${formatList(recaItems)}

RALOCA — Argumentos Lógicos (IDs válidos: ${formatIds(ralocaItems)}):
${formatList(ralocaItems)}

OBJEÇÕES (IDs válidos: ${formatIds(objectionItems)}):
${formatList(objectionItems)}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "check_progress",
          description: "Return which items have been covered by the SDR in the transcript",
          parameters: {
            type: "object",
            properties: {
              apresentacao_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of presentation items covered. Valid: ${formatIds(apresentacao)}`,
              },
              qualification_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of qualification items covered. Valid: ${formatIds(qualificacao)}`,
              },
              show_rate_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of show rate items covered. Valid: ${formatIds(showRate)}`,
              },
              reca_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of RECA items the SDR already explored. Valid: ${formatIds(recaItems)}`,
              },
              raloca_done: {
                type: "array",
                items: { type: "string" },
                description: `IDs of RALOCA items the SDR already used. Valid: ${formatIds(ralocaItems)}`,
              },
              objections_addressed: {
                type: "array",
                items: { type: "string" },
                description: `IDs of objections the SDR already addressed. Valid: ${formatIds(objectionItems)}`,
              },
            },
            required: ["apresentacao_done", "qualification_done", "show_rate_done", "reca_done", "raloca_done", "objections_addressed"],
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
        tool_choice: { type: "function", function: { name: "check_progress" } },
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
