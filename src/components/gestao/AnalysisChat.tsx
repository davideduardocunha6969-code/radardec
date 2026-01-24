import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DynamicVisualization, VisualizationSpec } from "./DynamicVisualization";
import { ContextualSuggestions } from "./ContextualSuggestions";

interface AnalysisResponse {
  summary: string;
  visualizations: VisualizationSpec[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  visualizations?: VisualizationSpec[];
}

interface AnalysisChatProps {
  contextData: {
    commercial: {
      records?: unknown[];
      sdrData?: unknown[];
      [key: string]: unknown;
    };
    bancario: {
      iniciaisData?: unknown[];
      saneamentoData?: unknown[];
      transitoData?: unknown[];
    };
    controladoria: {
      tasks?: unknown[];
      conformityErrors?: unknown[];
      deadlineErrors?: unknown[];
    };
    previdenciario: {
      peticoesIniciais?: unknown[];
      aposentadorias?: unknown[];
      [key: string]: unknown;
    };
    trabalhista: {
      iniciais?: unknown[];
      atividades?: unknown[];
      [key: string]: unknown;
    };
  };
  isLoadingData: boolean;
}

export function AnalysisChat({ contextData, isLoadingData }: AnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (query?: string) => {
    const messageText = query || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-gestao", {
        body: {
          query: messageText,
          context: contextData,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Erro na análise");
      }

      const analysisData = data.data as AnalysisResponse;
      
      const assistantMessage: Message = {
        role: "assistant",
        content: analysisData.summary,
        visualizations: analysisData.visualizations,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Analysis error:", err);
      toast({
        title: "Erro na análise",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Assistente de Análise Inteligente
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Faça perguntas sobre produtividade, metas, contratos e performance de qualquer setor ou colaborador.
            </p>
            
          {isLoadingData ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando dados dos setores...</span>
              </div>
            ) : (
              <div className="w-full max-w-2xl">
                <ContextualSuggestions 
                  contextData={contextData}
                  onSelectQuery={handleSend}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2"
                      : "space-y-4"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <>
                      <Card className="bg-muted/30 border-border/50">
                        <CardContent className="pt-4">
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </CardContent>
                      </Card>
                      
                      {message.visualizations && message.visualizations.length > 0 && (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {message.visualizations.map((viz, vizIndex) => (
                            <div 
                              key={vizIndex} 
                              className={
                                viz.type === "table" || viz.type === "chart" 
                                  ? "md:col-span-2 lg:col-span-3" 
                                  : ""
                              }
                            >
                              <DynamicVisualization visualization={viz} />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analisando dados...</span>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4 bg-background/50 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearChat}
              className="shrink-0"
              title="Limpar conversa"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Faça uma pergunta sobre os dados..."
            className="resize-none min-h-[44px] max-h-32"
            disabled={isLoading || isLoadingData}
            rows={1}
          />
          
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || isLoadingData}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
