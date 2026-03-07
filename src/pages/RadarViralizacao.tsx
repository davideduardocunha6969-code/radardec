import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Radar, Plus, Trash2, Loader2, Eye, Heart, MessageCircle, ExternalLink, CheckCircle2, User, BarChart3, TrendingUp, Calendar, Video, X, Play, Camera, Music, Facebook, RefreshCw, Globe, Shield, Briefcase, Users, ImageIcon, Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRadarViralizacao, type ViralContent, type MonitoredProfile, type ProfileHistory } from "@/hooks/useRadarViralizacao";
import { useMinhasContas, type OwnProfile } from "@/hooks/useMinhasContas";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Helpers ──

function formatNumber(n: number | null): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function platformBadge(platform: string) {
  if (platform === "instagram") {
    return <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">Instagram</Badge>;
  }
  return <Badge className="bg-zinc-800/80 text-zinc-200 border-zinc-600/40 text-xs">TikTok</Badge>;
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

function AvatarImage({ src, alt, className = "w-14 h-14 rounded-full object-cover border-2 border-gray-200" }: { src: string | null; alt: string; className?: string }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [src]);
  if (!src || hasError) {
    return (
      <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center flex-shrink-0">
        <User className="w-7 h-7 text-gray-400" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" crossOrigin="anonymous" onError={() => setHasError(true)} />;
}

function ThumbnailImage({ src, postUrl, platform }: { src: string | null; postUrl: string; platform: string }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [src]);
  const fallback = (
    <a href={postUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900 text-gray-400 hover:text-white transition-colors">
      <Play className="w-10 h-10" />
      <span className="text-xs">{platform === "instagram" ? "Ver no Instagram" : "Ver no TikTok"}</span>
    </a>
  );
  if (!src || hasError) return fallback;
  return <img src={src} alt="thumbnail" referrerPolicy="no-referrer" crossOrigin="anonymous" className="w-full h-full object-cover" onError={() => setHasError(true)} />;
}

function engagementBadge(score: number | null) {
  if (score == null) return <Badge variant="secondary" className="text-xs">—</Badge>;
  if (score > 5) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-xs">{score.toFixed(1)}%</Badge>;
  if (score >= 1) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs">{score.toFixed(1)}%</Badge>;
  return <Badge variant="secondary" className="text-xs">{score.toFixed(1)}%</Badge>;
}

// ── Legal Area helpers ──

const LEGAL_AREAS = [
  { value: "previdenciario", label: "Previdenciário", color: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" },
  { value: "trabalhista", label: "Trabalhista", color: "bg-orange-600/20 text-orange-400 border-orange-500/30" },
  { value: "bancario", label: "Bancário", color: "bg-blue-600/20 text-blue-400 border-blue-500/30" },
  { value: "outro", label: "Outro", color: "bg-zinc-600/20 text-zinc-400 border-zinc-500/30" },
] as const;

function legalAreaLabel(value: string | null): string {
  return LEGAL_AREAS.find((a) => a.value === value)?.label ?? value ?? "";
}

function legalAreaBadge(value: string | null) {
  if (!value) return null;
  const area = LEGAL_AREAS.find((a) => a.value === value);
  if (!area) return <Badge variant="secondary" className="text-[10px] px-1.5">{value}</Badge>;
  return <Badge className={`${area.color} text-[10px] px-1.5`}>{area.label}</Badge>;
}

function LegalAreaPillFilter({
  accounts,
  selected,
  onSelect,
}: {
  accounts: Array<{ legal_area: string | null }>;
  selected: string | null;
  onSelect: (v: string | null) => void;
}) {
  const available = useMemo(() => {
    const set = new Set(accounts.map((a) => a.legal_area).filter(Boolean) as string[]);
    return LEGAL_AREAS.filter((a) => set.has(a.value));
  }, [accounts]);

  if (available.length <= 1) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selected === null ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}
      >
        Todos
      </button>
      {available.map((a) => (
        <button
          key={a.value}
          onClick={() => onSelect(selected === a.value ? null : a.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selected === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

function LegalAreaSelect({ value, onChange, className = "w-[180px]" }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Ramo do Direito" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum</SelectItem>
          {LEGAL_AREAS.map((a) => (
            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Profile Detail Sheet ──

function ProfileDetailSheet({
  profile,
  open,
  onOpenChange,
  fetchHistory,
}: {
  profile: MonitoredProfile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fetchHistory: (id: string) => Promise<ProfileHistory[]>;
}) {
  const [history, setHistory] = useState<ProfileHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setLoadingHistory(true);
      fetchHistory(profile.id)
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [open, profile?.id]);

  if (!profile) return null;

  const followersData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    seguidores: h.followers_count ?? 0,
  }));

  const viewsData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    views: h.avg_views_7d ?? 0,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg">@{profile.username}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                {platformBadge(profile.platform)}
                <span className="text-sm text-muted-foreground">{formatNumber(profile.followers_count)} seguidores</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Metrics cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Posts totais</p>
            <p className="text-xl font-bold text-foreground">{formatNumber(profile.posts_count)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Posts/dia</p>
            <p className="text-xl font-bold text-foreground">{profile.avg_posts_per_day?.toFixed(1) ?? "—"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Posts/semana</p>
            <p className="text-xl font-bold text-foreground">{profile.avg_posts_per_week?.toFixed(1) ?? "—"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Posts/mês</p>
            <p className="text-xl font-bold text-foreground">{profile.avg_posts_per_month?.toFixed(1) ?? "—"}</p>
          </CardContent></Card>
        </div>

        {/* Charts */}
        {loadingHistory ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : history.length > 0 ? (
          <>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Evolução de Seguidores
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followersData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Line type="monotone" dataKey="seguidores" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Views Médias por Scan
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhum histórico disponível ainda. Execute um scan para gerar dados.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Perfis Tab ──

function PerfisTab() {
  const { monitoredProfiles, loadingProfiles, isScanning, addProfile, removeProfile, toggleProfile, runScan, fetchProfileHistory } = useRadarViralizacao();
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");
  const [selectedProfile, setSelectedProfile] = useState<MonitoredProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleAdd = () => {
    if (!username.trim()) return;
    addProfile.mutate({ username: username.trim().replace("@", ""), platform });
    setUsername("");
  };

  const sorted = [...monitoredProfiles].sort((a, b) => (b.engagement_score_7d ?? 0) - (a.engagement_score_7d ?? 0));

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Username</label>
              <Input
                placeholder="@usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="w-[160px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Plataforma</label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={addProfile.isPending || !username.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan button */}
      <div className="flex justify-end">
        <Button onClick={() => runScan("profiles")} disabled={isScanning || monitoredProfiles.length === 0}>
          {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Radar className="h-4 w-4 mr-2" />}
          Escanear Perfis Agora
        </Button>
      </div>

      {/* Grid */}
      {loadingProfiles ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : monitoredProfiles.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhum perfil monitorado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((p) => (
            <Card
              key={p.id}
              className={`cursor-pointer transition-all hover:border-primary/50 ${!p.is_active ? "opacity-50" : ""}`}
              onClick={() => { setSelectedProfile(p); setSheetOpen(true); }}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <AvatarImage src={p.avatar_url} alt={p.username} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">@{p.username}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {platformBadge(p.platform)}
                      <span className="text-xs text-muted-foreground">{formatNumber(p.followers_count)} seg.</span>
                    </div>
                  </div>
                  {engagementBadge(p.engagement_score_7d)}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {timeAgo(p.last_scanned_at)}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={p.is_active ?? true}
                      onCheckedChange={(v) => toggleProfile.mutate({ id: p.id, is_active: v })}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeProfile.mutate(p.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProfileDetailSheet
        profile={selectedProfile}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        fetchHistory={fetchProfileHistory}
      />
    </div>
  );
}

// ── Temas Tab ──

function TemasTab() {
  const { topics, loadingTopics, isScanning, addTopic, removeTopic, toggleTopic, runScan } = useRadarViralizacao();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "tiktok" | "ambos">("ambos");

  const handleAdd = () => {
    if (!topic.trim()) return;
    addTopic.mutate({ topic: topic.trim().replace("#", ""), platform });
    setTopic("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Tema / Hashtag</label>
              <Input
                placeholder="#direitotrabalhista"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="w-[160px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Plataforma</label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={addTopic.isPending || !topic.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => runScan("topics")} disabled={isScanning || topics.length === 0}>
          {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Radar className="h-4 w-4 mr-2" />}
          Escanear Temas Agora
        </Button>
      </div>

      {loadingTopics ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : topics.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhum tema monitorado ainda.</p>
      ) : (
        <div className="space-y-2">
          {topics.map((t) => (
            <Card key={t.id} className={`transition-opacity ${!t.is_active ? "opacity-50" : ""}`}>
              <CardContent className="py-3 px-4 flex items-center gap-4 flex-wrap">
                {t.platform === "ambos" ? (
                  <Badge className="bg-accent/20 text-accent-foreground border-accent/30 text-xs">Ambos</Badge>
                ) : platformBadge(t.platform)}
                <span className="font-medium text-foreground">#{t.topic}</span>
                <span className="text-xs text-muted-foreground ml-auto">Último scan: {timeAgo(t.last_scanned_at)}</span>
                <Switch
                  checked={t.is_active}
                  onCheckedChange={(v) => toggleTopic.mutate({ id: t.id, is_active: v })}
                />
                <Button variant="ghost" size="icon" onClick={() => removeTopic.mutate(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Virais Tab ──

function ViraisTab() {
  const { viralContent, loadingVirals, markAsModeled, dismissViral } = useRadarViralizacao();
  const navigate = useNavigate();
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [onlyNotModeled, setOnlyNotModeled] = useState(false);
  const [sortBy, setSortBy] = useState<string>("virality_rate");

  const filtered = viralContent
    .filter((v) => {
      if (filterPlatform !== "all" && v.platform !== filterPlatform) return false;
      if (onlyNotModeled && v.is_modeled) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "virality_rate") return (b.virality_rate ?? 0) - (a.virality_rate ?? 0);
      if (sortBy === "view_count") return (b.view_count ?? 0) - (a.view_count ?? 0);
      return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    });

  const handleSendToModeler = async (item: ViralContent) => {
    await markAsModeled.mutateAsync(item.id);
    navigate(`/marketing/modelador?link=${encodeURIComponent(item.post_url)}`);
  };

  const viralityColor = (rate: number | null) => {
    if (!rate) return "text-muted-foreground";
    if (rate > 100) return "text-emerald-400";
    if (rate >= 50) return "text-yellow-400";
    return "text-muted-foreground";
  };

  if (loadingVirals) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="virality_rate">Taxa de Viralização</SelectItem>
            <SelectItem value="view_count">Visualizações</SelectItem>
            <SelectItem value="detected_at">Mais Recentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plataforma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={onlyNotModeled} onCheckedChange={setOnlyNotModeled} />
          <span className="text-sm text-muted-foreground">Apenas não modelados</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhum viral detectado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item, index) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all ${item.is_modeled ? "border-emerald-500/50" : ""}`}
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                <ThumbnailImage src={item.thumbnail_url} postUrl={item.post_url} platform={item.platform} />
                {/* Rank badge */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className="bg-background/80 text-foreground border-border text-xs font-bold backdrop-blur-sm">
                    #{index + 1}
                  </Badge>
                  {platformBadge(item.platform)}
                  {item.is_modeled && (
                    <Badge className="bg-emerald-600/80 text-white border-emerald-500/50 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Modelado
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Username + virality */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {item.username ? `@${item.username}` : "—"}
                  </span>
                  {item.virality_rate != null && (
                    <span className={`text-lg font-bold ${viralityColor(item.virality_rate)}`}>
                      {item.virality_rate}%
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatNumber(item.view_count)}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{formatNumber(item.like_count)}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{formatNumber(item.comment_count)}</span>
                </div>

                {/* Caption */}
                {item.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.caption}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {!item.is_modeled && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSendToModeler(item)}
                      disabled={markAsModeled.isPending}
                    >
                      Enviar ao Modelador
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissViral.mutate(item.id)}
                    disabled={dismissViral.isPending}
                    title="Desconsiderar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={item.post_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-tab placeholders ──

function InstagramContasTab() {
  const { instagramProfiles, loadingProfiles, isScanning, scanProfile, scanAllByPlatform, fetchHistory, updateLegalArea } = useMinhasContas();
  const [selectedProfile, setSelectedProfile] = useState<OwnProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [history, setHistory] = useState<ProfileHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [legalAreaFilter, setLegalAreaFilter] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    if (!legalAreaFilter) return instagramProfiles;
    return instagramProfiles.filter((p) => p.legal_area === legalAreaFilter);
  }, [instagramProfiles, legalAreaFilter]);

  const openAnalysis = useCallback(async (profile: OwnProfile) => {
    setSelectedProfile(profile);
    setSheetOpen(true);
    setLoadingHistory(true);
    try {
      const h = await fetchHistory(profile.id);
      setHistory(h);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  }, [fetchHistory]);

  if (loadingProfiles) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">{instagramProfiles.length} conta(s) monitorada(s)</span>
        <Button size="sm" disabled={isScanning || instagramProfiles.length === 0} onClick={() => scanAllByPlatform("instagram")}>
          {isScanning ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
          Escanear todas as contas Instagram
        </Button>
      </div>

      {instagramProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Nenhuma conta Instagram marcada como própria.</p>
          <p className="text-xs mt-1">Vá em "Perfis" e marque um perfil como conta própria.</p>
        </div>
      )}

      {/* Legal area pill filter */}
      <LegalAreaPillFilter accounts={instagramProfiles} selected={legalAreaFilter} onSelect={setLegalAreaFilter} />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {/* Identity */}
              <div className="flex items-center gap-3">
                <AvatarImage src={p.avatar_url} alt={p.username} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.display_name || p.username}</p>
                  <p className="text-xs text-muted-foreground">@{p.username}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {p.is_verified && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5">Verificado</Badge>}
                    {p.is_business && <Badge variant="secondary" className="text-[10px] px-1.5">Business</Badge>}
                    {legalAreaBadge(p.legal_area)}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 text-center gap-2">
                <div><p className="text-sm font-bold">{formatNumber(p.followers_count)}</p><p className="text-[10px] text-muted-foreground">Seguidores</p></div>
                <div><p className="text-sm font-bold">{formatNumber(p.following_count)}</p><p className="text-[10px] text-muted-foreground">Seguindo</p></div>
                <div><p className="text-sm font-bold">{formatNumber(p.posts_count)}</p><p className="text-[10px] text-muted-foreground">Posts</p></div>
              </div>

              {/* Engagement */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Engajamento</span>
                <EngagementBadgeInline rate={p.engagement_rate} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Views médias</span>
                <span className="font-medium">{p.avg_views_recent != null ? formatNumber(Math.round(p.avg_views_recent)) : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Likes médios</span>
                <span className="font-medium">{p.avg_likes_recent != null ? formatNumber(Math.round(p.avg_likes_recent)) : "—"}</span>
              </div>

              {/* Last scan */}
              <p className="text-[10px] text-muted-foreground">Último scan: {p.last_scanned_at ? timeAgo(p.last_scanned_at) : "Nunca"}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openAnalysis(p)}>
                  <BarChart3 className="w-3.5 h-3.5 mr-1" />Analisar
                </Button>
                <Button size="sm" className="flex-1" disabled={isScanning} onClick={() => scanProfile(p.id)}>
                  {isScanning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                  Escanear
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analysis Sheet */}
      {selectedProfile && (
        <InstagramAnalysisSheet
          profile={selectedProfile}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          history={history}
          loadingHistory={loadingHistory}
          isScanning={isScanning}
          onScan={() => scanProfile(selectedProfile.id)}
          onUpdateLegalArea={(v) => updateLegalArea.mutate({ id: selectedProfile.id, legal_area: v === "none" ? null : v })}
        />
      )}
    </div>
  );
}

function EngagementBadgeInline({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-muted-foreground">—</span>;
  const cls = rate > 3 ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" : rate >= 1 ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30" : "bg-zinc-700/30 text-zinc-400 border-zinc-600/30";
  return <Badge className={`${cls} text-[10px] px-1.5`}>{rate.toFixed(2)}%</Badge>;
}

function InstagramAnalysisSheet({
  profile: p,
  open,
  onOpenChange,
  history,
  loadingHistory,
  isScanning,
  onScan,
  onUpdateLegalArea,
}: {
  profile: OwnProfile;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  history: ProfileHistory[];
  loadingHistory: boolean;
  isScanning: boolean;
  onScan: () => void;
  onUpdateLegalArea: (v: string) => void;
}) {
  const [periodo, setPeriodo] = useState<PeriodType>('7d');
  const topPosts = (p.top_posts as Array<{ url?: string; likesCount?: number; commentsCount?: number; videoViewCount?: number; displayUrl?: string; caption?: string }>) ?? [];

  const latestHistory = history.length > 0 ? history[history.length - 1] : null;

  const metricsForPeriod = useMemo(() => {
    const pl = periodLabel(periodo);
    if (periodo === '7d') {
      return {
        engagement: p.engagement_rate != null ? `${p.engagement_rate.toFixed(2)}%` : "—",
        views: p.avg_views_recent != null ? formatNumber(Math.round(p.avg_views_recent)) : "—",
        likes: p.avg_likes_recent != null ? formatNumber(Math.round(p.avg_likes_recent)) : "—",
        period: pl,
      };
    }
    if (periodo === '30d') {
      return {
        engagement: latestHistory?.avg_engagement_30d != null ? `${latestHistory.avg_engagement_30d.toFixed(2)}%` : "—",
        views: latestHistory?.avg_views_30d != null ? formatNumber(Math.round(latestHistory.avg_views_30d)) : "—",
        likes: latestHistory?.avg_likes_30d != null ? formatNumber(Math.round(latestHistory.avg_likes_30d)) : "—",
        period: pl,
      };
    }
    // historico
    if (history.length === 0) return { engagement: "—", views: "—", likes: "—", period: pl };
    const validEngagements = history.filter(h => h.engagement_score != null).map(h => h.engagement_score!);
    const validViews = history.filter(h => h.avg_views_7d != null).map(h => h.avg_views_7d!);
    const avgEng = validEngagements.length > 0 ? validEngagements.reduce((a, b) => a + b, 0) / validEngagements.length : null;
    const avgViews = validViews.length > 0 ? validViews.reduce((a, b) => a + b, 0) / validViews.length : null;
    const maxEng = validEngagements.length > 0 ? Math.max(...validEngagements) : null;
    return {
      engagement: avgEng != null ? `${avgEng.toFixed(2)}%` : "—",
      views: avgViews != null ? formatNumber(Math.round(avgViews)) : "—",
      likes: maxEng != null ? `${maxEng.toFixed(2)}%` : "—",
      period: pl,
      firstScan: history.length > 0 ? new Date(history[0].recorded_at).toLocaleDateString("pt-BR") : null,
    };
  }, [periodo, p, latestHistory, history]);

  const followersData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    value: h.followers_count ?? 0,
  }));
  const engagementData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    value: h.engagement_score ?? 0,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Análise do Perfil</SheetTitle>
            <Button size="sm" disabled={isScanning} onClick={onScan}>
              {isScanning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Escanear agora
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Profile header */}
          <div className="flex items-start gap-4">
            <AvatarImage src={p.avatar_url} alt={p.username} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{p.display_name || p.username}</p>
                {p.is_verified && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Verificado</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">@{p.username}</p>
              {p.biography && <p className="text-xs text-muted-foreground line-clamp-3">{p.biography}</p>}
              {p.external_url && (
                <a href={p.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                  <Globe className="w-3 h-3" />{p.external_url}
                </a>
              )}
            </div>
          </div>

          {/* Period selector */}
          <PeriodSelector value={periodo} onChange={setPeriodo} />

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricMiniCard label="Seguidores" value={formatNumber(p.followers_count)} icon={<Users className="w-4 h-4" />} />
            <MetricMiniCard label="Seguindo" value={formatNumber(p.following_count)} icon={<User className="w-4 h-4" />} />
            <MetricMiniCard label="Posts" value={formatNumber(p.posts_count)} icon={<ImageIcon className="w-4 h-4" />} />
            <MetricMiniCard label={periodo === 'historico' ? "Engajamento médio" : "Engajamento"} value={metricsForPeriod.engagement} icon={<TrendingUp className="w-4 h-4" />} period={metricsForPeriod.period} />
            <MetricMiniCard label={periodo === 'historico' ? "Views médias hist." : "Views médias"} value={metricsForPeriod.views} icon={<Eye className="w-4 h-4" />} period={metricsForPeriod.period} />
            <MetricMiniCard label={periodo === 'historico' ? "Melhor engajamento" : "Likes médios"} value={metricsForPeriod.likes} icon={<Heart className="w-4 h-4" />} period={metricsForPeriod.period} />
          </div>

          {periodo === 'historico' && (metricsForPeriod as any).firstScan && (
            <p className="text-xs text-muted-foreground">Primeiro scan: {(metricsForPeriod as any).firstScan}</p>
          )}

          {/* Legal area */}
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm text-muted-foreground">Ramo do Direito</label>
            <LegalAreaSelect value={p.legal_area || "none"} onChange={onUpdateLegalArea} className="flex-1" />
          </div>

          {/* Charts */}
          {loadingHistory ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : followersData.length > 1 ? (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-2">Evolução de Seguidores</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={followersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {periodo === 'historico' && engagementData.length > 1 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Evolução do Engajamento</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<CustomChartTooltip isEngagement />} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Dados históricos insuficientes para gráfico de seguidores.</p>
          )}

          {/* Top posts */}
          {topPosts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Top Posts</h4>
              <div className="grid grid-cols-1 gap-3">
                {topPosts.slice(0, 3).map((post, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <CardContent className="p-3 flex gap-3">
                      {post.displayUrl ? (
                        <img src={post.displayUrl} alt="post" className="w-20 h-20 rounded object-cover flex-shrink-0" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-20 h-20 rounded bg-muted flex items-center justify-center flex-shrink-0"><ImageIcon className="w-6 h-6 text-muted-foreground" /></div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        {post.caption && <p className="text-xs line-clamp-2">{post.caption}</p>}
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(post.videoViewCount ?? 0)}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(post.likesCount ?? 0)}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNumber(post.commentsCount ?? 0)}</span>
                        </div>
                        {post.url && (
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />Ver post
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetricMiniCard({ label, value, icon, period }: { label: string; value: string; icon: React.ReactNode; period?: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          {period && <p className="text-[9px] text-muted-foreground/60">{period}</p>}
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type PeriodType = '7d' | '30d' | 'historico';

function PeriodSelector({ value, onChange }: { value: PeriodType; onChange: (v: PeriodType) => void }) {
  const options: { value: PeriodType; label: string }[] = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: 'historico', label: 'Histórico' },
  ];
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${value === o.value ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:bg-accent"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function periodLabel(p: PeriodType): string {
  if (p === '7d') return 'últimos 7 dias';
  if (p === '30d') return 'últimos 30 dias';
  return 'desde o início';
}

function CustomChartTooltip({ active, payload, label, isEngagement }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold text-foreground">
        {isEngagement ? `${Number(val).toFixed(2)}%` : formatNumber(val)}
      </p>
    </div>
  );
}

function TiktokContasTab() {
  const { tiktokProfiles, loadingProfiles, isScanning, scanProfile, scanAllByPlatform, fetchHistory, updateLegalArea } = useMinhasContas();
  const [selectedProfile, setSelectedProfile] = useState<OwnProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [history, setHistory] = useState<ProfileHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [legalAreaFilter, setLegalAreaFilter] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    if (!legalAreaFilter) return tiktokProfiles;
    return tiktokProfiles.filter((p) => p.legal_area === legalAreaFilter);
  }, [tiktokProfiles, legalAreaFilter]);

  const openAnalysis = useCallback(async (profile: OwnProfile) => {
    setSelectedProfile(profile);
    setSheetOpen(true);
    setLoadingHistory(true);
    try { setHistory(await fetchHistory(profile.id)); } catch { setHistory([]); } finally { setLoadingHistory(false); }
  }, [fetchHistory]);

  if (loadingProfiles) return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">{tiktokProfiles.length} conta(s) monitorada(s)</span>
        <Button size="sm" disabled={isScanning || tiktokProfiles.length === 0} onClick={() => scanAllByPlatform("tiktok")}>
          {isScanning ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
          Escanear todas as contas TikTok
        </Button>
      </div>

      {tiktokProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Nenhuma conta TikTok marcada como própria.</p>
          <p className="text-xs mt-1">Vá em "Perfis" e marque um perfil como conta própria.</p>
        </div>
      )}

      <LegalAreaPillFilter accounts={tiktokProfiles} selected={legalAreaFilter} onSelect={setLegalAreaFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <AvatarImage src={p.avatar_url} alt={p.username} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.display_name || p.username}</p>
                  <p className="text-xs text-muted-foreground">@{p.username}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-[10px] px-1.5">TikTok</Badge>
                    {p.is_verified && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5">Verificado</Badge>}
                    {legalAreaBadge(p.legal_area)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 text-center gap-2">
                <div><p className="text-sm font-bold">{formatNumber(p.followers_count)}</p><p className="text-[10px] text-muted-foreground">Seguidores</p></div>
                <div><p className="text-sm font-bold">{formatNumber(p.following_count)}</p><p className="text-[10px] text-muted-foreground">Seguindo</p></div>
                <div><p className="text-sm font-bold">{formatNumber(p.posts_count)}</p><p className="text-[10px] text-muted-foreground">Vídeos</p></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Engajamento</span>
                <EngagementBadgeInline rate={p.engagement_rate} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Views médias</span>
                <span className="font-medium">{p.avg_views_recent != null ? formatNumber(Math.round(p.avg_views_recent)) : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Likes médios</span>
                <span className="font-medium">{p.avg_likes_recent != null ? formatNumber(Math.round(p.avg_likes_recent)) : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Compartilhamentos médios</span>
                <span className="font-medium">{p.avg_shares_recent != null ? formatNumber(Math.round(p.avg_shares_recent)) : "—"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Último scan: {p.last_scanned_at ? timeAgo(p.last_scanned_at) : "Nunca"}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openAnalysis(p)}><BarChart3 className="w-3.5 h-3.5 mr-1" />Analisar</Button>
                <Button size="sm" className="flex-1" disabled={isScanning} onClick={() => scanProfile(p.id)}>
                  {isScanning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}Escanear
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProfile && (
        <TiktokAnalysisSheet profile={selectedProfile} open={sheetOpen} onOpenChange={setSheetOpen} history={history} loadingHistory={loadingHistory} isScanning={isScanning} onScan={() => scanProfile(selectedProfile.id)} onUpdateLegalArea={(v) => updateLegalArea.mutate({ id: selectedProfile.id, legal_area: v === "none" ? null : v })} />
      )}
    </div>
  );
}

function TiktokAnalysisSheet({ profile: p, open, onOpenChange, history, loadingHistory, isScanning, onScan, onUpdateLegalArea }: { profile: OwnProfile; open: boolean; onOpenChange: (v: boolean) => void; history: ProfileHistory[]; loadingHistory: boolean; isScanning: boolean; onScan: () => void; onUpdateLegalArea: (v: string) => void }) {
  const followersData = history.map((h) => ({ date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), value: h.followers_count ?? 0 }));
  const engagementData = history.map((h) => ({ date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), value: h.engagement_score ?? 0 }));
  const topPosts = (p.top_posts as Array<{ url?: string; likesCount?: number; commentsCount?: number; videoViewCount?: number; displayUrl?: string; caption?: string }>) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Análise TikTok</SheetTitle>
            <Button size="sm" disabled={isScanning} onClick={onScan}>{isScanning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}Escanear agora</Button>
          </div>
        </SheetHeader>
        <div className="space-y-6 mt-4">
          <div className="flex items-start gap-4">
            <AvatarImage src={p.avatar_url} alt={p.username} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{p.display_name || p.username}</p>
                {p.is_verified && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Verificado</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">@{p.username}</p>
              {p.biography && <p className="text-xs text-muted-foreground line-clamp-3">{p.biography}</p>}
              {p.external_url && <a href={p.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Globe className="w-3 h-3" />{p.external_url}</a>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricMiniCard label="Seguidores" value={formatNumber(p.followers_count)} icon={<Users className="w-4 h-4" />} />
            <MetricMiniCard label="Curtidas totais" value={formatNumber(p.following_count)} icon={<Heart className="w-4 h-4" />} />
            <MetricMiniCard label="Vídeos" value={formatNumber(p.posts_count)} icon={<Video className="w-4 h-4" />} />
            <MetricMiniCard label="Engajamento" value={p.engagement_rate != null ? `${p.engagement_rate.toFixed(2)}%` : "—"} icon={<TrendingUp className="w-4 h-4" />} />
            <MetricMiniCard label="Views médias" value={p.avg_views_recent != null ? formatNumber(Math.round(p.avg_views_recent)) : "—"} icon={<Eye className="w-4 h-4" />} />
            <MetricMiniCard label="Compartilhamentos" value={p.avg_shares_recent != null ? formatNumber(Math.round(p.avg_shares_recent)) : "—"} icon={<ExternalLink className="w-4 h-4" />} />
          </div>

          {/* Legal area */}
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm text-muted-foreground">Ramo do Direito</label>
            <LegalAreaSelect value={p.legal_area || "none"} onChange={onUpdateLegalArea} className="flex-1" />
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : followersData.length > 1 ? (
            <div>
              <h4 className="text-sm font-semibold mb-2">Evolução de Seguidores</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={followersData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-4">Dados históricos insuficientes.</p>}

          {!loadingHistory && engagementData.length > 1 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Engajamento ao longo do tempo</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={engagementData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {topPosts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Top Vídeos</h4>
              <div className="grid grid-cols-1 gap-3">
                {topPosts.slice(0, 3).map((post, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <CardContent className="p-3 flex gap-3">
                      {post.displayUrl ? <img src={post.displayUrl} alt="cover" className="w-20 h-20 rounded object-cover flex-shrink-0" referrerPolicy="no-referrer" crossOrigin="anonymous" /> : <div className="w-20 h-20 rounded bg-muted flex items-center justify-center flex-shrink-0"><Video className="w-6 h-6 text-muted-foreground" /></div>}
                      <div className="flex-1 min-w-0 space-y-1">
                        {post.caption && <p className="text-xs line-clamp-2">{post.caption}</p>}
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(post.videoViewCount ?? 0)}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(post.likesCount ?? 0)}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNumber(post.commentsCount ?? 0)}</span>
                        </div>
                        {post.url && <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Ver vídeo</a>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FacebookContasTab() {
  const { facebookProfiles, loadingProfiles, isScanning, scanProfile, scanAllByPlatform, fetchHistory, updateLegalArea } = useMinhasContas();
  const [selectedProfile, setSelectedProfile] = useState<OwnProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [history, setHistory] = useState<ProfileHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [legalAreaFilter, setLegalAreaFilter] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    if (!legalAreaFilter) return facebookProfiles;
    return facebookProfiles.filter((p) => p.legal_area === legalAreaFilter);
  }, [facebookProfiles, legalAreaFilter]);

  const openAnalysis = useCallback(async (profile: OwnProfile) => {
    setSelectedProfile(profile);
    setSheetOpen(true);
    setLoadingHistory(true);
    try { setHistory(await fetchHistory(profile.id)); } catch { setHistory([]); } finally { setLoadingHistory(false); }
  }, [fetchHistory]);

  if (loadingProfiles) return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">{facebookProfiles.length} conta(s) monitorada(s)</span>
        <Button size="sm" disabled={isScanning || facebookProfiles.length === 0} onClick={() => scanAllByPlatform("facebook")}>
          {isScanning ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
          Escanear todas as contas Facebook
        </Button>
      </div>

      {facebookProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Facebook className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Nenhuma conta Facebook marcada como própria.</p>
          <p className="text-xs mt-1">Vá em "Perfis" e marque um perfil como conta própria.</p>
        </div>
      )}

      <LegalAreaPillFilter accounts={facebookProfiles} selected={legalAreaFilter} onSelect={setLegalAreaFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <AvatarImage src={p.avatar_url} alt={p.username} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.display_name || p.username}</p>
                  <p className="text-xs text-muted-foreground">@{p.username}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <Badge className="bg-blue-800/20 text-blue-300 border-blue-700/30 text-[10px] px-1.5">Facebook</Badge>
                    {p.is_business && <Badge variant="secondary" className="text-[10px] px-1.5">Business</Badge>}
                    {legalAreaBadge(p.legal_area)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 text-center gap-2">
                <div><p className="text-sm font-bold">{formatNumber(p.followers_count)}</p><p className="text-[10px] text-muted-foreground">Seguidores</p></div>
                <div><p className="text-sm font-bold">{p.date_joined || "—"}</p><p className="text-[10px] text-muted-foreground">Criação</p></div>
                <div><p className="text-sm font-bold">{p.avg_likes_recent != null ? formatNumber(Math.round(p.avg_likes_recent)) : "—"}</p><p className="text-[10px] text-muted-foreground">Curtidas página</p></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Engajamento</span>
                <span className="text-muted-foreground">—</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Último scan: {p.last_scanned_at ? timeAgo(p.last_scanned_at) : "Nunca"}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openAnalysis(p)}><BarChart3 className="w-3.5 h-3.5 mr-1" />Analisar</Button>
                <Button size="sm" className="flex-1" disabled={isScanning} onClick={() => scanProfile(p.id)}>
                  {isScanning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}Escanear
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProfile && (
        <FacebookAnalysisSheet profile={selectedProfile} open={sheetOpen} onOpenChange={setSheetOpen} history={history} loadingHistory={loadingHistory} isScanning={isScanning} onScan={() => scanProfile(selectedProfile.id)} onUpdateLegalArea={(v) => updateLegalArea.mutate({ id: selectedProfile.id, legal_area: v === "none" ? null : v })} />
      )}
    </div>
  );
}

function FacebookAnalysisSheet({ profile: p, open, onOpenChange, history, loadingHistory, isScanning, onScan, onUpdateLegalArea }: { profile: OwnProfile; open: boolean; onOpenChange: (v: boolean) => void; history: ProfileHistory[]; loadingHistory: boolean; isScanning: boolean; onScan: () => void; onUpdateLegalArea: (v: string) => void }) {
  const followersData = history.map((h) => ({ date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), value: h.followers_count ?? 0 }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Análise Facebook</SheetTitle>
            <Button size="sm" disabled={isScanning} onClick={onScan}>{isScanning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}Escanear agora</Button>
          </div>
        </SheetHeader>
        <div className="space-y-6 mt-4">
          <div className="flex items-start gap-4">
            <AvatarImage src={p.avatar_url} alt={p.username} />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold">{p.display_name || p.username}</p>
              <p className="text-xs text-muted-foreground">@{p.username}</p>
              {p.biography && <p className="text-xs text-muted-foreground">{p.biography}</p>}
              {p.external_url && <a href={p.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Globe className="w-3 h-3" />{p.external_url}</a>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricMiniCard label="Seguidores" value={formatNumber(p.followers_count)} icon={<Users className="w-4 h-4" />} />
            <MetricMiniCard label="Data de criação" value={p.date_joined || "—"} icon={<Calendar className="w-4 h-4" />} />
            <MetricMiniCard label="Curtidas na página" value={p.avg_likes_recent != null ? formatNumber(Math.round(p.avg_likes_recent)) : "—"} icon={<Heart className="w-4 h-4" />} />
            <MetricMiniCard label="Engajamento" value="—" icon={<TrendingUp className="w-4 h-4" />} />
            <MetricMiniCard label="Business" value={p.is_business ? "Sim" : "Não"} icon={<Briefcase className="w-4 h-4" />} />
          </div>

          {/* Legal area */}
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm text-muted-foreground">Ramo do Direito</label>
            <LegalAreaSelect value={p.legal_area || "none"} onChange={onUpdateLegalArea} className="flex-1" />
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : followersData.length > 1 ? (
            <div>
              <h4 className="text-sm font-semibold mb-2">Evolução de Seguidores</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={followersData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-4">Dados históricos insuficientes.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Minhas Contas Tab ──

function MinhasContasTab() {
  const { ownAccounts, addOwnAccount, removeProfile, loadingProfiles } = useRadarViralizacao();
  const [activeTab, setActiveTab] = useState<"instagram" | "tiktok" | "facebook">("instagram");
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "tiktok" | "facebook">("instagram");
  const [legalArea, setLegalArea] = useState<string>("none");

  // Sync select with active tab
  useEffect(() => { setPlatform(activeTab); }, [activeTab]);

  const handleAdd = () => {
    if (!username.trim()) return;
    addOwnAccount.mutate({
      username: username.trim(),
      platform,
      ...(legalArea !== "none" ? { legal_area: legalArea } : {}),
    });
    setUsername("");
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Username</label>
              <Input placeholder="@suaconta" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
            <div className="w-[160px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Plataforma</label>
              <Select value={platform} onValueChange={(v) => { setPlatform(v as typeof platform); setActiveTab(v as typeof activeTab); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Ramo do Direito</label>
              <LegalAreaSelect value={legalArea} onChange={setLegalArea} className="w-full" />
            </div>
            <Button onClick={handleAdd} disabled={!username.trim() || addOwnAccount.isPending}>
              <Plus className="w-4 h-4 mr-1" />Adicionar minha conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subtabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="instagram" className="gap-1.5"><Camera className="w-4 h-4 text-purple-500" />Instagram</TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-1.5"><Music className="w-4 h-4 text-foreground" />TikTok</TabsTrigger>
          <TabsTrigger value="facebook" className="gap-1.5"><Facebook className="w-4 h-4 text-blue-500" />Facebook</TabsTrigger>
        </TabsList>

        <TabsContent value="instagram" className="flex-1 overflow-auto mt-4">
          <InstagramContasTab />
        </TabsContent>
        <TabsContent value="tiktok" className="flex-1 overflow-auto mt-4">
          <TiktokContasTab />
        </TabsContent>
        <TabsContent value="facebook" className="flex-1 overflow-auto mt-4">
          <FacebookContasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main Page ──

const RadarViralizacao = () => {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-6">
        <Radar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Radar de Viralização</h1>
      </div>

      <Tabs defaultValue="perfis" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="perfis">Perfis</TabsTrigger>
          <TabsTrigger value="temas">Temas</TabsTrigger>
          <TabsTrigger value="virais">Virais Detectados</TabsTrigger>
          <TabsTrigger value="minhas-contas" className="gap-1.5"><User className="w-4 h-4" />Minhas Contas</TabsTrigger>
        </TabsList>

        <TabsContent value="perfis" className="flex-1 overflow-auto mt-4">
          <PerfisTab />
        </TabsContent>
        <TabsContent value="temas" className="flex-1 overflow-auto mt-4">
          <TemasTab />
        </TabsContent>
        <TabsContent value="virais" className="flex-1 overflow-auto mt-4">
          <ViraisTab />
        </TabsContent>
        <TabsContent value="minhas-contas" className="flex-1 overflow-auto mt-4">
          <MinhasContasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RadarViralizacao;
