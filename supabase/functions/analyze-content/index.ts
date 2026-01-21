import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function scrapeContent(url: string): Promise<{ markdown: string; metadata: any; screenshot?: string } | null> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY não configurada, usando apenas o link");
    return null;
  }

  try {
    console.log("Scraping URL with Firecrawl:", url);
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown", "screenshot"],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl error:", data);
      return null;
    }

    console.log("Firecrawl scrape successful");
    return {
      markdown: data.data?.markdown || data.markdown || "",
      metadata: data.data?.metadata || data.metadata || {},
      screenshot: data.data?.screenshot || data.screenshot,
    };
  } catch (error) {
    console.error("Error scraping with Firecrawl:", error);
    return null;
  }
}

// Endpoint for scraping only (preview)
async function handleScrapeOnly(url: string) {
  const scrapedContent = await scrapeContent(url);
  
  if (!scrapedContent) {
    return {
      success: false,
      error: "Não foi possível extrair o conteúdo do link",
    };
  }

  return {
    success: true,
    data: {
      title: scrapedContent.metadata?.title || null,
      description: scrapedContent.metadata?.description || null,
      author: scrapedContent.metadata?.author || null,
      markdown: scrapedContent.markdown?.slice(0, 2000) || null, // Limit for preview
      hasScreenshot: !!scrapedContent.screenshot,
      screenshot: scrapedContent.screenshot ? `data:image/png;base64,${scrapedContent.screenshot}` : null,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Check if it's a scrape-only request (preview)
    if (body.action === "scrape") {
      const result = await handleScrapeOnly(body.link);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Original analyze logic
    const { link, tipo, produtos } = body;

    if (!link || !tipo || !produtos) {
      return new Response(
        JSON.stringify({ error: "Link, tipo e produtos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Scrape the content from the link
    const scrapedContent = await scrapeContent(link);
    
    const tipoLabel = tipo === "video" ? "vídeo" : tipo === "blog_post" ? "blog post" : "publicação";

    // Build context from scraped content
    let contentContext = "";
    if (scrapedContent) {
      contentContext = `
CONTEÚDO EXTRAÍDO DA PÁGINA:
${scrapedContent.markdown}

METADADOS:
- Título: ${scrapedContent.metadata?.title || "N/A"}
- Descrição: ${scrapedContent.metadata?.description || "N/A"}
- Autor: ${scrapedContent.metadata?.author || "N/A"}
`;
      if (scrapedContent.screenshot) {
        contentContext += "\n(Screenshot da página disponível para análise visual)";
      }
    } else {
      contentContext = `
NOTA: Não foi possível extrair o conteúdo diretamente do link. Analise com base no URL fornecido e seu conhecimento sobre o formato típico de conteúdos nesta plataforma.
`;
    }

    const systemPrompt = `Você é um especialista em marketing de conteúdo jurídico e análise de conteúdos virais. Sua tarefa é analisar conteúdos de concorrentes e influenciadores e adaptá-los para escritórios de advocacia.

Você receberá o conteúdo extraído de uma página (legenda, descrição, metadados) e deve gerar uma modelagem completa adaptada para os produtos jurídicos informados.

IMPORTANTE: Responda APENAS com um objeto JSON válido, sem texto adicional antes ou depois. Use o seguinte formato exato:

{
  "gancho_original": "O gancho/hook utilizado no conteúdo original (extraído da legenda/descrição)",
  "analise_estrategia": "Análise detalhada da estratégia de conteúdo utilizada",
  "analise_performance": "Análise dos motivos pelos quais o conteúdo performou bem",
  "legenda_original": "A legenda ou descrição completa do conteúdo original",
  "analise_filmagem": "Análise das características de filmagem e edição sugeridas pelo conteúdo",
  "titulo_sugerido": "Título sugerido para a nova postagem adaptada",
  "copy_completa": "Roteiro/copy completa do conteúdo a ser produzido",
  "orientacoes_filmagem": "Orientações detalhadas de como produzir o conteúdo",
  "formato_sugerido": "video | video_longo | carrossel | estatico"
}`;

    const userPrompt = `Analise o seguinte ${tipoLabel} e modele para os produtos jurídicos listados abaixo:

LINK DO CONTEÚDO: ${link}

${contentContext}

PRODUTOS JURÍDICOS PARA MODELAGEM:
${produtos}

Por favor, analise o conteúdo original e crie uma modelagem completa adaptada para os produtos jurídicos acima. Considere:
1. O público-alvo específico de cada produto
2. A linguagem apropriada para o setor jurídico
3. Os ganchos e estratégias que funcionam bem no nicho
4. As características técnicas de produção que tornam o conteúdo efetivo

Responda APENAS com o JSON, sem markdown ou texto adicional.`;

    // Use vision model if screenshot is available
    const model = scrapedContent?.screenshot 
      ? "google/gemini-2.5-flash" 
      : "google/gemini-3-flash-preview";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add user message with optional image
    if (scrapedContent?.screenshot) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { 
            type: "image_url", 
            image_url: { 
              url: `data:image/png;base64,${scrapedContent.screenshot}` 
            } 
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
        model,
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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

    // Parse the JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Erro ao processar resposta da IA");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
