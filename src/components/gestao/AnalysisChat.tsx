import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Loader2, Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DynamicVisualization, VisualizationSpec } from "./DynamicVisualization";
import { ContextualSuggestions } from "./ContextualSuggestions";
import { SelectedSources, spreadsheetSources, supabaseSources } from "./DataSourceSelector";

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
      intimacoesPrevidenciario?: unknown[];
    };
    previdenciario: {
      peticoesIniciais?: unknown[];
      aposentadorias?: unknown[];
      tarefas?: unknown[];
      [key: string]: unknown;
    };
    trabalhista: {
      iniciais?: unknown[];
      atividades?: unknown[];
      [key: string]: unknown;
    };
    marketing?: {
      atividades?: unknown[];
      colunas?: unknown[];
      ideias?: unknown[];
      conteudos?: unknown[];
    };
    robos?: {
      tiposProdutos?: unknown[];
      transcricoes?: unknown[];
      modelagens?: unknown[];
    };
    closers?: {
      atendimentos?: unknown[];
    };
    profiles?: unknown[];
  };
  isLoadingData: boolean;
  selectedSources: SelectedSources;
}

// Helper to filter context based on selected sources
function filterContextBySelection(
  contextData: AnalysisChatProps["contextData"],
  selectedSources: SelectedSources
): AnalysisChatProps["contextData"] {
  const filtered: AnalysisChatProps["contextData"] = {
    commercial: {},
    bancario: {},
    controladoria: {},
    previdenciario: {},
    trabalhista: {},
    profiles: contextData.profiles,
  };

  // Map GIDs to context data keys for each spreadsheet
  const gidToDataMapping: Record<string, Record<string, string>> = {
    commercial: {
      "0": "records",
      "1631515229": "sdrData",
      "686842485": "sdrMessages",
      "290508236": "referralContacts",
      "2087539342": "referralReceived",
      "1874749978": "sanitization",
      "651337262": "googleReviews",
      "1905290884": "advboxDocs",
      "774111166": "witnesses",
      "186802545": "physicalDocs",
      "199327118": "bankingSchedules",
    },
    bancario: {
      "0": "iniciaisData",
      "325813835": "saneamentoData",
      "642720152": "transitoData",
    },
    controladoria: {
      "0": "tasks",
      "1319762905": "sectors",
      "1590941680": "conformityErrors",
      "1397357779": "deadlineErrors",
      "154449292": "intimacoesPrevidenciario",
    },
    previdenciario: {
      "1358203598": "peticoesIniciais",
      "306675231": "evolucaoIncapacidade",
      "1379612642": "tarefas",
      "0": "aposentadorias",
      "731526977": "pastasCorrecao",
    },
    trabalhista: {
      "1523237863": "iniciais",
      "52177345": "atividades",
    },
  };

  // Filter spreadsheet data
  Object.entries(selectedSources.spreadsheets).forEach(([sheetKey, gids]) => {
    const mapping = gidToDataMapping[sheetKey];
    if (!mapping) return;

    const sourceData = contextData[sheetKey as keyof typeof contextData];
    if (!sourceData || typeof sourceData !== "object") return;

    gids.forEach(gid => {
      const dataKey = mapping[gid];
      if (dataKey && dataKey in sourceData) {
        (filtered[sheetKey as keyof typeof filtered] as Record<string, unknown>)[dataKey] = 
          (sourceData as Record<string, unknown>)[dataKey];
      }
    });
  });

  // Filter Supabase data
  if (selectedSources.supabase.includes("marketing")) {
    filtered.marketing = contextData.marketing;
  }
  if (selectedSources.supabase.includes("conteudos")) {
    // conteudos is part of marketing
    if (!filtered.marketing) filtered.marketing = {};
    filtered.marketing.conteudos = contextData.marketing?.conteudos;
    filtered.marketing.ideias = contextData.marketing?.ideias;
  }
  if (selectedSources.supabase.includes("closers")) {
    filtered.closers = contextData.closers;
  }
  if (selectedSources.supabase.includes("robos")) {
    filtered.robos = contextData.robos;
  }

  return filtered;
}

// Generate selection description for the AI
function getSelectionDescription(selectedSources: SelectedSources): string {
  const parts: string[] = [];

  spreadsheetSources.forEach(sheet => {
    const selectedGids = selectedSources.spreadsheets[sheet.key] || [];
    if (selectedGids.length === 0) return;

    if (selectedGids.length === sheet.tabs.length) {
      parts.push(`${sheet.name} (todas as abas)`);
    } else {
      const tabNames = sheet.tabs
        .filter(t => selectedGids.includes(t.gid))
        .map(t => t.name);
      parts.push(`${sheet.name}: ${tabNames.join(", ")}`);
    }
  });

  supabaseSources.forEach(source => {
    if (selectedSources.supabase.includes(source.id)) {
      parts.push(source.name);
    }
  });

  return parts.length > 0 ? parts.join(" | ") : "Nenhuma fonte selecionada";
}

