import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Body recebido:", JSON.stringify(body));

    const { action, apiKey, renderId, hookUrl, corpoUrl, ctaUrl, variationId } = body;

    if (action === "render") {
      console.log("URLs recebidas:", { hookUrl, corpoUrl, ctaUrl });

      if (!hookUrl || !corpoUrl || !ctaUrl) {
        throw new Error(`URLs faltando: hook=${hookUrl}, corpo=${corpoUrl}, cta=${ctaUrl}`);
      }

      const payload = {
        template_id: "433aa2ca-f109-4256-be02-e21efe6f855b",
        modifications: [
          { name: "hook", source: hookUrl },
          { name: "corpo", source: corpoUrl },
          { name: "cta", source: ctaUrl },
        ],
      };

      console.log("Enviando ao Creatomate:", JSON.stringify(payload));

      const response = await fetch("https://api.creatomate.com/v2/renders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Resposta Creatomate:", JSON.stringify(data));

      if (!response.ok) {
        throw new Error(`Creatomate error: ${JSON.stringify(data)}`);
      }

      const render = Array.isArray(data) ? data[0] : data;
      return new Response(JSON.stringify({ renderId: render.id, status: render.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check-status") {
      const response = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      const data = await response.json();
      console.log("Status render:", JSON.stringify(data));

      return new Response(JSON.stringify({
        status: data.status,
        url: data.url || null,
        error_message: data.error_message || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Action inválida");

  } catch (error) {
    console.error("Erro:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
