import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;

  const hangupTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;

  try {
    const url = new URL(req.url);
    const clientIdentity = url.searchParams.get("clientIdentity");
    const sessionId = url.searchParams.get("sessionId");

    if (!clientIdentity) {
      throw new Error("clientIdentity is required");
    }

    // Parse AnsweredBy + CallSid from POST form data OR URL query params (AMD fallback)
    let answeredBy = url.searchParams.get("AnsweredBy") || "";
    let callSid = url.searchParams.get("CallSid") || "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      try {
        const formData = await req.formData();
        answeredBy = (formData.get("AnsweredBy") as string) || answeredBy;
        callSid = (formData.get("CallSid") as string) || callSid;
      } catch {
        // Fallback: parse as text
        const text = await req.text();
        const params = new URLSearchParams(text);
        answeredBy = params.get("AnsweredBy") || answeredBy;
        callSid = params.get("CallSid") || callSid;
      }
    }

    console.log(`[power-dialer-twiml] CallSid=${callSid} AnsweredBy=${answeredBy} SessionId=${sessionId}`);

    // Accept "human" and "unknown" (AMD timeout = likely human). Reject confirmed machines.
    const machineValues = ["machine_start", "machine_end_beep", "machine_end_silence", "machine_end_other", "fax"];
    const isMachine = machineValues.includes(answeredBy);

    if (isMachine) {
      console.log(`[power-dialer-twiml] Machine detected (${answeredBy}), hanging up`);
      return new Response(hangupTwiml, {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    // === HUMAN ANSWERED — attempt atomic winner selection ===
    console.log(`[power-dialer-twiml] Human detected! CallSid=${callSid} SessionId=${sessionId}`);

    let winnerSet = false;
    let canceledCount = 0;

    if (callSid && sessionId) {
      // Find the chamada for this call
      const { data: chamada } = await supabase
        .from("crm_chamadas")
        .select("id, lead_id, numero_discado, power_dialer_session_id")
        .eq("twilio_call_sid", callSid)
        .maybeSingle();

      if (chamada) {
        // Update chamada to em_chamada
        await supabase
          .from("crm_chamadas")
          .update({ status: "em_chamada" })
          .eq("id", chamada.id);

        // ATOMIC winner selection: only succeeds if lead_atendido_id is still null
        const { data: winner } = await supabase
          .from("power_dialer_sessions")
          .update({
            lead_atendido_id: chamada.lead_id,
            telefone_atendido: chamada.numero_discado,
            status: "atendida",
          })
          .eq("id", sessionId)
          .is("lead_atendido_id", null)
          .select("id, call_sids")
          .maybeSingle();

        if (!winner) {
          // Lost the race — another call already won
          console.log(`[power-dialer-twiml] Race lost! Another call already won. Hanging up.`);
          await supabase
            .from("crm_chamadas")
            .update({ status: "cancelada" })
            .eq("id", chamada.id);
          return new Response(hangupTwiml, {
            headers: { ...corsHeaders, "Content-Type": "text/xml" },
          });
        }

        // We won the race! Fire-and-forget: cancel other calls in background
        winnerSet = true;

        // Start dual-channel recording on the OUTBOUND call leg
        // (callSid here is the outbound SID stored in crm_chamadas.twilio_call_sid)
        const SUPABASE_URL_ENV = Deno.env.get("SUPABASE_URL")!;
        fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}/Recordings.json`,
          {
            method: "POST",
            headers: {
              Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              RecordingChannels: "dual",
              RecordingStatusCallback: `${SUPABASE_URL_ENV}/functions/v1/twilio-webhook`,
              RecordingStatusCallbackEvent: "completed",
            }).toString(),
          }
        ).then(r => r.json())
         .then(d => console.log("[twiml] Recording started:", d.sid))
         .catch(e => console.error("[twiml] start-recording error:", e));
        const allSids = (winner.call_sids || {}) as Record<string, string>;
        const cancelPromises = Object.entries(allSids)
          .filter(([sid]) => sid !== callSid)
          .map(async ([sid, chamadaId]) => {
            try {
              await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${sid}.json`, {
                method: "POST",
                headers: {
                  Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "Status=canceled",
              });
              console.log(`[power-dialer-twiml] Cancelled call ${sid}`);
            } catch (e) {
              console.error(`[power-dialer-twiml] Error cancelling ${sid}:`, e);
            }
            await supabase
              .from("crm_chamadas")
              .update({ status: "cancelada" })
              .eq("id", chamadaId)
              .in("status", ["em_andamento", "iniciando", "chamando"]);
          });
        // Don't await — return TwiML immediately so audio connects now
        Promise.all(cancelPromises).catch(console.error);
      }
    }

    console.log(`[power-dialer-twiml] winner_set=${winnerSet} — returning TwiML immediately`);

    // Return TwiML immediately — audio bridge starts in <1s instead of ~8s
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Client>${clientIdentity}</Client>
  </Dial>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[power-dialer-twiml] Error:", error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Erro ao conectar a chamada.</Say>
</Response>`;
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});
