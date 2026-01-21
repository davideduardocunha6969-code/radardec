import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscriptionResult {
  text: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    speaker_id?: string;
  }>;
}

interface VisualAnalysisResult {
  cenario: string;
  transicoes: string;
  enquadramento: string;
  postura_apresentador: string;
  elementos_visuais: string;
  ritmo_edicao: string;
}

// Transcribe audio using ElevenLabs
async function transcribeAudio(audioData: Uint8Array, fileName: string): Promise<TranscriptionResult | null> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY não configurada");
    return null;
  }

  try {
    console.log("Sending to ElevenLabs for transcription, size:", audioData.length, "bytes");
    
    // Determine content type based on file extension
    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    const contentType = ext === 'mp3' ? 'audio/mpeg' : 
                        ext === 'wav' ? 'audio/wav' :
                        ext === 'webm' ? 'video/webm' :
                        ext === 'mov' ? 'video/quicktime' :
                        'video/mp4';
    
    const formData = new FormData();
    const blob = new Blob([audioData.buffer as ArrayBuffer], { type: contentType });
    formData.append("file", blob, fileName);
    formData.append("model_id", "scribe_v2");
    formData.append("diarize", "true");
    formData.append("tag_audio_events", "true");
    formData.append("language_code", "por");
    
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      return null;
    }

    const result = await response.json();
    console.log("Transcription received, length:", result.text?.length || 0);
    
    return {
      text: result.text || "",
      words: result.words,
    };
  } catch (error) {
    console.error("Error transcribing:", error);
    return null;
  }
}

// Analyze video visually using Gemini Vision with video
async function analyzeVideoVisually(
  videoData: Uint8Array,
  fileName: string,
  caption: string | undefined,
  transcription: string | undefined
): Promise<VisualAnalysisResult | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY não configurada");
    return null;
  }

  try {
    // Convert video to base64 for Gemini
    const base64Video = btoa(String.fromCharCode(...videoData));
    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    const mimeType = ext === 'webm' ? 'video/webm' :
                     ext === 'mov' ? 'video/quicktime' :
                     'video/mp4';

    const systemPrompt = `Você é um especialista em produção de vídeos para redes sociais. Analise o vídeo fornecido e descreva os aspectos visuais e de produção.

Responda APENAS com um objeto JSON válido no seguinte formato:

{
  "cenario": "Descrição do cenário/ambiente onde foi gravado (estúdio, escritório, ao ar livre, etc.)",
  "transicoes": "Análise das transições utilizadas (cortes secos, zoom, fade, etc.)",
  "enquadramento": "Tipo de enquadramento predominante (close, plano médio, plano geral, etc.)",
  "postura_apresentador": "Postura do apresentador (em pé, sentado, andando, gesticulando, etc.)",
  "elementos_visuais": "Elementos visuais adicionais (textos na tela, gráficos, emojis, legendas, etc.)",
  "ritmo_edicao": "Ritmo geral da edição (rápido, lento, dinâmico, pausado, etc.)"
}`;

    const userPrompt = `Analise este vídeo:

${caption ? `LEGENDA DO VÍDEO:
${caption}

` : ""}${transcription ? `TRANSCRIÇÃO DO ÁUDIO:
${transcription}

` : ""}Descreva os aspectos visuais e de produção do vídeo com base no que você vê.

Responda APENAS com o JSON, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:${mimeType};base64,${base64Video}` 
                } 
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error for visual analysis:", response.status, errorText);
      // Fallback: analyze without video
      return await analyzeWithoutVideo(caption, transcription);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error("Error analyzing video visually:", error);
    // Fallback: analyze without video
    return await analyzeWithoutVideo(caption, transcription);
  }
}

