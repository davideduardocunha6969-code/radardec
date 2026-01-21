import { useState, useEffect, useMemo } from "react";
import { Wand2, Video, LayoutGrid, Image, Play, Save, RotateCcw, ArrowRight, BookOpen, Newspaper, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiPrompts, AiPrompt } from "@/hooks/useAiPrompts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FormatoConfig = {
  id: string;
  nome: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
};

// Formatos de ORIGEM (conteúdo original)
const FORMATOS_ORIGEM: FormatoConfig[] = [
  {
    id: "video",
    nome: "Vídeo Curto",
    descricao: "Reels/Shorts/TikTok",
    icon: Play,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "video_longo",
    nome: "Vídeo Longo",
    descricao: "YouTube 5-15min",
    icon: Video,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "carrossel",
    nome: "Carrossel",
    descricao: "5-10 slides",
    icon: LayoutGrid,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "estatico",
    nome: "Post Estático",
    descricao: "Imagem única",
    icon: Image,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "blog_post",
    nome: "Blog Post",
    descricao: "Artigo de blog",
    icon: BookOpen,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "publicacao",
    nome: "Publicação",
    descricao: "Post de texto",
    icon: Newspaper,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

// Formatos de SAÍDA (conteúdo modelado)
const FORMATOS_SAIDA: FormatoConfig[] = [
  {
    id: "video",
    nome: "Vídeo Curto",
    descricao: "30-90 segundos",
    icon: Play,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "video_longo",
    nome: "Vídeo Longo",
    descricao: "5-15 minutos",
    icon: Video,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "carrossel",
    nome: "Carrossel",
    descricao: "5-10 slides",
    icon: LayoutGrid,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "estatico",
    nome: "Estático",
    descricao: "Imagem única",
    icon: Image,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

interface CombinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatoOrigem: FormatoConfig | null;
  formatoSaida: FormatoConfig | null;
  prompt: AiPrompt | null;
  onSave: (promptText: string) => Promise<void>;
  isSaving: boolean;
}

function CombinationDialog({
  open,
  onOpenChange,
  formatoOrigem,
  formatoSaida,
  prompt,
  onSave,
  isSaving,
}: CombinationDialogProps) {
  const [editedPrompt, setEditedPrompt] = useState(prompt?.prompt || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedPrompt(prompt?.prompt || "");
    setHasChanges(false);
  }, [prompt, open]);

  const handleChange = (value: string) => {
    setEditedPrompt(value);
    setHasChanges(value !== (prompt?.prompt || ""));
  };

  const handleSave = async () => {
    await onSave(editedPrompt);
    setHasChanges(false);
  };

  const handleReset = () => {
    setEditedPrompt(prompt?.prompt || "");
    setHasChanges(false);
  };

  if (!formatoOrigem || !formatoSaida) return null;

  const OrigemIcon = formatoOrigem.icon;
  const SaidaIcon = formatoSaida.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Prompt:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("gap-1", formatoOrigem.color)}>
                <OrigemIcon className="h-3 w-3" />
                {formatoOrigem.nome}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className={cn("gap-1", formatoSaida.color)}>
                <SaidaIcon className="h-3 w-3" />
                {formatoSaida.nome}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Configure as instruções específicas para transformar um {formatoOrigem.nome} em {formatoSaida.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <Label htmlFor="prompt-edit">Instruções para a IA</Label>
          <ScrollArea className="flex-1 border rounded-md">
            <Textarea
              id="prompt-edit"
              value={editedPrompt}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={`Insira as instruções que a IA deve seguir ao transformar um ${formatoOrigem.nome} em ${formatoSaida.nome}...`}
              className="min-h-[400px] border-0 font-mono text-sm resize-none"
            />
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !editedPrompt.trim()}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasChanges ? "Salvar Alterações" : "Salvar"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PromptsModeladorPage() {
  const { prompts, isLoading, fetchPrompts, createPromptWithFormats, updatePromptWithFormats } = useAiPrompts("modelador");
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrigem, setSelectedOrigem] = useState<FormatoConfig | null>(null);
  const [selectedSaida, setSelectedSaida] = useState<FormatoConfig | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Map prompts by combination key (origem_saida)
  const promptsByCombination = useMemo(() => {
    const map: Record<string, AiPrompt | null> = {};
    
    FORMATOS_ORIGEM.forEach((origem) => {
      FORMATOS_SAIDA.forEach((saida) => {
        const key = `${origem.id}_${saida.id}`;
        const found = prompts.find(
          (p) => p.formato_origem === origem.id && p.formato_saida === saida.id
        );
        map[key] = found || null;
      });
    });
    
    return map;
  }, [prompts]);

  const handleOpenDialog = (origem: FormatoConfig, saida: FormatoConfig) => {
    setSelectedOrigem(origem);
    setSelectedSaida(saida);
    setDialogOpen(true);
  };

  const handleSavePrompt = async (promptText: string) => {
    if (!selectedOrigem || !selectedSaida) return;

    const key = `${selectedOrigem.id}_${selectedSaida.id}`;
    const existingPrompt = promptsByCombination[key];

    setIsSaving(true);
    try {
      const nome = `${selectedOrigem.nome} → ${selectedSaida.nome}`;
      const descricao = `Transforma ${selectedOrigem.nome} em ${selectedSaida.nome}`;

      if (existingPrompt) {
        await updatePromptWithFormats({
          id: existingPrompt.id,
          nome,
          prompt: promptText,
          descricao,
          formato_origem: selectedOrigem.id,
          formato_saida: selectedSaida.id,
        });
      } else {
        await createPromptWithFormats({
          nome,
          prompt: promptText,
          descricao,
          formato_origem: selectedOrigem.id,
          formato_saida: selectedSaida.id,
        });
      }

      toast.success(`Prompt "${nome}" salvo com sucesso!`);
      setDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPrompt = useMemo(() => {
    if (!selectedOrigem || !selectedSaida) return null;
    const key = `${selectedOrigem.id}_${selectedSaida.id}`;
    return promptsByCombination[key];
  }, [selectedOrigem, selectedSaida, promptsByCombination]);

  const configuredCount = useMemo(() => {
    return Object.values(promptsByCombination).filter(Boolean).length;
  }, [promptsByCombination]);

  const totalCombinations = FORMATOS_ORIGEM.length * FORMATOS_SAIDA.length;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Prompts Modelador</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {configuredCount} de {totalCombinations} configurados
        </Badge>
      </div>

      <p className="text-muted-foreground">
        Configure instruções específicas para cada combinação de formato origem → saída. 
        Clique em uma célula da matriz para editar o prompt correspondente.
      </p>

      {/* Matrix Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Matriz de Combinações</CardTitle>
          <CardDescription>
            Linhas = Formato do conteúdo original | Colunas = Formato de saída
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left border-b border-r bg-muted/50">
                    <span className="text-xs text-muted-foreground">Origem ↓ / Saída →</span>
                  </th>
                  {FORMATOS_SAIDA.map((saida) => {
                    const Icon = saida.icon;
                    return (
                      <th key={saida.id} className="p-2 border-b bg-muted/50 min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn("p-1.5 rounded", saida.bgColor, saida.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium">{saida.nome}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {FORMATOS_ORIGEM.map((origem) => {
                  const OrigemIcon = origem.icon;
                  return (
                    <tr key={origem.id}>
                      <td className="p-2 border-r bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded", origem.bgColor, origem.color)}>
                            <OrigemIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">{origem.nome}</span>
                            <p className="text-xs text-muted-foreground">{origem.descricao}</p>
                          </div>
                        </div>
                      </td>
                      {FORMATOS_SAIDA.map((saida) => {
                        const key = `${origem.id}_${saida.id}`;
                        const hasPrompt = !!promptsByCombination[key];
                        
                        return (
                          <td key={saida.id} className="p-2 border-b">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full h-12 transition-all",
                                hasPrompt 
                                  ? "bg-green-500/10 hover:bg-green-500/20 border border-green-500/30" 
                                  : "bg-muted/30 hover:bg-muted/50 border border-dashed border-muted-foreground/30"
                              )}
                              onClick={() => handleOpenDialog(origem, saida)}
                            >
                              {hasPrompt ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <span className="text-xs text-muted-foreground">Configurar</span>
                              )}
                            </Button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <Check className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Prompt configurado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                <X className="h-3 w-3 text-muted-foreground/50" />
              </div>
              <span className="text-sm text-muted-foreground">Sem prompt (usará padrão)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for editing prompts */}
      <CombinationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formatoOrigem={selectedOrigem}
        formatoSaida={selectedSaida}
        prompt={selectedPrompt}
        onSave={handleSavePrompt}
        isSaving={isSaving}
      />
    </div>
  );
}
