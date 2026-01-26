import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Loader2, Sparkles, RefreshCw, Copy, Check, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { DynamicVisualization, VisualizationSpec } from "./DynamicVisualization";
import { ContextualSuggestions } from "./ContextualSuggestions";
import { SelectedSources, spreadsheetSources, supabaseSources } from "./DataSourceSelector";
import logoEscritorio from "@/assets/logo-escritorio.webp";

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
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewIndex, setPdfPreviewIndex] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { profile } = useAuthContext();

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

  const handlePdfPreview = (index: number) => {
    setPdfPreviewIndex(index);
    setPdfPreviewOpen(true);
  };

  const handleDownloadPdf = async () => {
    if (pdfPreviewIndex === null) return;
    
    const pdfElement = pdfContentRef.current;
    if (!pdfElement) {
      toast({
        title: "Erro",
        description: "Não foi possível encontrar o conteúdo para o PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPdf(true);
    
    try {
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate dimensions to fit content
      const contentWidth = pdfWidth - 20; // 10mm margin each side
      const scaleFactor = contentWidth / (imgWidth / 2); // Divide by scale factor
      const contentHeight = (imgHeight / 2) * scaleFactor;
      
      // Handle multi-page if content is too tall
      const maxContentHeight = pdfHeight - 20; // 10mm margin top/bottom
      
      if (contentHeight <= maxContentHeight) {
        // Single page
        pdf.addImage(imgData, "PNG", 10, 10, contentWidth, contentHeight);
      } else {
        // Multi-page
        const pageContentHeight = maxContentHeight;
        const sourcePageHeight = pageContentHeight / scaleFactor * 2; // In canvas pixels
        let yOffset = 0;
        let pageNum = 0;
        
        while (yOffset < imgHeight) {
          if (pageNum > 0) {
            pdf.addPage();
          }
          
          // Create a temporary canvas for this page section
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.min(sourcePageHeight, imgHeight - yOffset);
          const ctx = pageCanvas.getContext("2d");
          
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, yOffset, imgWidth, pageCanvas.height,
              0, 0, imgWidth, pageCanvas.height
            );
            
            const pageImgData = pageCanvas.toDataURL("image/png");
            const thisPageHeight = (pageCanvas.height / 2) * scaleFactor;
            pdf.addImage(pageImgData, "PNG", 10, 10, contentWidth, thisPageHeight);
          }
          
          yOffset += sourcePageHeight;
          pageNum++;
        }
      }

      // Download
      const now = new Date();
      const timestamp = now.toISOString().split("T")[0];
      pdf.save(`analise-gestao-${timestamp}.pdf`);

      toast({
        title: "PDF gerado!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString("pt-BR");
    const time = now.toLocaleTimeString("pt-BR");
    return { date, time };
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
                  <div className="w-full mb-6" ref={(el) => { messageRefs.current[index] = el; }}>
                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 mb-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handlePdfPreview(index)}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        PDF
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

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Prévia do PDF</span>
              <Button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="mr-8"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </>
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {pdfPreviewIndex !== null && messages[pdfPreviewIndex] && (
            <div ref={pdfContentRef} className="bg-white text-black p-8 rounded-lg">
              {/* Header with Logo */}
              <div className="flex items-center justify-center py-6 mb-6 -mx-8 -mt-8 rounded-t-lg" style={{ backgroundColor: 'hsl(216, 50%, 12%)' }}>
                <img 
                  src={logoEscritorio} 
                  alt="David Eduardo Cunha Advogados" 
                  className="h-16 object-contain"
                />
              </div>
              
              {/* Main content */}
              <div className="prose prose-base max-w-none prose-headings:text-black prose-p:text-black prose-strong:text-black prose-li:text-black">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {messages[pdfPreviewIndex].content}
                </ReactMarkdown>
              </div>
              
              {/* Visualizations preview */}
              {messages[pdfPreviewIndex].visualizations && 
               messages[pdfPreviewIndex].visualizations!.length > 0 && (
                <div className="mt-6 space-y-6">
                  {messages[pdfPreviewIndex].visualizations!
                    .filter(viz => viz.type === "text")
                    .map((viz, vizIndex) => {
                      const textData = viz.data as { content: string };
                      return (
                        <div key={`text-${vizIndex}`}>
                          {viz.title && (
                            <h3 className="text-lg font-semibold mb-2 text-black">{viz.title}</h3>
                          )}
                          <div className="prose prose-base max-w-none prose-headings:text-black prose-p:text-black prose-strong:text-black prose-li:text-black">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {textData?.content || ""}
                            </ReactMarkdown>
                          </div>
                        </div>
                      );
                    })}
                  
                  {messages[pdfPreviewIndex].visualizations!
                    .filter(viz => viz.type === "table")
                    .map((viz, vizIndex) => {
                      const tableData = viz.data as { headers: string[]; rows: (string | number)[][] };
                      return (
                        <div key={`table-${vizIndex}`}>
                          {viz.title && (
                            <h3 className="text-lg font-semibold mb-2 text-black">{viz.title}</h3>
                          )}
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                {tableData?.headers?.map((header, i) => (
                                  <th key={i} className="border border-gray-300 px-3 py-2 text-left text-black font-medium">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableData?.rows?.map((row, rowIdx) => (
                                <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="border border-gray-300 px-3 py-2 text-black">
                                      {typeof cell === "number" ? cell.toLocaleString("pt-BR") : cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  
                  {messages[pdfPreviewIndex].visualizations!
                    .filter(viz => viz.type === "metric")
                    .map((viz, vizIndex) => {
                      const metricData = viz.data as { value: number | string; label: string; trend?: string };
                      return (
                        <div key={`metric-${vizIndex}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">{viz.title || metricData?.label}</p>
                          <p className="text-2xl font-bold text-black">
                            {typeof metricData?.value === "number" 
                              ? metricData.value.toLocaleString("pt-BR") 
                              : metricData?.value}
                          </p>
                          {metricData?.trend && (
                            <p className="text-sm text-gray-500">{metricData.trend}</p>
                          )}
                        </div>
                      );
                    })}
                  
                  {messages[pdfPreviewIndex].visualizations!
                    .filter(viz => viz.type === "chart")
                    .map((viz, vizIndex) => {
                      const chartData = viz.data as { name: string; value: number }[];
                      return (
                        <div key={`chart-${vizIndex}`}>
                          {viz.title && (
                            <h3 className="text-lg font-semibold mb-2 text-black">{viz.title}</h3>
                          )}
                          <p className="text-sm text-gray-600 mb-2">(Dados do gráfico)</p>
                          <ul className="list-disc pl-6">
                            {Array.isArray(chartData) && chartData.map((item, i) => (
                              <li key={i} className="text-black">
                                {item.name}: {typeof item.value === "number" ? item.value.toLocaleString("pt-BR") : item.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                </div>
              )}
              
              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Gerado por <span className="font-medium text-gray-700">{profile?.display_name || "Usuário"}</span> em {formatDateTime().date} às {formatDateTime().time}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
