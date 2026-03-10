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

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const body = await req.json();
    const { template_id, signer_name, signer_email, signer_phone, lead_id, template_nome, field_data } = body;

    if (!template_id || !signer_name || !lead_id) {
      return new Response(JSON.stringify({ error: "template_id, signer_name e lead_id são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zapSignToken = Deno.env.get("ZAPSIGN_API_TOKEN");
    if (!zapSignToken) {
      return new Response(JSON.stringify({ error: "ZAPSIGN_API_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the data array for template variable replacement
    const dataArray: Array<{ de: string; para: string }> = [];
    if (field_data && typeof field_data === "object") {
      for (const [key, value] of Object.entries(field_data)) {
        if (typeof value === "string" && value.trim()) {
          dataArray.push({ de: `{{${key}}}`, para: value.trim() });
        }
      }
    }

    const zapBody: Record<string, unknown> = {
      signer_name,
      ...(signer_email && { signer_email }),
      ...(signer_phone && { signer_phone }),
      ...(dataArray.length > 0 && { data: dataArray }),
    };

    console.log("DEBUG: ZapSign create-doc payload:", JSON.stringify(zapBody));

    const apiUrl = `https://api.zapsign.com.br/api/v1/templates/${template_id}/create-doc/`;
    console.log("DEBUG: Requesting URL:", apiUrl);

    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${zapSignToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zapBody),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("ZapSign create-doc error:", resp.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao criar documento", detail: errText }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const docResult = await resp.json();

    const signers = docResult.signers || [];
    const firstSigner = signers[0] || {};
    const sign_url = firstSigner.sign_url || "";
    const signer_token = firstSigner.token || "";
    const doc_token = docResult.token || "";

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await adminClient.from("zapsign_documentos").insert({
      lead_id,
      user_id: userId,
      doc_token,
      signer_token,
      sign_url,
      template_id,
      template_nome: template_nome || "",
      nome_documento: docResult.name || signer_name,
      status: "pendente",
      dados_enviados: { signer_name, signer_email, signer_phone, field_data },
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    return new Response(
      JSON.stringify({ sign_url, doc_token, signer_token, nome: docResult.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
