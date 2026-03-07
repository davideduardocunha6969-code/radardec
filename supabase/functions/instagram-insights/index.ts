import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API = "https://graph.facebook.com/v25.0";

interface MediaPost {
  id: string;
  like_count?: number;
  comments_count?: number;
  reach?: number;
  impressions?: number;
  saved?: number;
  shares_count?: number;
  video_views?: number;
  plays?: number;
  timestamp?: string;
  media_type?: string;
  media_product_type?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
}

function getTokenForArea(legalArea: string | null): string | null {
  const map: Record<string, string> = {
    Previdenciário: "META_PAGE_TOKEN_PREVIDENCIARIO",
    Trabalhista: "META_PAGE_TOKEN_TRABALHISTA",
    Bancário: "META_PAGE_TOKEN_BANCARIO",
  };
  const key = map[legalArea ?? ""];
  return key ? Deno.env.get(key) ?? null : null;
}

function safeNum(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

function postEngagement(p: MediaPost, followers: number): number {
  const total = safeNum(p.like_count) + safeNum(p.comments_count) + safeNum(p.saved) + safeNum(p.shares_count);
  return followers > 0 ? Math.round((total / followers) * 100 * 100) / 100 : 0;
}

function postEngagementRaw(p: MediaPost): number {
  return safeNum(p.like_count) + safeNum(p.comments_count) + safeNum(p.saved) + safeNum(p.shares_count);
}

function isWithinDays(timestamp: string | undefined, days: number): boolean {
  if (!timestamp) return false;
  const postDate = new Date(timestamp);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return postDate >= cutoff;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_id } = await req.json();
    if (!profile_id) throw new Error("profile_id é obrigatório");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileErr } = await sb
      .from("monitored_profiles")
      .select("id, instagram_business_id, legal_area, user_id")
      .eq("id", profile_id)
      .single();

    if (profileErr || !profile) throw new Error("Perfil não encontrado: " + (profileErr?.message ?? ""));
    if (!profile.instagram_business_id) throw new Error("instagram_business_id não configurado para este perfil");

    const igId = profile.instagram_business_id;
    const token = getTokenForArea(profile.legal_area);
    if (!token) throw new Error(`Token Meta não encontrado para legal_area '${profile.legal_area}'`);

    // Fetch profile data and posts in parallel
    const [profileRes, mediaRes] = await Promise.all([
      fetch(`${GRAPH_API}/${igId}?fields=followers_count,media_count,biography,website,name,profile_picture_url&access_token=${token}`),
      fetch(`${GRAPH_API}/${igId}/media?fields=id,like_count,comments_count,reach,impressions,saved,shares_count,video_views,plays,media_product_type,timestamp,media_type,thumbnail_url,permalink,caption&limit=30&access_token=${token}`),
    ]);

    const profileData = await profileRes.json();
    if (profileData.error) throw new Error("Meta API (perfil): " + (profileData.error.message ?? JSON.stringify(profileData.error)));

    const mediaData = await mediaRes.json();
    const posts: MediaPost[] = mediaData.data ?? [];

    const followers = safeNum(profileData.followers_count);

    // Calculate metrics
    const last7 = posts.slice(0, 7);
    const last10 = posts.slice(0, 10);

    // Engagement rate from last 7 posts
    let engagementRate: number | null = null;
    if (last7.length > 0 && followers > 0) {
      const totalEng = last7.reduce((s, p) => s + postEngagementRaw(p), 0);
      engagementRate = Math.round(((totalEng) / (last7.length * followers)) * 100 * 100) / 100;
    }

    // Averages from last 10
    const avgLikes = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.like_count), 0) / last10.length)
      : null;

    const avgComments = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.comments_count), 0) / last10.length)
      : null;

    // avg_views = video_views for reels/videos, fallback to impressions
    const viewsArr = last10.map((p) => {
      const vv = safeNum(p.video_views) || safeNum(p.plays);
      return vv > 0 ? vv : safeNum(p.impressions);
    }).filter((v) => v > 0);
    const avgViews = viewsArr.length > 0
      ? Math.round(viewsArr.reduce((a, b) => a + b, 0) / viewsArr.length)
      : null;

    // avg shares
    const avgShares = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.shares_count), 0) / last10.length * 100) / 100
      : null;

    // avg saves
    const avgSaves = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.saved), 0) / last10.length * 100) / 100
      : null;

    // best_post_engagement from all fetched posts (up to 30)
    let bestPostEngagement: number | null = null;
    if (posts.length > 0 && followers > 0) {
      bestPostEngagement = Math.max(...posts.map((p) => postEngagement(p, followers)));
    }

    // total_posts_7d
    const totalPosts7d = posts.filter((p) => isWithinDays(p.timestamp, 7)).length;

    // Top 5 posts by engagement
    const sortedPosts = [...posts]
      .sort((a, b) => postEngagementRaw(b) - postEngagementRaw(a))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        permalink: p.permalink,
        thumbnail_url: p.thumbnail_url,
        media_type: p.media_type,
        like_count: safeNum(p.like_count),
        comments_count: safeNum(p.comments_count),
        saved: safeNum(p.saved),
        shares_count: safeNum(p.shares_count),
        video_views: safeNum(p.video_views) || safeNum(p.plays),
        impressions: safeNum(p.impressions),
        reach: safeNum(p.reach),
        timestamp: p.timestamp,
        engagement_post: postEngagement(p, followers),
        caption: p.caption?.slice(0, 100) ?? null,
      }));

    // Update monitored_profiles
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      followers_count: followers,
      posts_count: safeNum(profileData.media_count),
      biography: profileData.biography ?? null,
      external_url: profileData.website ?? null,
      display_name: profileData.name ?? null,
      avatar_url: profileData.profile_picture_url ?? null,
      engagement_score_7d: engagementRate,
      avg_likes_recent: avgLikes,
      avg_comments_recent: avgComments,
      avg_views_recent: avgViews,
      avg_shares_recent: avgShares,
      avg_saves_recent: avgSaves,
      best_post_engagement: bestPostEngagement,
      total_posts_7d: totalPosts7d,
      top_posts: sortedPosts,
      last_scanned_at: now,
    };

    const { error: updateErr } = await sb
      .from("monitored_profiles")
      .update(updateData)
      .eq("id", profile_id);
    if (updateErr) console.error("Erro ao atualizar perfil:", updateErr.message);

    // Insert profile_history
    const { error: histErr } = await sb.from("profile_history").insert({
      profile_id,
      user_id: profile.user_id,
      followers_count: followers,
      posts_count: safeNum(profileData.media_count),
      engagement_score: engagementRate,
      avg_engagement_7d: engagementRate,
      avg_views_7d: avgViews,
      avg_likes_7d: avgLikes,
      recorded_at: now,
    });
    if (histErr) console.error("Erro ao inserir histórico:", histErr.message);

    return new Response(
      JSON.stringify({
        success: true,
        followers,
        engagement_rate: engagementRate,
        avg_likes: avgLikes,
        avg_comments: avgComments,
        avg_views: avgViews,
        avg_shares: avgShares,
        avg_saves: avgSaves,
        best_post_engagement: bestPostEngagement,
        total_posts_7d: totalPosts7d,
        posts_fetched: posts.length,
        top_posts_count: sortedPosts.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("instagram-insights error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
