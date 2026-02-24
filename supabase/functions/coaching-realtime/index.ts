import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

interface AncoraEmocional {
  frase: string;
  categoria: string;
  intensidade: string;
  utilizado: boolean;
  turno_capturado: number;
}

interface SessionState {
  fase_atual: number;
  turno: number;
  checkpoints: Record<string, Record<string, boolean | string | null>>;
  radar: { prova_tecnica: number; confianca_closer: number; conviccao_cliente: number; resistencia: number };
  ancoras_emocionais: AncoraEmocional[];
  dados_coletados: Record<string, any>;
  ultimas_falas: string[];
  reca_ativas: any[];
  raloca_ativas: any[];
  objeccoes_ativas: any[];
  pode_fechar: boolean;
}

function defaultState(): SessionState {
  return {
    fase_atual: 1,
    turno: 0,
    checkpoints: {
      fase1: { especializacao: false, experiencia: false, separou_analise_acao: false, modelo_exito: false, pediu_permissao: false },
      fase2: { jornada: false, descanso: false, tempo_espera: false, horas_extras: false, adicionais: false, pgto_por_fora: false },
      fase3: { pausa_apos_valor: false, pergunta_impacto: false, microcompromisso: false },
      fase4: { reacao_classificada: null },
      fase5: { pode_avancar: false },
      fase6: { concordancia_verbal: false, objeccoes_tratadas: false },
    },
    radar: { prova_tecnica: 0, confianca_closer: 5, conviccao_cliente: 0, resistencia: 0 },
    ancoras_emocionais: [],
    dados_coletados: {
      jornada_horas_dia: null, descanso_horas: null, tempo_espera_horas: null,
      adicional_tipo: null, pgto_por_fora: false, acidente: null, doenca: null,
    },
    ultimas_falas: [],
    reca_ativas: [],
    raloca_ativas: [],
    objeccoes_ativas: [],
    pode_fechar: false,
  };
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function applyClassification(state: SessionState, classification: any): SessionState {
  const s = JSON.parse(JSON.stringify(state)) as SessionState;
  s.turno++;

  // Apply technical data
  if (classification.dados_tecnicos) {
    const d = classification.dados_tecnicos;
    if (d.jornada_horas_dia != null) {
      s.dados_coletados.jornada_horas_dia = d.jornada_horas_dia;
      s.checkpoints.fase2.jornada = true;
      s.radar.prova_tecnica = clamp(s.radar.prova_tecnica + 2, 0, 10);
      if (d.jornada_horas_dia >= 11) s.radar.prova_tecnica = clamp(s.radar.prova_tecnica + 1, 0, 10);
    }
    if (d.descanso_horas != null) {
      s.dados_coletados.descanso_horas = d.descanso_horas;
      s.checkpoints.fase2.descanso = true;
      s.radar.prova_tecnica = clamp(s.radar.prova_tecnica + 2, 0, 10);
      if (d.descanso_horas <= 8) s.radar.prova_tecnica = clamp(s.radar.prova_tecnica + 1, 0, 10);
    }
    if (d.tempo_espera_horas != null) {
      s.dados_coletados.tempo_espera_horas = d.tempo_espera_horas;
      s.checkpoints.fase2.tempo_espera = true;
      s.radar.prova_tecnica = clamp(s.radar.prova_tecnica + 2, 0, 10);
    }
    if (d.adicional_tipo) {
      s.dados_coletados.adicional_tipo = d.adicional_tipo;
      s.checkpoints.fase2.adicionais = true;
      s.radar.prova_tecnica = clamp(s.radar.prova_tecnica + 1, 0, 10);
    }
    if (d.pgto_por_fora === true) {
      s.dados_coletados.pgto_por_fora = true;
      s.checkpoints.fase2.pgto_por_fora = true;
      s.radar.prova_tecnica = clamp(s.radar.prova_tecnica + 1, 0, 10);
    }
    if (d.acidente) s.dados_coletados.acidente = d.acidente;
    if (d.doenca) s.dados_coletados.doenca = d.doenca;
  }

  // Apply emotional anchor
  if (classification.ancora_emocional?.detectada && classification.ancora_emocional.frase_exata) {
    s.ancoras_emocionais.push({
      frase: classification.ancora_emocional.frase_exata,
      categoria: classification.ancora_emocional.categoria || "geral",
      intensidade: classification.ancora_emocional.intensidade || "media",
      utilizado: false,
      turno_capturado: s.turno,
    });
  }

  // Apply event-type based radar changes
  const tipo = classification.tipo_evento;
  if (tipo === "confirmacao_positiva") {
    s.radar.conviccao_cliente = clamp(s.radar.conviccao_cliente + 2, 0, 10);
  } else if (tipo === "objeccao_ativa") {
    s.radar.resistencia = clamp(s.radar.resistencia + 2, 0, 10);
  } else if (tipo === "evasao") {
    s.radar.resistencia = clamp(s.radar.resistencia + 1, 0, 10);
  } else if (tipo === "sinal_emocional_forte") {
    s.radar.conviccao_cliente = clamp(s.radar.conviccao_cliente + 1, 0, 10);
  }

  // Phase transitions (deterministic)
  if (s.fase_atual === 1) {
    const f1 = s.checkpoints.fase1;
    const done = [f1.especializacao, f1.experiencia, f1.separou_analise_acao, f1.modelo_exito, f1.pediu_permissao].filter(Boolean).length;
    if (done >= 3) s.fase_atual = 2;
  } else if (s.fase_atual === 2 && s.radar.prova_tecnica >= 6) {
    s.fase_atual = 3;
  } else if (s.fase_atual === 3) {
    const f3 = s.checkpoints.fase3;
    if (f3.pergunta_impacto && f3.microcompromisso) s.fase_atual = 4;
  } else if (s.fase_atual === 4 && s.checkpoints.fase4.reacao_classificada) {
    s.fase_atual = 5;
  } else if (s.fase_atual === 5) {
    const r = s.radar;
    if (r.prova_tecnica >= 7 && r.conviccao_cliente >= 6 && r.resistencia <= 5 && r.confianca_closer >= 6) {
      s.checkpoints.fase5.pode_avancar = true;
      s.fase_atual = 6;
    }
  }

  // pode_fechar
  s.pode_fechar = s.fase_atual >= 5 && s.radar.prova_tecnica >= 7 && s.radar.conviccao_cliente >= 6 && s.radar.resistencia <= 5;

  // Clamp radar
  s.radar.prova_tecnica = clamp(s.radar.prova_tecnica, 0, 10);
  s.radar.confianca_closer = clamp(s.radar.confianca_closer, 0, 10);
  s.radar.conviccao_cliente = clamp(s.radar.conviccao_cliente, 0, 10);
  s.radar.resistencia = clamp(s.radar.resistencia, 0, 10);

  return s;
}

async function callAI(apiKey: string, messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = {
    model: "google/gemini-2.5-flash",
    messages,
    stream: false,
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429 || status === 402) {
      return { error: true, status, message: status === 429 ? "Rate limit exceeded" : "Payment required" };
    }
    const t = await response.text();
    console.error("AI error:", status, t);
    return { error: true, status: 500, message: "AI gateway error" };
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { error: true, status: 500, message: "No structured response from AI" };

  try {
    const parsed = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
    return { error: false, data: parsed };
  } catch {
    return { error: true, status: 500, message: "Invalid AI response format" };
  }
}

// ========== LEGACY MODE (original behavior, unchanged) ==========
async function handleLegacyMode(body: any, apiKey: string) {
  const { transcript, coachInstructions, leadName, leadContext, scriptItems } = body;

  const qualificacao: ScriptItem[] = scriptItems?.qualificacao || [];
  const apresentacao: ScriptItem[] = scriptItems?.apresentacao || [];
  const qualList = qualificacao.map((q) => `   - ${q.id}: ${q.description || q.label}`).join("\n");
  const qualIds = qualificacao.map((q) => q.id).join(", ");
  const apresList = apresentacao.map((a) => `   - ${a.id}: ${a.description || a.label}`).join("\n");
  const apresIds = apresentacao.map((a) => a.id).join(", ");

  const systemPrompt = `Você é um assistente de análise em tempo real de ligações SDR.

CONTEXTO:
- Lead: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

INSTRUÇÕES DO COACH (siga rigorosamente para avaliar RECA, RALOCA e RAPOVECA):
${coachInstructions || "Sem instruções específicas."}

Analise a transcrição e identifique com precisão:

1. APRESENTAÇÃO — Quais falas de apresentação o SDR JÁ FEZ (IDs válidos: ${apresIds || "nenhum"}):
${apresList || "   Nenhuma fala de apresentação cadastrada."}

2. QUALIFICAÇÃO — Quais perguntas o SDR JÁ FEZ (IDs válidos: ${qualIds || "nenhum"}):
${qualList || "   Nenhuma pergunta cadastrada."}

3. OBJEÇÕES (RAPOVECA) — Identifique TODAS as objeções do lead.
4. RECA (Razões Emocionais) — Gatilhos emocionais relevantes para ESTE lead.
5. RALOCA (Razões Lógicas) — Argumentos lógicos relevantes.

REGRAS:
- Só marque como feito se houver evidência CLARA na transcrição.
- Gere entre 3 e 7 itens para RECA e RALOCA.`;

  const tools = [{
    type: "function",
    function: {
      name: "analyze_call",
      description: "Return structured analysis of the SDR call transcript",
      parameters: {
        type: "object",
        properties: {
          apresentacao_done: { type: "array", items: { type: "string" } },
          qualification_done: { type: "array", items: { type: "string" } },
          objections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" }, objection: { type: "string" },
                suggested_response: { type: "string" }, addressed: { type: "boolean" },
              },
              required: ["id", "objection", "suggested_response", "addressed"],
            },
          },
          reca_items: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, label: { type: "string" }, description: { type: "string" }, done: { type: "boolean" } },
              required: ["id", "label", "description", "done"],
            },
          },
          raloca_items: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, label: { type: "string" }, description: { type: "string" }, done: { type: "boolean" } },
              required: ["id", "label", "description", "done"],
            },
          },
        },
        required: ["apresentacao_done", "qualification_done", "objections", "reca_items", "raloca_items"],
      },
    },
  }];

  const result = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Transcrição atual da ligação:\n\n${transcript}` },
  ], tools, { type: "function", function: { name: "analyze_call" } });

  if (result.error) {
    return new Response(JSON.stringify({ error: result.message }), {
      status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ analysis: result.data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ========== NEW MODE (stateful, two-call pipeline) ==========
async function handleNewMode(body: any, apiKey: string) {
  const { session_key, new_utterance, user_id, lead_id, chamada_id, coachInstructions, leadName, leadContext, scriptItems } = body;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Load or create session state
  const { data: existingSession } = await supabase
    .from("coaching_sessions")
    .select("state")
    .eq("session_key", session_key)
    .maybeSingle();

  let state: SessionState = existingSession?.state
    ? (existingSession.state as unknown as SessionState)
    : defaultState();

  // Add utterance to sliding window
  const maxFalas = state.turno < 5 ? 8 : 4;
  state.ultimas_falas.push(new_utterance);
  while (state.ultimas_falas.length > maxFalas) state.ultimas_falas.shift();

  // 2. CALL 1 — Classify & Extract (fast model)
  let classification: any = null;
  try {
    // Load classifier prompt from DB
    const { data: classifierPrompt } = await supabase
      .from("coaching_prompts")
      .select("prompt_text")
      .eq("ai_key", "classifier")
      .eq("phase", "global")
      .eq("is_active", true)
      .maybeSingle();

    const classifierSystemPrompt = classifierPrompt?.prompt_text || "Classifique a fala do cliente.";

    const classifierTools = [{
      type: "function",
      function: {
        name: "classify_utterance",
        description: "Classify the utterance and extract data",
        parameters: {
          type: "object",
          properties: {
            tipo_evento: {
              type: "string",
              enum: ["dado_tecnico", "sinal_emocional_forte", "sinal_emocional_leve", "objeccao_ativa", "evasao", "confirmacao_positiva", "pergunta_processo", "silencio", "fala_neutra", "sinal_compliance_risco"],
            },
            dados_tecnicos: {
              type: "object",
              properties: {
                jornada_horas_dia: { type: "number" },
                descanso_horas: { type: "number" },
                tempo_espera_horas: { type: "number" },
                adicional_tipo: { type: "string" },
                pgto_por_fora: { type: "boolean" },
                acidente: { type: "string" },
                doenca: { type: "string" },
              },
            },
            ancora_emocional: {
              type: "object",
              properties: {
                detectada: { type: "boolean" },
                frase_exata: { type: "string", description: "COPIE A FRASE EXATA DO CLIENTE, sem alterar uma única palavra" },
                categoria: { type: "string", enum: ["sacrificio_familiar", "injustica_financeira", "saude_comprometida", "medo_futuro", "revolta_empregador", "dignidade_ferida"] },
                intensidade: { type: "string", enum: ["alta", "media", "baixa"] },
              },
              required: ["detectada"],
            },
            gatilhos_emocionais: { type: "array", items: { type: "string" } },
          },
          required: ["tipo_evento", "ancora_emocional"],
        },
      },
    }];

    const classResult = await callAI(apiKey, [
      { role: "system", content: classifierSystemPrompt },
      { role: "user", content: `Fala mais recente:\n"${new_utterance}"` },
    ], classifierTools, { type: "function", function: { name: "classify_utterance" } });

    if (!classResult.error) {
      classification = classResult.data;
    } else {
      console.warn("[Coaching] Classifier failed, continuing with raw state:", classResult.message);
    }
  } catch (e) {
    console.warn("[Coaching] Classifier error, continuing:", e);
  }

  // 3. Apply deterministic state updates
  if (classification) {
    state = applyClassification(state, classification);
  } else {
    state.turno++;
  }

  // 4. Persist state (atomic upsert)
  await supabase.from("coaching_sessions").upsert({
    session_key,
    user_id: user_id || "00000000-0000-0000-0000-000000000000",
    lead_id: lead_id || null,
    chamada_id: chamada_id || null,
    state: state as unknown as Record<string, unknown>,
  }, { onConflict: "session_key" });

  // 5. CALL 2 — Generate Coaching (more capable model)
  const qualificacao: ScriptItem[] = scriptItems?.qualificacao || [];
  const apresentacao: ScriptItem[] = scriptItems?.apresentacao || [];
  const qualIds = qualificacao.map((q) => q.id).join(", ");
  const apresIds = apresentacao.map((a) => a.id).join(", ");

  // Load prompts from DB
  const { data: coachPrompts } = await supabase
    .from("coaching_prompts")
    .select("phase, prompt_text")
    .eq("ai_key", "main_coach")
    .eq("is_active", true)
    .in("phase", ["global", `phase_${state.fase_atual}`]);

  const globalPrompt = coachPrompts?.find(p => p.phase === "global")?.prompt_text || "";
  const phasePrompt = coachPrompts?.find(p => p.phase === `phase_${state.fase_atual}`)?.prompt_text || "";

  const ancorasNaoUsadas = state.ancoras_emocionais.filter(a => !a.utilizado);
  const ancorasText = ancorasNaoUsadas.length
    ? `\nÂNCORAS EMOCIONAIS CAPTURADAS (frases EXATAS do cliente, use-as!):\n${ancorasNaoUsadas.map(a => `- "${a.frase}" (${a.categoria}, intensidade: ${a.intensidade})`).join("\n")}`
    : "";

  const stateContext = `