// Fallback visual analysis without video (just from caption and transcription)
async function analyzeWithoutVideo(
  caption: string | undefined,
  transcription: string | undefined
): Promise<VisualAnalysisResult | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) return null;

  try {
    const systemPrompt = `Você é um especialista em produção de vídeos para redes sociais. Baseado na legenda e transcrição fornecidas, INFIRA os aspectos visuais e de produção que provavelmente foram utilizados.

Responda APENAS com um objeto JSON válido no seguinte formato:

{
  "cenario": "Descrição provável do cenário/ambiente (infira baseado no contexto)",
  "transicoes": "Transições prováveis baseado no estilo do conteúdo",
  "enquadramento": "Enquadramento provável",
  "postura_apresentador": "Postura provável do apresentador",
  "elementos_visuais": "Elementos visuais prováveis",
  "ritmo_edicao": "Ritmo provável da edição"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `LEGENDA: ${caption || "Não disponível"}\n\nTRANSCRIÇÃO: ${transcription || "Não disponível"}\n\nInfira os aspectos visuais. Responda APENAS com JSON.` 
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanContent);
  } catch {
    return null;
  }
}

// Generate final content modeling
async function generateContentModeling(
  caption: string | undefined,
  transcription: TranscriptionResult | null,
  visualAnalysis: VisualAnalysisResult | null,
  produtos: string
): Promise<object | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY não configurada");
    return null;
  }

  try {
    const systemPrompt = `Você é um especialista em marketing de conteúdo jurídico e análise de conteúdos virais. Sua tarefa é analisar conteúdos de concorrentes e influenciadores e adaptá-los para escritórios de advocacia.

Você receberá informações detalhadas sobre um vídeo (legenda, transcrição do áudio, análise visual) e deve gerar uma modelagem completa adaptada para os produtos jurídicos informados.

IMPORTANTE: Responda APENAS com um objeto JSON válido, sem texto adicional. Use o seguinte formato:

{
  "gancho_original": "O gancho/hook utilizado no conteúdo original (primeiros segundos)",
  "analise_estrategia": "Análise detalhada da estratégia de conteúdo utilizada",
  "analise_performance": "Análise dos motivos pelos quais o conteúdo performou bem",
  "legenda_original": "A legenda completa do conteúdo original",
  "analise_filmagem": "Análise detalhada de como o vídeo foi filmado, editado, cenário, postura, etc.",
  "titulo_sugerido": "Título sugerido para a nova postagem adaptada",
  "copy_completa": "Roteiro/copy completa do conteúdo a ser produzido",
  "orientacoes_filmagem": "Orientações detalhadas de como produzir o conteúdo (cenário, postura, edição, etc.)",
  "formato_sugerido": "video | video_longo | carrossel | estatico",
  "transcricao_audio": "A transcrição completa do áudio (copie exatamente)",
  "analise_visual_detalhada": {
    "cenario": "...",
    "transicoes": "...",
    "enquadramento": "...",
    "postura_apresentador": "...",
    "elementos_visuais": "...",
    "ritmo_edicao": "..."
  }
}`;

    let contextInfo = `DADOS DO VÍDEO:

`;

    if (caption) {
      contextInfo += `LEGENDA ORIGINAL:
${caption}

`;
    }

    if (transcription?.text) {
      contextInfo += `TRANSCRIÇÃO DO ÁUDIO:
${transcription.text}

`;
    }

    if (visualAnalysis) {
      contextInfo += `ANÁLISE VISUAL DO VÍDEO:
- Cenário: ${visualAnalysis.cenario}
- Transições: ${visualAnalysis.transicoes}
- Enquadramento: ${visualAnalysis.enquadramento}
- Postura do Apresentador: ${visualAnalysis.postura_apresentador}
- Elementos Visuais: ${visualAnalysis.elementos_visuais}
- Ritmo de Edição: ${visualAnalysis.ritmo_edicao}

`;
    }

    const userPrompt = `Analise o seguinte vídeo e modele para os produtos jurídicos listados abaixo:

${contextInfo}
PRODUTOS JURÍDICOS PARA MODELAGEM:
${produtos}

Por favor, analise o conteúdo original e crie uma modelagem completa adaptada para os produtos jurídicos acima. Considere:
1. O público-alvo específico de cada produto
2. A linguagem apropriada para o setor jurídico
3. Os ganchos e estratégias que funcionam bem no nicho
4. As características técnicas de produção que tornam o conteúdo efetivo

IMPORTANTE: Mantenha a transcrição exata do áudio no campo "transcricao_audio" e os detalhes visuais em "analise_visual_detalhada".

Responda APENAS com o JSON, sem markdown ou texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes.");
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Erro ao processar análise de conteúdo");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleanContent);

    // Ensure transcription and visual analysis are in the result
    if (transcription?.text && !result.transcricao_audio) {
      result.transcricao_audio = transcription.text;
    }
    if (visualAnalysis && !result.analise_visual_detalhada) {
      result.analise_visual_detalhada = visualAnalysis;
    }

    return result;
  } catch (error) {
    console.error("Error generating content modeling:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Content-Type deve ser multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const caption = formData.get("caption") as string | null;
    const produtos = formData.get("produtos") as string | null;

    if (!videoFile) {
      return new Response(
        JSON.stringify({ error: "Arquivo de vídeo é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!produtos) {
      return new Response(
        JSON.stringify({ error: "Produtos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received video upload:", videoFile.name, "size:", videoFile.size, "bytes");
    console.log("Caption provided:", caption ? "Yes" : "No");

    // Read video data
    const videoData = new Uint8Array(await videoFile.arrayBuffer());
    console.log("Video data read, size:", videoData.length, "bytes");

    // Step 1: Transcribe audio
    console.log("Starting transcription...");
    const transcription = await transcribeAudio(videoData, videoFile.name);
    console.log("Transcription complete:", transcription?.text?.slice(0, 200) || "No transcription");

    // Step 2: Analyze video visually
    console.log("Starting visual analysis...");
    let visualAnalysis: VisualAnalysisResult | null = null;
    
    // Only send video to Gemini if it's small enough (< 20MB for base64)
    if (videoData.length < 15 * 1024 * 1024) {
      visualAnalysis = await analyzeVideoVisually(videoData, videoFile.name, caption || undefined, transcription?.text);
    } else {
      console.log("Video too large for visual analysis, using fallback");
      visualAnalysis = await analyzeWithoutVideo(caption || undefined, transcription?.text);
    }
    console.log("Visual analysis complete:", visualAnalysis ? "Success" : "Failed");

    // Step 3: Generate content modeling
    console.log("Generating content modeling...");
    const result = await generateContentModeling(
      caption || undefined,
      transcription,
      visualAnalysis,
      produtos
    );

    if (!result) {
      throw new Error("Falha ao gerar modelagem");
    }

    console.log("Content modeling complete!");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-video-upload error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
