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

    // Handle recording completed
    if (recordingStatus === "completed" && recordingUrl && callSid) {
      // Find the chamada by twilio_call_sid
      const { data: chamada, error: findError } = await supabase
        .from("crm_chamadas")
        .select("*")
        .eq("twilio_call_sid", callSid)
        .single();

      if (findError || !chamada) {
        console.error("Chamada não encontrada para CallSid:", callSid);
      } else {
        // Update with recording URL and duration
        const { error: updateError } = await supabase
          .from("crm_chamadas")
          .update({
            recording_url: `${recordingUrl}.mp3`,
            duracao_segundos: recordingDuration ? parseInt(recordingDuration) : null,
            status: "gravacao_pronta",
          })
          .eq("id", chamada.id);

        if (updateError) {
          console.error("Erro ao atualizar chamada:", updateError);
        } else {
          console.log("Chamada atualizada com gravação:", chamada.id);
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
