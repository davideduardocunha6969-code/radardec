import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 5;

async function twilioCall(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  twimlUrl: string,
  statusCallbackUrl: string
): Promise<{ sid: string } | { error: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
  const body = new URLSearchParams({
    From: from,
    To: to,
    Url: twimlUrl,
    Timeout: "20",
    StatusCallback: statusCallbackUrl,
    StatusCallbackEvent: "initiated ringing answered completed",
    StatusCallbackMethod: "POST",
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await resp.json();
  if (!resp.ok) {
    return { error: data.message || JSON.stringify(data) };
  }
  return { sid: data.sid };
}

async function cancelTwilioCall(accountSid: string, authToken: string, callSid: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "Status=canceled",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const TWILIO_PHONE = Deno.env.get("TWILIO_PHONE_NUMBER")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    if (action === "start") {
      const { funilId, colunaId, papel } = body;

      // Cleanup old sessions
      await supabase.rpc("expire_old_dialer_sessions");

      // Check existing active session for this column
      const { data: existing } = await supabase
        .from("power_dialer_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("coluna_id", colunaId)
        .eq("status", "ativo")
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Já existe uma sessão ativa nesta coluna" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch leads with phones in this column
      const { data: leadsData, error: leadsErr } = await supabase
        .from("crm_leads")
        .select("id, nome, telefones, endereco")
        .eq("funil_id", funilId)
        .eq("coluna_id", colunaId)
        .order("ordem", { ascending: true });

      if (leadsErr) throw leadsErr;

      // Build queue: flatten leads × phones, prioritize whatsapp > celular > fixo
      const typePriority: Record<string, number> = { whatsapp: 0, celular: 1, fixo: 2 };
      interface QueueItem {
        leadId: string;
        leadNome: string;
        numero: string;
        tipo: string;
        ddd: string;
      }
      const queue: QueueItem[] = [];

      for (const lead of leadsData || []) {
        const phones = (lead.telefones as Array<{ numero: string; tipo: string }>) || [];
        if (!phones.length) continue;

        // Sort phones by priority
        const sorted = [...phones].sort(
          (a, b) => (typePriority[a.tipo] ?? 9) - (typePriority[b.tipo] ?? 9)
        );

        // Use best phone
        const best = sorted[0];
        const cleanNum = best.numero.replace(/\D/g, "");
        const e164 = cleanNum.startsWith("+") ? cleanNum : `+55${cleanNum}`;
        const ddd = cleanNum.length >= 10 ? cleanNum.slice(0, 2) : "";

        queue.push({
          leadId: lead.id,
          leadNome: lead.nome,
          numero: e164,
          tipo: best.tipo,
          ddd,
        });
      }

      if (!queue.length) {
        return new Response(
          JSON.stringify({ error: "Nenhum lead com telefone nesta coluna" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch local presence numbers
      const { data: twilioNums } = await supabase
        .from("twilio_numeros")
        .select("numero, ddd")
        .eq("ativo", true);

      const dddMap = new Map<string, string>();
      for (const tn of twilioNums || []) {
        dddMap.set(tn.ddd, tn.numero);
      }

      // Create session
      const { data: session, error: sessErr } = await supabase
        .from("power_dialer_sessions")
        .insert({
          user_id: userId,
          funil_id: funilId,
          coluna_id: colunaId,
          papel: papel || "sdr",
          numeros_fila: queue,
          lote_atual: 0,
        })
        .select()
        .single();

      if (sessErr) throw sessErr;

      // Dial first batch
      const batch = queue.slice(0, BATCH_SIZE);
      const clientIdentity = `user_${userId}`;
      const callSids: Record<string, string> = {};
      const leadsInfo: Array<{ leadId: string; leadNome: string; numero: string; status: string }> = [];

      for (const item of batch) {
        const callerId = dddMap.get(item.ddd) || TWILIO_PHONE;
        const callerDdd = dddMap.has(item.ddd) ? item.ddd : "";
        const twimlUrl = `${SUPABASE_URL}/functions/v1/power-dialer-twiml?clientIdentity=${encodeURIComponent(clientIdentity)}&sessionId=${session.id}`;
        const statusUrl = `${SUPABASE_URL}/functions/v1/power-dialer-status`;

        const result = await twilioCall(ACCOUNT_SID, AUTH_TOKEN, callerId, item.numero, twimlUrl, statusUrl);

        if ("sid" in result) {
          // Create chamada record
          const { data: chamada } = await supabase
            .from("crm_chamadas")
            .insert({
              lead_id: item.leadId,
              user_id: userId,
              numero_discado: item.numero,
              twilio_call_sid: result.sid,
              status: "em_andamento",
              canal: "power_dialer",
              papel: papel || "sdr",
              power_dialer_session_id: session.id,
              caller_id_usado: callerId,
              coluna_id_no_momento: colunaId,
              ddd_destino: item.ddd,
              ddd_caller: callerDdd,
            })
            .select("id")
            .single();

          if (chamada) {
            callSids[result.sid] = chamada.id;
          }
          leadsInfo.push({ leadId: item.leadId, leadNome: item.leadNome, numero: item.numero, status: "em_andamento" });
        } else {
          // Record failed attempt
          await supabase
            .from("crm_chamadas")
            .insert({
              lead_id: item.leadId,
              user_id: userId,
              numero_discado: item.numero,
              status: "falhou",
              canal: "power_dialer",
              papel: papel || "sdr",
              power_dialer_session_id: session.id,
              caller_id_usado: callerId,
              coluna_id_no_momento: colunaId,
              ddd_destino: item.ddd,
              ddd_caller: callerDdd,
              observacoes: result.error,
            });

          leadsInfo.push({ leadId: item.leadId, leadNome: item.leadNome, numero: item.numero, status: "falhou" });
        }
      }

      // Update session with call_sids and leads_info
      await supabase
        .from("power_dialer_sessions")
        .update({ call_sids: callSids, leads_info: leadsInfo })
        .eq("id", session.id);

      return new Response(
        JSON.stringify({ sessionId: session.id, totalQueue: queue.length, batchSize: batch.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "next-batch") {
      const { sessionId } = body;

      const { data: session, error: sessErr } = await supabase
        .from("power_dialer_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (sessErr || !session) {
        return new Response(JSON.stringify({ error: "Sessão não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Cancel any still-pending calls from previous batch
      const prevSids = session.call_sids as Record<string, string>;
      for (const sid of Object.keys(prevSids)) {
        try {
          await cancelTwilioCall(ACCOUNT_SID, AUTH_TOKEN, sid);
        } catch {
          // ignore cancel errors
        }
      }

      // Mark pending chamadas as cancelada
      for (const chamadaId of Object.values(prevSids)) {
        await supabase
          .from("crm_chamadas")
          .update({ status: "cancelada" })
          .eq("id", chamadaId)
          .in("status", ["em_andamento", "iniciando"]);
      }

      const queue = session.numeros_fila as Array<{ leadId: string; leadNome: string; numero: string; tipo: string; ddd: string }>;
      const nextLote = session.lote_atual + 1;
      const start = nextLote * BATCH_SIZE;
      const batch = queue.slice(start, start + BATCH_SIZE);

      if (!batch.length) {
        await supabase
          .from("power_dialer_sessions")
          .update({ status: "finalizado_sem_atendimento", lote_atual: nextLote })
          .eq("id", sessionId);

        return new Response(
          JSON.stringify({ done: true, status: "finalizado_sem_atendimento" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch local presence numbers
      const { data: twilioNums } = await supabase
        .from("twilio_numeros")
        .select("numero, ddd")
        .eq("ativo", true);

      const dddMap = new Map<string, string>();
      for (const tn of twilioNums || []) {
        dddMap.set(tn.ddd, tn.numero);
      }

      const clientIdentity = `user_${userId}`;
      const callSids: Record<string, string> = {};
      const leadsInfo: Array<{ leadId: string; leadNome: string; numero: string; status: string }> = [];

      // Small cooldown
      await new Promise((r) => setTimeout(r, 2000));

      for (const item of batch) {
        const callerId = dddMap.get(item.ddd) || Deno.env.get("TWILIO_PHONE_NUMBER")!;
        const callerDdd = dddMap.has(item.ddd) ? item.ddd : "";
        const twimlUrl = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/power-dialer-twiml?clientIdentity=${encodeURIComponent(clientIdentity)}&sessionId=${sessionId}`;
        const statusUrl = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/power-dialer-status`;

        const result = await twilioCall(ACCOUNT_SID, AUTH_TOKEN, callerId, item.numero, twimlUrl, statusUrl);

        if ("sid" in result) {
          const { data: chamada } = await supabase
            .from("crm_chamadas")
            .insert({
              lead_id: item.leadId,
              user_id: userId,
              numero_discado: item.numero,
              twilio_call_sid: result.sid,
              status: "em_andamento",
              canal: "power_dialer",
              papel: session.papel,
              power_dialer_session_id: sessionId,
              caller_id_usado: callerId,
              coluna_id_no_momento: session.coluna_id,
              ddd_destino: item.ddd,
              ddd_caller: callerDdd,
            })
            .select("id")
            .single();

          if (chamada) callSids[result.sid] = chamada.id;
          leadsInfo.push({ leadId: item.leadId, leadNome: item.leadNome, numero: item.numero, status: "em_andamento" });
        } else {
          await supabase
            .from("crm_chamadas")
            .insert({
              lead_id: item.leadId,
              user_id: userId,
              numero_discado: item.numero,
              status: "falhou",
              canal: "power_dialer",
              papel: session.papel,
              power_dialer_session_id: sessionId,
              caller_id_usado: callerId,
              coluna_id_no_momento: session.coluna_id,
              ddd_destino: item.ddd,
              ddd_caller: callerDdd,
              observacoes: result.error,
            });
          leadsInfo.push({ leadId: item.leadId, leadNome: item.leadNome, numero: item.numero, status: "falhou" });
        }
      }

      await supabase
        .from("power_dialer_sessions")
        .update({ call_sids: callSids, leads_info: leadsInfo, lote_atual: nextLote })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ lote: nextLote, batchSize: batch.length, totalQueue: queue.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cancel") {
      const { sessionId } = body;

      const { data: session } = await supabase
        .from("power_dialer_sessions")
        .select("call_sids")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (session) {
        const sids = session.call_sids as Record<string, string>;
        for (const sid of Object.keys(sids)) {
          try {
            await cancelTwilioCall(ACCOUNT_SID, AUTH_TOKEN, sid);
          } catch {
            // ignore
          }
        }

        // Update all pending chamadas
        for (const chamadaId of Object.values(sids)) {
          await supabase
            .from("crm_chamadas")
            .update({ status: "cancelada" })
            .eq("id", chamadaId)
            .in("status", ["em_andamento", "iniciando", "em_chamada"]);
        }
      }

      await supabase
        .from("power_dialer_sessions")
        .update({ status: "cancelado" })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[power-dialer] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
