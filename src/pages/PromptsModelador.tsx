import { useState, useEffect, useMemo } from "react";
import { Wand2, Video, LayoutGrid, Image, Play, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAiPrompts, AiPrompt } from "@/hooks/useAiPrompts";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FormatoConfig = {
  id: string;
  nome: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  promptPrefixes: string[];
};

const FORMATOS: FormatoConfig[] = [
  {
    id: "video",
    nome: "Vídeo Curto",
    descricao: "Reels/Shorts de 30-90 segundos",
    icon: Play,
    color: "text-red-500",
    promptPrefixes: ["Modelagem de Conteúdo - Vídeo Curto", "Vídeo Curto"],
  },
  {
    id: "video_longo",
    nome: "Vídeo Longo",
    descricao: "YouTube de 5-15 minutos",
    icon: Video,
    color: "text-blue-500",
    promptPrefixes: ["Modelagem de Conteúdo - Vídeo Longo", "Vídeo Longo"],
  },
  {
    id: "carrossel",
    nome: "Carrossel",
    descricao: "5-10 slides para Instagram",
    icon: LayoutGrid,
    color: "text-purple-500",
    promptPrefixes: ["Modelagem de Conteúdo - Carrossel", "Carrossel"],
  },
  {
    id: "estatico",
    nome: "Estático",
    descricao: "Imagem única para feed/stories",
    icon: Image,
    color: "text-green-500",
    promptPrefixes: ["Modelagem de Conteúdo - Estático", "Estático"],
  },
];

const PROMPT_AUXILIAR_PREFIXES = ["Análise Visual"];

function FormatoCard({
  formato,
  prompt,
  onSave,
  isSaving,
}: {
  formato: FormatoConfig;
  prompt: AiPrompt | null;
  onSave: (promptText: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [editedPrompt, setEditedPrompt] = useState(prompt?.prompt || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedPrompt(prompt?.prompt || "");
    setHasChanges(false);
  }, [prompt]);

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

  const Icon = formato.icon;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${formato.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{formato.nome}</CardTitle>
            <CardDescription>{formato.descricao}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <Label htmlFor={`prompt-${formato.id}`}>Instruções para a IA</Label>
          <Textarea
            id={`prompt-${formato.id}`}
            value={editedPrompt}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Insira as instruções que a IA deve seguir ao modelar conteúdo para este formato..."
            className="flex-1 min-h-[300px] font-mono text-sm"
          />
        </div>
        <div className="flex gap-2 justify-end">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
          )}
          <Button 
            size="sm" 
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
        </div>
      </CardContent>
    </Card>
  );
}

function PromptsAuxiliaresTab({
  prompts,
  onSave,
  isSaving,
}: {
  prompts: AiPrompt[];
  onSave: (id: string, promptText: string) => Promise<void>;
  isSaving: string | null;
}) {
  const auxiliarPrompts = prompts.filter((p) =>
    PROMPT_AUXILIAR_PREFIXES.some((prefix) => p.nome.startsWith(prefix))
  );

  if (auxiliarPrompts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wand2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum prompt auxiliar</h3>
          <p className="text-muted-foreground text-center">
            Prompts auxiliares como "Análise Visual" aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {auxiliarPrompts.map((p) => (
        <AuxiliarPromptCard
          key={p.id}
          prompt={p}
          onSave={onSave}
          isSaving={isSaving === p.id}
        />
      ))}
    </div>
  );
}

function AuxiliarPromptCard({
  prompt,
  onSave,
  isSaving,
}: {
  prompt: AiPrompt;
  onSave: (id: string, promptText: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [editedPrompt, setEditedPrompt] = useState(prompt.prompt);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedPrompt(prompt.prompt);
    setHasChanges(false);
  }, [prompt]);

  const handleChange = (value: string) => {
    setEditedPrompt(value);
    setHasChanges(value !== prompt.prompt);
  };

  const handleSave = async () => {
    await onSave(prompt.id, editedPrompt);
    setHasChanges(false);
  };

  const handleReset = () => {
    setEditedPrompt(prompt.prompt);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{prompt.nome}</CardTitle>
        {prompt.descricao && (
          <CardDescription>{prompt.descricao}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={editedPrompt}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
        <div className="flex gap-2 justify-end">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
          )}
          <Button 
            size="sm" 
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function PromptsModeladorPage() {
  const { prompts, isLoading, fetchPrompts, createPrompt, updatePrompt } = useAiPrompts("modelador");
  const [savingFormat, setSavingFormat] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Map prompts to formats
  const promptsByFormat = useMemo(() => {
    const map: Record<string, AiPrompt | null> = {};
    
    FORMATOS.forEach((formato) => {
      const found = prompts.find((p) =>
        formato.promptPrefixes.some((prefix) => 
          p.nome.toLowerCase().includes(prefix.toLowerCase())
        )
      );
      map[formato.id] = found || null;
    });
    
    return map;
  }, [prompts]);

  const handleSaveForFormat = async (formatoId: string, promptText: string) => {
    const formato = FORMATOS.find((f) => f.id === formatoId);
    if (!formato) return;

    setSavingFormat(formatoId);
    try {
      const existingPrompt = promptsByFormat[formatoId];
      
      if (existingPrompt) {
        await updatePrompt(existingPrompt.id, existingPrompt.nome, promptText, existingPrompt.descricao || "");
      } else {
        await createPrompt(
          `Modelagem de Conteúdo - ${formato.nome}`,
          promptText,
          `Instruções para modelar conteúdo no formato ${formato.nome}`
        );
      }
      
      toast.success(`Prompt de ${formato.nome} salvo com sucesso!`);
    } catch (error) {
      toast.error("Erro ao salvar prompt");
    } finally {
      setSavingFormat(null);
    }
  };

  const handleSaveAuxiliar = async (id: string, promptText: string) => {
    setSavingFormat(id);
    try {
      const prompt = prompts.find((p) => p.id === id);
      if (prompt) {
        await updatePrompt(id, prompt.nome, promptText, prompt.descricao || "");
        toast.success("Prompt salvo com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao salvar prompt");
    } finally {
      setSavingFormat(null);
    }
  };

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
      <div className="flex items-center gap-2">
        <Wand2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Prompts Modelador</h1>
      </div>

      <p className="text-muted-foreground">
        Configure as instruções que a IA deve seguir ao modelar conteúdos para cada formato.
      </p>

      <Tabs defaultValue="formatos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="formatos">Por Formato</TabsTrigger>
          <TabsTrigger value="auxiliares">Prompts Auxiliares</TabsTrigger>
        </TabsList>

        <TabsContent value="formatos" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {FORMATOS.map((formato) => (
              <FormatoCard
                key={formato.id}
                formato={formato}
                prompt={promptsByFormat[formato.id]}
                onSave={(promptText) => handleSaveForFormat(formato.id, promptText)}
                isSaving={savingFormat === formato.id}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auxiliares">
          <PromptsAuxiliaresTab
            prompts={prompts}
            onSave={handleSaveAuxiliar}
            isSaving={savingFormat}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
