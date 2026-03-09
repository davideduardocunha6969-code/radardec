import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useDropzone } from "react-dropzone";
import { Video, Upload, Play, CheckCircle, Loader2, Plus, Trash2, Save, Settings, LayoutDashboard, FolderPlus, Grid3X3, Link, FolderOpen, X, AlertCircle, Send } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────
type VideoStatus = "Pendente" | "Renderizando" | "Pronto" | "Publicado" | "Erro";
type AreaDireito = "Trabalhista" | "Previdenciário" | "Bancário" | "Outros";

interface VideoItem {
  id: string;
  name: string;
  source: "local" | "drive";
  file?: File;
  driveUrl?: string;
}

interface DbVariation {
  id: string;
  nome: string;
  projeto_id: string;
  projeto_nome?: string;
  status: VideoStatus;
  render_id: string | null;
  video_url: string | null;
  erro: string | null;
}

interface DbProject {
  id: string;
  nome: string;
  hooks_count: number;
  ctas_count: number;
  variacoes_count: number;
  status: string;
  created_at: string;
}

interface InstaPage {
  nome: string;
  userId: string;
  token: string;
  areaDireito: AreaDireito;
  facebookPageId?: string;
  facebookToken?: string;
}

interface ReelsConfig {
  apiKey: string;
  pages: InstaPage[];
}

const LS_CONFIG_KEY = "reels-machine-config";

const AREAS_DIREITO: AreaDireito[] = ["Trabalhista", "Previdenciário", "Bancário", "Outros"];

const areaColor: Record<AreaDireito, string> = {
  Trabalhista: "bg-chart-1/20 text-chart-1",
  Previdenciário: "bg-chart-2/20 text-chart-2",
  Bancário: "bg-chart-3/20 text-chart-3",
  Outros: "bg-muted text-muted-foreground",
};

const statusColor: Record<VideoStatus, string> = {
  Pendente: "bg-muted text-muted-foreground",
  Renderizando: "bg-chart-4/20 text-chart-4",
  Pronto: "bg-chart-2/20 text-chart-2",
  Publicado: "bg-primary/20 text-primary",
  Erro: "bg-destructive/20 text-destructive",
};

