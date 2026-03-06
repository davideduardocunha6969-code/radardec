import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SocialMediaResponse {
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

function detectPlatform(url: string): "instagram" | "tiktok" {
  try {
    const host = new URL(url).hostname;
    if (host.includes("tiktok")) return "tiktok";
  } catch {
    // fallback
  }
  return "instagram";
}

function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/\/(reel|p)\/([^\/\?]+)/);
  return match ? match[2] : null;
}

async function extractSocialMedia(url: string): Promise<SocialMediaResponse | null> {
  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");

  if (!RAPIDAPI_KEY) {
    console.error("RAPIDAPI_KEY não configurada");
    return null;
  }

  try {
    const platform = detectPlatform(url);
    console.log(`Extracting ${platform} media from:`, url);

    let endpoint: string;
    if (platform === "tiktok") {
      endpoint = `https://social-media-video-downloader.p.rapidapi.com/tiktok/v3/post/details?url=${encodeURIComponent(url)}`;
    } else {
      const shortcode = extractInstagramShortcode(url);
      if (!shortcode) {
        console.error("Could not extract Instagram shortcode from URL:", url);
        return null;
      }
      endpoint = `https://social-media-video-downloader.p.rapidapi.com/instagram/v3/media/post/details?shortcode=${shortcode}`;
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.error("API returned error:", data.error);
      return null;
    }

    if (platform === "tiktok") {
      return parseTikTokResponse(data);
    }
    return parseInstagramResponse(data);
  } catch (error) {
    console.error("Error extracting social media:", error);
    return null;
  }
}

function parseInstagramResponse(data: any): SocialMediaResponse {
  const videoUrl = data.contents?.[0]?.videos?.[0]?.url || null;
  const extra = data.additionalData || {};
  const captionEdges = extra.edge_media_to_caption?.edges || [];
  const caption = captionEdges[0]?.node?.text || extra.accessibility_caption || null;
  return {
    video_url: videoUrl,
    thumbnail_url: extra.thumbnail_src || extra.display_url || null,
    caption: caption,
    like_count: extra.edge_media_preview_like?.count || null,
    comment_count: extra.edge_media_to_comment?.count || null,
    view_count: extra.video_view_count || null,
    username: extra.username || null,
  };
}

