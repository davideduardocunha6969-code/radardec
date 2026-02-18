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

    // Twilio sends form-encoded data
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const recordingStatus = formData.get("RecordingStatus") as string;
    const recordingDuration = formData.get("RecordingDuration") as string;
    const callStatus = formData.get("CallStatus") as string;

    console.log("Twilio webhook received:", {
      callSid,
      recordingSid,
      recordingUrl,
      recordingStatus,
      callStatus,
      recordingDuration,
    });

    // Handle recording completed — download, upload to storage, then trigger background processing
    if (recordingStatus === "completed" && recordingUrl && callSid) {
      // Find the chamada by twilio_call_sid
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

        // Trigger background processing (transcription + feedback) — same pipeline as WhatsApp
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

    // Handle call status updates
    if (callStatus && callSid && !recordingSid) {
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

      const { error: statusError } = await supabase
        .from("crm_chamadas")
        .update({ status: mappedStatus })
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