import { useState, useEffect, useCallback } from "react";
import { Sparkles, Copy, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiPrompts, AiPrompt } from "@/hooks/useAiPrompts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AiAnalysisSectionProps {
  transcricaoTexto: string;
  onAnalysisCountChange?: (count: number) => void;
}

interface AnalysisResult {
  promptId: string;
  promptName: string;
  response: string;
  isLoading: boolean;
}

export function AiAnalysisSection({ 
  transcricaoTexto,
  onAnalysisCountChange 
}: AiAnalysisSectionProps) {
  const { prompts, fetchPrompts, isLoading: loadingPrompts } = useAiPrompts();
  const { toast } = useToast();
  
  const [showFormattedTranscription, setShowFormattedTranscription] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Notify parent of analysis count changes
  useEffect(() => {
    onAnalysisCountChange?.(analysisResults.length);
  }, [analysisResults.length, onAnalysisCountChange]);

  const handleGenerateTranscription = () => {
    setShowFormattedTranscription(true);
    toast({
      title: "Transcrição gerada",
      description: "A transcrição formatada foi exibida abaixo.",
    });
    
    // Scroll to transcription section after a brief delay
    setTimeout(() => {
      const element = document.getElementById("transcricao-completa");
      const scrollContainer = document.querySelector('[data-scroll-container="transcricao"]');
      if (element && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offset = elementRect.top - containerRect.top + scrollContainer.scrollTop - 20;
        scrollContainer.scrollTo({ top: offset, behavior: "smooth" });
      }
    }, 100);
  };

  const copyTranscription = () => {
    navigator.clipboard.writeText(transcricaoTexto);
    toast({
      title: "Copiado!",
      description: "Transcrição copiada para a área de transferência.",
    });
  };

  const analyzeWithPrompt = useCallback(async (prompt: AiPrompt) => {
    // Check if already analyzing this prompt
    const existingIndex = analysisResults.findIndex(r => r.promptId === prompt.id);
    if (existingIndex !== -1 && analysisResults[existingIndex].isLoading) {
      return;
    }

    const newIndex = existingIndex !== -1 ? existingIndex : analysisResults.length;

    // Add or update the result entry
    if (existingIndex !== -1) {
      setAnalysisResults(prev => prev.map((r, i) => 
        i === existingIndex ? { ...r, response: "", isLoading: true } : r
      ));
    } else {
      setAnalysisResults(prev => [...prev, {
        promptId: prompt.id,
        promptName: prompt.nome,
        response: "",
        isLoading: true,
      }]);
    }

    // Scroll to the analysis section after a brief delay
    setTimeout(() => {
      const element = document.getElementById(`analise-${newIndex}`);
      const scrollContainer = document.querySelector('[data-scroll-container="transcricao"]');
      if (element && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offset = elementRect.top - containerRect.top + scrollContainer.scrollTop - 20;
        scrollContainer.scrollTo({ top: offset, behavior: "smooth" });
      }
    }, 100);

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
              setAnalysisResults(prev => prev.map(r => 
                r.promptId === prompt.id ? { ...r, response: responseSoFar } : r
              ));
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
              setAnalysisResults(prev => prev.map(r => 
                r.promptId === prompt.id ? { ...r, response: responseSoFar } : r
              ));
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
      setAnalysisResults(prev => prev.map(r => 
        r.promptId === prompt.id ? { ...r, isLoading: false } : r
      ));
    }
  }, [analysisResults, transcricaoTexto, toast]);

  const copyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    toast({
      title: "Copiado!",
      description: "Resposta copiada para a área de transferência.",
    });
  };

  const isPromptLoading = (promptId: string) => {
    return analysisResults.find(r => r.promptId === promptId)?.isLoading || false;
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Generate Transcription Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleGenerateTranscription}
          className="gap-2"
          disabled={showFormattedTranscription}
        >
          <FileText className="h-5 w-5" />
          Gerar Transcrição Formatada
        </Button>
      </div>

      {/* Formatted Transcription Card */}
      {showFormattedTranscription && (
        <Card id="transcricao-completa">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Transcrição Completa
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyTranscription}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {transcricaoTexto}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* AI Prompts Section */}
      {showFormattedTranscription && (
        <Card id="prompts-ia">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Análise com IA</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em um dos prompts abaixo para analisar a transcrição
            </p>
          </CardHeader>
          <CardContent>
            {loadingPrompts ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Carregando prompts...</span>
              </div>
            ) : prompts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum prompt disponível.
                <br />
                <span className="text-xs">
                  Crie prompts em <strong>Robôs &gt; Prompts de IA</strong>
                </span>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <Button
                    key={prompt.id}
                    variant="outline"
                    size="sm"
                    onClick={() => analyzeWithPrompt(prompt)}
                    disabled={isPromptLoading(prompt.id)}
                    className={cn(
                      "transition-all",
                      analysisResults.find(r => r.promptId === prompt.id)?.response && 
                        "border-primary text-primary"
                    )}
                  >
                    {isPromptLoading(prompt.id) && (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    )}
                    {prompt.nome}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResults.map((result, index) => (
        <Card key={result.promptId} id={`analise-${index}`} className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {result.promptName}
              </CardTitle>
              {result.response && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyResponse(result.response)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result.isLoading && !result.response ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Analisando transcrição...</span>
              </div>
            ) : (
              <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {result.response}
                  {result.isLoading && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
