import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente de análise em tempo real de ligações SDR para um escritório de advocacia trabalhista que atende motoristas de caminhão demitidos.

O objetivo do SDR é agendar uma ANÁLISE GRATUITA por vídeo, focada em checagem de rescisão e análise de cálculos.

Analise a transcrição da ligação e identifique com precisão:

1. QUALIFICAÇÃO — Quais perguntas de qualificação o SDR JÁ FEZ (use APENAS os IDs listados):
   - jornada: Perguntou sobre jornada diária de trabalho
   - descanso_11h: Perguntou sobre descanso de 11 horas entre jornadas
   - tempo_espera: Perguntou sobre tempo de espera para carga/descarga
   - diarias: Perguntou sobre diárias ou ajuda de custo
   - holerite: Perguntou sobre holerite detalhado
   - controle_jornada: Perguntou sobre controle de jornada (tacógrafo, planilha)
   - tempo_empresa: Perguntou sobre tempo na empresa
   - tipo_demissao: Perguntou sobre tipo de demissão
   - rotina_estrada: Perguntou sobre rotina na estrada (pernoites, refeições)

2. OBJEÇÕES — Identifique TODAS as objeções do lead (explícitas ou implícitas). Para cada objeção:
   - Crie um ID único em snake_case
   - Descreva a objeção de forma curta
   - Sugira uma resposta ou pergunta para o SDR usar (linguagem simples, sem jargão)
   - Indique se o SDR JÁ respondeu essa objeção adequadamente

3. RECA — Quais gatilhos emocionais o SDR JÁ ATIVOU (use APENAS os IDs listados):
   - justica: Explorou senso de justiça/injustiça
   - encerramento: Explorou desejo de resolver/encerrar
   - seguranca: Explorou segurança financeira/tranquilidade
   - alivio: Explorou alívio emocional
   - prejuizo: Alertou sobre possível prejuízo/perda

4. RALOCA — Quais argumentos lógicos o SDR JÁ USOU (use APENAS os IDs listados):
   - metodo: Explicou método (transformar rotina em cálculo)
   - analise: Reforçou necessidade de análise dos números
   - sem_compromisso: Mencionou que é gratuito/sem compromisso
   - decisao_cliente: Reforçou que decisão é do cliente
   - revisao_calculo: Explicou que pode revisar mesmo tendo assinado rescisão

REGRAS:
- Só marque como feito se houver evidência CLARA na transcrição.
- Não invente. Se não está claro, não marque.
- Para objeções, seja criativo nas sugestões de resposta — prefira perguntas que levem o lead a encontrar sozinho a resposta.`;

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
            description: "IDs of qualification questions already asked by the SDR",
          },
          objections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Unique snake_case ID for this objection" },
                objection: { type: "string", description: "Short description of the objection" },
                suggested_response: { type: "string", description: "Suggested response/question for the SDR" },
                addressed: { type: "boolean", description: "Whether the SDR has adequately addressed this" },
              },
              required: ["id", "objection", "suggested_response", "addressed"],
            },
          },
          reca_done: {
            type: "array",
            items: { type: "string" },
            description: "IDs of emotional triggers (RECA) that the SDR has activated",
          },
          raloca_done: {
            type: "array",
            items: { type: "string" },
            description: "IDs of logical arguments (RALOCA) that the SDR has used",
          },
        },
        required: ["qualification_done", "objections", "reca_done", "raloca_done"],
      },
    },
  },
];

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

    const contextBlock = `\nCONTEXTO:\n- Lead: ${leadName}${leadContext ? `\n- Info: ${leadContext}` : ""}${coachInstructions ? `\n\nINSTRUÇÕES ADICIONAIS DO COACH:\n${coachInstructions}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
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

    // Extract tool call arguments
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
