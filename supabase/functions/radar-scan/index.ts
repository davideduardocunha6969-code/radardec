import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Actor IDs ──
const ACTORS = {
  instagram_profile: "apify/instagram-reel-scraper",
  tiktok_profile: "clockworks/tiktok-scraper",
  instagram_topic: "apify/instagram-hashtag-scraper",
  tiktok_topic: "clockworks/tiktok-scraper",
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
      let profileFollowers = profile.followers_count;

      // instagram-reel-scraper already returns ownerFollowersCount per post, no separate details call needed
      if (isIg) {
        // skip separate profile details fetch — reel scraper includes followers
      }

      const actorId = isIg ? ACTORS.instagram_profile : ACTORS.tiktok_profile;
      const input = isIg
        ? { username: [profile.username], resultsLimit: 20 }
        : { profiles: [profile.username], resultsPerPage: 20, profileScrapeSections: ["videos"], profileSorting: "latest" };

      const items = await runActor(actorId, input, token);

      if (debugMode) {
        console.log(`[DEBUG] raw items count: ${items.length}`);
        console.log(`[DEBUG] raw items sample: ${JSON.stringify(items.slice(0, 1))}`);
      }

      console.log(`[radar-scan] perfil ${profile.username}: ${items.length} posts retornados pelo Apify`);
      console.log(`[radar-scan] primeiro post sample:`, JSON.stringify(items[0] ?? {}).substring(0, 300));

      if (debugMode) {
        debugItems.push(...items.slice(0, 2));
      }

      const mapper = isIg ? mapInstagram : mapTiktok;
      const mapped = items.map(mapper);

      // For TikTok, grab followers from first result
      if (!isIg && mapped.length > 0 && mapped[0].followers_at_capture) {
        profileFollowers = mapped[0].followers_at_capture;
      }

      const virals = mapped.filter((p) => {
        // Inject profile-level followers if post doesn't have its own
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

        await supabase.from("viral_content").insert(rows);
        totalFound += virals.length;
      }

      // Update profile metadata
      const updateData: Record<string, unknown> = { last_scanned_at: now };
      if (profileFollowers) updateData.followers_count = profileFollowers;
      await supabase.from("monitored_profiles").update(updateData).eq("id", profile.id);
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

          await supabase.from("viral_content").insert(rows);
          totalFound += virals.length;
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
