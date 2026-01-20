import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    // Create Supabase client with user's token
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Parse form data
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const titulo = formData.get("titulo") as string;
    const transcricaoId = formData.get("transcricao_id") as string;

    if (!audioFile) {
      throw new Error("Arquivo de áudio não enviado");
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update status to processing
    if (transcricaoId) {
      await supabaseAdmin
        .from("transcricoes")
        .update({ status: "processando" })
        .eq("id", transcricaoId);
    }

    console.log(`Iniciando transcrição para arquivo: ${audioFile.name}, tamanho: ${audioFile.size} bytes`);

    // Send to ElevenLabs Scribe API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append("file", audioFile);
    elevenLabsFormData.append("model_id", "scribe_v2");
    // IMPORTANT: num_speakers helps with diarization accuracy
    elevenLabsFormData.append("num_speakers", "10"); // Allow up to 10 speakers to be detected
    elevenLabsFormData.append("diarize", "true");
    elevenLabsFormData.append("tag_audio_events", "true");
    elevenLabsFormData.append("language_code", "por");

    console.log("Enviando para ElevenLabs com diarize=true e num_speakers=10");

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
      
      // Update status to error
      if (transcricaoId) {
        await supabaseAdmin
          .from("transcricoes")
          .update({ 
            status: "erro", 
            erro_mensagem: `Erro na API ElevenLabs: ${response.status}` 
          })
          .eq("id", transcricaoId);
      }
      
      throw new Error(`Erro na API ElevenLabs: ${response.status} - ${errorText}`);
    }

    const transcriptionResult = await response.json();
    console.log("Transcrição recebida com sucesso");
    
    // Log raw response structure for debugging
    console.log("Resposta contém 'words':", !!transcriptionResult.words);
    console.log("Quantidade de words:", transcriptionResult.words?.length || 0);
    if (transcriptionResult.words && transcriptionResult.words.length > 0) {
      console.log("Primeira word:", JSON.stringify(transcriptionResult.words[0]));
      console.log("Última word:", JSON.stringify(transcriptionResult.words[transcriptionResult.words.length - 1]));
    }
    
    // Check if response has utterances (alternative diarization format)
    if (transcriptionResult.utterances) {
      console.log("Resposta contém 'utterances':", transcriptionResult.utterances.length);
    }
    
    // Log speaker information for debugging
    const uniqueSpeakers = new Set<string>();
    if (transcriptionResult.words) {
      for (const word of transcriptionResult.words) {
        if (word.speaker) {
          uniqueSpeakers.add(word.speaker);
        }
      }
    }
    console.log(`Falantes únicos detectados nas words: ${uniqueSpeakers.size}`, Array.from(uniqueSpeakers));

    // Process the response to extract segments with speakers
    const segmentos = processTranscription(transcriptionResult);
    const textoCompleto = transcriptionResult.text || "";
    
    console.log(`Total de segmentos processados: ${segmentos.length}`);
    const uniqueProcessedSpeakers = [...new Set(segmentos.map(s => s.falante))];
    console.log(`Falantes nos segmentos: ${uniqueProcessedSpeakers.length}`, uniqueProcessedSpeakers);

    // Calculate duration from the last word's end time
    let duracaoSegundos = 0;
    if (transcriptionResult.words && transcriptionResult.words.length > 0) {
      const lastWord = transcriptionResult.words[transcriptionResult.words.length - 1];
      duracaoSegundos = Math.ceil(lastWord.end || 0);
    }

    // Update transcription record
    if (transcricaoId) {
      const { error: updateError } = await supabaseAdmin
        .from("transcricoes")
        .update({
          texto_completo: textoCompleto,
          segmentos: segmentos,
          duracao_segundos: duracaoSegundos,
          status: "concluido",
        })
        .eq("id", transcricaoId);

      if (updateError) {
        console.error("Error updating transcription:", updateError);
        throw new Error("Erro ao salvar transcrição");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        texto_completo: textoCompleto,
        segmentos: segmentos,
        duracao_segundos: duracaoSegundos,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in transcribe-audio:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar transcrição";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

interface Word {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

interface Segment {
  falante: string;
  texto: string;
  inicio: number;
  fim: number;
}

function processTranscription(result: { words?: Word[]; text?: string }): Segment[] {
  if (!result.words || result.words.length === 0) {
    return [];
  }

  const segments: Segment[] = [];
  let currentSpeaker = result.words[0].speaker || "Falante 1";
  let currentText = "";
  let segmentStart = result.words[0].start;
  let segmentEnd = result.words[0].end;

  for (const word of result.words) {
    const speaker = word.speaker || "Falante 1";
    
    if (speaker !== currentSpeaker) {
      // Save current segment
      if (currentText.trim()) {
        segments.push({
          falante: formatSpeakerName(currentSpeaker),
          texto: currentText.trim(),
          inicio: segmentStart,
          fim: segmentEnd,
        });
      }
      
      // Start new segment
      currentSpeaker = speaker;
      currentText = word.text;
      segmentStart = word.start;
      segmentEnd = word.end;
    } else {
      currentText += " " + word.text;
      segmentEnd = word.end;
    }
  }

  // Add last segment
  if (currentText.trim()) {
    segments.push({
      falante: formatSpeakerName(currentSpeaker),
      texto: currentText.trim(),
      inicio: segmentStart,
      fim: segmentEnd,
    });
  }

  return segments;
}

function formatSpeakerName(speaker: string): string {
  // Convert speaker_0, speaker_1 to Falante 1, Falante 2
  if (speaker.startsWith("speaker_")) {
    const num = parseInt(speaker.replace("speaker_", "")) + 1;
    return `Falante ${num}`;
  }
  return speaker;
}
