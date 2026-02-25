import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const contentType = req.headers.get("content-type") || "";

    // ── Handle JSON requests from frontend (start-recording) ──
    if (contentType.includes("application/json")) {
      const body = await req.json();

      if (body.action === "start-recording" && body.callSid) {
        console.log("[Webhook] start-recording requested for CallSid:", body.callSid);

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
          throw new Error("TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN não configurados");
        }

        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${body.callSid}/Recordings.json`;
        const authHeader = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

        const params = new URLSearchParams({
          RecordingChannels: "dual",
          RecordingStatusCallback: `${SUPABASE_URL}/functions/v1/twilio-webhook`,
          RecordingStatusCallbackEvent: "completed",
        });

        const res = await fetch(recordingUrl, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const resData = await res.json();
        if (!res.ok) {
          console.error("[Webhook] Twilio recording API error:", res.status, resData);
          return new Response(JSON.stringify({ error: "Failed to start recording", details: resData }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("[Webhook] Recording started:", resData.sid);
        return new Response(JSON.stringify({ success: true, recordingSid: resData.sid }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Unknown JSON action
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Handle Twilio form-encoded callbacks ──
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const recordingStatus = formData.get("RecordingStatus") as string;
    const recordingDuration = formData.get("RecordingDuration") as string;
    const callStatus = formData.get("CallStatus") as string;
    const dialCallStatus = formData.get("DialCallStatus") as string;

    console.log("Twilio webhook received:", {
      callSid,
      recordingSid,
      recordingUrl,
      recordingStatus,
      callStatus,
      dialCallStatus,
      recordingDuration,
    });

    // ── Handle <Dial> action callback (DialCallStatus) ──
    if (dialCallStatus && callSid && !recordingSid) {
      const statusMap: Record<string, string> = {
        "completed": "finalizada",
        "busy": "ocupado",
        "no-answer": "sem_resposta",
        "failed": "falhou",
        "canceled": "cancelada",
      };
      const mappedStatus = statusMap[dialCallStatus] || dialCallStatus;

      const terminatedBy = formData.get("TerminatedBy") as string | null;
      const encerradoPorMap: Record<string, string> = {
        "callee": "lead",
        "caller": "sdr",
      };
      const encerradoPor = terminatedBy ? (encerradoPorMap[terminatedBy] || terminatedBy) : undefined;

      const updatePayload: Record<string, unknown> = { status: mappedStatus };
      if (encerradoPor) updatePayload.encerrado_por = encerradoPor;

      const { error: statusError } = await supabase
        .from("crm_chamadas")
        .update(updatePayload)
        .eq("twilio_call_sid", callSid);

      if (statusError) {
        console.error("Erro ao atualizar status (DialCallStatus):", statusError);
      }

      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    // ── Handle recording completed ──
    if (recordingStatus === "completed" && recordingUrl && callSid) {
      const { data: chamada, error: findError } = await supabase
        .from("crm_chamadas")
        .select("id, lead_id")
        .eq("twilio_call_sid", callSid)
        .single();

      if (findError || !chamada) {
        console.error("Chamada não encontrada para CallSid:", callSid);
      } else {
        // Download the recording from Twilio
        const audioUrl = `${recordingUrl}.mp3`;
        console.log("[Webhook] Downloading recording from Twilio:", audioUrl);

        let audioBlob: Blob | null = null;
        try {
          const authHeader = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
            ? "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
            : undefined;

          const audioResponse = await fetch(audioUrl, {
            headers: authHeader ? { Authorization: authHeader } : {},
          });

          if (audioResponse.ok) {
            audioBlob = await audioResponse.blob();
            console.log("[Webhook] Recording downloaded:", audioBlob.size, "bytes");
          } else {
            console.error("[Webhook] Failed to download recording:", audioResponse.status);
          }
        } catch (e) {
          console.error("[Webhook] Error downloading recording:", e);
        }

        // Upload to Supabase storage
        const fileName = `voip_${chamada.lead_id}_${chamada.id}.mp3`;
        if (audioBlob && audioBlob.size > 0) {
          const { error: uploadErr } = await supabase.storage
            .from("atendimentos-audio")
            .upload(fileName, audioBlob, { contentType: "audio/mpeg", upsert: true });

          if (uploadErr) {
            console.error("[Webhook] Error uploading to storage:", uploadErr);
          } else {
            console.log("[Webhook] Recording uploaded to storage:", fileName);
          }
        }

        // Update chamada with recording info
        const { error: updateError } = await supabase
          .from("crm_chamadas")
          .update({
            recording_url: audioUrl,
            audio_url: fileName,
            duracao_segundos: recordingDuration ? parseInt(recordingDuration) : null,
            status: "gravacao_pronta",
          })
          .eq("id", chamada.id);

        if (updateError) {
          console.error("Erro ao atualizar chamada:", updateError);
        } else {
          console.log("Chamada atualizada com gravação:", chamada.id);
        }

        // Get lead info for transcription speaker labels
        const { data: leadData } = await supabase
          .from("crm_leads")
          .select("nome")
          .eq("id", chamada.lead_id)
          .single();

        // Trigger background processing (transcription + feedback)
        if (audioBlob && audioBlob.size > 0) {
          console.log("[Webhook] Triggering process-chamada-background for:", chamada.id);
          try {
            const bgUrl = `${SUPABASE_URL}/functions/v1/process-chamada-background`;
            await fetch(bgUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                chamadaId: chamada.id,
                leadId: chamada.lead_id,
                leadNome: leadData?.nome || "Lead",
                audioFileName: fileName,
                userName: "Operador",
              }),
            });
            console.log("[Webhook] Background processing triggered successfully");
          } catch (e) {
            console.error("[Webhook] Error triggering background processing:", e);
          }
        }
      }
    }

    // ── Handle legacy call status updates ──
    if (callStatus && callSid && !recordingSid && !dialCallStatus) {
      const statusMap: Record<string, string> = {
        "ringing": "discando",
        "in-progress": "em_chamada",
        "completed": "finalizada",
        "busy": "ocupado",
        "no-answer": "sem_resposta",
        "failed": "falhou",
        "canceled": "cancelada",
      };

      const mappedStatus = statusMap[callStatus] || callStatus;

      const terminatedBy = formData.get("TerminatedBy") as string | null;
      const encerradoPorMap: Record<string, string> = {
        "callee": "lead",
        "caller": "sdr",
      };
      const encerradoPor = terminatedBy ? (encerradoPorMap[terminatedBy] || terminatedBy) : undefined;

      const updatePayload: Record<string, unknown> = { status: mappedStatus };
      if (encerradoPor) updatePayload.encerrado_por = encerradoPor;

      const { error: statusError } = await supabase
        .from("crm_chamadas")
        .update(updatePayload)
        .eq("twilio_call_sid", callSid);

      if (statusError) {
        console.error("Erro ao atualizar status:", statusError);
      }
    }

    // Twilio expects 200 OK
    return new Response("<Response/>", {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: unknown) {
    console.error("Error in twilio-webhook:", error);
    return new Response("<Response/>", {
      headers: { "Content-Type": "text/xml" },
    });
  }
});
