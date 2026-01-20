import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiPrompts, AiPrompt } from "@/hooks/useAiPrompts";
import { useToast } from "@/hooks/use-toast";

interface AiAnalysisSectionProps {
  transcricaoTexto: string;
}

export function AiAnalysisSection({ transcricaoTexto }: AiAnalysisSectionProps) {
  const { prompts, fetchPrompts, isLoading: loadingPrompts } = useAiPrompts();
  const { toast } = useToast();
  
  const [selectedPrompt, setSelectedPrompt] = useState<AiPrompt | null>(null);
  const [aiResponse, setAiResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const analyzeWithPrompt = async (prompt: AiPrompt) => {
    setSelectedPrompt(prompt);
    setAiResponse("");
    setIsAnalyzing(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-transcricao`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: prompt.prompt,
            transcricao: transcricaoTexto,
          }),
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Erro ao analisar");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let responseSoFar = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              responseSoFar += content;
              setAiResponse(responseSoFar);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              responseSoFar += content;
              setAiResponse(responseSoFar);
            }
          } catch {}
        }
      }
    } catch (error: any) {
      console.error("Error analyzing:", error);
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(aiResponse);
    toast({
      title: "Copiado!",
      description: "Resposta copiada para a área de transferência.",
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Análise com IA</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={loadingPrompts || prompts.length === 0}>
                {loadingPrompts ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : prompts.length === 0 ? (
                  "Nenhum prompt disponível"
                ) : (
                  <>
                    Selecionar Prompt
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {prompts.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => analyzeWithPrompt(p)}
                  className="flex flex-col items-start"
                >
                  <span className="font-medium">{p.nome}</span>
                  {p.descricao && (
                    <span className="text-xs text-muted-foreground">{p.descricao}</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedPrompt && !aiResponse && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Selecione um prompt para analisar a transcrição com IA.
            <br />
            <span className="text-xs">
              Crie prompts em <strong>Robôs &gt; Prompts de IA</strong>
            </span>
          </p>
        )}

        {isAnalyzing && !aiResponse && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Analisando transcrição...</span>
          </div>
        )}

        {aiResponse && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedPrompt?.nome}
              </span>
              <Button variant="ghost" size="sm" onClick={copyResponse}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
            </div>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {aiResponse}
                {isAnalyzing && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
