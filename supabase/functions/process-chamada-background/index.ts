import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Background edge function that processes a chamada after recording ends:
 * 1. Downloads audio from storage
 * 2. Transcribes via ElevenLabs
 * 3. Updates chamada record with transcription
 * 4. Triggers AI feedback
 *
 * This runs entirely server-side so the user can navigate away immediately.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Return 200 immediately to release the client, then process in background
  const body = await req.json();
  const { chamadaId, leadId, leadNome, audioFileName, userName } = body;

  if (!chamadaId || !audioFileName) {
    return new Response(
      JSON.stringify({ error: "chamadaId and audioFileName are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

  // Update status to processing
  await supabase
    .from("crm_chamadas")
    .update({ status: "processando_transcricao" })
    .eq("id", chamadaId);

  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    // 1. Download audio from storage
    console.log(`[Background] Downloading audio: ${audioFileName}`);
    const { data: audioData, error: dlErr } = await supabase.storage
      .from("atendimentos-audio")
      .download(audioFileName);

    if (dlErr || !audioData) {
      throw new Error(`Erro ao baixar áudio: ${dlErr?.message || "arquivo não encontrado"}`);
    }

    console.log(`[Background] Audio size: ${audioData.size} bytes`);

    // 2. Transcribe via ElevenLabs
    const speakerNames: Record<string, string> = {
      "speaker_0": leadNome || "Lead",
      "speaker_1": userName || "Operador",
      "0": leadNome || "Lead",
      "1": userName || "Operador",
    };

    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append("file", audioData, audioFileName);
    elevenLabsFormData.append("model_id", "scribe_v2");
    elevenLabsFormData.append("language_code", "por");
    elevenLabsFormData.append("diarize", "true");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Background] ElevenLabs error:", errorText);
      throw new Error(`Erro na API ElevenLabs: ${response.status}`);
    }

    const transcriptionResult = await response.json();
    const words = transcriptionResult.words || [];
    const rawText = transcriptionResult.text || "";

    // Build structured transcription with speaker segments
    let structuredText = "";
    let currentSpeaker: string | null = null;
    let currentSegment = "";

    for (const word of words) {
      const speaker = word.speaker_id || word.speaker || "unknown";
      if (speaker !== currentSpeaker) {
        if (currentSpeaker !== null && currentSegment.trim()) {
          const name = speakerNames[currentSpeaker] || `Locutor ${currentSpeaker}`;
          structuredText += `[${name}]: ${currentSegment.trim()}\n\n`;
        }
        currentSpeaker = speaker;
        currentSegment = word.text || "";
      } else {
        currentSegment += word.text || "";
      }
    }
    if (currentSpeaker !== null && currentSegment.trim()) {
      const name = speakerNames[currentSpeaker] || `Locutor ${currentSpeaker}`;
      structuredText += `[${name}]: ${currentSegment.trim()}\n`;
    }

    const finalText = structuredText.trim() || rawText;
    console.log("[Background] Transcription done:", finalText.substring(0, 100));

    // 3. Detect if call was answered (2+ speakers)
    const speakerMatches = finalText.match(/^\[(.+?)\]:/gm);
    const uniqueSpeakers = speakerMatches
      ? new Set(speakerMatches.map((m: string) => m.replace(/[\[\]:]/g, "").trim()))
      : new Set();
    const wasAnswered = uniqueSpeakers.size >= 2 && finalText.length >= 20;
    const finalStatus = wasAnswered ? "finalizada" : "nao_atendida";

    // 4. Update chamada with transcription
    await supabase
      .from("crm_chamadas")
      .update({
        transcricao: finalText,
        status: finalStatus,
      })
      .eq("id", chamadaId);

    // 5. Trigger AI feedback if answered
    if (wasAnswered) {
      console.log("[Background] Triggering feedback for chamada:", chamadaId);
      try {
        const feedbackUrl = `${supabaseUrl}/functions/v1/feedback-chamada`;
        await fetch(feedbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ chamadaId }),
        });
        console.log("[Background] Feedback triggered successfully");
      } catch (e) {
        console.error("[Background] Feedback error:", e);
      }
    }

    console.log("[Background] Processing complete for chamada:", chamadaId);
  } catch (error) {
    console.error("[Background] Error:", error);
    // Update chamada with error status
    await supabase
      .from("crm_chamadas")
      .update({ status: "erro_transcricao" })
      .eq("id", chamadaId);
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