export function AnalysisChat({ contextData, isLoadingData, selectedSources }: AnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Filter context based on selection
  const filteredContext = useMemo(
    () => filterContextBySelection(contextData, selectedSources),
    [contextData, selectedSources]
  );

  const selectionDescription = useMemo(
    () => getSelectionDescription(selectedSources),
    [selectedSources]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildFullContent = (message: Message): string => {
    let fullContent = message.content;
    
    if (message.visualizations && message.visualizations.length > 0) {
      message.visualizations.forEach((viz) => {
        if (viz.type === "text") {
          const textData = viz.data as { content: string };
          if (textData?.content) {
            fullContent += "\n\n" + (viz.title ? `## ${viz.title}\n\n` : "") + textData.content;
          }
        } else if (viz.type === "table") {
          const tableData = viz.data as { headers: string[]; rows: (string | number)[][] };
          if (tableData?.headers && tableData?.rows) {
            fullContent += "\n\n" + (viz.title ? `## ${viz.title}\n\n` : "");
            // Build markdown table
            fullContent += "| " + tableData.headers.join(" | ") + " |\n";
            fullContent += "| " + tableData.headers.map(() => "---").join(" | ") + " |\n";
            tableData.rows.forEach(row => {
              fullContent += "| " + row.join(" | ") + " |\n";
            });
          }
        } else if (viz.type === "metric") {
          const metricData = viz.data as { value: number | string; label: string; trend?: string };
          if (metricData) {
            fullContent += "\n\n" + (viz.title ? `**${viz.title}:** ` : "") + 
              `${metricData.label}: ${metricData.value}` + 
              (metricData.trend ? ` (${metricData.trend})` : "");
          }
        } else if (viz.type === "chart") {
          const chartData = viz.data as { name: string; value: number }[];
          if (Array.isArray(chartData)) {
            fullContent += "\n\n" + (viz.title ? `## ${viz.title}\n\n` : "");
            chartData.forEach(item => {
              fullContent += `- ${item.name}: ${item.value}\n`;
            });
          }
        }
      });
    }
    
    return fullContent;
  };

  const handleCopy = async (index: number, message: Message) => {
    try {
      const fullContent = buildFullContent(message);
      await navigator.clipboard.writeText(fullContent);
      setCopiedIndex(index);
      toast({
        title: "Copiado!",
        description: "Resposta completa copiada para a área de transferência.",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

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
          context: filteredContext,
          selectedSources: selectionDescription,
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

  const hasNoSourcesSelected = 
    Object.keys(selectedSources.spreadsheets).length === 0 && 
    selectedSources.supabase.length === 0;

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
            <p className="text-muted-foreground mb-2 max-w-md">
              Faça perguntas sobre produtividade, metas, contratos e performance de qualquer setor ou colaborador.
            </p>
            
            {/* Show selected sources */}
            <p className="text-xs text-muted-foreground mb-6 max-w-lg bg-muted/50 px-3 py-2 rounded-lg">
              <strong>Fontes ativas:</strong> {selectionDescription}
            </p>
            
          {isLoadingData ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando dados dos setores...</span>
              </div>
            ) : hasNoSourcesSelected ? (
              <div className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg">
                ⚠️ Nenhuma fonte de dados selecionada. Selecione ao menos uma fonte para fazer perguntas.
              </div>
            ) : (
              <div className="w-full max-w-2xl">
                <ContextualSuggestions 
                  contextData={filteredContext}
                  onSelectQuery={handleSend}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className="w-full">
                {message.role === "user" ? (
                  <div className="flex justify-end mb-4">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[85%]">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full mb-6">
                    {/* Copy button */}
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(index, message)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Markdown content */}
                    <div className="w-full prose prose-base dark:prose-invert max-w-none 
                      prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                      prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-li:text-foreground prose-li:leading-relaxed
                      prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc
                      prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal
                      prose-li:my-1
                      prose-img:rounded-lg prose-img:max-w-full prose-img:my-6
                      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg
                      prose-hr:my-6 prose-hr:border-border
                    ">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({ node, ...props }) => (
                            <img 
                              {...props} 
                              className="rounded-lg max-w-full h-auto shadow-md" 
                              loading="lazy"
                            />
                          ),
                          a: ({ node, ...props }) => (
                            <a 
                              {...props} 
                              className="text-primary hover:underline font-medium" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p {...props} className="mb-4 leading-relaxed" />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul {...props} className="my-4 pl-6 space-y-2 list-disc" />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol {...props} className="my-4 pl-6 space-y-2 list-decimal" />
                          ),
                          li: ({ node, ...props }) => (
                            <li {...props} className="leading-relaxed" />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 {...props} className="text-2xl font-bold mt-6 mb-4" />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 {...props} className="text-xl font-semibold mt-5 mb-3" />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong {...props} className="font-semibold text-foreground" />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote {...props} className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Visualizations */}
                    {message.visualizations && message.visualizations.length > 0 && (
                      <div className="mt-6 space-y-6">
                        {/* Text visualizations - full width */}
                        {message.visualizations
                          .filter(viz => viz.type === "text")
                          .map((viz, vizIndex) => (
                            <div key={`text-${vizIndex}`} className="w-full">
                              <DynamicVisualization visualization={viz} />
                            </div>
                          ))}
                        
                        {/* Other visualizations in grid */}
                        {message.visualizations.filter(viz => viz.type !== "text").length > 0 && (
                          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {message.visualizations
                              .filter(viz => viz.type !== "text")
                              .map((viz, vizIndex) => (
                                <div 
                                  key={`viz-${vizIndex}`} 
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Analisando dados...</span>
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
            placeholder={hasNoSourcesSelected ? "Selecione fontes de dados primeiro..." : "Faça uma pergunta sobre os dados..."}
            className="resize-none min-h-[44px] max-h-32"
            disabled={isLoading || isLoadingData || hasNoSourcesSelected}
            rows={1}
          />
          
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || isLoadingData || hasNoSourcesSelected}
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
