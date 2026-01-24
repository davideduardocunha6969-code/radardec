import { useState, useEffect, useMemo } from "react";
import { Wand2, Save, RotateCcw, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiPrompts, AiPrompt } from "@/hooks/useAiPrompts";
import { useFormatosModelador, FormatoOrigem, FormatoSaida } from "@/hooks/useFormatosModelador";
import { FormatosManager } from "@/components/modelador/FormatosManager";
import { getFormatoIcon, getFormatoColors } from "@/utils/formatoIcons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CombinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatoOrigem: FormatoOrigem | null;
  formatoSaida: FormatoSaida | null;
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

  const OrigemIcon = getFormatoIcon(formatoOrigem.icone);
  const SaidaIcon = getFormatoIcon(formatoSaida.icone);
  const origemColors = getFormatoColors(formatoOrigem.cor);
  const saidaColors = getFormatoColors(formatoSaida.cor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Prompt:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("gap-1", origemColors.textColor)}>
                <OrigemIcon className="h-3 w-3" />
                {formatoOrigem.nome}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className={cn("gap-1", saidaColors.textColor)}>
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
  const { prompts, isLoading: isLoadingPrompts, fetchPrompts, createPromptWithFormats, updatePromptWithFormats } = useAiPrompts("modelador");
  const {
    formatosOrigem,
    formatosSaida,
    isLoading: isLoadingFormatos,
    createFormatoOrigem,
    createFormatoSaida,
    updateFormatoOrigem,
    updateFormatoSaida,
    deleteFormatoOrigem,
    deleteFormatoSaida,
  } = useFormatosModelador();

  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrigem, setSelectedOrigem] = useState<FormatoOrigem | null>(null);
  const [selectedSaida, setSelectedSaida] = useState<FormatoSaida | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Map prompts by combination key (origem_saida)
  const promptsByCombination = useMemo(() => {
    const map: Record<string, AiPrompt | null> = {};
    
    formatosOrigem.forEach((origem) => {
      formatosSaida.forEach((saida) => {
        const key = `${origem.key}_${saida.key}`;
        const found = prompts.find(
          (p) => p.formato_origem === origem.key && p.formato_saida === saida.key
        );
        map[key] = found || null;
      });
    });
    
    return map;
  }, [prompts, formatosOrigem, formatosSaida]);

  const handleOpenDialog = (origem: FormatoOrigem, saida: FormatoSaida) => {
    setSelectedOrigem(origem);
    setSelectedSaida(saida);
    setDialogOpen(true);
  };

  const handleSavePrompt = async (promptText: string) => {
    if (!selectedOrigem || !selectedSaida) return;

    const key = `${selectedOrigem.key}_${selectedSaida.key}`;
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
          formato_origem: selectedOrigem.key,
          formato_saida: selectedSaida.key,
        });
      } else {
        await createPromptWithFormats({
          nome,
          prompt: promptText,
          descricao,
          formato_origem: selectedOrigem.key,
          formato_saida: selectedSaida.key,
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
    const key = `${selectedOrigem.key}_${selectedSaida.key}`;
    return promptsByCombination[key];
  }, [selectedOrigem, selectedSaida, promptsByCombination]);

  const configuredCount = useMemo(() => {
    return Object.values(promptsByCombination).filter(Boolean).length;
  }, [promptsByCombination]);

  const totalCombinations = formatosOrigem.length * formatosSaida.length;

  const isLoading = isLoadingPrompts || isLoadingFormatos;

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
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {configuredCount} de {totalCombinations} configurados
          </Badge>
          <FormatosManager
            formatosOrigem={formatosOrigem}
            formatosSaida={formatosSaida}
            onCreateOrigem={createFormatoOrigem}
            onCreateSaida={createFormatoSaida}
            onUpdateOrigem={updateFormatoOrigem}
            onUpdateSaida={updateFormatoSaida}
            onDeleteOrigem={deleteFormatoOrigem}
            onDeleteSaida={deleteFormatoSaida}
          />
        </div>
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
          {formatosOrigem.length === 0 || formatosSaida.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum formato configurado.</p>
              <p className="text-sm">Clique em "Gerenciar Formatos" para adicionar formatos de origem e saída.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left border-b border-r bg-muted/50">
                        <span className="text-xs text-muted-foreground">Origem ↓ / Saída →</span>
                      </th>
                      {formatosSaida.map((saida) => {
                        const Icon = getFormatoIcon(saida.icone);
                        const colors = getFormatoColors(saida.cor);
                        return (
                          <th key={saida.id} className="p-2 border-b bg-muted/50 min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn("p-1.5 rounded", colors.bgColor, colors.textColor)}>
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
                    {formatosOrigem.map((origem) => {
                      const OrigemIcon = getFormatoIcon(origem.icone);
                      const origemColors = getFormatoColors(origem.cor);
                      return (
                        <tr key={origem.id}>
                          <td className="p-2 border-r bg-muted/50">
                            <div className="flex items-center gap-2">
                              <div className={cn("p-1.5 rounded", origemColors.bgColor, origemColors.textColor)}>
                                <OrigemIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-sm font-medium">{origem.nome}</span>
                                <p className="text-xs text-muted-foreground">{origem.descricao}</p>
                              </div>
                            </div>
                          </td>
                          {formatosSaida.map((saida) => {
                            const key = `${origem.key}_${saida.key}`;
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
            </>
          )}
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
