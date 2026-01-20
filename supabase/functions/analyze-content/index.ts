import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { link, tipo, produtos } = await req.json();

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

    const tipoLabel = tipo === "video" ? "vídeo" : tipo === "blog_post" ? "blog post" : "publicação";

    const systemPrompt = `Você é um especialista em marketing de conteúdo jurídico e análise de conteúdos virais. Sua tarefa é analisar conteúdos de concorrentes e influenciadores e adaptá-los para escritórios de advocacia.

Você deve analisar o conteúdo do link fornecido e gerar uma modelagem completa adaptada para os produtos jurídicos informados.

IMPORTANTE: Responda APENAS com um objeto JSON válido, sem texto adicional antes ou depois. Use o seguinte formato exato:

{
  "gancho_original": "O gancho/hook utilizado no conteúdo original",
  "analise_estrategia": "Análise detalhada da estratégia de conteúdo utilizada",
  "analise_performance": "Análise dos motivos pelos quais o conteúdo performou bem",
  "legenda_original": "A legenda ou descrição do conteúdo original (se disponível)",
  "analise_filmagem": "Análise das características de filmagem e edição (para vídeos)",
  "titulo_sugerido": "Título sugerido para a nova postagem adaptada",
  "copy_completa": "Roteiro/copy completa do conteúdo a ser produzido",
  "orientacoes_filmagem": "Orientações detalhadas de como produzir o conteúdo",
  "formato_sugerido": "video | video_longo | carrossel | estatico"
}`;

    const userPrompt = `Analise o seguinte ${tipoLabel} e modele para os produtos jurídicos listados abaixo:

LINK DO CONTEÚDO: ${link}

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
