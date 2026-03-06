import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Actor IDs ──
const ACTORS = {
  instagram_profile: "apify~instagram-reel-scraper",
  tiktok_profile: "clockworks~tiktok-scraper",
  instagram_topic: "apify~instagram-hashtag-scraper",
  tiktok_topic: "clockworks~tiktok-scraper",
};

// ── Apify helpers ──

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

  // Polling – max 40 attempts × 3 s = 2 min
  let status = "RUNNING";
  let attempts = 0;
  while (status !== "SUCCEEDED" && status !== "FAILED" && attempts < 40) {
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
  const itemsJson = await itemsRes.json();
  console.log(`[runActor] items count=${Array.isArray(itemsJson) ? itemsJson.length : 'not array'} type=${typeof itemsJson}`);
  console.log(`[runActor] items raw=${JSON.stringify(itemsJson).substring(0, 500)}`);
  return itemsJson as Record<string, unknown>[];
}

// ── Field mapping ──

interface MappedPost {
  views: number;
  likes: number;
  comments: number;
  thumbnail: string | null;
  post_url: string;
  caption: string | null;
  username: string | null;
  followers_at_capture: number | null;
  timestamp: string | null;
}

function mapInstagram(item: Record<string, unknown>): MappedPost {
  return {
    views: (item.videoPlayCount as number) || (item.videoViewCount as number) || 0,
    likes: (item.likesCount as number) || 0,
    comments: (item.commentsCount as number) || 0,
    thumbnail: (item.displayUrl as string) || null,
    post_url: (item.url as string) || "",
    caption: (item.caption as string) || null,
    username: (item.ownerUsername as string) || null,
    followers_at_capture: (item.ownerFollowersCount as number) || null,
    timestamp: (item.timestamp as string) || null,
  };
}

function mapTiktok(item: Record<string, unknown>): MappedPost {
  const videoMeta = (item.videoMeta as Record<string, unknown>) || {};
  const authorMeta = (item.authorMeta as Record<string, unknown>) || {};
  return {
    views: (item.playCount as number) || 0,
    likes: (item.diggCount as number) || 0,
    comments: (item.commentCount as number) || 0,
    thumbnail: (videoMeta.coverUrl as string) || null,
    post_url: (item.webVideoUrl as string) || "",
    caption: (item.text as string) || null,
    username: (authorMeta.name as string) || null,
    followers_at_capture: (authorMeta.fans as number) || null,
    timestamp: (item.createTimeISO as string) || null,
  };
}

// ── Viral check ──

function isViral(post: MappedPost, hasFollowers: boolean): boolean {
  if (hasFollowers && post.followers_at_capture && post.followers_at_capture > 0) {
    return post.views / post.followers_at_capture > 0.5;
  }
  return post.views >= 10000;
}

function viralityRate(views: number, followers: number | null): number | null {
  if (!followers || followers === 0) return null;
  return Math.round((views / followers) * 1000) / 10; // round to 1 decimal
}

// ── Profile metrics helpers ──

function extractProfileMeta(items: Record<string, unknown>[], isIg: boolean) {
  if (items.length === 0) return { avatar_url: null, posts_count: null, followers_count: null };
  const first = items[0];
  if (isIg) {
    return {
      avatar_url: (first.ownerProfilePicUrl as string) || (first.profilePicUrl as string) || null,
      posts_count: (first.ownerPostsCount as number) || (first.postsCount as number) || null,
      followers_count: (first.ownerFollowersCount as number) || null,
    };
  }
  const authorMeta = (first.authorMeta as Record<string, unknown>) || {};
  return {
    avatar_url: (authorMeta.avatar as string) || null,
    posts_count: (authorMeta.video as number) || null,
    followers_count: (authorMeta.fans as number) || null,
  };
}

function calcPostFrequency(mapped: MappedPost[]) {
  const timestamps = mapped
    .map((p) => p.timestamp ? new Date(p.timestamp).getTime() : null)
    .filter((t): t is number => t !== null && !isNaN(t))
    .sort((a, b) => a - b);

  if (timestamps.length < 2) return { avg_posts_per_day: null, avg_posts_per_week: null, avg_posts_per_month: null };

  const spanMs = timestamps[timestamps.length - 1] - timestamps[0];
  const spanDays = spanMs / (1000 * 60 * 60 * 24);
  if (spanDays < 1) return { avg_posts_per_day: null, avg_posts_per_week: null, avg_posts_per_month: null };

  const perDay = Math.round((timestamps.length / spanDays) * 100) / 100;
  return {
    avg_posts_per_day: perDay,
    avg_posts_per_week: Math.round(perDay * 7 * 100) / 100,
    avg_posts_per_month: Math.round(perDay * 30 * 100) / 100,
  };
}

