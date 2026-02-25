import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildStateContext(coachingState: any) {
  const ativas = (coachingState?.sugestoes_ativas || []) as Array<{id: string; gatilho: string; classificacao: string; resposta_sugerida: string; turno_gerado?: number}>;
  const encerradas = (coachingState?.sugestoes_encerradas || []) as Array<{id: string; gatilho: string; classificacao: string; status: string}>;
  const fases = (coachingState?.fases_cumpridas || []) as string[];
  const ancoras = (coachingState?.ancoras_registradas || []) as string[];

  const parts: string[] = [];

  parts.push(ativas.length
    ? `SUGESTÕES ATIVAS (podem ter status atualizado):\n${ativas.map(s => `- [${s.classificacao}] id="${s.id}" | gatilho: "${s.gatilho}" | sugestão: "${s.resposta_sugerida}"${s.turno_gerado != null ? ` | turno: ${s.turno_gerado}` : ""}`).join("\n")}`
    : "SUGESTÕES ATIVAS: nenhuma.");

  if (encerradas.length) {
    parts.push(`SUGESTÕES ENCERRADAS (NÃO gerar novas sobre estes gatilhos):\n${encerradas.map(s => `- [${s.classificacao}] id="${s.id}" | gatilho: "${s.gatilho}" | status: ${s.status}`).join("\n")}`);
  }

  if (fases.length) {
    parts.push(`FASES CUMPRIDAS: ${fases.join(", ")}`);
  }

  if (ancoras.length) {
    parts.push(`ÂNCORAS REGISTRADAS (frases-chave do lead que podem ser reutilizadas):\n${ancoras.map(a => `- "${a}"`).join("\n")}`);
  }

  return parts.join("\n\n");
}

function buildRadarContext(radarAtual: any) {
  if (!radarAtual) return "";
  const keys = ["prova_tecnica", "confianca", "conviccao", "resistencia", "prob_fechamento"];
  const lines = keys
    .filter(k => radarAtual[k])
    .map(k => `- ${k}: ${radarAtual[k].valor}/10 — ${radarAtual[k].justificativa}`);
  if (!lines.length) return "";
  return `\n--- RADAR ATUAL DO LEAD ---\n${lines.join("\n")}\n--- FIM DO RADAR ---`;
}

function buildToolSchema(isCloser: boolean) {
  const itemProps: any = {
    id: { type: "string" },
    label: { type: "string" },
    description: { type: "string" },
    done: { type: "boolean" },
  };
  const itemRequired = ["id", "label", "description", "done"];

  const objProps: any = {
    id: { type: "string" },
    objection: { type: "string" },
    suggested_response: { type: "string" },
    addressed: { type: "boolean" },
  };
  const objRequired = ["id", "objection", "suggested_response", "addressed"];

  if (isCloser) {
    itemProps.pergunta_sugerida = { type: "string", description: "Pergunta proativa que o closer pode fazer" };
    objProps.pergunta_sugerida = { type: "string", description: "Pergunta proativa que o closer pode fazer" };
  }

  const properties: any = {
    updates: {
      type: "array",
      description: "Status updates for existing active suggestions (only DITO or TIMING_PASSOU)",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          new_status: { type: "string", enum: ["DITO", "TIMING_PASSOU"] },
        },
        required: ["id", "new_status"],
      },
    },
    new_items: {
      type: "object",
      description: "Genuinely new suggestions based on new transcript content",
      properties: {
        objections: { type: "array", items: { type: "object", properties: objProps, required: objRequired } },
        reca_items: { type: "array", items: { type: "object", properties: itemProps, required: itemRequired } },
        raloca_items: { type: "array", items: { type: "object", properties: itemProps, required: itemRequired } },
      },
      required: ["objections", "reca_items", "raloca_items"],
    },
  };
  const required = ["updates", "new_items"];

  if (isCloser) {
    properties.state_updates = {
      type: "object",
      description: "Updates to the coaching state (anchors and phases)",
      properties: {
        novas_ancoras: { type: "array", items: { type: "string" }, description: "New anchor phrases from the lead to register" },
        fases_cumpridas: { type: "array", items: { type: "string" }, description: "New phases to mark as completed" },
      },
      required: ["novas_ancoras", "fases_cumpridas"],
    };
    required.push("state_updates");
  }

  return [{
    type: "function",
    function: {
      name: "analyze_coaching",
      description: "Return coaching analysis with status updates and genuinely new items",
      parameters: { type: "object", properties, required },
    },
  }];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newTranscript, coachingState, coachInstructions, leadName, leadContext, radar_atual, isCloser } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stateContext = buildStateContext(coachingState);
    const radarContext = buildRadarContext(radar_atual);
    const roleLabel = isCloser ? "Closer" : "SDR";
    const techniqueLabel = isCloser ? "RADOVECA" : "RAPOVECA";

    const systemPrompt = `Você é um assistente de coaching em tempo real de ligações ${roleLabel}.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH:
${coachInstructions || "Sem instruções específicas."}
${radarContext}

--- ESTADO ATUAL DAS SUGESTÕES ---
${stateContext}
--- FIM DO ESTADO ---

Você receberá APENAS as falas NOVAS da ligação (delta desde a última análise). Você tem DUAS responsabilidades:

1. **UPDATES** — Para cada sugestão ATIVA listada acima, avalie se algo mudou nas falas novas:
   - "DITO": o ${roleLabel} já usou essa sugestão ou tratou o gatilho
   - "TIMING_PASSOU": o momento ideal para usar essa sugestão já passou
   - "MANTER": nada mudou, manter como está
   Retorne updates APENAS para itens cujo status mudou (DITO ou TIMING_PASSOU). Não retorne "MANTER".

2. **NEW_ITEMS** — Gere novas sugestões APENAS se houver gatilhos GENUINAMENTE NOVOS nas falas recebidas:

   a) OBJEÇÕES (${techniqueLabel}) — SOMENTE objeções que o lead EXPLICITAMENTE verbalizou. Cite a fala exata como evidência.
   b) RECA (Emocionais) — SOMENTE quando houver evidência CLARA de gatilho emocional do lead.
   c) RALOCA (Lógicos) — SOMENTE quando houver evidência CLARA de questão lógica do lead.
${isCloser ? `
   Para cada item, inclua também uma "pergunta_sugerida" — uma pergunta proativa que o closer pode fazer para avançar a conversa.

3. **STATE_UPDATES** — Atualize o estado:
   - novas_ancoras: frases-chave que o lead disse e que podem ser reutilizadas em argumentos futuros
   - fases_cumpridas: fases da ligação que foram cumpridas (ex: "apresentacao", "investigacao_tecnica", "proposta", "negociacao", "fechamento")
` : ""}
REGRAS CRÍTICAS:
- NUNCA gere um item sobre um gatilho que já existe nas sugestões ativas OU encerradas acima.
- Cada frase-gatilho do lead gera NO MÁXIMO 1 item.
- Seja RESTRITIVO. Só gere com evidência EXPLÍCITA na fala do lead.
- Se não há novos gatilhos, retorne arrays VAZIOS em new_items.
- NÃO invente fatos. NÃO gere itens especulativos ou preventivos.`;

    const tools = buildToolSchema(!!isCloser);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Falas NOVAS da ligação (delta):\n\n${newTranscript}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "analyze_coaching" } },
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
      console.error("[coaching-realtime] AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("[coaching-realtime] No tool call:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let analysis;
    try {
      analysis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      console.error("[coaching-realtime] Parse error:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[coaching-realtime] error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
