import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2, Users, ImageIcon, TrendingUp, Eye, Heart, MessageCircle, Bookmark, Share2, Globe, ExternalLink, BarChart3, Calendar, Award, MousePointerClick, Binoculars, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useMinhasContas, type OwnProfile } from "@/hooks/useMinhasContas";
import type { ProfileHistory } from "@/hooks/useRadarViralizacao";

// ── Helpers ──

function formatNumber(n: number | null | undefined): string {
  if (n == null || n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(Math.round(n));
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

interface PostData {
  id: string;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  media_type?: string;
  media_product_type?: string;
  like_count: number;
  comments_count: number;
  saved: number;
  shares_count: number;
  video_views: number;
  impressions: number;
  reach: number;
  total_interactions: number;
  timestamp?: string;
  engagement_post: number;
  caption?: string | null;
}

const MEDAL = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#94a3b8", "#64748b", "#475569"];

function mediaLabel(type?: string): string {
  if (type === "VIDEO") return "Reel";
  if (type === "CAROUSEL_ALBUM") return "Carrossel";
  return "Foto";
}

// ── Main Page ──

export default function MinhasContasDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ownProfiles, loadingProfiles, scanProfile, isScanning, fetchHistory } = useMinhasContas();

  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [history, setHistory] = useState<ProfileHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Find profile
  useEffect(() => {
    if (!loadingProfiles && id) {
      const found = ownProfiles.find((p) => p.id === id);
      setProfile(found ?? null);
    }
  }, [ownProfiles, loadingProfiles, id]);

  // Fetch history
  useEffect(() => {
    if (profile) {
      setLoadingHistory(true);
      fetchHistory(profile.id)
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [profile?.id]);

  if (loadingProfiles) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate("/marketing/radar")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <p className="text-center text-muted-foreground py-12">Perfil não encontrado.</p>
      </div>
    );
  }

  const p = profile;
  const postsData: PostData[] = (p as any).posts_data ?? [];
  const topPosts: PostData[] = (p.top_posts as PostData[]) ?? [];

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/marketing/radar")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Radar
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Último scan: {timeAgo(p.last_scanned_at)}</span>
          <Button size="sm" disabled={isScanning} onClick={() => scanProfile(p.id)}>
            {isScanning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Escanear
          </Button>
        </div>
      </div>

      {/* SECTION 1 — Profile Header */}
      <ProfileHeaderSection profile={p} />

      {/* SECTION 2 — Engagement */}
      <EngagementSection profile={p} />

      {/* SECTION 3 — Audience */}
      <AudienceSection profile={p} />

      {/* SECTION 4 — Evolution */}
      <EvolutionSection history={history} loading={loadingHistory} />

      {/* SECTION 5 — Posts Grid */}
      <PostsGridSection posts={postsData} followers={p.followers_count ?? 0} />

      {/* SECTION 6 — Top 5 */}
      <TopPostsSection posts={topPosts} />
    </div>
  );
}

// ── SECTION 1: Header ──

