import { useState, useEffect, useMemo } from "react";
import { Copy, Save, RotateCcw, Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFormatosModelador, FormatoSaida } from "@/hooks/useFormatosModelador";
import { getFormatoIcon, getFormatoColors } from "@/utils/formatoIcons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface ReplicaPrompt {
  id: string;
  nome: string;
  prompt: string;
  descricao: string | null;
  formato_saida: string;
}

interface FormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formato: FormatoSaida | null;
  prompt: ReplicaPrompt | null;
  onSave: (promptText: string) => Promise<void>;
  isSaving: boolean;
}

function FormatDialog({
  open,
  onOpenChange,
  formato,
  prompt,
  onSave,
  isSaving,
}: FormatDialogProps) {
  const [editedPrompt, setEditedPrompt] = useState(prompt?.prompt || getDefaultPrompt());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedPrompt(prompt?.prompt || getDefaultPrompt());
    setHasChanges(false);
  }, [prompt, open]);

  const handleChange = (value: string) => {
    setEditedPrompt(value);
    setHasChanges(value !== (prompt?.prompt || getDefaultPrompt()));
  };

  const handleSave = async () => {
    await onSave(editedPrompt);
    setHasChanges(false);
  };

  const handleReset = () => {
    setEditedPrompt(prompt?.prompt || getDefaultPrompt());
    setHasChanges(false);
  };

  const handleRestoreDefault = () => {
    setEditedPrompt(getDefaultPrompt());
    setHasChanges(true);
  };

  if (!formato) return null;

  const Icon = getFormatoIcon(formato.icone);
  const colors = getFormatoColors(formato.cor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Prompt Réplica:</span>
            <Badge variant="outline" className={cn("gap-1", colors.textColor)}>
              <Icon className="h-3 w-3" />
              {formato.nome}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Configure as instruções específicas para modelar réplicas no formato {formato.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt-edit">Instruções para a IA</Label>
            <Button variant="ghost" size="sm" onClick={handleRestoreDefault}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Restaurar Padrão
            </Button>
          </div>
          <ScrollArea className="flex-1 border rounded-md">
            <Textarea
              id="prompt-edit"
              value={editedPrompt}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={`Insira as instruções que a IA deve seguir ao modelar réplicas no formato ${formato.nome}...`}
              className="min-h-[400px] border-0 font-mono text-sm resize-none"
            />
          </ScrollArea>
          <p className="text-xs text-muted-foreground">
            Variáveis disponíveis: {"{transcricao}"}, {"{legenda}"}, {"{formato_origem}"}, {"{formato_saida}"}
          </p>
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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

export default function ModeladorReplica() {
  const { user } = useAuthContext();
  const { formatosSaida, isLoading: isLoadingFormatos } = useFormatosModelador();
  
  const [prompts, setPrompts] = useState<ReplicaPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormato, setSelectedFormato] = useState<FormatoSaida | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("tipo", "replica")
        .not("formato_saida", "is", null);

      if (error) throw error;
      setPrompts(data as ReplicaPrompt[] || []);
    } catch (error) {
      console.error("Erro ao carregar prompts:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const promptsByFormato = useMemo(() => {
    const map: Record<string, ReplicaPrompt | null> = {};
    formatosSaida.forEach((formato) => {
      const found = prompts.find((p) => p.formato_saida === formato.key);
      map[formato.key] = found || null;
    });
    return map;
  }, [prompts, formatosSaida]);

  const handleOpenDialog = (formato: FormatoSaida) => {
    setSelectedFormato(formato);
    setDialogOpen(true);
  };

  const handleSavePrompt = async (promptText: string) => {
    if (!selectedFormato || !user?.id) return;

    const existingPrompt = promptsByFormato[selectedFormato.key];

    setIsSaving(true);
    try {
      const nome = `Réplica → ${selectedFormato.nome}`;
      const descricao = `Prompt para modelar réplica no formato ${selectedFormato.nome}`;

      if (existingPrompt) {
        const { error } = await supabase
          .from("ai_prompts")
          .update({
            prompt: promptText,
            nome,
            descricao,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPrompt.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_prompts")
          .insert({
            user_id: user.id,
            nome,
            prompt: promptText,
            descricao,
            tipo: "replica",
            formato_saida: selectedFormato.key,
          });

        if (error) throw error;
      }

      toast.success(`Prompt para "${selectedFormato.nome}" salvo com sucesso!`);
      await loadPrompts();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPrompt = useMemo(() => {
    if (!selectedFormato) return null;
    return promptsByFormato[selectedFormato.key];
  }, [selectedFormato, promptsByFormato]);

  const configuredCount = useMemo(() => {
    return Object.values(promptsByFormato).filter(Boolean).length;
  }, [promptsByFormato]);

  const isLoading = isLoadingPrompts || isLoadingFormatos;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Copy className="h-6 w-6" />
            Modelador Réplica
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Copy className="h-6 w-6" />
            Modelador Réplica
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure o treinamento da IA para modelagem de réplicas otimizadas por formato de saída
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {configuredCount} de {formatosSaida.length} configurados
        </Badge>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            O que é a Réplica Otimizada?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A réplica otimizada permite modelar conteúdos virais sem associá-los a um produto específico.
            Ideal para identificar tendências e adaptar conteúdos em alta para seu perfil.
            Configure abaixo um prompt específico para cada tipo de formato de saída.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Matriz de Formatos de Saída</CardTitle>
          <CardDescription>
            Clique em um formato para configurar o prompt específico de réplica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formatosSaida.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum formato de saída configurado.</p>
              <p className="text-sm">Acesse "Prompts Modelador" para adicionar formatos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {formatosSaida.map((formato) => {
                const Icon = getFormatoIcon(formato.icone);
                const colors = getFormatoColors(formato.cor);
                const hasPrompt = !!promptsByFormato[formato.key];

                return (
                  <Button
                    key={formato.id}
                    variant="outline"
                    className={cn(
                      "h-auto flex-col gap-2 p-4 transition-all relative",
                      hasPrompt 
                        ? "bg-green-500/10 hover:bg-green-500/20 border-green-500/30" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleOpenDialog(formato)}
                  >
                    {hasPrompt && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                    <div className={cn("p-2 rounded", colors.bgColor, colors.textColor)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{formato.nome}</span>
                    {formato.descricao && (
                      <span className="text-xs text-muted-foreground text-center line-clamp-2">
                        {formato.descricao}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <Check className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Prompt configurado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-dashed border-muted-foreground/30" />
              <span className="text-sm text-muted-foreground">Sem prompt (usará padrão)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <FormatDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formato={selectedFormato}
        prompt={selectedPrompt}
        onSave={handleSavePrompt}
        isSaving={isSaving}
      />
    </div>
  );
}

function getDefaultPrompt(): string {
  return `Você é um especialista em marketing de conteúdo e análise de vídeos virais.

Sua tarefa é analisar o conteúdo fornecido e criar uma RÉPLICA OTIMIZADA - uma versão adaptada que mantém a essência do que fez o conteúdo original funcionar, mas com uma abordagem original e autêntica.

## CONTEXTO DO CONTEÚDO ORIGINAL

**Transcrição do Áudio:**
{transcricao}

**Legenda/Descrição Original (se disponível):**
{legenda}

**Formato de Origem:** {formato_origem}
**Formato de Saída Desejado:** {formato_saida}

## SUA ANÁLISE DEVE INCLUIR:

### 1. ANÁLISE DO GANCHO
- O que torna o início do conteúdo atrativo?
- Qual técnica de retenção foi usada?
- Como podemos replicar esse padrão de forma original?

### 2. ANÁLISE DA ESTRUTURA
- Como o conteúdo está organizado?
- Qual é o arco narrativo?
- Quais são os pontos de virada ou momentos de destaque?

### 3. ANÁLISE DA LINGUAGEM
- Tom de voz utilizado
- Palavras-chave e expressões marcantes
- Nível de formalidade e público-alvo aparente

### 4. ELEMENTOS DE VIRALIZAÇÃO
- O que faz esse conteúdo ser compartilhável?
- Quais gatilhos emocionais são acionados?
- Qual é o "valor" entregue ao espectador?

## GERE:

### TÍTULO SUGERIDO
Um título otimizado para a réplica

### GANCHO INICIAL
Os primeiros 5-10 segundos do conteúdo, adaptados para sua versão

### COPY/ROTEIRO COMPLETO
O roteiro ou copy completa para a réplica, mantendo a estrutura de sucesso mas com conteúdo original

### ORIENTAÇÕES DE FILMAGEM/PRODUÇÃO
Como produzir o conteúdo visualmente para maximizar o impacto

### LEGENDA PARA PUBLICAÇÃO
Sugestão de legenda para acompanhar o conteúdo, incluindo hashtags relevantes

Seja criativo, mas mantenha os elementos que fazem o conteúdo original funcionar.`;
}
