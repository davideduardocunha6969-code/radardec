

## Plan: Fix Engagement Rate Calculation (7d, 30d, Historical) + Fetch All Posts

### Problems
1. **Engagement is only calculated for 7 days** — no 30d or historical (all-time from fetched posts) engagement stored
2. **Only 30 posts fetched** — no pagination, so accounts posting frequently miss posts in the 30-day window
3. **Averages use `last10` slice** instead of actual 7d/30d post groups

### Changes

#### 1. Database Migration
Add new columns to `monitored_profiles`:
- `engagement_score_30d NUMERIC` — engagement rate from posts in last 30 days
- `engagement_score_all NUMERIC` — engagement rate from all fetched posts (historical baseline)

#### 2. Edge Function (`instagram-insights`)

**Pagination**: After initial fetch of 30 posts, follow `mediaRes.paging?.next` until oldest post is >30 days old or cap of 100 posts reached.

**Three engagement rates** (each = average of per-post engagement where `engagement_post = (likes+comments+saves+shares)/followers*100`):
- `engagement_score_7d` = average of posts from last 7 days
- `engagement_score_30d` = average of posts from last 30 days  
- `engagement_score_all` = average of ALL fetched posts

**Averages recalculated per window**:
- `avg_likes_recent`, `avg_comments_recent`, `avg_views_recent`, `avg_shares_recent`, `avg_saves_recent` → from **last 30 days** posts (not last 10)

**History upsert** — also store `avg_engagement_30d`, `avg_views_30d`, `avg_likes_30d`, `posts_count_7d`, `posts_count_30d`.

#### 3. Frontend (`MinhasContasDetail.tsx`)

Update `EngagementSection` to show three cards:
- "Taxa 7d" → `engagement_score_7d`
- "Taxa 30d" → `engagement_score_30d`  
- "Taxa Histórica" → `engagement_score_all`

#### 4. Hook (`useMinhasContas.ts`)
Add `engagement_score_30d` and `engagement_score_all` to the `OwnProfile` type.

### Files Modified
- **Migration**: new SQL adding 2 columns
- **Edge Function**: `supabase/functions/instagram-insights/index.ts` — pagination + 3 engagement calcs
- **Frontend**: `src/pages/MinhasContasDetail.tsx` — display 3 rates
- **Hook**: `src/hooks/useMinhasContas.ts` — type update