ESTADO ATUAL:
- Fase: ${state.fase_atual}/6
- Turno: ${state.turno}
- Radar: Prova=${state.radar.prova_tecnica} | Confiança=${state.radar.confianca_closer} | Convicção=${state.radar.conviccao_cliente} | Resistência=${state.radar.resistencia}
- Dados coletados: ${JSON.stringify(state.dados_coletados)}
- Pode fechar: ${state.pode_fechar}
${ancorasText}

ÚLTIMAS FALAS:
${state.ultimas_falas.map((f, i) => `${i + 1}. ${f}`).join("\n")}

CONTEXTO DO LEAD:
- Nome: ${leadName || "Desconhecido"}
${leadContext ? `- Info: ${leadContext}` : ""}

${coachInstructions ? `INSTRUÇÕES ADICIONAIS DO COACH:\n${coachInstructions}` : ""}

IDs válidos de apresentação: ${apresIds || "nenhum"}
IDs válidos de qualificação: ${qualIds || "nenhum"}`;

  const coachSystemPrompt = `${globalPrompt}\n\n${phasePrompt}\n\n${stateContext}`;

  const coachTools = [{
    type: "function",
    function: {
      name: "coach_response",
      description: "Generate coaching instructions for the closer/SDR",
      parameters: {
        type: "object",
        properties: {
          dizer_agora: { type: "string", description: "1-2 frases prontas para o closer falar AGORA (máx 30 palavras)" },
          proxima_pergunta: { type: "string", description: "Melhor pergunta para este momento" },
          alerta_compliance: { type: "string", description: "Alerta se detectado violação, ou null" },
          apresentacao_done: { type: "array", items: { type: "string" } },
          qualification_done: { type: "array", items: { type: "string" } },
          objections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" }, objection: { type: "string" },
                suggested_response: { type: "string" }, addressed: { type: "boolean" },
              },
              required: ["id", "objection", "suggested_response", "addressed"],
            },
          },
          reca_items: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, label: { type: "string" }, description: { type: "string" }, done: { type: "boolean" } },
              required: ["id", "label", "description", "done"],
            },
          },
          raloca_items: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, label: { type: "string" }, description: { type: "string" }, done: { type: "boolean" } },
              required: ["id", "label", "description", "done"],
            },
          },
          radar: {
            type: "object",
            properties: {
              prova_tecnica: { type: "number" }, confianca_closer: { type: "number" },
              conviccao_cliente: { type: "number" }, resistencia: { type: "number" },
            },
          },
          fase_atual: { type: "number" },
          pode_fechar: { type: "boolean" },
        },
        required: ["dizer_agora", "proxima_pergunta", "apresentacao_done", "qualification_done", "objections", "reca_items", "raloca_items", "radar", "fase_atual", "pode_fechar"],
      },
    },
  }];

  const coachResult = await callAI(apiKey, [
    { role: "system", content: coachSystemPrompt },
    { role: "user", content: `Gere as instruções de coaching para este momento da ligação.` },
  ], coachTools, { type: "function", function: { name: "coach_response" } });

  if (coachResult.error) {
    // Return state-only fallback if coach call fails
    return new Response(JSON.stringify({
      analysis: {
        apresentacao_done: [], qualification_done: [], objections: [],
        reca_items: [], raloca_items: [],
        dizer_agora: null, proxima_pergunta: null, alerta_compliance: null,
        radar: state.radar, fase_atual: state.fase_atual, pode_fechar: state.pode_fechar,
      },
      state,
      ancoras: state.ancoras_emocionais,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({
    analysis: coachResult.data,
    state,
    ancoras: state.ancoras_emocionais,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ========== MAIN HANDLER ==========
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect mode: new (session_key + new_utterance) vs legacy (transcript)
    if (body.new_utterance && body.session_key) {
      return await handleNewMode(body, LOVABLE_API_KEY);
    } else {
      return await handleLegacyMode(body, LOVABLE_API_KEY);
    }
  } catch (e) {
    console.error("coaching-realtime error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
