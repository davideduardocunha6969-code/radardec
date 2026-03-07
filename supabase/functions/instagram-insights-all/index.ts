import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all own accounts with instagram_business_id configured
    const { data: profiles, error: fetchErr } = await sb
      .from("monitored_profiles")
      .select("id, username, legal_area")
      .eq("is_own_account", true)
      .not("instagram_business_id", "is", null);

    if (fetchErr) throw new Error("Erro ao buscar perfis: " + fetchErr.message);
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, scanned: 0, errors: [], message: "Nenhum perfil para escanear" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const errors: Array<{ profile_id: string; username: string; error: string }> = [];
    let scanned = 0;

    for (const profile of profiles) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/instagram-insights`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ profile_id: profile.id }),
        });

        const result = await res.json();
        if (!result.success) {
          errors.push({ profile_id: profile.id, username: profile.username, error: result.error ?? "Erro desconhecido" });
        } else {
          scanned++;
        }
      } catch (e) {
        errors.push({
          profile_id: profile.id,
          username: profile.username,
          error: e instanceof Error ? e.message : "Erro desconhecido",
        });
      }

      // Delay between profiles to avoid Meta rate limits
      if (profiles.indexOf(profile) < profiles.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    console.log(`instagram-insights-all: scanned=${scanned}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({ success: true, scanned, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("instagram-insights-all error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
