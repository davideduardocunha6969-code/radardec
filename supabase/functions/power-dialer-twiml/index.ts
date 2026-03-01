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
    const sessionId = url.searchParams.get("sessionId");

    if (!clientIdentity) {
      throw new Error("clientIdentity is required");
    }

    // Parse form data (Twilio sends POST with form-urlencoded when using sync AMD)
    let answeredBy = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      answeredBy = (formData.get("AnsweredBy") as string) || "";
      console.log("[power-dialer-twiml] AnsweredBy:", answeredBy, "SessionId:", sessionId);
    }

    // If machine/voicemail detected, hang up immediately — no audio reaches the browser
    if (answeredBy && answeredBy !== "human" && answeredBy !== "unknown") {
      console.log(`[power-dialer-twiml] Machine detected (${answeredBy}), hanging up`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    // Human answered — connect to Client
    console.log(`[power-dialer-twiml] Human detected, connecting to ${clientIdentity}`);
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
