import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { leadId, papel } = await req.json();
    if (!leadId) throw new Error("leadId é obrigatório");

    const filterPapel = papel || "sdr";

    // Fetch chamadas filtered by papel
    let query = supabase
      .from("crm_chamadas")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });

    if (filterPapel) {
      query = query.eq("papel", filterPapel);
    }

    const { data: chamadas, error } = await query;

    if (error) throw error;
    if (!chamadas || chamadas.length === 0) {
      return new Response(
        JSON.stringify({ resumo: "Nenhum contato registrado para este lead." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch lead info
    const { data: lead } = await supabase
      .from("crm_leads")
      .select("nome, endereco, resumo_caso, funil_id")
      .eq("id", leadId)
      .single();

    // Try to get custom instructions from the coach assigned to this funnel
    let customInstrucoes = "";
    if (lead?.funil_id) {
      const coachField = filterPapel === "closer" ? "robo_coach_closer_id" : "robo_coach_sdr_id";
      const { data: funil } = await supabase
        .from("crm_funis")
        .select(`${coachField}`)
        .eq("id", lead.funil_id)
        .single();

      const coachId = funil?.[coachField];
      if (coachId) {
        const { data: coach } = await supabase
          .from("robos_coach")
          .select("instrucoes_resumo")
          .eq("id", coachId)
          .single();
        if (coach?.instrucoes_resumo) {
          customInstrucoes = coach.instrucoes_resumo;
        }
      }
    }

    // Build context for AI
    const totalChamadas = chamadas.length;
    const atendidas = chamadas.filter((c: any) =>
      ["completada", "finalizada", "gravacao_pronta"].includes(c.status)
    );
    const naoAtendidas = chamadas.filter((c: any) =>
      ["cancelada", "nao_atendida", "erro"].includes(c.status)
    );

    const chamadasInfo = chamadas.map((c: any, i: number) => {
      const durMin = c.duracao_segundos
        ? (c.duracao_segundos / 60).toFixed(1)
        : "0";
      const atendida = ["completada", "finalizada", "gravacao_pronta"].includes(c.status);
      const canal = c.canal === "whatsapp" ? "WhatsApp" : "VoIP";
      let info = `Chamada ${i + 1}: ${new Date(c.created_at).toLocaleString("pt-BR")} | Canal: ${canal} | Número: ${c.numero_discado} | Status: ${atendida ? "Atendida" : "Não atendida"} | Duração: ${durMin} min`;
      if (c.encerrado_por) info += ` | Encerrada por: ${c.encerrado_por}`;
      if (c.resumo_ia) info += `\nResumo IA: ${c.resumo_ia}`;
      if (c.transcricao) {
        const transcricaoTruncada = c.transcricao.length > 2000
          ? c.transcricao.substring(0, 2000) + "..."
          : c.transcricao;
        info += `\nTranscrição: ${transcricaoTruncada}`;
      }
      return info;
    });

    const papelLabel = filterPapel === "closer" ? "Closer" : "SDR";

    // Use custom instructions if available, otherwise use default prompt
    const defaultInstrucoes = `## Instruções para o resumo:
Gere um resumo estruturado e conciso contendo:

1. **Status Geral**: Se o lead foi contactado com sucesso ou não
2. **Tentativas**: Quantas chamadas foram necessárias, distinguindo atendidas vs não atendidas
3. **Canal Efetivo**: Qual foi o canal que funcionou (VoIP, WhatsApp) — se houve contato efetivo
4. **Resumo do Atendimento**: O que foi discutido, se houve agendamento de reunião, qual a data, se o lead demonstrou interesse, objeções, etc.
5. **Próximos Passos**: Baseado no histórico, qual deveria ser a próxima ação (reagendar, fazer follow-up, descartar, etc.)

Se o lead NÃO atendeu nenhuma chamada, foque em:
- Quantidade de tentativas realizadas
- Canais utilizados
- Horários das tentativas
- Sugestão de melhor abordagem`;

    const instrucoes = customInstrucoes || defaultInstrucoes;

    const prompt = `Você é um analista de CRM especializado em prospecção outbound para escritórios de advocacia.

Analise TODOS os contatos realizados pelo ${papelLabel} com o lead "${lead?.nome || "desconhecido"}" e gere um RESUMO EXECUTIVO da situação dos contatos.

## Dados do Lead
- Nome: ${lead?.nome || "N/A"}
- Endereço: ${lead?.endereco || "N/A"}
- Resumo do caso: ${lead?.resumo_caso || "N/A"}

## Estatísticas
- Total de chamadas (${papelLabel}): ${totalChamadas}
- Chamadas atendidas: ${atendidas.length}
- Chamadas não atendidas: ${naoAtendidas.length}
- Canais utilizados: ${[...new Set(chamadas.map((c: any) => c.canal === "whatsapp" ? "WhatsApp" : "VoIP"))].join(", ")}

## Histórico completo de chamadas do ${papelLabel} (em ordem cronológica):
${chamadasInfo.join("\n\n---\n\n")}

${instrucoes}

Responda em português brasileiro, de forma direta e objetiva. Use markdown para formatação.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 1500,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Gateway error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const resumo = aiData.choices?.[0]?.message?.content || "Não foi possível gerar o resumo.";

    return new Response(
      JSON.stringify({ resumo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
