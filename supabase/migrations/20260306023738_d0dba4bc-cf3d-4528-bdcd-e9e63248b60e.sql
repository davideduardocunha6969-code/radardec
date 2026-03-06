
create table public.monitored_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text not null,
  platform text not null,
  display_name text,
  followers_count integer,
  avatar_url text,
  is_active boolean default true,
  last_scanned_at timestamptz,
  created_at timestamptz default now()
);

create table public.monitored_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  topic text not null,
  platform text not null,
  is_active boolean default true,
  last_scanned_at timestamptz,
  created_at timestamptz default now()
);

create table public.viral_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_type text not null,
  source_id uuid,
  platform text not null,
  username text,
  post_url text not null,
  thumbnail_url text,
  caption text,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  followers_at_capture integer,
  virality_rate numeric,
  is_modeled boolean default false,
  modeled_at timestamptz,
  detected_at timestamptz default now(),
  scan_week text
);

alter table public.monitored_profiles enable row level security;
alter table public.monitored_topics enable row level security;
alter table public.viral_content enable row level security;

create policy "user_own" on public.monitored_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_own" on public.monitored_topics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_own" on public.viral_content for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
