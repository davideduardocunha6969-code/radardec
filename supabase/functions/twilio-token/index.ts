import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple base64 encoding for JWT
function base64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateTwilioAccessToken(
  accountSid: string,
  apiKey: string,
  apiSecret: string,
  identity: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = { alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" };

  const grants: Record<string, unknown> = {
    voice: {
      outgoing: {
        application_sid: Deno.env.get("TWILIO_APP_ID") || "",
      },
    },
    identity,
  };

  const payload = {
    jti: `${apiKey}-${now}`,
    iss: apiKey,
    sub: accountSid,
    iat: now,
    exp: expiry,
    grants,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  // HMAC-SHA256 signing
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);

  // Use Web Crypto API for HMAC
  // Since Deno supports top-level await in serve callbacks, we need sync approach
  // We'll use a simpler approach with the crypto module
  const cryptoKey = new Uint8Array(keyData);

  // For Deno, we can use the built-in crypto
  // But HMAC needs async, so we'll structure accordingly
  return `${signingInput}.PENDING`; // Placeholder - will use async version
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const API_KEY = Deno.env.get("TWILIO_API_KEY");
    const API_SECRET = Deno.env.get("TWILIO_API_SECRET");
    const TWILIO_APP_ID = Deno.env.get("TWILIO_APP_ID");

    if (!ACCOUNT_SID || !API_KEY || !API_SECRET) {
      throw new Error("Credenciais Twilio não configuradas");
    }

    // Validate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const identity = `user_${userId.replace(/-/g, "")}`;

    // Generate JWT Access Token for Twilio Voice
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header = { alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" };
    const grants: Record<string, unknown> = {
      identity,
      voice: {
        outgoing: {
          application_sid: TWILIO_APP_ID || "",
        },
      },
    };

    const payload = {
      jti: `${API_KEY}-${now}`,
      iss: API_KEY,
      sub: ACCOUNT_SID,
      iat: now,
      exp: expiry,
      grants,
    };

    const headerB64 = base64url(JSON.stringify(header));
    const payloadB64 = base64url(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    // HMAC-SHA256 signing using Web Crypto API
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(API_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signingInput));
    const sigB64 = base64url(String.fromCharCode(...new Uint8Array(signature)));

    const accessToken = `${signingInput}.${sigB64}`;

    return new Response(
      JSON.stringify({ token: accessToken, identity }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error generating Twilio token:", error);
    const msg = error instanceof Error ? error.message : "Erro ao gerar token";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
