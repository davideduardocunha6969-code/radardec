import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!TWILIO_PHONE_NUMBER) {
      throw new Error("TWILIO_PHONE_NUMBER não configurado");
    }

    // Parse form data or JSON body
    let toNumber = "";
    const contentType = req.headers.get("content-type") || "";

    console.log("[TwiML] Content-Type:", contentType);

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      toNumber = formData.get("To") as string || "";
      console.log("[TwiML] Form data - To:", toNumber);
      // Log all form fields for debugging
      const allFields: Record<string, string> = {};
      formData.forEach((v, k) => allFields[k] = v as string);
      console.log("[TwiML] All form fields:", JSON.stringify(allFields));
    } else {
      try {
        const body = await req.json();
        toNumber = body.To || body.to || "";
        console.log("[TwiML] JSON body - To:", toNumber);
      } catch {
        // If no body, use query params
        const url = new URL(req.url);
        toNumber = url.searchParams.get("To") || "";
        console.log("[TwiML] Query params - To:", toNumber);
      }
    }

    if (!toNumber) {
      throw new Error("Número de destino não fornecido");
    }

    // Clean the number - ensure it starts with +
    const cleanNumber = toNumber.startsWith("+") ? toNumber : `+${toNumber}`;
    console.log("[TwiML] Clean number:", cleanNumber, "CallerID:", TWILIO_PHONE_NUMBER);

    // Generate TwiML for outbound call WITHOUT automatic recording.
    // Recording is started via REST API only after the call is confirmed answered,
    // avoiding recording costs on unanswered/voicemail calls.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${TWILIO_PHONE_NUMBER}" action="${SUPABASE_URL}/functions/v1/twilio-webhook" method="POST">
    <Number>${cleanNumber}</Number>
  </Dial>
</Response>`;

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/xml",
      },
    });
  } catch (error: unknown) {
    console.error("Error generating TwiML:", error);
    const msg = error instanceof Error ? error.message : "Erro ao gerar TwiML";

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Erro ao conectar a chamada. ${msg}</Say>
</Response>`;

    return new Response(errorTwiml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/xml",
      },
    });
  }
});
