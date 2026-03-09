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

// ─── Mock Drive detection ───────────────────────────────────────
function mockDetectDriveFiles(url: string): { type: "file" | "folder"; files: string[] } {
  if (url.includes("/folders/") || url.includes("folderview")) {
    return {
      type: "folder",
      files: ["intro_energetico.mp4", "gancho_urgencia.mp4", "abertura_curiosidade.mp4"],
    };
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
  onAddDrive: (items: VideoItem[]) => void;
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
    // Simulate API delay
    setTimeout(() => {
      const result = mockDetectDriveFiles(driveUrl);
      const newItems: VideoItem[] = result.files.map((name) => ({
        id: crypto.randomUUID(),
        name,
        source: "drive" as const,
        driveUrl: driveUrl,
      }));
      if (!multiple) {
        onAddDrive(newItems.slice(0, 1));
      } else {
        onAddDrive(newItems);
      }
      toast.success(
        result.type === "folder"
          ? `${result.files.length} arquivo(s) detectados na pasta`
          : `Arquivo importado: ${result.files[0]}`
      );
      setDriveUrl("");
      setShowDriveInput(false);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowDriveInput(!showDriveInput)}
        >
          <Link className="h-3.5 w-3.5" />
          Importar do Google Drive
        </Button>
      </div>

      {showDriveInput && (
        <div className="flex gap-2 items-center border rounded-lg p-3 bg-muted/30">
          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Cole o link do Google Drive (arquivo ou pasta)"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleImportDrive()}
          />
          <Button size="sm" className="h-8 shrink-0" onClick={handleImportDrive} disabled={!driveUrl.trim() || loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Importar"}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setShowDriveInput(false); setDriveUrl(""); }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

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
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
              <div className="flex items-center gap-2 truncate">
                {item.source === "drive" ? (
                  <FolderOpen className="h-3.5 w-3.5 text-chart-4 shrink-0" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{item.name}</span>
                {item.source === "drive" && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-chart-4/10 text-chart-4">Drive</Badge>
                )}
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