function ProfileHeaderSection({ profile: p }: { profile: OwnProfile }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-5 mb-6">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt={p.username} className="w-20 h-20 rounded-full object-cover border-2 border-border" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{p.display_name || p.username}</h2>
              {(p as any).is_verified && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">✓ Verificado</Badge>}
              {(p as any).is_business && <Badge variant="secondary" className="text-xs">Business</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">@{p.username}</p>
            {p.biography && <p className="text-sm text-muted-foreground mt-1">{p.biography}</p>}
            {(p as any).external_url && (
              <a href={(p as any).external_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                <Globe className="w-3.5 h-3.5" />{(p as any).external_url}
              </a>
            )}
          </div>
        </div>

        {/* Metrics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniMetric label="Seguidores" value={formatNumber(p.followers_count)} icon={<Users className="w-4 h-4" />} />
          <MiniMetric label="Seguindo" value={formatNumber((p as any).follows_count ?? p.following_count)} icon={<Users className="w-4 h-4" />} />
          <MiniMetric label="Posts" value={formatNumber(p.posts_count)} icon={<ImageIcon className="w-4 h-4" />} />
          <MiniMetric label="Views 30d" value={formatNumber(p.avg_views_recent ? Math.round(p.avg_views_recent * 10) : null)} icon={<Eye className="w-4 h-4" />} />
          <MiniMetric label="Alcance 30d" value={formatNumber((p as any).reach_30d)} icon={<Binoculars className="w-4 h-4" />} />
          <MiniMetric label="Impressões 30d" value={formatNumber((p as any).impressions_30d)} icon={<BarChart3 className="w-4 h-4" />} />
          <MiniMetric label="Visitas perfil 30d" value={formatNumber((p as any).profile_views_30d)} icon={<Eye className="w-4 h-4" />} />
          <MiniMetric label="Cliques site 30d" value={formatNumber((p as any).website_clicks_30d)} icon={<MousePointerClick className="w-4 h-4" />} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ── SECTION 2: Engagement ──

function EngagementSection({ profile: p }: { profile: OwnProfile }) {
  const engRate = p.engagement_rate ?? p.engagement_score_7d;
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" /> Engajamento
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Taxa (7 dias)</p>
            <p className="text-2xl font-bold text-primary">{engRate != null ? `${engRate.toFixed(2)}%` : "—"}</p>
          </CardContent>
        </Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Likes médios</p>
          <p className="text-lg font-bold">{p.avg_likes_recent != null ? formatNumber(Math.round(p.avg_likes_recent)) : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Comentários</p>
          <p className="text-lg font-bold">{p.avg_comments_recent != null ? formatNumber(Math.round(p.avg_comments_recent)) : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Saves médios</p>
          <p className="text-lg font-bold">{p.avg_saves_recent != null ? String(Math.round(p.avg_saves_recent)) : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Shares médios</p>
          <p className="text-lg font-bold">{p.avg_shares_recent != null ? String(Math.round(p.avg_shares_recent)) : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Views (Reels)</p>
          <p className="text-lg font-bold">{p.avg_views_recent != null ? formatNumber(Math.round(p.avg_views_recent)) : "—"}</p>
        </CardContent></Card>
      </div>
    </div>
  );
}

// ── SECTION 3: Audience ──

function AudienceSection({ profile: p }: { profile: OwnProfile }) {
  const genderAge = (p as any).audience_gender_age;
  const city = (p as any).audience_city;
  const country = (p as any).audience_country;

  if (!genderAge && !city && !country) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Audiência
        </h3>
        <p className="text-sm text-muted-foreground">Dados de audiência não disponíveis (requer conta profissional com permissões completas).</p>
      </div>
    );
  }

  // Parse gender/age for pie chart
  const genderData = useMemo(() => {
    if (!genderAge || typeof genderAge !== "object") return [];
    const genders: Record<string, number> = {};
    for (const [key, value] of Object.entries(genderAge)) {
      const gender = key.split(".")[0];
      const label = gender === "M" ? "Masculino" : gender === "F" ? "Feminino" : gender;
      genders[label] = (genders[label] ?? 0) + (value as number);
    }
    return Object.entries(genders).map(([name, value]) => ({ name, value }));
  }, [genderAge]);

  // Top 5 cities
  const cityData = useMemo(() => {
    if (!city || typeof city !== "object") return [];
    return Object.entries(city)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.split(",")[0], value: value as number }));
  }, [city]);

  // Top 5 countries
  const countryData = useMemo(() => {
    if (!country || typeof country !== "object") return [];
    return Object.entries(country)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [country]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> Audiência
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {genderData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Gênero</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {cityData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Top Cidades</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {countryData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Top Países</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={countryData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── SECTION 4: Evolution ──

function EvolutionSection({ history, loading }: { history: ProfileHistory[]; loading: boolean }) {
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d">("30d");

  const filteredHistory = useMemo(() => {
    if (chartPeriod === "7d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return history.filter(h => new Date(h.recorded_at) >= cutoff);
    }
    return history;
  }, [history, chartPeriod]);

  const followersData = filteredHistory.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    seguidores: h.followers_count ?? 0,
    engajamento: h.engagement_score ?? 0,
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Evolução
        </h3>
        <div className="flex gap-2">
          {(["7d", "30d"] as const).map(v => (
            <button
              key={v}
              onClick={() => setChartPeriod(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${chartPeriod === v ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:bg-accent"}`}
            >
              {v === "7d" ? "7 dias" : "30 dias"}
            </button>
          ))}
        </div>
      </div>

      {followersData.length < 2 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Dados históricos insuficientes. Execute mais scans para gerar o gráfico.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Seguidores</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={followersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="seguidores" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Engajamento (%)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={followersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="engajamento" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── SECTION 5: Posts Grid ──

function PostsGridSection({ posts, followers }: { posts: PostData[]; followers: number }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [periodFilter, setPeriodFilter] = useState<string>("30d");

  const filtered = useMemo(() => {
    let list = [...posts];

    // Period
    if (periodFilter === "7d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      list = list.filter(p => p.timestamp && new Date(p.timestamp) >= cutoff);
    }

    // Type
    if (typeFilter !== "all") {
      list = list.filter(p => {
        if (typeFilter === "VIDEO") return p.media_type === "VIDEO";
        if (typeFilter === "IMAGE") return p.media_type === "IMAGE";
        if (typeFilter === "CAROUSEL_ALBUM") return p.media_type === "CAROUSEL_ALBUM";
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "likes": return b.like_count - a.like_count;
        case "engagement": return b.engagement_post - a.engagement_post;
        case "views": return b.video_views - a.video_views;
        case "saves": return b.saved - a.saved;
        case "shares": return b.shares_count - a.shares_count;
        default: return new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime();
      }
    });

    return list;
  }, [posts, typeFilter, sortBy, periodFilter]);

  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" /> Publicações ({filtered.length})
        </h3>
        <div className="flex gap-2 flex-wrap">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="VIDEO">Reels</SelectItem>
              <SelectItem value="IMAGE">Fotos</SelectItem>
              <SelectItem value="CAROUSEL_ALBUM">Carrosséis</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><ArrowUpDown className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="likes">Likes</SelectItem>
              <SelectItem value="engagement">Engajamento</SelectItem>
              <SelectItem value="views">Views</SelectItem>
              <SelectItem value="saves">Saves</SelectItem>
              <SelectItem value="shares">Shares</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum post encontrado para os filtros selecionados.</p>
      )}
    </div>
  );
}

function PostCard({ post }: { post: PostData }) {
  const imgSrc = post.thumbnail_url || post.media_url;
  return (
    <Card className="overflow-hidden">
      {/* Thumbnail */}
      <div className="aspect-square relative bg-muted">
        {imgSrc ? (
          <img src={imgSrc} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm">{mediaLabel(post.media_type)}</Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge className="bg-primary/80 text-primary-foreground text-[10px] backdrop-blur-sm">{post.engagement_post.toFixed(2)}%</Badge>
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        {post.caption && <p className="text-xs line-clamp-2 text-muted-foreground">{post.caption}</p>}
        <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{formatNumber(post.like_count)}</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{formatNumber(post.comments_count)}</span>
          {post.video_views > 0 && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatNumber(post.video_views)}</span>}
          <span className="flex items-center gap-0.5"><Bookmark className="w-3 h-3" />{formatNumber(post.saved)}</span>
          <span className="flex items-center gap-0.5"><Share2 className="w-3 h-3" />{formatNumber(post.shares_count)}</span>
          {post.timestamp && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(post.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          )}
        </div>
        {post.permalink && (
          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />Ver post
          </a>
        )}
      </CardContent>
    </Card>
  );
}

// ── SECTION 6: Top 5 ──

function TopPostsSection({ posts }: { posts: PostData[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" /> Top 5 Melhores Posts
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {posts.slice(0, 5).map((post, idx) => {
          const imgSrc = post.thumbnail_url || post.media_url;
          return (
            <Card key={post.id || idx} className="overflow-hidden border-2 border-primary/20">
              <div className="aspect-square relative bg-muted">
                {imgSrc ? (
                  <img src={imgSrc} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 text-2xl">{MEDAL[idx]}</div>
                <div className="absolute bottom-2 right-2">
                  <Badge className="bg-primary/80 text-primary-foreground text-xs backdrop-blur-sm">{post.engagement_post.toFixed(2)}%</Badge>
                </div>
              </div>
              <CardContent className="p-3 space-y-1">
                <Badge variant="outline" className="text-[10px]">{mediaLabel(post.media_type)}</Badge>
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{formatNumber(post.like_count)}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{formatNumber(post.comments_count)}</span>
                  <span className="flex items-center gap-0.5"><Bookmark className="w-3 h-3" />{formatNumber(post.saved)}</span>
                  <span className="flex items-center gap-0.5"><Share2 className="w-3 h-3" />{formatNumber(post.shares_count)}</span>
                </div>
                {post.permalink && (
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />Ver
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
