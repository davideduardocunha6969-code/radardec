import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function extractReelsVideoPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/reels-videos/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const path = parsed.pathname.slice(idx + marker.length);
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

function toAbsoluteSignedUrl(signedUrl: string): string {
  if (signedUrl.startsWith("http://") || signedUrl.startsWith("https://")) return signedUrl;
  return `${SUPABASE_URL}${signedUrl}`;
}

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ─── Submit render job to Creatomate ───
    if (action === "render") {
      const { apiKey, variacaoId } = body;
      let hook_url = body.hook_url ?? body.hookUrl;
      let corpo_url = body.corpo_url ?? body.corpoUrl;
      let cta_url = body.cta_url ?? body.ctaUrl;

      console.log("=== CREATOMATE RENDER REQUEST ===");
      console.log("hook_url:", hook_url);
      console.log("corpo_url:", corpo_url);
      console.log("cta_url:", cta_url);
      console.log("variacaoId:", variacaoId);

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API Key do Creatomate não configurada" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!hook_url || !corpo_url || !cta_url) {
        console.error("Missing URLs - hook:", !!hook_url, "corpo:", !!corpo_url, "cta:", !!cta_url);
        return new Response(
          JSON.stringify({ error: "URLs dos vídeos são obrigatórias", hook_url, corpo_url, cta_url }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Ensure bucket exists and resolve URL strategy
      let bucketIsPublic = true;
      const { data: bucketData, error: bucketError } = await adminSupabase.storage.getBucket("reels-videos");

      if (bucketError || !bucketData) {
        console.warn("Bucket reels-videos não encontrado. Criando bucket público...");
        const { error: createBucketError } = await adminSupabase.storage.createBucket("reels-videos", {
          public: true,
          fileSizeLimit: "500MB",
        });
        if (createBucketError) {
          console.error("Erro ao criar bucket reels-videos:", createBucketError.message);
          return new Response(
            JSON.stringify({ error: `Erro ao criar bucket reels-videos: ${createBucketError.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        bucketIsPublic = !!bucketData.public;
      }

      // If bucket is private, fallback to signed URLs (1h)
      if (!bucketIsPublic) {
        console.log("Bucket reels-videos é privado. Gerando signed URLs...");

        const hookPath = extractReelsVideoPath(hook_url);
        const corpoPath = extractReelsVideoPath(corpo_url);
        const ctaPath = extractReelsVideoPath(cta_url);

        if (!hookPath || !corpoPath || !ctaPath) {
          return new Response(
            JSON.stringify({ error: "Não foi possível extrair path dos vídeos para assinar URLs." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const [hookSigned, corpoSigned, ctaSigned] = await Promise.all([
          adminSupabase.storage.from("reels-videos").createSignedUrl(hookPath, 3600),
          adminSupabase.storage.from("reels-videos").createSignedUrl(corpoPath, 3600),
          adminSupabase.storage.from("reels-videos").createSignedUrl(ctaPath, 3600),
        ]);

        if (hookSigned.error || corpoSigned.error || ctaSigned.error) {
          return new Response(
            JSON.stringify({
              error: "Erro ao gerar signed URLs para o Creatomate",
              details: {
                hook: hookSigned.error?.message,
                corpo: corpoSigned.error?.message,
                cta: ctaSigned.error?.message,
              },
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        hook_url = toAbsoluteSignedUrl(hookSigned.data.signedUrl);
        corpo_url = toAbsoluteSignedUrl(corpoSigned.data.signedUrl);
        cta_url = toAbsoluteSignedUrl(ctaSigned.data.signedUrl);

        console.log("Signed hook_url:", hook_url);
        console.log("Signed corpo_url:", corpo_url);
        console.log("Signed cta_url:", cta_url);
      }

      const requestBody = {
        template_id: "433aa2ca-f109-4256-be02-e21efe6f855b",
        modifications: {
          hook: hook_url,
          corpo: corpo_url,
          cta: cta_url,
        },
      };

      console.log("=== CREATOMATE FINAL REQUEST BODY ===");
      console.log(JSON.stringify(requestBody, null, 2));

      const creatomateRes = await fetch("https://api.creatomate.com/v2/renders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await creatomateRes.text();
      console.log("Creatomate response status:", creatomateRes.status);
      console.log("Creatomate response body:", responseText);

      if (!creatomateRes.ok) {
        return new Response(
          JSON.stringify({ error: `Erro Creatomate: ${creatomateRes.status}`, details: responseText }),
          { status: creatomateRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const renderData = JSON.parse(responseText);
      const renderId = Array.isArray(renderData) ? renderData[0]?.id : renderData?.id;

      console.log("Render ID:", renderId);

      if (variacaoId && renderId) {
        await supabase
          .from("reels_variacoes")
          .update({ render_id: renderId, status: "Renderizando" })
          .eq("id", variacaoId);
      }

      return new Response(JSON.stringify({ success: true, renderId, renderData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

      console.log("Status check - renderId:", renderId, "status:", status, "videoUrl:", videoUrl);

      if (variacaoId) {
        if (status === "succeeded") {
          await supabase.from("reels_variacoes").update({ status: "Pronto", video_url: videoUrl }).eq("id", variacaoId);
        } else if (status === "failed") {
          await supabase
            .from("reels_variacoes")
            .update({ status: "Erro", erro: statusData.error_message || "Erro na renderização" })
            .eq("id", variacaoId);
        }
      }

      return new Response(JSON.stringify({ status, videoUrl, renderData: statusData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