function calcEngagement7d(mapped: MappedPost[], followers: number | null) {
  if (!followers || followers === 0) return null;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = mapped.filter((p) => {
    if (!p.timestamp) return true; // if no timestamp, include (assume recent)
    return new Date(p.timestamp).getTime() >= sevenDaysAgo;
  });
  if (recent.length === 0) return null;
  const totalEngagement = recent.reduce((sum, p) => sum + p.likes + p.comments, 0);
  return Math.round((totalEngagement / recent.length / followers) * 100 * 100) / 100;
}

// ── Upsert viral content ──

async function upsertVirals(
  supabase: ReturnType<typeof createClient>,
  rows: Record<string, unknown>[],
) {
  let inserted = 0;
  for (const row of rows) {
    const { data: existing } = await supabase
      .from("viral_content")
      .select("id")
      .eq("post_url", row.post_url)
      .eq("user_id", row.user_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("viral_content")
        .update({
          view_count: row.view_count,
          like_count: row.like_count,
          comment_count: row.comment_count,
          virality_rate: row.virality_rate,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("viral_content").insert(row);
      inserted++;
    }
  }
  return inserted;
}

// ── Recalculate rank_position ──

async function recalcRankPositions(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: allVirals } = await supabase
    .from("viral_content")
    .select("id, virality_rate")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("virality_rate", { ascending: false });

  if (!allVirals || allVirals.length === 0) return;

  for (let i = 0; i < allVirals.length; i++) {
    await supabase
      .from("viral_content")
      .update({ rank_position: i + 1 })
      .eq("id", allVirals[i].id);
  }
  console.log(`[radar-scan] rank_position recalculado para ${allVirals.length} virais`);
}

// ── Scan profiles ──

async function scanProfiles(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  token: string,
  debugMode = false,
) {
  const { data: profiles } = await supabase
    .from("monitored_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  console.log('[radar-scan] profiles encontrados:', profiles?.length ?? 0);
  console.log('[radar-scan] user_id recebido:', userId);

  if (!profiles || profiles.length === 0) return { found: 0, debugItems: [] };

  let totalFound = 0;
  const debugItems: Record<string, unknown>[] = [];
  const now = new Date().toISOString();
  const weekNum = `${new Date().getFullYear()}-W${String(Math.ceil((new Date().getDate()) / 7)).padStart(2, "0")}`;

  for (const profile of profiles) {
    try {
      const isIg = profile.platform === "instagram";

      const actorId = isIg ? ACTORS.instagram_profile : ACTORS.tiktok_profile;
      const input = isIg
        ? { username: [profile.username], resultsLimit: 20 }
        : { profiles: [profile.username], resultsPerPage: 20, profileScrapeSections: ["videos"], profileSorting: "latest" };

      let items: Record<string, unknown>[] = [];
      let debugMeta: Record<string, unknown> = {};
      try {
        const testRes = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
        const testBody = await testRes.json();
        debugMeta.tokenTest = testBody;

        items = await runActor(actorId, input, token);
        debugMeta.itemsCount = items.length;
      } catch (e: any) {
        debugMeta.runError = e.message;
      }

      if (debugMode) {
        debugItems.push({ profile: profile.username, input, meta: debugMeta, sample: items.slice(0, 1) });
      }

      console.log(`[radar-scan] perfil ${profile.username}: ${items.length} posts retornados pelo Apify`);
      console.log(`[radar-scan] primeiro post sample:`, JSON.stringify(items[0] ?? {}).substring(0, 300));

      const mapper = isIg ? mapInstagram : mapTiktok;
      const mapped = items.map(mapper);

      // ── Extract profile metadata ──
      const profileMeta = extractProfileMeta(items, isIg);
      const profileFollowers = profileMeta.followers_count || profile.followers_count;

      // ── Calculate posting frequency & engagement ──
      const freq = calcPostFrequency(mapped);
      const engagementScore = calcEngagement7d(mapped, profileFollowers);

      // ── Update profile with all metrics ──
      const updateData: Record<string, unknown> = {
        last_scanned_at: now,
        followers_count: profileFollowers,
      };
      if (profileMeta.avatar_url) updateData.avatar_url = profileMeta.avatar_url;
      if (profileMeta.posts_count != null) updateData.posts_count = profileMeta.posts_count;
      if (freq.avg_posts_per_day != null) updateData.avg_posts_per_day = freq.avg_posts_per_day;
      if (freq.avg_posts_per_week != null) updateData.avg_posts_per_week = freq.avg_posts_per_week;
      if (freq.avg_posts_per_month != null) updateData.avg_posts_per_month = freq.avg_posts_per_month;
      if (engagementScore != null) updateData.engagement_score_7d = engagementScore;

      await supabase.from("monitored_profiles").update(updateData).eq("id", profile.id);

      // ── Insert profile_history snapshot ──
      const avgViews7d = mapped.length > 0
        ? Math.round(mapped.reduce((s, p) => s + p.views, 0) / mapped.length * 100) / 100
        : null;
      const avgLikes7d = mapped.length > 0
        ? Math.round(mapped.reduce((s, p) => s + p.likes, 0) / mapped.length * 100) / 100
        : null;

      await supabase.from("profile_history").insert({
        profile_id: profile.id,
        user_id: userId,
        followers_count: profileFollowers,
        posts_count: profileMeta.posts_count,
        avg_views_7d: avgViews7d,
        avg_likes_7d: avgLikes7d,
        engagement_score: engagementScore,
      });

      // ── Detect & upsert virals ──
      const virals = mapped.filter((p) => {
        if (!p.followers_at_capture && profileFollowers) p.followers_at_capture = profileFollowers;
        return isViral(p, !!profileFollowers);
      });

      console.log(`[radar-scan] virais encontrados: ${virals.length} de ${mapped.length} posts`);
      console.log(`[radar-scan] followers_at_capture: ${profileFollowers}, primeiro post views: ${mapped[0]?.views ?? 0}`);

      if (virals.length > 0) {
        const rows = virals.map((v) => ({
          user_id: userId,
          source_type: "profile",
          source_id: profile.id,
          platform: profile.platform,
          username: v.username || profile.username,
          post_url: v.post_url,
          thumbnail_url: v.thumbnail,
          caption: v.caption,
          view_count: v.views,
          like_count: v.likes,
          comment_count: v.comments,
          followers_at_capture: v.followers_at_capture || profileFollowers,
          virality_rate: viralityRate(v.views, v.followers_at_capture || profileFollowers),
          scan_week: weekNum,
        }));

        totalFound += await upsertVirals(supabase, rows);
      }
    } catch (err) {
      console.error(`Error scanning profile ${profile.username}:`, err);
    }
  }

  return { found: totalFound, debugItems };
}

// ── Scan topics ──

async function scanTopics(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  token: string,
) {
  const { data: topics } = await supabase
    .from("monitored_topics")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!topics || topics.length === 0) return 0;

  let totalFound = 0;
  const now = new Date().toISOString();
  const weekNum = `${new Date().getFullYear()}-W${String(Math.ceil((new Date().getDate()) / 7)).padStart(2, "0")}`;

  for (const topic of topics) {
    const platforms: string[] =
      topic.platform === "ambos" ? ["instagram", "tiktok"] : [topic.platform];

    for (const platform of platforms) {
      try {
        const isIg = platform === "instagram";
        const actorId = isIg ? ACTORS.instagram_topic : ACTORS.tiktok_topic;
        const input = isIg
          ? { hashtags: [topic.topic], resultsLimit: 30 }
          : { hashtags: [topic.topic], resultsPerPage: 30 };

        const items = await runActor(actorId, input, token);
        const mapper = isIg ? mapInstagram : mapTiktok;
        const mapped = items.map(mapper);

        // For topics we don't have profile-level followers → use 10k min views rule
        const virals = mapped.filter((p) => isViral(p, false));

        if (virals.length > 0) {
          const rows = virals.map((v) => ({
            user_id: userId,
            source_type: "topic",
            source_id: topic.id,
            platform,
            username: v.username,
            post_url: v.post_url,
            thumbnail_url: v.thumbnail,
            caption: v.caption,
            view_count: v.views,
            like_count: v.likes,
            comment_count: v.comments,
            followers_at_capture: v.followers_at_capture,
            virality_rate: viralityRate(v.views, v.followers_at_capture),
            scan_week: weekNum,
          }));

          totalFound += await upsertVirals(supabase, rows);
        }

        await supabase.from("monitored_topics").update({ last_scanned_at: now }).eq("id", topic.id);
      } catch (err) {
        console.error(`Error scanning topic ${topic.topic} on ${platform}:`, err);
      }
    }
  }

  return totalFound;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY_TOKEN) throw new Error("APIFY_API_TOKEN is not configured");

    const { scan_type = "all", user_id, debug = false } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[radar-scan] START scan_type=${scan_type} user_id=${user_id} debug=${debug}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userId = user_id;

    let found = 0;
    let allDebugItems: Record<string, unknown>[] = [];

    if (scan_type === "profiles" || scan_type === "all") {
      const result = await scanProfiles(supabase, userId, APIFY_TOKEN, debug);
      found += result.found;
      allDebugItems.push(...result.debugItems);
    }

    if (scan_type === "topics" || scan_type === "all") {
      found += await scanTopics(supabase, userId, APIFY_TOKEN);
    }

    // ── Recalculate rank positions for all user virals ──
    await recalcRankPositions(supabase, userId);

    console.log(`[radar-scan] DONE found=${found}`);

    const responseBody: Record<string, unknown> = { success: true, found };
    if (debug) {
      responseBody.debugItems = allDebugItems;
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("radar-scan error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
