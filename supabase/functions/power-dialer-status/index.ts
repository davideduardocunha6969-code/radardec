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

  try {
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = parseInt(formData.get("CallDuration") as string || "0", 10);

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
      case "in-progress":
        // Stage 1: call connected, but don't update session yet
        newStatus = "em_chamada";
        break;

      case "completed":
        if (callDuration > 0) {
          // Stage 2: call was actually answered and had duration
          newStatus = "finalizada";
          updateData.duracao_segundos = callDuration;

          // NOW update session with lead_atendido_id
          if (chamada.power_dialer_session_id) {
            const { error: sessErr } = await supabase
              .from("power_dialer_sessions")
              .update({
                lead_atendido_id: chamada.lead_id,
                telefone_atendido: chamada.numero_discado,
                status: "atendida",
              })
              .eq("id", chamada.power_dialer_session_id);

            if (sessErr) {
              console.error("[power-dialer-status] Error updating session:", sessErr);
            }
          }
        } else {
          // Connected but duration 0 — voicemail or immediate hangup
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
        return new Response("OK", { headers: corsHeaders });
    }

    // Update chamada status
    updateData.status = newStatus;
    await supabase
      .from("crm_chamadas")
      .update(updateData)
      .eq("id", chamada.id);

    // Update resultado_por_numero on session
    if (chamada.power_dialer_session_id) {
      const { data: session } = await supabase
        .from("power_dialer_sessions")
        .select("resultado_por_numero")
        .eq("id", chamada.power_dialer_session_id)
        .single();

      if (session) {
        const resultados = (session.resultado_por_numero || {}) as Record<string, string>;
        resultados[chamada.numero_discado] = newStatus;
        await supabase
          .from("power_dialer_sessions")
          .update({ resultado_por_numero: resultados })
          .eq("id", chamada.power_dialer_session_id);
      }
    }

    return new Response("OK", { headers: corsHeaders });
  } catch (error) {
    console.error("[power-dialer-status] Error:", error);
    return new Response("OK", { headers: corsHeaders });
  }
});
