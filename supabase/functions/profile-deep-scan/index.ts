import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Apify helper ──

async function runActor(actorId: string, input: Record<string, unknown>, token: string) {
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const startBody = await startRes.json();
  const runId = startBody?.data?.id;
  if (!runId) throw new Error(`Apify run start failed: ${JSON.stringify(startBody)}`);

  console.log(`[runActor] runId=${runId} actor=${actorId}`);

  let status = "RUNNING";
  let attempts = 0;
  while (status !== "SUCCEEDED" && status !== "FAILED" && attempts < 60) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
    const pollBody = await pollRes.json();
    status = pollBody?.data?.status ?? "UNKNOWN";
    attempts++;
  }

  console.log(`[runActor] final status=${status} attempts=${attempts}`);
  if (status !== "SUCCEEDED") throw new Error(`Apify run ${runId} ended with status ${status}`);

  const itemsRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}&limit=50`,
  );
  return (await itemsRes.json()) as Record<string, unknown>[];
}

// ── Helpers ──

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function topN<T>(arr: T[], key: (item: T) => number, n: number): T[] {
  return [...arr].sort((a, b) => key(b) - key(a)).slice(0, n);
}

// ── Instagram deep scan ──

async function scanInstagram(username: string, token: string) {
  const items = await runActor("apify~instagram-profile-scraper", { usernames: [username] }, token);
  const p = items[0] as Record<string, unknown> | undefined;
  if (!p) throw new Error("No Instagram profile data returned");

  const followersCount = (p.followersCount as number) ?? null;
  const followingCount = (p.followsCount as number) ?? null;
  const postsCount = (p.postsCount as number) ?? null;
  const avatarUrl = (p.profilePicUrlHD as string) || (p.profilePicUrl as string) || null;
  const displayName = (p.fullName as string) || null;
  const biography = (p.biography as string) || null;
  const isBusiness = (p.isBusinessAccount as boolean) ?? false;
  const isVerified = (p.verified as boolean) ?? false;
  const externalUrl = (p.externalUrl as string) || null;
  const dateJoined = (p.date_joined as string) || null;

  const posts = (p.latestPosts as Record<string, unknown>[]) ?? [];

  const likes = posts.map((x) => (x.likesCount as number) ?? 0);
  const views = posts.map((x) => (x.videoViewCount as number) ?? 0);
  const comments = posts.map((x) => (x.commentsCount as number) ?? 0);

  const avgLikes = avg(likes);
  const avgViews = avg(views);
  const avgComments = avg(comments);
  const engagementRate =
    followersCount && followersCount > 0 && avgLikes != null && avgComments != null
      ? Math.round(((avgLikes + avgComments) / followersCount) * 100 * 100) / 100
      : null;

  const top3 = topN(posts, (x) => ((x.videoViewCount as number) ?? 0) || ((x.likesCount as number) ?? 0), 3).map((x) => ({
    url: (x.url as string) ?? null,
    likesCount: (x.likesCount as number) ?? 0,
    commentsCount: (x.commentsCount as number) ?? 0,
    videoViewCount: (x.videoViewCount as number) ?? 0,
    displayUrl: (x.displayUrl as string) ?? null,
    caption: ((x.caption as string) ?? "").substring(0, 300),
    timestamp: (x.timestamp as string) ?? null,
  }));

  return {
    followers_count: followersCount,
    following_count: followingCount,
    posts_count: postsCount,
    avatar_url: avatarUrl,
    display_name: displayName,
    biography,
    is_business: isBusiness,
    is_verified: isVerified,
    external_url: externalUrl,
    date_joined: dateJoined,
    avg_likes_recent: avgLikes,
    avg_views_recent: avgViews,
    avg_comments_recent: avgComments,
    avg_shares_recent: null,
    engagement_rate: engagementRate,
    top_posts: top3,
  };
}

// ── TikTok deep scan ──

async function scanTiktok(username: string, token: string) {
  const items = await runActor("clockworks~tiktok-scraper", {
    profiles: [username],
    resultsPerPage: 20,
    profileScrapeSections: ["videos"],
  }, token);

  if (!items.length) throw new Error("No TikTok data returned");

  const authorMeta = (items[0].authorMeta as Record<string, unknown>) ?? {};
  const followersCount = (authorMeta.fans as number) ?? null;
  const followingCount = (authorMeta.following as number) ?? null;
  const postsCount = (authorMeta.video as number) ?? null;
  const avatarUrl = (authorMeta.avatar as string) || null;
  const displayName = (authorMeta.nickName as string) || null;
  const biography = (authorMeta.signature as string) || null;
  const isVerified = (authorMeta.verified as boolean) ?? false;
  const externalUrl = (authorMeta.bioLink as string) || null;

  const likesArr = items.map((x) => (x.diggCount as number) ?? 0);
  const viewsArr = items.map((x) => (x.playCount as number) ?? 0);
  const commentsArr = items.map((x) => (x.commentCount as number) ?? 0);
  const sharesArr = items.map((x) => (x.shareCount as number) ?? 0);

  const avgLikes = avg(likesArr);
  const avgViews = avg(viewsArr);
  const avgComments = avg(commentsArr);
  const avgShares = avg(sharesArr);
  const engagementRate =
    followersCount && followersCount > 0 && avgLikes != null && avgComments != null
      ? Math.round(((avgLikes + avgComments) / followersCount) * 100 * 100) / 100
      : null;

  const top3 = topN(items, (x) => (x.playCount as number) ?? 0, 3).map((x) => {
    const videoMeta = (x.videoMeta as Record<string, unknown>) ?? {};
    return {
      url: (x.webVideoUrl as string) ?? null,
      likesCount: (x.diggCount as number) ?? 0,
      commentsCount: (x.commentCount as number) ?? 0,
      videoViewCount: (x.playCount as number) ?? 0,
      displayUrl: (videoMeta.coverUrl as string) ?? null,
      caption: ((x.text as string) ?? "").substring(0, 300),
      timestamp: (x.createTimeISO as string) ?? null,
    };
  });

  return {
    followers_count: followersCount,
    following_count: followingCount,
    posts_count: postsCount,
    avatar_url: avatarUrl,
    display_name: displayName,
    biography,
    is_business: false,
    is_verified: isVerified,
    external_url: externalUrl,
    date_joined: null,
    avg_likes_recent: avgLikes,
    avg_views_recent: avgViews,
    avg_comments_recent: avgComments,
    avg_shares_recent: avgShares,
    engagement_rate: engagementRate,
    top_posts: top3,
  };
}

// ── Facebook deep scan ──

async function scanFacebook(username: string, token: string) {
  const items = await runActor("apify~facebook-pages-scraper", {
    startUrls: [{ url: `https://www.facebook.com/${username}` }],
  }, token);

  const p = items[0] as Record<string, unknown> | undefined;
  if (!p) throw new Error("No Facebook page data returned");

  const followersCount = (p.followers as number) ?? null;
  const displayName = (p.title as string) || null;
  const avatarUrl = (p.profilePictureUrl as string) || null;
  const biography = (p.intro as string) || null;
  const externalUrl = (p.website as string) || null;
  const dateJoined = (p.creation_date as string) || null;
  const isBusiness = (p.is_business_page_active as boolean) ?? false;
  const likesProxy = (p.likes as number) ?? null;

  return {
    followers_count: followersCount,
    following_count: null,
    posts_count: null,
    avatar_url: avatarUrl,
    display_name: displayName,
    biography,
    is_business: isBusiness,
    is_verified: false,
    external_url: externalUrl,
    date_joined: dateJoined,
    avg_likes_recent: likesProxy,
    avg_views_recent: null,
    avg_comments_recent: null,
    avg_shares_recent: null,
    engagement_rate: null,
    top_posts: null,
  };
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, profile_id } = await req.json();
    if (!user_id || !profile_id) {
      return new Response(JSON.stringify({ error: "user_id and profile_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY_TOKEN) throw new Error("APIFY_API_TOKEN not configured");

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supaUrl, supaKey);

    // Fetch profile
    const { data: profile, error: fetchErr } = await supabase
      .from("monitored_profiles")
      .select("*")
      .eq("id", profile_id)
      .eq("user_id", user_id)
      .single();

    if (fetchErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platform = profile.platform as string;
    const username = profile.username as string;

    console.log(`[profile-deep-scan] platform=${platform} username=${username}`);

    let data: Record<string, unknown>;

    if (platform === "instagram") {
      data = await scanInstagram(username, APIFY_TOKEN);
    } else if (platform === "tiktok") {
      data = await scanTiktok(username, APIFY_TOKEN);
    } else if (platform === "facebook") {
      data = await scanFacebook(username, APIFY_TOKEN);
    } else {
      return new Response(JSON.stringify({ error: `Unsupported platform: ${platform}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update monitored_profiles
    const { error: updateErr } = await supabase
      .from("monitored_profiles")
      .update({
        ...data,
        last_scanned_at: new Date().toISOString(),
      })
      .eq("id", profile_id);

    if (updateErr) {
      console.error("[profile-deep-scan] update error:", updateErr);
      throw new Error(`Failed to update profile: ${updateErr.message}`);
    }

    // Insert profile_history
    const { error: histErr } = await supabase.from("profile_history").insert({
      profile_id,
      user_id,
      followers_count: data.followers_count ?? null,
      posts_count: data.posts_count ?? null,
      avg_views_7d: data.avg_views_recent ?? null,
      avg_likes_7d: data.avg_likes_recent ?? null,
      engagement_score: data.engagement_rate ?? null,
    });

    if (histErr) {
      console.error("[profile-deep-scan] history insert error:", histErr);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[profile-deep-scan] error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
