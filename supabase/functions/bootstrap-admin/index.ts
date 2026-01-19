import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if admin already exists
    const { data: existingAdmins } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("role", "admin");

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: "Admin already exists", alreadyExists: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      throw new Error("Email, password, and display name are required");
    }

    // Create the admin user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      throw createError;
    }

    const newUserId = userData.user.id;

    // Create profile
    await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUserId,
        display_name: displayName,
      });

    // Create admin role
    await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "admin",
      });

    return new Response(
      JSON.stringify({ success: true, message: "Admin user created successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in bootstrap-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
