import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clientIdentity = url.searchParams.get("clientIdentity");

    if (!clientIdentity) {
      throw new Error("clientIdentity is required");
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Client>${clientIdentity}</Client>
  </Dial>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[power-dialer-twiml] Error:", error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Erro ao conectar a chamada.</Say>
</Response>`;
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});
