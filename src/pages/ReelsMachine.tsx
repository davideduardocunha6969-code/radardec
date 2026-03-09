import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDropzone } from "react-dropzone";
import { Video, Upload, Play, CheckCircle, Loader2, Plus, Trash2, Save, Settings, LayoutDashboard, FolderPlus, Grid3X3, Link, FolderOpen, X } from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────
type VideoStatus = "Pendente" | "Renderizando" | "Pronto" | "Publicado";

interface VideoItem {
  id: string;
  name: string;
  source: "local" | "drive";
  driveUrl?: string;
}

interface Variation {
  id: string;
  nome: string;
  projeto: string;
  status: VideoStatus;
}

interface Project {
  id: string;
  nome: string;
  hooks: number;
  ctas: number;
  variacoes: number;
  status: string;
  criadoEm: string;
}

interface InstaPage {
  nome: string;
  userId: string;
  token: string;
}

interface ReelsConfig {
  apiKey: string;
  pages: InstaPage[];
}

const LS_CONFIG_KEY = "reels-machine-config";

const statusColor: Record<VideoStatus, string> = {
  Pendente: "bg-muted text-muted-foreground",
  Renderizando: "bg-chart-4/20 text-chart-4",
  Pronto: "bg-chart-2/20 text-chart-2",
  Publicado: "bg-primary/20 text-primary",
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

// ─── Upload Zone Component ──────────────────────────────────────
function UploadZone({ label, multiple, files, onDrop, onRemove }: {
  label: string;
  multiple: boolean;
  files: File[];
  onDrop: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/mp4": [".mp4"] },
    multiple,
  });

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? "Solte aqui..." : `Arraste arquivos .mp4 ou clique para selecionar${multiple ? " (múltiplos)" : ""}`}
        </p>
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
              <span className="truncate">{f.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(i)}>
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
function DashboardTab({ projects, variations }: { projects: Project[]; variations: Variation[] }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const videosHoje = variations.filter((v) => {
    const proj = projects.find((p) => p.nome === v.projeto);
    return proj?.criadoEm === hoje;
  }).length;

  const stats = [
    { label: "Vídeos Hoje", value: videosHoje, icon: Video, color: "text-primary" },
    { label: "Renderizando", value: variations.filter((v) => v.status === "Renderizando").length, icon: Loader2, color: "text-chart-4" },
    { label: "Prontos para Publicar", value: variations.filter((v) => v.status === "Pronto").length, icon: CheckCircle, color: "text-chart-2" },
    { label: "Publicados", value: variations.filter((v) => v.status === "Publicado").length, icon: Play, color: "text-chart-1" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos Projetos</CardTitle>
        </CardHeader>
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
                    <TableCell className="text-center">{p.hooks}</TableCell>
                    <TableCell className="text-center">{p.ctas}</TableCell>
                    <TableCell className="text-center">{p.variacoes}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[p.status as VideoStatus]} variant="secondary">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.criadoEm}</TableCell>
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
function NovoProjetoTab({ onGenerate }: { onGenerate: (nome: string, hookCount: number, ctaCount: number) => void }) {
  const [nome, setNome] = useState("");
  const [hooks, setHooks] = useState<File[]>([]);
  const [corpo, setCorpo] = useState<File[]>([]);
  const [ctas, setCtas] = useState<File[]>([]);

  const removeFile = (setter: React.Dispatch<React.SetStateAction<File[]>>, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const totalVariations = hooks.length * (corpo.length > 0 ? 1 : 0) * ctas.length;
  const canGenerate = hooks.length > 0 && corpo.length > 0 && ctas.length > 0;

  const handleGenerate = () => {
    onGenerate(nome || "Sem nome", hooks.length, ctas.length);
    setNome("");
    setHooks([]);
    setCorpo([]);
    setCtas([]);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Novo Projeto de Reels</CardTitle>
          <CardDescription>Faça upload dos vídeos para gerar variações automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome do Projeto</Label>
            <Input id="project-name" placeholder="Ex: Campanha Março" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <UploadZone
            label="Hooks (múltiplos .mp4)"
            multiple
            files={hooks}
            onDrop={(f) => setHooks((prev) => [...prev, ...f])}
            onRemove={(i) => removeFile(setHooks, i)}
          />

          <UploadZone
            label="Corpo (1 arquivo .mp4)"
            multiple={false}
            files={corpo}
            onDrop={(f) => setCorpo(f.slice(0, 1))}
            onRemove={() => setCorpo([])}
          />

          <UploadZone
            label="CTAs (múltiplos .mp4)"
            multiple
            files={ctas}
            onDrop={(f) => setCtas((prev) => [...prev, ...f])}
            onRemove={(i) => removeFile(setCtas, i)}
          />

          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-lg font-semibold">
              {hooks.length} hook{hooks.length !== 1 ? "s" : ""} × 1 corpo × {ctas.length} CTA{ctas.length !== 1 ? "s" : ""} ={" "}
              <span className="text-primary">{totalVariations} variações</span>
            </p>
          </div>

          <Button className="w-full" disabled={!canGenerate} onClick={handleGenerate}>
            Gerar Variações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Galeria Tab ────────────────────────────────────────────────
function GaleriaTab({ variations, projects, selectedProject, onProjectChange }: { variations: Variation[]; projects: Project[]; selectedProject: string; onProjectChange: (v: string) => void }) {
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const projectNames = [...new Set(variations.map((v) => v.projeto))];

  const filtered = variations.filter((v) => {
    const matchStatus = filterStatus === "todos" || v.status === filterStatus;
    const matchProject = selectedProject === "todos" || v.projeto === selectedProject;
    return matchStatus && matchProject;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedProject} onValueChange={onProjectChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrar por projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os projetos</SelectItem>
            {projectNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Renderizando">Renderizando</SelectItem>
            <SelectItem value="Pronto">Pronto</SelectItem>
            <SelectItem value="Publicado">Publicado</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} vídeo(s)</span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma variação encontrada. Crie um projeto na aba "Novo Projeto".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="aspect-[9/16] bg-muted flex items-center justify-center">
                <Video className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium truncate">{v.nome}</p>
                <p className="text-xs text-muted-foreground">{v.projeto}</p>
                <div className="flex items-center justify-between">
                  <Badge className={statusColor[v.status]} variant="secondary">
                    {v.status}
                  </Badge>
                  {v.status === "Pronto" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`Publicando ${v.nome}...`)}>
                      Publicar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
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

  const addPage = () => setPages((prev) => [...prev, { nome: "", userId: "", token: "" }]);
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
        <CardHeader>
          <CardTitle className="text-lg">API de Renderização</CardTitle>
        </CardHeader>
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
          <Button variant="outline" size="sm" onClick={addPage}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Página
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {pages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma página configurada.</p>
          )}
          {pages.map((p, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removePage(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome da Página</Label>
                  <Input placeholder="Nome" value={p.nome} onChange={(e) => updatePage(i, "nome", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instagram User ID</Label>
                  <Input placeholder="17841400..." value={p.userId} onChange={(e) => updatePage(i, "userId", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Access Token</Label>
                  <Input type="password" placeholder="EAA..." value={p.token} onChange={(e) => updatePage(i, "token", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" /> Salvar Configurações
      </Button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function ReelsMachine() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("todos");

  const handleGenerate = (nome: string, hookCount: number, ctaCount: number) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const projectId = crypto.randomUUID();
    const totalVar = hookCount * ctaCount;

    const newProject: Project = {
      id: projectId,
      nome,
      hooks: hookCount,
      ctas: ctaCount,
      variacoes: totalVar,
      status: "Pendente",
      criadoEm: hoje,
    };

    const newVariations: Variation[] = [];
    for (let h = 1; h <= hookCount; h++) {
      for (let c = 1; c <= ctaCount; c++) {
        newVariations.push({
          id: crypto.randomUUID(),
          nome: `Hook ${h} + Corpo + CTA ${c}`,
          projeto: nome,
          status: "Pendente",
        });
      }
    }

    setProjects((prev) => [newProject, ...prev]);
    setVariations((prev) => [...newVariations, ...prev]);
    setSelectedProject(nome);
    setActiveTab("galeria");
    toast.success(`${totalVar} variações criadas para "${nome}"!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reels Machine</h1>
        <p className="text-muted-foreground">Geração em massa de variações de Reels com hooks, corpo e CTAs.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="novo" className="gap-1.5">
            <FolderPlus className="h-4 w-4" /> Novo Projeto
          </TabsTrigger>
          <TabsTrigger value="galeria" className="gap-1.5">
            <Grid3X3 className="h-4 w-4" /> Galeria
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="h-4 w-4" /> Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab projects={projects} variations={variations} /></TabsContent>
        <TabsContent value="novo"><NovoProjetoTab onGenerate={handleGenerate} /></TabsContent>
        <TabsContent value="galeria"><GaleriaTab variations={variations} projects={projects} selectedProject={selectedProject} onProjectChange={setSelectedProject} /></TabsContent>
        <TabsContent value="config"><ConfiguracoesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
