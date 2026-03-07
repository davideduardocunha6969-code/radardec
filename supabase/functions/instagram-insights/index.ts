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
  total_interactions?: number;
  timestamp?: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
}

function getTokenForArea(legalArea: string | null): string | null {
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

function safeFetchJson(url: string): Promise<any> {
  return fetch(url).then(r => r.json()).catch(() => ({ error: { message: "fetch failed" } }));
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

    if (!profile.instagram_business_id) {
      return new Response(
        JSON.stringify({ success: false, error: "instagram_business_id não configurado", step: "check_ig_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const igId = profile.instagram_business_id;

    step = "resolve_token";
    const token = getTokenForArea(profile.legal_area);
    if (!token) {
      const msg = `Token Meta não encontrado para legal_area '${profile.legal_area}'`;
      console.error(`[instagram-insights] step=${step}, error=${msg}`);
      return new Response(
        JSON.stringify({ success: false, error: msg, step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch all data from Meta Graph API ──
    step = "fetch_meta_api";
    const profileUrl = `${GRAPH_API}/${igId}?fields=id,name,username,biography,website,followers_count,follows_count,media_count,profile_picture_url,ig_id&access_token=${token}`;
    const mediaUrl = `${GRAPH_API}/${igId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,shares_count,saved,reach,impressions,video_views,plays,total_interactions,media_product_type&limit=30&access_token=${token}`;

    // Profile insights (last 30 days)
    const now = new Date();
    const since30d = new Date(now.getTime() - 30 * 86400000);
    const sinceTs = Math.floor(since30d.getTime() / 1000);
    const untilTs = Math.floor(now.getTime() / 1000);
    const insightsUrl = `${GRAPH_API}/${igId}/insights?metric=reach,impressions,profile_views,website_clicks,email_contacts,follower_count&period=day&since=${sinceTs}&until=${untilTs}&access_token=${token}`;
    const audienceUrl = `${GRAPH_API}/${igId}/insights?metric=audience_gender_age,audience_city,audience_country&period=lifetime&access_token=${token}`;

    console.log(`[instagram-insights] step=fetch_meta_api, igId=${igId}`);

    const [profileRes, mediaRes, insightsRes, audienceRes] = await Promise.all([
      safeFetchJson(profileUrl),
      safeFetchJson(mediaUrl),
      safeFetchJson(insightsUrl),
      safeFetchJson(audienceUrl),
    ]);

    // ── Parse profile ──
    step = "parse_meta_profile";
    if (profileRes.error) {
      const msg = "Meta API (perfil): " + (profileRes.error.message ?? JSON.stringify(profileRes.error));
      console.error(`[instagram-insights] step=${step}, error=${msg}`);
      return new Response(
        JSON.stringify({ success: false, error: msg, step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const followers = safeNum(profileRes.followers_count);
    const followsCount = safeNum(profileRes.follows_count);
    console.log(`[instagram-insights] profile: followers=${followers}, follows=${followsCount}`);

    // ── Parse media ──
    step = "parse_meta_media";
    if (mediaRes.error) {
      const msg = "Meta API (media): " + (mediaRes.error.message ?? JSON.stringify(mediaRes.error));
      console.error(`[instagram-insights] step=${step}, error=${msg}`);
      return new Response(
        JSON.stringify({ success: false, error: msg, step }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const posts: MediaPost[] = mediaRes.data ?? [];
    console.log(`[instagram-insights] posts_count=${posts.length}`);

    // ── Parse insights (graceful — may fail on dev accounts) ──
    step = "parse_insights";
    let profileViews30d: number | null = null;
    let websiteClicks30d: number | null = null;
    let reach30d: number | null = null;
    let impressions30d: number | null = null;

    if (!insightsRes.error && Array.isArray(insightsRes.data)) {
      for (const metric of insightsRes.data) {
        const values = metric.values ?? [];
        const total = values.reduce((s: number, v: any) => s + safeNum(v.value), 0);
        switch (metric.name) {
          case "reach": reach30d = total; break;
          case "impressions": impressions30d = total; break;
          case "profile_views": profileViews30d = total; break;
          case "website_clicks": websiteClicks30d = total; break;
        }
      }
      console.log(`[instagram-insights] insights: reach=${reach30d}, impressions=${impressions30d}, profile_views=${profileViews30d}, clicks=${websiteClicks30d}`);
    } else {
      console.log(`[instagram-insights] insights unavailable (dev account?): ${insightsRes.error?.message ?? "no data"}`);
    }

    // ── Parse audience (graceful) ──
    step = "parse_audience";
    let audienceGenderAge: any = null;
    let audienceCity: any = null;
    let audienceCountry: any = null;

    if (!audienceRes.error && Array.isArray(audienceRes.data)) {
      for (const metric of audienceRes.data) {
        const val = metric.values?.[0]?.value ?? null;
        switch (metric.name) {
          case "audience_gender_age": audienceGenderAge = val; break;
          case "audience_city": audienceCity = val; break;
          case "audience_country": audienceCountry = val; break;
        }
      }
      console.log(`[instagram-insights] audience data loaded`);
    } else {
      console.log(`[instagram-insights] audience unavailable: ${audienceRes.error?.message ?? "no data"}`);
    }

    // ── Calculate metrics ──
    step = "calculate_metrics";
    const last7 = posts.filter(p => isWithinDays(p.timestamp, 7));
    const last10 = posts.slice(0, 10);
    const last30 = posts.filter(p => isWithinDays(p.timestamp, 30));

    let engagementRate: number | null = null;
    if (last7.length > 0 && followers > 0) {
      const engagements = last7.map(p => postEngagement(p, followers));
      engagementRate = Math.round((engagements.reduce((a, b) => a + b, 0) / engagements.length) * 100) / 100;
    }

    const avgLikes = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.like_count), 0) / last10.length)
      : null;

    const avgComments = last10.length > 0
      ? Math.round(last10.reduce((s, p) => s + safeNum(p.comments_count), 0) / last10.length)
      : null;

    const viewsArr = last10.map(p => {
      const vv = safeNum(p.video_views) || safeNum(p.plays);
      return vv > 0 ? vv : safeNum(p.impressions);
    }).filter(v => v > 0);
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
      bestPostEngagement = Math.max(...posts.map(p => postEngagement(p, followers)));
    }

    const totalPosts7d = last7.length;
    const totalPosts30d = last30.length;

    // ── Build posts_data (all 30 posts with full detail) ──
    const postsData = posts.map(p => ({
      id: p.id,
      permalink: p.permalink,
      thumbnail_url: p.thumbnail_url,
      media_url: p.media_url,
      media_type: p.media_type,
      media_product_type: p.media_product_type,
      like_count: safeNum(p.like_count),
      comments_count: safeNum(p.comments_count),
      saved: safeNum(p.saved),
      shares_count: safeNum(p.shares_count),
      video_views: safeNum(p.video_views) || safeNum(p.plays),
      impressions: safeNum(p.impressions),
      reach: safeNum(p.reach),
      total_interactions: safeNum(p.total_interactions),
      timestamp: p.timestamp,
      engagement_post: postEngagement(p, followers),
      caption: p.caption?.slice(0, 200) ?? null,
    }));

    // Top 5 by engagement
    const sortedPosts = [...postsData]
      .sort((a, b) => (b.like_count + b.comments_count + b.saved + b.shares_count) - (a.like_count + a.comments_count + a.saved + a.shares_count))
      .slice(0, 5);

    console.log(`[instagram-insights] metrics: engagement=${engagementRate}, avgLikes=${avgLikes}, top_posts=${sortedPosts.length}, posts30d=${totalPosts30d}`);

    // ── Update monitored_profiles ──
    step = "update_profile";
    const nowIso = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      followers_count: followers,
      follows_count: followsCount,
      posts_count: safeNum(profileRes.media_count),
      biography: profileRes.biography ?? null,
      external_url: profileRes.website ?? null,
      display_name: profileRes.name ?? null,
      avatar_url: profileRes.profile_picture_url ?? null,
      engagement_score_7d: engagementRate,
      avg_likes_recent: avgLikes,
      avg_comments_recent: avgComments,
      avg_views_recent: avgViews,
      avg_shares_recent: avgShares,
      avg_saves_recent: avgSaves,
      best_post_engagement: bestPostEngagement,
      total_posts_7d: totalPosts7d,
      total_posts_30d: totalPosts30d,
      top_posts: sortedPosts,
      posts_data: postsData,
      profile_views_30d: profileViews30d,
      website_clicks_30d: websiteClicks30d,
      reach_30d: reach30d,
      impressions_30d: impressions30d,
      audience_gender_age: audienceGenderAge,
      audience_city: audienceCity,
      audience_country: audienceCountry,
      last_scanned_at: nowIso,
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

    // ── Upsert profile_history (one per day, São Paulo timezone) ──
    step = "upsert_history";
    const historyData = {
      profile_id,
      user_id: profile.user_id,
      followers_count: followers,
      posts_count: safeNum(profileRes.media_count),
      engagement_score: engagementRate,
      avg_engagement_7d: engagementRate,
      avg_views_7d: avgViews,
      avg_likes_7d: avgLikes,
      recorded_at: nowIso,
    };

    // Use RPC-style query to find existing record for today in São Paulo timezone
    const { data: existingHist } = await sb
      .from("profile_history")
      .select("id")
      .eq("profile_id", profile_id)
      .gte("recorded_at", (() => {
        // Calculate today's start in São Paulo (UTC-3)
        const spNow = new Date(now.getTime() - 3 * 3600000);
        const spDateStr = spNow.toISOString().slice(0, 10);
        return new Date(spDateStr + "T03:00:00Z").toISOString(); // midnight SP = 03:00 UTC
      })())
      .lt("recorded_at", (() => {
        const spNow = new Date(now.getTime() - 3 * 3600000);
        const spDateStr = spNow.toISOString().slice(0, 10);
        return new Date(new Date(spDateStr + "T03:00:00Z").getTime() + 86400000).toISOString();
      })())
      .limit(1);

    if (existingHist && existingHist.length > 0) {
      await sb.from("profile_history").update(historyData).eq("id", existingHist[0].id);
      console.log(`[instagram-insights] history updated (existing id=${existingHist[0].id})`);
    } else {
      await sb.from("profile_history").insert(historyData);
      console.log(`[instagram-insights] history inserted (new day)`);
    }

    console.log(`[instagram-insights] DONE`);

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
        total_posts_30d: totalPosts30d,
        posts_fetched: posts.length,
        top_posts_count: sortedPosts.length,
        reach_30d: reach30d,
        impressions_30d: impressions30d,
        profile_views_30d: profileViews30d,
        has_audience_data: !!audienceGenderAge,
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
