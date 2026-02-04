import { useState, useEffect } from "react";
import { Copy, Save, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const PROMPT_REPLICA_KEY = "replica_otimizada";

export default function ModeladorReplica() {
  const { user } = useAuthContext();
  const [prompt, setPrompt] = useState("");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("tipo", "replica")
        .eq("nome", PROMPT_REPLICA_KEY)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPrompt(data.prompt);
        setPromptId(data.id);
      } else {
        // Load default prompt
        setPrompt(getDefaultPrompt());
      }
    } catch (error) {
      console.error("Erro ao carregar prompt:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSaving(true);
    try {
      if (promptId) {
        // Update existing
        const { error } = await supabase
          .from("ai_prompts")
          .update({ prompt, updated_at: new Date().toISOString() })
          .eq("id", promptId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("ai_prompts")
          .insert({
            user_id: user.id,
            nome: PROMPT_REPLICA_KEY,
            tipo: "replica",
            prompt,
            descricao: "Prompt para modelagem de réplica otimizada (sem produto específico)"
          })
          .select()
          .single();

        if (error) throw error;
        setPromptId(data.id);
      }

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copiado!");
  };

  const handleRestoreDefault = () => {
    setPrompt(getDefaultPrompt());
    toast.info("Prompt padrão restaurado. Clique em Salvar para confirmar.");
  };

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
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Copy className="h-6 w-6" />
          Modelador Réplica
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure o treinamento da IA para modelagem de réplicas otimizadas
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            O que é a Réplica Otimizada?
          </CardTitle>
          <CardDescription>
            A réplica otimizada permite modelar conteúdos virais sem associá-los a um produto específico do seu escritório.
            Ideal para identificar tendências e adaptar conteúdos em alta para seu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-primary">
              <strong>Quando usar:</strong> Quando você encontrar um conteúdo viral que quer replicar, mas não precisa associar a nenhum serviço específico.
              A IA irá analisar a estrutura, linguagem e abordagem do conteúdo e gerar uma versão otimizada para você.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Prompt de Modelagem</CardTitle>
          <CardDescription>
            Configure as instruções que a IA seguirá ao modelar réplicas otimizadas.
            Este prompt será usado quando você clicar em "Modelar Réplica Otimizada" no Modelador de Conteúdo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Instruções para a IA</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite as instruções para modelagem de réplicas..."
              className="min-h-[400px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {"{transcricao}"}, {"{legenda}"}, {"{formato_origem}"}, {"{formato_saida}"}
            </p>
          </div>

          <div className="flex items-center gap-2 justify-between pt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRestoreDefault}>
                Restaurar Padrão
              </Button>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
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
