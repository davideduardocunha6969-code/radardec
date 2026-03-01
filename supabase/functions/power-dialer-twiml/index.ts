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

  try {
    const url = new URL(req.url);
    const clientIdentity = url.searchParams.get("clientIdentity");
    const sessionId = url.searchParams.get("sessionId");

    if (!clientIdentity) {
      throw new Error("clientIdentity is required");
    }

    // Parse form data (Twilio sends POST with form-urlencoded for sync AMD)
    let answeredBy = "";
    let callSid = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      answeredBy = (formData.get("AnsweredBy") as string) || "";
      callSid = (formData.get("CallSid") as string) || "";
    }

    console.log(`[power-dialer-twiml] CallSid=${callSid} AnsweredBy=${answeredBy} SessionId=${sessionId}`);

    // Accept "human" and "unknown" (AMD timeout = likely human). Reject confirmed machines.
    const machineValues = ["machine_start", "machine_end_beep", "machine_end_silence", "machine_end_other", "fax"];
    const isMachine = machineValues.includes(answeredBy);

    if (isMachine) {
      console.log(`[power-dialer-twiml] Machine detected (${answeredBy}), hanging up`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    // === HUMAN ANSWERED — set winner in session ===
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

        // Load session
        const { data: session } = await supabase
          .from("power_dialer_sessions")
          .select("lead_atendido_id, call_sids")
          .eq("id", sessionId)
          .single();

        // Idempotent: only set winner if not already set
        if (session && !session.lead_atendido_id) {
          winnerSet = true;

          await supabase
            .from("power_dialer_sessions")
            .update({
              lead_atendido_id: chamada.lead_id,
              telefone_atendido: chamada.numero_discado,
              status: "atendida",
            })
            .eq("id", sessionId);

          // Re-read to confirm THIS call won the race
          const { data: confirmed } = await supabase
            .from("power_dialer_sessions")
            .select("lead_atendido_id")
            .eq("id", sessionId)
            .single();

          if (confirmed?.lead_atendido_id !== chamada.lead_id) {
            // Another call won the race — hang up this one
            console.log(`[power-dialer-twiml] Race lost! Expected lead=${chamada.lead_id}, got=${confirmed?.lead_atendido_id}. Hanging up.`);
            const hangupTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
            return new Response(hangupTwiml, {
              headers: { ...corsHeaders, "Content-Type": "text/xml" },
            });
          }

          // Cancel all OTHER calls in this batch
          const allSids = (session.call_sids || {}) as Record<string, string>;
          for (const [sid, chamadaId] of Object.entries(allSids)) {
            if (sid === callSid) continue;
            try {
              const cancelUrl = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${sid}.json`;
              await fetch(cancelUrl, {
                method: "POST",
                headers: {
                  Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "Status=canceled",
              });
              canceledCount++;
              console.log(`[power-dialer-twiml] Cancelled call ${sid}`);
            } catch (e) {
              console.error(`[power-dialer-twiml] Error cancelling ${sid}:`, e);
            }
            // Mark sibling chamada as cancelada
            await supabase
              .from("crm_chamadas")
              .update({ status: "cancelada" })
              .eq("id", chamadaId)
              .in("status", ["em_andamento", "iniciando"]);
          }
        }
      }
    }

    console.log(`[power-dialer-twiml] winner_set=${winnerSet} canceled_calls=${canceledCount}`);

    // Connect to browser Client
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