function parseTikTokResponse(data: any): SocialMediaResponse {
  const videoUrl = data.contents?.[0]?.videos?.[0]?.url || null;
  const item = data.itemInfo?.itemStruct || {};

  return {
    video_url: videoUrl,
    thumbnail_url: item.video?.cover || null,
    caption: item.desc || null,
    like_count: item.stats?.diggCount,
    comment_count: item.stats?.commentCount,
    view_count: item.stats?.playCount,
    username: item.author?.uniqueId,
  };
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

    const videoResponse = await fetch(videoUrl, {
      headers: {
        "Referer": "https://www.instagram.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!videoResponse.ok) {
      console.error("Failed to download video:", videoResponse.status);
      return null;
    }

    const videoBlob = await videoResponse.blob();
    console.log("Video downloaded, size:", videoBlob.size, "bytes");

    if (videoBlob.size < 1000) {
      console.error("Video file too small, likely blocked:", videoBlob.size);
      return null;
    }

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

// Fallback: use Gemini Vision to transcribe video directly from URL
async function transcribeVideoWithGemini(videoUrl: string): Promise<TranscriptionResult | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY não configurada");
    return null;
  }

  try {
    console.log("Attempting Gemini Vision fallback transcription...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um transcritor profissional. Transcreva o áudio do vídeo fornecido na íntegra, em português. Retorne APENAS a transcrição, sem comentários adicionais.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcreva todo o áudio deste vídeo em português. Retorne apenas o texto transcrito." },
              { type: "video_url", video_url: { url: videoUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Vision fallback error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content || content.trim().length < 10) {
      console.error("Gemini Vision returned empty or too short transcription");
      return null;
    }

    console.log("Gemini Vision transcription received, length:", content.length);
    return { text: content.trim() };
  } catch (error) {
    console.error("Error in Gemini Vision fallback:", error);
    return null;
  }
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

${caption ? `LEGENDA DO VÍDEO:\n${caption}\n\n` : ""}${transcription ? `TRANSCRIÇÃO DO ÁUDIO:\n${transcription}\n\n` : ""}Baseado no contexto acima e na thumbnail fornecida, descreva os aspectos visuais e de produção do vídeo. Se não houver thumbnail, infira com base na legenda e transcrição.

Responda APENAS com o JSON, sem texto adicional.`;

    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "system", content: systemPrompt },
    ];

    if (thumbnailUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: thumbnailUrl } },
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

    if (!content) return null;

    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error("Error analyzing video visually:", error);
    return null;
  }
}

// Generate final content modeling
async function generateContentModeling(
  socialData: SocialMediaResponse,
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

Você receberá informações detalhadas sobre um vídeo de rede social (legenda, transcrição do áudio, análise visual) e deve gerar uma modelagem completa adaptada para os produtos jurídicos informados.

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
}

IMPORTANTE: Inclua também estes campos adicionais com os dados brutos da análise:
- transcricao_audio: A transcrição completa do áudio do vídeo (copie exatamente o que foi transcrito)
- analise_visual_detalhada: Objeto com os detalhes visuais (cenario, transicoes, enquadramento, postura_apresentador, elementos_visuais, ritmo_edicao)`;

    let contextInfo = `DADOS DO VÍDEO:
- Autor: @${socialData.username || "desconhecido"}
- Visualizações: ${socialData.view_count?.toLocaleString() || "N/A"}
- Curtidas: ${socialData.like_count?.toLocaleString() || "N/A"}
- Comentários: ${socialData.comment_count?.toLocaleString() || "N/A"}

`;

    if (socialData.caption) {
      contextInfo += `LEGENDA ORIGINAL:\n${socialData.caption}\n\n`;
    }

    if (transcription?.text) {
      contextInfo += `TRANSCRIÇÃO DO ÁUDIO:\n${transcription.text}\n\n`;
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

    const userPrompt = `Analise o seguinte vídeo de rede social e modele para os produtos jurídicos listados abaixo:

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

    // Action: extract - Just extract social media data for preview
    if (action === "extract") {
      console.log("Extracting social media data for preview...");

      const socialData = await extractSocialMedia(link);

      if (!socialData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Não foi possível extrair dados do Instagram/TikTok. Verifique se o link é válido.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            title: socialData.caption?.slice(0, 100) || null,
            description: socialData.caption || null,
            author: socialData.username ? `@${socialData.username}` : null,
            markdown: socialData.caption || null,
            hasScreenshot: !!socialData.thumbnail_url,
            screenshot: socialData.thumbnail_url || null,
            video_url: socialData.video_url || null,
            metrics: {
              views: socialData.view_count,
              likes: socialData.like_count,
              comments: socialData.comment_count,
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

    console.log("Starting full social media video analysis...");

    // Step 1: Extract social media data
    const socialData = await extractSocialMedia(link);

    if (!socialData || !socialData.video_url) {
      console.log("No video URL found, falling back to caption-only analysis");
      return new Response(
        JSON.stringify({
          error: "Não foi possível extrair o vídeo. Use a opção de entrada manual.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video URL found:", socialData.video_url.slice(0, 100));

    // Step 2: Transcribe audio from video
    console.log("Starting transcription...");
    let transcription = await transcribeVideo(socialData.video_url);
    console.log("Transcription complete:", transcription?.text?.slice(0, 200) || "No transcription");

    // Step 2b: Fallback - try Gemini Vision if ElevenLabs transcription failed
    if (!transcription) {
      console.log("ElevenLabs transcription failed, trying Gemini Vision fallback...");
      transcription = await transcribeVideoWithGemini(socialData.video_url);
      console.log("Gemini fallback result:", transcription?.text?.slice(0, 200) || "Also failed");
    }

    // Step 2c: If both failed, return error instead of generic analysis
    if (!transcription) {
      return new Response(
        JSON.stringify({
          error: "Não foi possível transcrever o vídeo. O link pode ter expirado ou o vídeo está protegido.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Analyze video visually
    console.log("Starting visual analysis...");
    const visualAnalysis = await analyzeVideoVisually(
      socialData.thumbnail_url,
      socialData.caption,
      transcription?.text
    );
    console.log("Visual analysis complete:", visualAnalysis ? "Success" : "Failed");

    // Step 4: Generate final content modeling
    console.log("Generating content modeling...");
    const modelingResult = await generateContentModeling(
      socialData,
      transcription,
      visualAnalysis,
      produtos
    );

    const result = {
      ...modelingResult,
      transcricao_audio: transcription?.text || null,
      analise_visual_detalhada: visualAnalysis || null,
    };

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
