 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 
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
 
     const formData = await req.formData();
     const audioFile = formData.get("audio") as File;
 
     if (!audioFile) {
       throw new Error("Arquivo de áudio não enviado");
     }
 
     console.log(`Transcrevendo áudio: ${audioFile.name}, tamanho: ${audioFile.size} bytes`);
 
     // Send to ElevenLabs Scribe API
     const elevenLabsFormData = new FormData();
     elevenLabsFormData.append("file", audioFile);
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