function loadConfig(): ReelsConfig {
  try {
    const raw = localStorage.getItem(LS_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { apiKey: "", pages: [] };
}

function saveConfig(config: ReelsConfig) {
  localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(config));
}

// ─── Mock Drive detection ───────────────────────────────────────
function mockDetectDriveFiles(url: string): { type: "file" | "folder"; files: string[] } {
  if (url.includes("/folders/") || url.includes("folderview")) {
    return { type: "folder", files: ["intro_energetico.mp4", "gancho_urgencia.mp4", "abertura_curiosidade.mp4"] };
  }
  const match = url.match(/\/d\/([^/]+)/);
  const name = match ? `drive_video_${match[1].slice(0, 6)}.mp4` : "video_importado.mp4";
  return { type: "file", files: [name] };
}

// ─── Upload Zone Component ──────────────────────────────────────
function UploadZone({ label, multiple, items, onAddLocal, onAddDrive, onRemove }: {
  label: string;
  multiple: boolean;
  items: VideoItem[];
  onAddLocal: (files: File[]) => void;
  onAddDrive: (newItems: VideoItem[]) => void;
  onRemove: (id: string) => void;
}) {
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onAddLocal,
    accept: { "video/mp4": [".mp4"] },
    multiple,
  });

  const handleImportDrive = () => {
    if (!driveUrl.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const result = mockDetectDriveFiles(driveUrl);
      const newItems: VideoItem[] = result.files.map((n) => ({
        id: crypto.randomUUID(),
        name: n,
        source: "drive" as const,
        driveUrl,
      }));
      onAddDrive(multiple ? newItems : newItems.slice(0, 1));
      toast.success(result.type === "folder" ? `${result.files.length} arquivo(s) detectados` : `Arquivo importado: ${result.files[0]}`);
      setDriveUrl("");
      setShowDriveInput(false);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowDriveInput(!showDriveInput)}>
          <Link className="h-3.5 w-3.5" /> Importar do Google Drive
        </Button>
      </div>
      {showDriveInput && (
        <div className="flex gap-2 items-center border rounded-lg p-3 bg-muted/30">
          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input placeholder="Cole o link do Google Drive" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} className="h-8 text-sm" onKeyDown={(e) => e.key === "Enter" && handleImportDrive()} />
          <Button size="sm" className="h-8 shrink-0" onClick={handleImportDrive} disabled={!driveUrl.trim() || loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Importar"}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setShowDriveInput(false); setDriveUrl(""); }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{isDragActive ? "Solte aqui..." : `Arraste arquivos .mp4 ou clique${multiple ? " (múltiplos)" : ""}`}</p>
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
              <div className="flex items-center gap-2 truncate">
                {item.source === "drive" ? <FolderOpen className="h-3.5 w-3.5 text-chart-4 shrink-0" /> : <Upload className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <span className="truncate">{item.name}</span>
                {item.source === "drive" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-chart-4/10 text-chart-4">Drive</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(item.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────────
function DashboardTab({ projects, variations }: { projects: DbProject[]; variations: DbVariation[] }) {
  const stats = [
    { label: "Total Variações", value: variations.length, icon: Video, color: "text-primary" },
    { label: "Renderizando", value: variations.filter((v) => v.status === "Renderizando").length, icon: Loader2, color: "text-chart-4" },
    { label: "Prontos", value: variations.filter((v) => v.status === "Pronto").length, icon: CheckCircle, color: "text-chart-2" },
    { label: "Publicados", value: variations.filter((v) => v.status === "Publicado").length, icon: Play, color: "text-chart-1" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Últimos Projetos</CardTitle></CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto criado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead className="text-center">Hooks</TableHead>
                  <TableHead className="text-center">CTAs</TableHead>
                  <TableHead className="text-center">Variações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-center">{p.hooks_count}</TableCell>
                    <TableCell className="text-center">{p.ctas_count}</TableCell>
                    <TableCell className="text-center">{p.variacoes_count}</TableCell>
                    <TableCell><Badge className={statusColor[p.status as VideoStatus] || ""} variant="secondary">{p.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Novo Projeto Tab ───────────────────────────────────────────
function NovoProjetoTab({ onGenerate, isGenerating, progressInfo }: {
  onGenerate: (nome: string, hooks: VideoItem[], corpo: VideoItem[], ctas: VideoItem[]) => Promise<void>;
  isGenerating: boolean;
  progressInfo: { current: number; total: number; step: string };
}) {
  const [nome, setNome] = useState("");
  const [hooks, setHooks] = useState<VideoItem[]>([]);
  const [corpo, setCorpo] = useState<VideoItem[]>([]);
  const [ctas, setCtas] = useState<VideoItem[]>([]);

  const filesToItems = (files: File[]): VideoItem[] =>
    files.map((f) => ({ id: crypto.randomUUID(), name: f.name, source: "local" as const, file: f }));

  const removeItem = (setter: React.Dispatch<React.SetStateAction<VideoItem[]>>, id: string) =>
    setter((prev) => prev.filter((item) => item.id !== id));

  const totalVariations = hooks.length * (corpo.length > 0 ? 1 : 0) * ctas.length;
  const canGenerate = hooks.length > 0 && corpo.length > 0 && ctas.length > 0 && !isGenerating;

  const handleGenerate = async () => {
    const capturedNome = nome || "Sem nome";
    const capturedHooks = [...hooks];
    const capturedCorpo = [...corpo];
    const capturedCtas = [...ctas];
    await onGenerate(capturedNome, capturedHooks, capturedCorpo, capturedCtas);
    setNome("");
    setHooks([]);
    setCorpo([]);
    setCtas([]);
  };

  const progressPercent = progressInfo.total > 0 ? Math.round((progressInfo.current / progressInfo.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Novo Projeto de Reels</CardTitle>
          <CardDescription>Faça upload dos vídeos ou importe do Google Drive para gerar variações automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome do Projeto</Label>
            <Input id="project-name" placeholder="Ex: Campanha Março" value={nome} onChange={(e) => setNome(e.target.value)} disabled={isGenerating} />
          </div>

          <UploadZone label="Hooks (múltiplos .mp4)" multiple items={hooks}
            onAddLocal={(f) => setHooks((prev) => [...prev, ...filesToItems(f)])}
            onAddDrive={(items) => setHooks((prev) => [...prev, ...items])}
            onRemove={(id) => removeItem(setHooks, id)} />

          <UploadZone label="Corpo (1 arquivo .mp4)" multiple={false} items={corpo}
            onAddLocal={(f) => setCorpo(filesToItems(f).slice(0, 1))}
            onAddDrive={(items) => setCorpo(items.slice(0, 1))}
            onRemove={() => setCorpo([])} />

          <UploadZone label="CTAs (múltiplos .mp4)" multiple items={ctas}
            onAddLocal={(f) => setCtas((prev) => [...prev, ...filesToItems(f)])}
            onAddDrive={(items) => setCtas((prev) => [...prev, ...items])}
            onRemove={(id) => removeItem(setCtas, id)} />

          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-lg font-semibold">
              {hooks.length} hook{hooks.length !== 1 ? "s" : ""} × 1 corpo × {ctas.length} CTA{ctas.length !== 1 ? "s" : ""} ={" "}
              <span className="text-primary">{totalVariations} variações</span>
            </p>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressInfo.step}</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{progressInfo.current} de {progressInfo.total}</p>
            </div>
          )}

          <Button className="w-full" disabled={!canGenerate} onClick={handleGenerate}>
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
            ) : (
              "Gerar Variações"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Galeria Tab ────────────────────────────────────────────────
function GaleriaTab({ variations, projects, selectedProject, onProjectChange, onPollStatus, onDeleteVariation, onDeleteAllErrors }: {
  variations: DbVariation[];
  projects: DbProject[];
  selectedProject: string;
  onProjectChange: (v: string) => void;
  onPollStatus: () => void;
  onDeleteVariation: (id: string) => Promise<void>;
  onDeleteAllErrors: () => Promise<void>;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<DbVariation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingErrors, setDeletingErrors] = useState(false);

  const filtered = variations.filter((v) => {
    const matchStatus = filterStatus === "todos" || v.status === filterStatus;
    const matchProject = selectedProject === "todos" || v.projeto_id === selectedProject;
    return matchStatus && matchProject;
  });

  const renderingCount = variations.filter((v) => v.status === "Renderizando").length;
  const errorCount = variations.filter((v) => v.status === "Erro").length;

  const handlePublishClick = (variation: DbVariation) => {
    setSelectedVariation(variation);
    setPublishModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDeleteVariation(id);
    setDeletingId(null);
  };

  const handleDeleteAllErrors = async () => {
    setDeletingErrors(true);
    await onDeleteAllErrors();
    setDeletingErrors(false);
  };

  return (
    <div className="space-y-4">
      {renderingCount > 0 && (
        <div className="flex items-center gap-3 bg-chart-4/10 border border-chart-4/20 rounded-lg p-3">
          <Loader2 className="h-4 w-4 text-chart-4 animate-spin" />
          <span className="text-sm">{renderingCount} vídeo(s) renderizando...</span>
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={onPollStatus}>
            Atualizar Status
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedProject} onValueChange={onProjectChange}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filtrar por projeto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os projetos</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Renderizando">Renderizando</SelectItem>
            <SelectItem value="Pronto">Pronto</SelectItem>
            <SelectItem value="Publicado">Publicado</SelectItem>
            <SelectItem value="Erro">Erro</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} vídeo(s)</span>

        {errorCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="ml-auto h-8 text-xs gap-1.5" disabled={deletingErrors}>
                {deletingErrors ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Excluir com erro ({errorCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir todas as variações com erro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação irá excluir {errorCount} variação(ões) com status "Erro". Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllErrors}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma variação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((v) => (
            <Card key={v.id} className="overflow-hidden relative group">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={deletingId === v.id}
                  >
                    {deletingId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja excluir esta variação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A variação "{v.nome}" será excluída permanentemente. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(v.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="aspect-[9/16] bg-muted flex items-center justify-center">
                {v.video_url ? (
                  <video src={v.video_url} className="w-full h-full object-cover" controls />
                ) : v.status === "Renderizando" ? (
                  <Loader2 className="h-10 w-10 text-chart-4 animate-spin" />
                ) : v.status === "Erro" ? (
                  <AlertCircle className="h-10 w-10 text-destructive/40" />
                ) : (
                  <Video className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium truncate">{v.nome}</p>
                <p className="text-xs text-muted-foreground">{v.projeto_nome}</p>
                {v.erro && <p className="text-xs text-destructive truncate" title={v.erro}>{v.erro}</p>}
                <div className="flex items-center justify-between">
                  <Badge className={statusColor[v.status]} variant="secondary">{v.status}</Badge>
                  {v.status === "Pronto" && v.video_url && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePublishClick(v)}>
                      Publicar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PublishModal 
        open={publishModalOpen} 
        onOpenChange={setPublishModalOpen} 
        variation={selectedVariation}
      />
    </div>
  );
}

// ─── Publish Modal ──────────────────────────────────────────────
function PublishModal({ open, onOpenChange, variation }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variation: DbVariation | null;
}) {
  const [filterArea, setFilterArea] = useState<string>("Todas");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [facebookOptions, setFacebookOptions] = useState<Map<string, boolean>>(new Map());
  const [pages, setPages] = useState<InstaPage[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load pages from config and add mock data if empty
  useEffect(() => {
    const config = loadConfig();
    if (config.pages.length > 0) {
      setPages(config.pages);
    } else {
      // Mock data for demonstration
      setPages([
        { nome: "Advogado Trabalhista SP", userId: "17841400001", token: "EAA...", areaDireito: "Trabalhista", facebookPageId: "fb_123", facebookToken: "EAA..." },
        { nome: "Direito do Trabalho RJ", userId: "17841400002", token: "EAA...", areaDireito: "Trabalhista" },
        { nome: "Prev. Social Brasil", userId: "17841400003", token: "EAA...", areaDireito: "Previdenciário", facebookPageId: "fb_456", facebookToken: "EAA..." },
        { nome: "INSS e Aposentadoria", userId: "17841400004", token: "EAA...", areaDireito: "Previdenciário" },
        { nome: "Direito Bancário MG", userId: "17841400005", token: "EAA...", areaDireito: "Bancário" },
        { nome: "Advogados Associados", userId: "17841400006", token: "EAA...", areaDireito: "Outros" },
      ]);
    }
  }, [open]);

  useEffect(() => {
    setSelectedPages(new Set());
    setFacebookOptions(new Map());
    setFilterArea("Todas");
  }, [open]);

  const filteredPages = filterArea === "Todas" 
    ? pages 
    : pages.filter(p => p.areaDireito === filterArea);

  const togglePage = (pageId: string) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  const toggleFacebook = (pageId: string, checked: boolean) => {
    setFacebookOptions(prev => {
      const newMap = new Map(prev);
      newMap.set(pageId, checked);
      return newMap;
    });
  };

  const handlePublish = async () => {
    if (selectedPages.size === 0 || !variation) return;
    
    setIsPublishing(true);
    
    const fbCount = Array.from(selectedPages).filter(id => facebookOptions.get(id)).length;
    
    // Simulate publishing
    setTimeout(() => {
      setIsPublishing(false);
      onOpenChange(false);
      toast.success(`Publicado em ${selectedPages.size} página(s) do Instagram e ${fbCount} página(s) do Facebook com sucesso!`);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Selecionar páginas para publicar
          </DialogTitle>
        </DialogHeader>

        {variation && (
          <div className="bg-muted/50 rounded-lg p-3 mb-2">
            <p className="text-sm font-medium">{variation.nome}</p>
            <p className="text-xs text-muted-foreground">{variation.projeto_nome}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Filtrar por Área do Direito</Label>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as áreas</SelectItem>
                {AREAS_DIREITO.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
            {filteredPages.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma página encontrada para esta área.
              </div>
            ) : (
              filteredPages.map((page) => (
                <div key={page.userId} className="flex flex-col p-3 hover:bg-muted/30">
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => togglePage(page.userId)}
                  >
                    <Checkbox 
                      checked={selectedPages.has(page.userId)} 
                      onCheckedChange={() => togglePage(page.userId)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{page.nome}</p>
                      <p className="text-xs text-muted-foreground">ID: {page.userId}</p>
                    </div>
                    <Badge className={areaColor[page.areaDireito]} variant="secondary">
                      {page.areaDireito}
                    </Badge>
                  </div>
                  
                  {page.facebookPageId && selectedPages.has(page.userId) && (
                    <div className="mt-3 ml-7 flex items-center space-x-2">
                      <Checkbox 
                        id={`fb-${page.userId}`}
                        checked={!!facebookOptions.get(page.userId)}
                        onCheckedChange={(checked) => toggleFacebook(page.userId, checked === true)}
                      />
                      <Label 
                        htmlFor={`fb-${page.userId}`}
                        className="text-xs text-muted-foreground font-normal cursor-pointer"
                      >
                        Publicar também no Facebook
                      </Label>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {selectedPages.size} página(s) selecionada(s)
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={selectedPages.size === 0 || isPublishing}
          >
            {isPublishing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publicando...</>
            ) : (
              <>Publicar nas páginas selecionadas</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Configurações Tab ──────────────────────────────────────────
function ConfiguracoesTab() {
  const [apiKey, setApiKey] = useState("");
  const [pages, setPages] = useState<InstaPage[]>([]);

  useEffect(() => {
    const config = loadConfig();
    setApiKey(config.apiKey);
    setPages(config.pages);
  }, []);

  const addPage = () => setPages((prev) => [...prev, { nome: "", userId: "", token: "", areaDireito: "Outros", facebookPageId: "", facebookToken: "" }]);
  const removePage = (i: number) => setPages((prev) => prev.filter((_, idx) => idx !== i));
  const updatePage = (i: number, field: keyof InstaPage, value: string) =>
    setPages((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const handleSave = () => {
    saveConfig({ apiKey, pages });
    toast.success("Configurações salvas!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader><CardTitle className="text-lg">API de Renderização</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Creatomate API Key</Label>
            <Input type="password" placeholder="Sua API Key do Creatomate" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Páginas do Instagram</CardTitle>
          <Button variant="outline" size="sm" onClick={addPage}><Plus className="h-4 w-4 mr-1" /> Adicionar Página</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {pages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma página configurada.</p>}
          {pages.map((p, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removePage(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input placeholder="Nome da página" value={p.nome} onChange={(e) => updatePage(i, "nome", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Área do Direito</Label>
                  <Select value={p.areaDireito} onValueChange={(v) => updatePage(i, "areaDireito", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS_DIREITO.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instagram User ID</Label>
                  <Input placeholder="17841400..." value={p.userId} onChange={(e) => updatePage(i, "userId", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instagram Access Token</Label>
                  <Input type="password" placeholder="EAA..." value={p.token} onChange={(e) => updatePage(i, "token", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Facebook Page ID (Opcional)</Label>
                  <Input placeholder="ID da página do Facebook" value={p.facebookPageId || ""} onChange={(e) => updatePage(i, "facebookPageId", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Facebook Access Token (Opcional)</Label>
                  <Input type="password" placeholder="Token do Facebook" value={p.facebookToken || ""} onChange={(e) => updatePage(i, "facebookToken", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Button className="w-full" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Salvar Configurações</Button>
    </div>
  );
}

// ─── Helper: upload file to storage ─────────────────────────────
async function uploadVideoToStorage(file: File, userId: string, projectId: string, category: string, index: number): Promise<string> {
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${userId}/${projectId}/${category}_${index}.${ext}`;
  const { error } = await supabase.storage.from("reels-videos").upload(path, file, { upsert: true });
  if (error) throw new Error(`Erro no upload de ${file.name}: ${error.message}`);
  const { data } = supabase.storage.from("reels-videos").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Main Page ──────────────────────────────────────────────────
export default function ReelsMachine() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [variations, setVariations] = useState<DbVariation[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("todos");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ current: 0, total: 0, step: "" });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from DB
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [projRes, varRes] = await Promise.all([
      supabase.from("reels_projetos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("reels_variacoes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (projRes.data) setProjects(projRes.data as any);
    if (varRes.data) {
      const projMap = new Map((projRes.data || []).map((p: any) => [p.id, p.nome]));
      setVariations((varRes.data as any[]).map((v) => ({ ...v, projeto_nome: projMap.get(v.projeto_id) || "—" })));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-poll rendering status
  useEffect(() => {
    const renderingVars = variations.filter((v) => v.status === "Renderizando" && v.render_id);
    if (renderingVars.length > 0 && !pollingRef.current) {
      pollingRef.current = setInterval(() => pollRenderStatus(), 10000);
    } else if (renderingVars.length === 0 && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [variations]);

  const pollRenderStatus = async () => {
    const config = loadConfig();
    if (!config.apiKey) return;

    const renderingVars = variations.filter((v) => v.status === "Renderizando" && v.render_id);
    if (renderingVars.length === 0) return;

    for (const v of renderingVars) {
      try {
        const { data, error } = await supabase.functions.invoke("creatomate-render", {
          body: { action: "check-status", apiKey: config.apiKey, renderId: v.render_id, variacaoId: v.id },
        });
        if (error) console.error("Poll error:", error);
      } catch (e) {
        console.error("Poll exception:", e);
      }
    }
    await loadData();
  };

  const handleDeleteVariation = async (id: string) => {
    const { error } = await supabase.from("reels_variacoes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir variação: " + error.message);
    } else {
      toast.success("Variação excluída.");
      await loadData();
    }
  };

  const handleDeleteAllErrors = async () => {
    const errorIds = variations.filter((v) => v.status === "Erro").map((v) => v.id);
    if (errorIds.length === 0) return;
    const { error } = await supabase.from("reels_variacoes").delete().in("id", errorIds);
    if (error) {
      toast.error("Erro ao excluir variações: " + error.message);
    } else {
      toast.success(`${errorIds.length} variação(ões) com erro excluída(s).`);
      await loadData();
    }
  };

  const handleGenerate = async (nome: string, hooks: VideoItem[], corpo: VideoItem[], ctas: VideoItem[]) => {
    const config = loadConfig();
    if (!config.apiKey) {
      toast.error("Configure a API Key do Creatomate nas Configurações antes de gerar variações.");
      setActiveTab("config");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Você precisa estar logado."); return; }

    setIsGenerating(true);
    const totalSteps = hooks.length + 1 + ctas.length + (hooks.length * ctas.length);
    let currentStep = 0;

    try {
      // 1. Create project in DB
      const { data: projData, error: projError } = await supabase
        .from("reels_projetos")
        .insert({
          user_id: user.id,
          nome,
          hooks_count: hooks.length,
          ctas_count: ctas.length,
          variacoes_count: hooks.length * ctas.length,
          status: "Renderizando",
        })
        .select()
        .single();

      if (projError || !projData) throw new Error(projError?.message || "Erro ao criar projeto");
      const projectId = (projData as any).id;

      // 2. Upload hooks
      const hookUrls: string[] = [];
      for (let i = 0; i < hooks.length; i++) {
        currentStep++;
        setProgressInfo({ current: currentStep, total: totalSteps, step: `Enviando Hook ${i + 1}...` });
        if (hooks[i].file) {
          const url = await uploadVideoToStorage(hooks[i].file!, user.id, projectId, "hook", i);
          hookUrls.push(url);
        } else {
          hookUrls.push(hooks[i].driveUrl || "");
        }
      }

      // 3. Upload corpo
      currentStep++;
      setProgressInfo({ current: currentStep, total: totalSteps, step: "Enviando Corpo..." });
      let corpoUrl = "";
      if (corpo[0].file) {
        corpoUrl = await uploadVideoToStorage(corpo[0].file!, user.id, projectId, "corpo", 0);
      } else {
        corpoUrl = corpo[0].driveUrl || "";
      }

      // 4. Upload CTAs
      const ctaUrls: string[] = [];
      for (let i = 0; i < ctas.length; i++) {
        currentStep++;
        setProgressInfo({ current: currentStep, total: totalSteps, step: `Enviando CTA ${i + 1}...` });
        if (ctas[i].file) {
          const url = await uploadVideoToStorage(ctas[i].file!, user.id, projectId, "cta", i);
          ctaUrls.push(url);
        } else {
          ctaUrls.push(ctas[i].driveUrl || "");
        }
      }

      // 5. Create ALL variations in DB first
      const variationEntries: { h: number; c: number; varName: string }[] = [];
      for (let h = 0; h < hookUrls.length; h++) {
        for (let c = 0; c < ctaUrls.length; c++) {
          variationEntries.push({ h, c, varName: `Hook ${h + 1} + Corpo + CTA ${c + 1}` });
        }
      }

      currentStep++;
      setProgressInfo({ current: currentStep, total: totalSteps, step: `Criando ${variationEntries.length} variações...` });

      const insertRows = variationEntries.map((e) => ({
        projeto_id: projectId,
        user_id: user.id,
        nome: e.varName,
        status: "Renderizando" as const,
        hook_url: hookUrls[e.h],
        corpo_url: corpoUrl,
        cta_url: ctaUrls[e.c],
      }));

      const { data: allVarData, error: allVarError } = await supabase
        .from("reels_variacoes")
        .insert(insertRows)
        .select();

      if (allVarError || !allVarData) {
        throw new Error(allVarError?.message || "Erro ao criar variações");
      }

      // 6. Submit ALL renders in parallel
      setProgressInfo({ current: currentStep, total: totalSteps, step: `Enviando ${allVarData.length} renders ao Creatomate...` });

      const renderPromises = (allVarData as any[]).map(async (varRow: any, idx: number) => {
        const entry = variationEntries[idx];
        try {
          const { data, error } = await supabase.functions.invoke("creatomate-render", {
            body: {
              action: "render",
              apiKey: config.apiKey,
              hookUrl: hookUrls[entry.h],
              corpoUrl,
              ctaUrl: ctaUrls[entry.c],
              variacaoId: varRow.id,
            },
          });
          if (error) {
            console.error("Render error:", error);
            await supabase.from("reels_variacoes").update({ status: "Erro", erro: error.message }).eq("id", varRow.id);
          }
        } catch (e: any) {
          console.error("Render exception:", e);
          await supabase.from("reels_variacoes").update({ status: "Erro", erro: e.message }).eq("id", varRow.id);
        }
      });

      await Promise.all(renderPromises);

      await loadData();
      setSelectedProject(projectId);
      setActiveTab("galeria");
      toast.success(`${hooks.length * ctas.length} variações enviadas para renderização!`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar variações");
      console.error(e);
    } finally {
      setIsGenerating(false);
      setProgressInfo({ current: 0, total: 0, step: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reels Machine</h1>
        <p className="text-muted-foreground">Geração em massa de variações de Reels com hooks, corpo e CTAs.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1.5"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="novo" className="gap-1.5"><FolderPlus className="h-4 w-4" /> Novo Projeto</TabsTrigger>
          <TabsTrigger value="galeria" className="gap-1.5"><Grid3X3 className="h-4 w-4" /> Galeria</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Settings className="h-4 w-4" /> Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab projects={projects} variations={variations} /></TabsContent>
        <TabsContent value="novo"><NovoProjetoTab onGenerate={handleGenerate} isGenerating={isGenerating} progressInfo={progressInfo} /></TabsContent>
        <TabsContent value="galeria"><GaleriaTab variations={variations} projects={projects} selectedProject={selectedProject} onProjectChange={setSelectedProject} onPollStatus={pollRenderStatus} onDeleteVariation={handleDeleteVariation} onDeleteAllErrors={handleDeleteAllErrors} /></TabsContent>
        <TabsContent value="config"><ConfiguracoesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
