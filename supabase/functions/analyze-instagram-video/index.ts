import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstagramMediaResponse {
  video_url?: string;
  thumbnail_url?: string;
  caption?: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  username?: string;
}

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

// Extract Instagram media using RapidAPI
async function extractInstagramMedia(url: string): Promise<InstagramMediaResponse | null> {
  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
  
  if (!RAPIDAPI_KEY) {
    console.error("RAPIDAPI_KEY não configurada");
    return null;
  }

  try {
    console.log("Extracting Instagram media from:", url);
    
    // Use the Instagram Scraper Stable API
    const response = await fetch("https://instagram-scraper-stable-api.p.rapidapi.com/get_content_by_url.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log("Instagram data received:", JSON.stringify(data).slice(0, 500));
    
    // Extract video URL from the response
    // The API returns different structures depending on the content type
    let videoUrl = null;
    let thumbnailUrl = null;
    let caption = null;
    
    // Check for video_versions array (common format)
    if (data.video_versions && data.video_versions.length > 0) {
      videoUrl = data.video_versions[0].url;
    } else if (data.video_url) {
      videoUrl = data.video_url;
    } else if (data.media?.video_versions?.[0]?.url) {
      videoUrl = data.media.video_versions[0].url;
    }
    
    // Get thumbnail
    if (data.thumbnail_url) {
      thumbnailUrl = data.thumbnail_url;
    } else if (data.image_versions2?.candidates?.[0]?.url) {
      thumbnailUrl = data.image_versions2.candidates[0].url;
    } else if (data.media?.image_versions2?.candidates?.[0]?.url) {
      thumbnailUrl = data.media.image_versions2.candidates[0].url;
    }
    
    // Get caption
    caption = data.caption?.text || data.caption || data.media?.caption?.text || null;

    return {
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      caption: caption,
      like_count: data.like_count || data.media?.like_count,
      comment_count: data.comment_count || data.media?.comment_count,
      view_count: data.view_count || data.play_count || data.media?.view_count || data.media?.play_count,
      username: data.user?.username || data.owner?.username || data.media?.user?.username,
    };
  } catch (error) {
    console.error("Error extracting Instagram media:", error);
    return null;
  }
}

// Download video and convert to audio for transcription
async function transcribeVideo(videoUrl: string): Promise<TranscriptionResult | null> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY não configurada");
    return null;
  }

  try {
    console.log("Downloading video from:", videoUrl.slice(0, 100));
    
    // Download the video file
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      console.error("Failed to download video:", videoResponse.status);
      return null;
    }
    
    const videoBlob = await videoResponse.blob();
    console.log("Video downloaded, size:", videoBlob.size, "bytes");
    
    // Send to ElevenLabs for transcription
    const formData = new FormData();
    formData.append("file", videoBlob, "video.mp4");
    formData.append("model_id", "scribe_v2");
    formData.append("diarize", "true");
    formData.append("tag_audio_events", "true");
    formData.append("language_code", "por");
    
    console.log("Sending to ElevenLabs for transcription...");
    
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
    console.error("Error transcribing video:", error);
    return null;
  }
}

// Extract frames from video for visual analysis
async function extractVideoFrames(videoUrl: string): Promise<string[]> {
  // For now, we'll use the thumbnail as the primary frame
  // In the future, we could use a service to extract multiple frames
  // We return the video URL and let Gemini handle it with vision
  return [videoUrl];
}

// Analyze video visually using Gemini Vision
async function analyzeVideoVisually(
  thumbnailUrl: string | undefined,
  caption: string | undefined,
  transcription: string | undefined
): Promise<VisualAnalysisResult | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY não configurada");
    return null;
  }

  try {
    const systemPrompt = `Você é um especialista em produção de vídeos para redes sociais. Analise o conteúdo fornecido (thumbnail do vídeo, legenda e transcrição) e descreva os aspectos visuais e de produção.

Responda APENAS com um objeto JSON válido no seguinte formato:

{
  "cenario": "Descrição do cenário/ambiente onde foi gravado (estúdio, escritório, ao ar livre, etc.)",
  "transicoes": "Análise das transições utilizadas (cortes secos, zoom, fade, etc.)",
  "enquadramento": "Tipo de enquadramento predominante (close, plano médio, plano geral, etc.)",
  "postura_apresentador": "Postura do apresentador (em pé, sentado, andando, gesticulando, etc.)",
  "elementos_visuais": "Elementos visuais adicionais (textos na tela, gráficos, emojis, legendas, etc.)",
  "ritmo_edicao": "Ritmo geral da edição (rápido, lento, dinâmico, pausado, etc.)"
}`;

    const userPrompt = `Analise este conteúdo de vídeo:

${caption ? `LEGENDA DO VÍDEO:
${caption}

` : ""}${transcription ? `TRANSCRIÇÃO DO ÁUDIO:
${transcription}

` : ""}Baseado no contexto acima e na thumbnail fornecida, descreva os aspectos visuais e de produção do vídeo. Se não houver thumbnail, infira com base na legenda e transcrição.

Responda APENAS com o JSON, sem texto adicional.`;

    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add user message with optional image
    if (thumbnailUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { 
            type: "image_url", 
            image_url: { url: thumbnailUrl } 
          },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: thumbnailUrl ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    // Parse JSON response
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error("Error analyzing video visually:", error);
    return null;
  }
}

