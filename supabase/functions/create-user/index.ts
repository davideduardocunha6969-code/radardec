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

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Only admins can create users");
    }

    const { email, password, displayName, isAdmin, permissions } = await req.json();

    if (!email || !password || !displayName) {
      throw new Error("Email, password, and display name are required");
    }

    // Create the user
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
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUserId,
        display_name: displayName,
      });

    if (profileError) {
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    // Create role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: isAdmin ? "admin" : "user",
      });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw roleError;
    }

    // Create permissions if not admin and permissions provided
    if (!isAdmin && permissions && permissions.length > 0) {
      const permissionInserts = permissions.map((pageKey: string) => ({
        user_id: newUserId,
        page_key: pageKey,
      }));

      const { error: permError } = await supabaseAdmin
        .from("user_permissions")
        .insert(permissionInserts);

      if (permError) {
        console.error("Error creating permissions:", permError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
