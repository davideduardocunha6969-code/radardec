import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ─── Submit render job to Creatomate ───
    if (action === "render") {
      const { apiKey, hookUrl, corpoUrl, ctaUrl, variacaoId } = body;

      console.log("=== CREATOMATE RENDER REQUEST ===");
      console.log("hookUrl:", hookUrl);
      console.log("corpoUrl:", corpoUrl);
      console.log("ctaUrl:", ctaUrl);
      console.log("variacaoId:", variacaoId);

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API Key do Creatomate não configurada" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate URLs
      if (!hookUrl || !corpoUrl || !ctaUrl) {
        console.error("Missing URLs - hook:", !!hookUrl, "corpo:", !!corpoUrl, "cta:", !!ctaUrl);
        return new Response(
          JSON.stringify({ error: "URLs dos vídeos são obrigatórias", hookUrl, corpoUrl, ctaUrl }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const creatomateRes = await fetch("https://api.creatomate.com/v2/renders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: "433aa2ca-f109-4256-be02-e21efe6f855b",
          modifications: {
            "hook": hookUrl,
            "corpo": corpoUrl,
            "cta": ctaUrl,
          },
        }),
      });

      if (!creatomateRes.ok) {
        const errText = await creatomateRes.text();
        console.error("Creatomate error:", errText);
        return new Response(
          JSON.stringify({ error: `Erro Creatomate: ${creatomateRes.status}`, details: errText }),
          { status: creatomateRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const renderData = await creatomateRes.json();
      const renderId = Array.isArray(renderData) ? renderData[0]?.id : renderData?.id;

      // Update variation with render_id
      if (variacaoId && renderId) {
        await supabase
          .from("reels_variacoes")
          .update({ render_id: renderId, status: "Renderizando" })
          .eq("id", variacaoId);
      }

      return new Response(
        JSON.stringify({ success: true, renderId, renderData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Check render status ───
    if (action === "check-status") {
      const { apiKey, renderId, variacaoId } = body;

      if (!apiKey || !renderId) {
        return new Response(
          JSON.stringify({ error: "Missing apiKey or renderId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const statusRes = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        return new Response(
          JSON.stringify({ error: `Erro ao verificar status: ${statusRes.status}`, details: errText }),
          { status: statusRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const statusData = await statusRes.json();
      const status = statusData.status;
      const videoUrl = statusData.output?.[0]?.url || statusData.url;

      // Update DB based on status
      if (variacaoId) {
        if (status === "succeeded") {
          await supabase
            .from("reels_variacoes")
            .update({ status: "Pronto", video_url: videoUrl })
            .eq("id", variacaoId);
        } else if (status === "failed") {
          await supabase
            .from("reels_variacoes")
            .update({ status: "Pendente", erro: statusData.error_message || "Erro na renderização" })
            .eq("id", variacaoId);
        }
      }

      return new Response(
        JSON.stringify({ status, videoUrl, renderData: statusData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
