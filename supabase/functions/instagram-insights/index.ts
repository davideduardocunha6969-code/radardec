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
  // Normalize: lowercase, remove accents
  const normalized = (legalArea ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const map: Record<string, string> = {
    previdenciario: "META_PAGE_TOKEN_PREVIDENCIARIO",
    trabalhista: "META_PAGE_TOKEN_TRABALHISTA",
    bancario: "META_PAGE_TOKEN_BANCARIO",
  };
  const key = map[normalized];
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

  let step = "init";
  try {
    step = "parse_body";
    const body = await req.json();
    const profile_id = body?.profile_id;
    console.log(`[instagram-insights] step=parse_body, profile_id=${profile_id}`);
    if (!profile_id) {
      return new Response(
        JSON.stringify({ success: false, error: "profile_id é obrigatório", step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    step = "init_supabase";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    step = "fetch_profile";
    console.log(`[instagram-insights] step=fetch_profile, id=${profile_id}`);
    const { data: profile, error: profileErr } = await sb
      .from("monitored_profiles")
      .select("id, instagram_business_id, legal_area, user_id")
      .eq("id", profile_id)
      .single();

    if (profileErr || !profile) {
      const msg = "Perfil não encontrado: " + (profileErr?.message ?? "null");
      console.error(`[instagram-insights] step=${step}, error=${msg}`);
      return new Response(
        JSON.stringify({ success: false, error: msg, step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[instagram-insights] profile found: ig_id=${profile.instagram_business_id}, legal_area=${profile.legal_area}`);

    if (!profile.instagram_business_id) {
      return new Response(
        JSON.stringify({ success: false, error: "instagram_business_id não configurado para este perfil", step: "check_ig_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const igId = profile.instagram_business_id;

    step = "resolve_token";
    const token = getTokenForArea(profile.legal_area);
    if (!token) {
      const msg = `Token Meta não encontrado para legal_area '${profile.legal_area}' (normalized). Verifique os secrets META_PAGE_TOKEN_*.`;
      console.error(`[instagram-insights] step=${step}, error=${msg}`);
      return new Response(
        JSON.stringify({ success: false, error: msg, step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log(`[instagram-insights] step=resolve_token, token found (length=${token.length})`);

    step = "fetch_meta_api";
    const profileUrl = `${GRAPH_API}/${igId}?fields=followers_count,media_count,biography,website,name,profile_picture_url&access_token=${token}`;
    const mediaUrl = `${GRAPH_API}/${igId}/media?fields=id,like_count,comments_count,reach,impressions,saved,shares_count,video_views,plays,media_product_type,timestamp,media_type,thumbnail_url,permalink,caption&limit=30&access_token=${token}`;
    console.log(`[instagram-insights] step=fetch_meta_api, igId=${igId}`);

    const [profileRes, mediaRes] = await Promise.all([
      fetch(profileUrl),
      fetch(mediaUrl),
    ]);

    step = "parse_meta_profile";
    const profileData = await profileRes.json();
    if (profileData.error) {
      const msg = "Meta API (perfil): " + (profileData.error.message ?? JSON.stringify(profileData.error));
      console.error(`[instagram-insights] step=${step}, error=${msg}`);
      return new Response(
        JSON.stringify({ success: false, error: msg, step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log(`[instagram-insights] step=parse_meta_profile, followers=${profileData.followers_count}`);

    step = "parse_meta_media";
    const mediaData = await mediaRes.json();
    if (mediaData.error) {
      const msg = "Meta API (media): " + (mediaData.error.message ?? JSON.stringify(mediaData.error));
      console.error(`[instagram-insights] step=${step}, error=${msg}`);
      return new Response(
        JSON.stringify({ success: false, error: msg, step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const posts: MediaPost[] = mediaData.data ?? [];
    console.log(`[instagram-insights] step=parse_meta_media, posts_count=${posts.length}`);

    const followers = safeNum(profileData.followers_count);

    // Calculate metrics
    step = "calculate_metrics";
    const last7 = posts.slice(0, 7);
    const last10 = posts.slice(0, 10);

    let engagementRate: number | null = null;
    if (last7.length > 0 && followers > 0) {
      const totalEng = last7.reduce((s, p) => s + postEngagementRaw(p), 0);
      engagementRate = Math.round(((totalEng) / (last7.length * followers)) * 100 * 100) / 100;
    }

    const avgLikes = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.like_count), 0) / last10.length)
      : null;

    const avgComments = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.comments_count), 0) / last10.length)
      : null;

    const viewsArr = last10.map((p) => {
      const vv = safeNum(p.video_views) || safeNum(p.plays);
      return vv > 0 ? vv : safeNum(p.impressions);
    }).filter((v) => v > 0);
    const avgViews = viewsArr.length > 0
      ? Math.round(viewsArr.reduce((a, b) => a + b, 0) / viewsArr.length)
      : null;

    const avgShares = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.shares_count), 0) / last10.length * 100) / 100
      : null;

    const avgSaves = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.saved), 0) / last10.length * 100) / 100
      : null;

    let bestPostEngagement: number | null = null;
    if (posts.length > 0 && followers > 0) {
      bestPostEngagement = Math.max(...posts.map((p) => postEngagement(p, followers)));
    }

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

    console.log(`[instagram-insights] step=calculate_metrics, engagement=${engagementRate}, avgLikes=${avgLikes}, top_posts=${sortedPosts.length}`);

    // Update monitored_profiles
    step = "update_profile";
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
    if (updateErr) {
      console.error(`[instagram-insights] step=${step}, error=${updateErr.message}`);
    } else {
      console.log(`[instagram-insights] step=update_profile, success`);
    }

    // Upsert profile_history (one record per day)
    step = "upsert_history";
    const historyData = {
      profile_id,
      user_id: profile.user_id,
      followers_count: followers,
      posts_count: safeNum(profileData.media_count),
      engagement_score: engagementRate,
      avg_engagement_7d: engagementRate,
      avg_views_7d: avgViews,
      avg_likes_7d: avgLikes,
      recorded_at: now,
    };

    const todayStr = now.slice(0, 10);
    const todayStart = new Date(todayStr).toISOString();
    const tomorrowStart = new Date(new Date(todayStr).getTime() + 86400000).toISOString();

    const { data: existingHist } = await sb
      .from("profile_history")
      .select("id")
      .eq("profile_id", profile_id)
      .gte("recorded_at", todayStart)
      .lt("recorded_at", tomorrowStart)
      .limit(1);

    if (existingHist && existingHist.length > 0) {
      const { error: histErr } = await sb.from("profile_history").update(historyData).eq("id", existingHist[0].id);
      if (histErr) console.error(`[instagram-insights] step=${step}, update error=${histErr.message}`);
      else console.log(`[instagram-insights] step=upsert_history, updated existing`);
    } else {
      const { error: histErr } = await sb.from("profile_history").insert(historyData);
      if (histErr) console.error(`[instagram-insights] step=${step}, insert error=${histErr.message}`);
      else console.log(`[instagram-insights] step=upsert_history, inserted new`);
    }

    console.log(`[instagram-insights] DONE, followers=${followers}, posts=${posts.length}`);

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
    console.error(`[instagram-insights] EXCEPTION at step=${step}, error=${msg}`);
    return new Response(
      JSON.stringify({ success: false, error: msg, step }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