// Generate final content modeling
async function generateContentModeling(
  instagramData: InstagramMediaResponse,
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

Você receberá informações detalhadas sobre um vídeo do Instagram (legenda, transcrição do áudio, análise visual) e deve gerar uma modelagem completa adaptada para os produtos jurídicos informados.

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
  "formato_sugerido": "video | video_longo | carrossel | estatico"
}`;

    let contextInfo = `DADOS DO VÍDEO INSTAGRAM:
- Autor: @${instagramData.username || "desconhecido"}
- Visualizações: ${instagramData.view_count?.toLocaleString() || "N/A"}
- Curtidas: ${instagramData.like_count?.toLocaleString() || "N/A"}
- Comentários: ${instagramData.comment_count?.toLocaleString() || "N/A"}

`;

    if (instagramData.caption) {
      contextInfo += `LEGENDA ORIGINAL:
${instagramData.caption}

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

    const userPrompt = `Analise o seguinte vídeo do Instagram e modele para os produtos jurídicos listados abaixo:

${contextInfo}
PRODUTOS JURÍDICOS PARA MODELAGEM:
${produtos}

Por favor, analise o conteúdo original e crie uma modelagem completa adaptada para os produtos jurídicos acima. Considere:
1. O público-alvo específico de cada produto
2. A linguagem apropriada para o setor jurídico
3. Os ganchos e estratégias que funcionam bem no nicho
4. As características técnicas de produção que tornam o conteúdo efetivo

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

    // Parse JSON response
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanContent);
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
    const body = await req.json();
    const { link, tipo, produtos, action } = body;

    // Action: extract - Just extract Instagram data for preview
    if (action === "extract") {
      console.log("Extracting Instagram data for preview...");
      
      const instagramData = await extractInstagramMedia(link);
      
      if (!instagramData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Não foi possível extrair dados do Instagram. Verifique se o link é válido." 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            title: instagramData.caption?.slice(0, 100) || null,
            description: instagramData.caption || null,
            author: instagramData.username ? `@${instagramData.username}` : null,
            markdown: instagramData.caption || null,
            hasScreenshot: !!instagramData.thumbnail_url,
            screenshot: instagramData.thumbnail_url || null,
            video_url: instagramData.video_url || null,
            metrics: {
              views: instagramData.view_count,
              likes: instagramData.like_count,
              comments: instagramData.comment_count,
            },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: analyze - Full analysis with transcription and visual analysis
    if (!link || !tipo || !produtos) {
      return new Response(
        JSON.stringify({ error: "Link, tipo e produtos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting full Instagram video analysis...");

    // Step 1: Extract Instagram data
    const instagramData = await extractInstagramMedia(link);
    
    if (!instagramData || !instagramData.video_url) {
      // Fall back to caption-only analysis
      console.log("No video URL found, falling back to caption-only analysis");
      
      // Use the original analyze-content function logic
      return new Response(
        JSON.stringify({ 
          error: "Não foi possível extrair o vídeo. Use a opção de entrada manual." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video URL found:", instagramData.video_url.slice(0, 100));

    // Step 2: Transcribe audio from video
    console.log("Starting transcription...");
    const transcription = await transcribeVideo(instagramData.video_url);
    console.log("Transcription complete:", transcription?.text?.slice(0, 200) || "No transcription");

    // Step 3: Analyze video visually
    console.log("Starting visual analysis...");
    const visualAnalysis = await analyzeVideoVisually(
      instagramData.thumbnail_url,
      instagramData.caption,
      transcription?.text
    );
    console.log("Visual analysis complete:", visualAnalysis ? "Success" : "Failed");

    // Step 4: Generate final content modeling
    console.log("Generating content modeling...");
    const result = await generateContentModeling(
      instagramData,
      transcription,
      visualAnalysis,
      produtos
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-instagram-video error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
