import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Radar, Plus, Trash2, Loader2, Eye, Heart, MessageCircle, ExternalLink, CheckCircle2, User, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRadarViralizacao, type ViralContent, type MonitoredProfile, type ProfileHistory } from "@/hooks/useRadarViralizacao";
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

function engagementBadge(score: number | null) {
  if (score == null) return <Badge variant="secondary" className="text-xs">—</Badge>;
  if (score > 5) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-xs">{score.toFixed(1)}%</Badge>;
  if (score >= 1) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs">{score.toFixed(1)}%</Badge>;
  return <Badge variant="secondary" className="text-xs">{score.toFixed(1)}%</Badge>;
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
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
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
  const { profiles, loadingProfiles, isScanning, addProfile, removeProfile, toggleProfile, runScan, fetchProfileHistory } = useRadarViralizacao();
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");
  const [selectedProfile, setSelectedProfile] = useState<MonitoredProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleAdd = () => {
    if (!username.trim()) return;
    addProfile.mutate({ username: username.trim().replace("@", ""), platform });
    setUsername("");
  };

  const sorted = [...profiles].sort((a, b) => (b.engagement_score_7d ?? 0) - (a.engagement_score_7d ?? 0));

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
        <Button onClick={() => runScan("profiles")} disabled={isScanning || profiles.length === 0}>
          {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Radar className="h-4 w-4 mr-2" />}
          Escanear Perfis Agora
        </Button>
      </div>

      {/* Grid */}
      {loadingProfiles ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : profiles.length === 0 ? (
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
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center border border-border">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
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
  const { viralContent, loadingVirals, markAsModeled } = useRadarViralizacao();
  const navigate = useNavigate();
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [onlyNotModeled, setOnlyNotModeled] = useState(false);

  const filtered = viralContent.filter((v) => {
    if (filterPlatform !== "all" && v.platform !== filterPlatform) return false;
    if (onlyNotModeled && v.is_modeled) return false;
    return true;
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
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all ${item.is_modeled ? "border-emerald-500/50" : ""}`}
            >
              {/* Thumbnail */}
              {item.thumbnail_url && (
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {platformBadge(item.platform)}
                    {item.is_modeled && (
                      <Badge className="bg-emerald-600/80 text-white border-emerald-500/50 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Modelado
                      </Badge>
                    )}
                  </div>
                </div>
              )}

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
      </Tabs>
    </div>
  );
};

export default RadarViralizacao;
