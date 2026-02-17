import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    let audioFile: File | Blob | null = null;
    let fileName = "audio.webm";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Direct file upload via formData
      const formData = await req.formData();
      audioFile = formData.get("audio") as File;
      if (audioFile && (audioFile as File).name) {
        fileName = (audioFile as File).name;
      }
    } else {
      // JSON body with storage reference
      const body = await req.json();
      const { audioUrl, bucketName } = body;

      if (!audioUrl || !bucketName) {
        throw new Error("audioUrl e bucketName são obrigatórios");
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log(`Downloading from bucket: ${bucketName}, path: ${audioUrl}`);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(audioUrl);

      if (error) {
        console.error("Storage download error:", JSON.stringify(error));
        throw new Error(`Erro ao baixar áudio do storage: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data) {
        throw new Error("Arquivo não encontrado no storage");
      }

      console.log(`Downloaded file size: ${data.size} bytes`);
      audioFile = data;
      fileName = audioUrl;
    }

    if (!audioFile) {
      throw new Error("Arquivo de áudio não enviado");
    }

    console.log(`Transcrevendo áudio: ${fileName}, tamanho: ${audioFile.size} bytes`);

    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append("file", audioFile, fileName);
    elevenLabsFormData.append("model_id", "scribe_v2");
    elevenLabsFormData.append("language_code", "por");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`Erro na API ElevenLabs: ${response.status}`);
    }

    const transcriptionResult = await response.json();
    const text = transcriptionResult.text || "";

    console.log("Transcrição concluída:", text.substring(0, 100));

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in transcribe-voice:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao transcrever áudio" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
