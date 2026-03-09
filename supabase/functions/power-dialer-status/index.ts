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
    // Resilient parsing: try formData first, fallback to text + URLSearchParams
    let callSid = "";
    let callStatus = "";
    let callDuration = 0;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      try {
        const formData = await req.formData();
        callSid = (formData.get("CallSid") as string) || "";
        callStatus = (formData.get("CallStatus") as string) || "";
        callDuration = parseInt((formData.get("CallDuration") as string) || "0", 10);
      } catch {
        // Fallback: parse as text
        const text = await req.text();
        const params = new URLSearchParams(text);
        callSid = params.get("CallSid") || "";
        callStatus = params.get("CallStatus") || "";
        callDuration = parseInt(params.get("CallDuration") || "0", 10);
      }
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      callSid = params.get("CallSid") || "";
      callStatus = params.get("CallStatus") || "";
      callDuration = parseInt(params.get("CallDuration") || "0", 10);
    }

    console.log(`[power-dialer-status] CallSid=${callSid} Status=${callStatus} Duration=${callDuration}`);

    if (!callSid) {
      return new Response("OK", { headers: corsHeaders });
    }

    // Find chamada by call_sid
    const { data: chamada, error: findErr } = await supabase
      .from("crm_chamadas")
      .select("id, lead_id, power_dialer_session_id, numero_discado")
      .eq("twilio_call_sid", callSid)
      .maybeSingle();

    if (findErr || !chamada) {
      console.error("[power-dialer-status] Chamada not found for sid:", callSid, findErr);
      return new Response("OK", { headers: corsHeaders });
    }

    let newStatus = "";
    const updateData: Record<string, unknown> = {};

    switch (callStatus) {
      case "initiated":
        newStatus = "iniciando";
        break;

      case "ringing":
        newStatus = "chamando";
        break;

      case "in-progress": {
        // Call connected — fallback winner logic (TwiML should have done this already)
        newStatus = "em_chamada";

        if (chamada.power_dialer_session_id) {
          // ATOMIC winner selection fallback (same as TwiML)
          const { data: winner } = await supabase
            .from("power_dialer_sessions")
            .update({
              lead_atendido_id: chamada.lead_id,
              telefone_atendido: chamada.numero_discado,
              status: "atendida",
            })
            .eq("id", chamada.power_dialer_session_id)
            .is("lead_atendido_id", null)
            .select("id, call_sids")
            .maybeSingle();

          if (winner) {
            console.log(`[power-dialer-status] Fallback winner! Lead=${chamada.lead_id}`);

            // Cancel other calls
            const allSids = (winner.call_sids || {}) as Record<string, string>;
            for (const [sid, chamadaId] of Object.entries(allSids)) {
              if (sid === callSid) continue;
              try {
                const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${sid}.json`;
                await fetch(url, {
                  method: "POST",
                  headers: {
                    Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: "Status=canceled",
                });
                console.log(`[power-dialer-status] Cancelled call ${sid}`);
              } catch (e) {
                console.error(`[power-dialer-status] Error cancelling ${sid}:`, e);
              }
              await supabase
                .from("crm_chamadas")
                .update({ status: "cancelada" })
                .eq("id", chamadaId)
                .in("status", ["em_andamento", "iniciando"]);
            }
          }
        }
        break;
      }

      case "completed":
        if (callDuration > 0) {
          newStatus = "finalizada";
          updateData.duracao_segundos = callDuration;
        } else {
          newStatus = "nao_atendida";
        }
        break;

      case "no-answer":
        newStatus = "nao_atendida";
        break;

      case "busy":
        newStatus = "ocupado";
        break;

      case "failed":
        newStatus = "falhou";
        break;

      case "canceled":
        newStatus = "cancelada";
        break;

      default:
        console.log("[power-dialer-status] Unknown status:", callStatus);
        break;
    }

    // Update chamada status
    updateData.status = newStatus;
    await supabase
      .from("crm_chamadas")
      .update(updateData)
      .eq("id", chamada.id);

    // ATOMIC JSONB update via RPC (no read-modify-write race)
    if (chamada.power_dialer_session_id && newStatus) {
      await supabase.rpc("update_resultado_por_numero", {
        p_session_id: chamada.power_dialer_session_id,
        p_numero: chamada.numero_discado,
        p_status: newStatus,
      });
    }

    return new Response("OK", { headers: corsHeaders });
  } catch (error) {
    console.error("[power-dialer-status] Error:", error);
    return new Response("OK", { headers: corsHeaders });
  }
});
