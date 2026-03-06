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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch distinct user_ids with active profiles
    const { data: rows, error } = await supabase
      .from("monitored_profiles")
      .select("user_id")
      .eq("is_active", true);

    if (error) throw error;

    const userIds = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))];
    console.log(`[scheduled-radar] ${userIds.length} usuários com perfis ativos`);

    let scanned = 0;

    for (const userId of userIds) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/radar-scan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ scan_type: "all", user_id: userId, scheduled: true }),
        });
        const body = await res.json();
        console.log(`[scheduled-radar] user=${userId} status=${res.status} found=${body.found ?? 0}`);
        scanned++;
      } catch (e: any) {
        console.error(`[scheduled-radar] erro user=${userId}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, users_scanned: scanned, total_users: userIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[scheduled-radar] erro:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
