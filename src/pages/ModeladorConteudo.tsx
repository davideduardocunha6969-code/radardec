import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Wand2, Loader2, ExternalLink, ArrowRight, Send, AlertCircle, Upload, X, FileVideo, LayoutGrid, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useTiposProdutos, TipoProduto, SETOR_LABELS, SETOR_COLORS } from "@/hooks/useTiposProdutos";
import { useModelagemConteudo, ModelagemResult } from "@/hooks/useModelagemConteudo";
import { Formato, FORMATO_LABELS } from "@/hooks/useConteudosMidia";
import { useFormatosModelador, FormatoOrigem, FormatoSaida } from "@/hooks/useFormatosModelador";
import { ModelagemIdeiaFormDialog } from "@/components/modelador/ModelagemIdeiaFormDialog";
import { ModelagemResultsView } from "@/components/modelador/ModelagemResultsView";
import { getFormatoIcon, getFormatoColors } from "@/utils/formatoIcons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PendingIdeia {
  produto: TipoProduto | null;
  formatoSaida: string;
  formatoOrigem: string;
  result: ModelagemResult;
  link: string;
  isReplica?: boolean;
}

// Produto fake para réplica otimizada
const REPLICA_PRODUTO: TipoProduto = {
  id: "replica-otimizada",
  nome: "Réplica Otimizada",
  setor: "geral" as any,
  descricao: "Conteúdo modelado sem associação a produto específico",
  caracteristicas: null,
  perfil_cliente_ideal: null,
  estrutura_editorial: null,
  created_at: "",
  updated_at: "",
  user_id: "",
};

type ModeladorStep = "select-origem" | "select-saida" | "input-link" | "upload-video" | "select-products" | "analyzing" | "results";

export default function ModeladorConteudo() {
  const { produtos, isLoading: loadingProdutos } = useTiposProdutos();
  const { isAnalyzing, analyzeVideoUploadMultiFormato, resetState: resetModelagem } = useModelagemConteudo();
  const { formatosOrigem, formatosSaida: formatosSaidaDB, isLoading: loadingFormatos } = useFormatosModelador();

  const [step, setStep] = useState<"select-origem" | "select-saida" | "input-link" | "upload-video" | "select-products" | "analyzing" | "results">("select-origem");
  const [formatoOrigem, setFormatoOrigem] = useState<string | null>(null);
  const [formatosSaidaSelecionados, setFormatosSaidaSelecionados] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [pendingIdeias, setPendingIdeias] = useState<PendingIdeia[]>([]);
  const [currentIdeiaIndex, setCurrentIdeiaIndex] = useState(0);
  const [ideiaFormOpen, setIdeiaFormOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isDirectLink, setIsDirectLink] = useState(false);
  const [extractingLink, setExtractingLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get current selected origin format details
  const selectedOrigemFormat = useMemo(() => {
    return formatosOrigem.find(f => f.key === formatoOrigem) || null;
  }, [formatosOrigem, formatoOrigem]);

  // Get labels for display
  const getOrigemLabel = useCallback((key: string) => {
    const format = formatosOrigem.find(f => f.key === key);
    return format?.nome || key;
  }, [formatosOrigem]);

  const getSaidaLabel = useCallback((key: string) => {
    const format = formatosSaidaDB.find(f => f.key === key);
    return format?.nome || FORMATO_LABELS[key as Formato] || key;
  }, [formatosSaidaDB]);

  const clearVideoPreview = useCallback(() => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch {
        // ignore
      }
    }

    if (videoPreviewUrl) {
      try {
        URL.revokeObjectURL(videoPreviewUrl);
      } catch {
        // ignore
      }
    }

    setVideoPreviewUrl(null);
  }, [videoPreviewUrl]);

  const selectMediaFile = useCallback(
    (file: File) => {
      clearVideoPreview();
      setVideoFile(file);
    },
    [clearVideoPreview]
  );

  useEffect(() => {
    if (!videoFile || !videoFile.type.startsWith("video/")) return;

    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);

    if (videoRef.current) {
      try {
        videoRef.current.load();
      } catch {
        // ignore
      }
    }

    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };
  }, [videoFile]);

  const handleOrigemSelect = (formatKey: string) => {
    setFormatoOrigem(formatKey);
    setStep("select-saida");
  };

  const handleFormatoSaidaToggle = (formatKey: string) => {
    setFormatosSaidaSelecionados((prev) =>
      prev.includes(formatKey)
        ? prev.filter((f) => f !== formatKey)
        : [...prev, formatKey]
    );
  };

  const handleProdutoToggle = (produtoId: string) => {
    setProdutosSelecionados((prev) =>
      prev.includes(produtoId)
        ? prev.filter((id) => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  const handleContinueToInput = () => {
    if (formatosSaidaSelecionados.length === 0) {
      toast.error("Selecione pelo menos um formato de saída");
      return;
    }
    setStep("input-link");
  };

  const isSocialMediaLink = (url: string): boolean => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.includes("instagram.com") || host.includes("tiktok.com");
    } catch {
      return false;
    }
  };

  const handleContinueToUpload = async () => {
    if (!link) {
      toast.error("Cole o link do conteúdo original");
      return;
    }

    // Check if it's an Instagram or TikTok link
    if (isSocialMediaLink(link)) {
      setExtractingLink(true);
      try {
        const { data, error } = await supabase.functions.invoke("analyze-instagram-video", {
          body: { link, action: "extract" },
        });

        if (error) throw error;

        if (data?.success) {
          setIsDirectLink(true);
          toast.success("Vídeo detectado automaticamente! Upload não necessário.");
          setStep("select-products");
          return;
        } else {
          toast.warning(data?.error || "Não foi possível extrair o vídeo automaticamente. Faça upload manualmente.");
        }
      } catch (err) {
        console.error("Erro ao extrair link:", err);
        toast.warning("Não foi possível extrair o vídeo automaticamente. Faça upload manualmente.");
      } finally {
        setExtractingLink(false);
      }
    }

    setIsDirectLink(false);
    setStep("upload-video");
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        selectMediaFile(file);
      } else {
        toast.error("Por favor, selecione um arquivo de vídeo ou áudio");
      }
    }
  }, [selectMediaFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      selectMediaFile(file);
    }
  }, [selectMediaFile]);

  const clearVideoFile = () => {
    clearVideoPreview();
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinueToProducts = () => {
    if (!videoFile && !isDirectLink) {
      toast.error("Faça upload do vídeo");
      return;
    }
    setStep("select-products");
  };

  const handleAnalyze = async () => {
    if (!formatoOrigem || !link || formatosSaidaSelecionados.length === 0 || produtosSelecionados.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isDirectLink && !videoFile) {
      toast.error("Faça upload do vídeo");
      return;
    }

    setStep("analyzing");

    const selectedProducts = produtos.filter((p) =>
      produtosSelecionados.includes(p.id)
    );

    const ideias: PendingIdeia[] = [];

    if (isDirectLink) {
      // Use edge function analyze-instagram-video for IG/TikTok links
      const produtosTexto = selectedProducts.map(p => `${p.nome}: ${p.descricao || ""}`).join("\n");

      for (const formatoSaidaKey of formatosSaidaSelecionados) {
        for (const produto of selectedProducts) {
          try {
            const { data, error } = await supabase.functions.invoke("analyze-instagram-video", {
              body: { link, tipo: formatoOrigem, produtos: `${produto.nome}: ${produto.descricao || ""}` },
            });

            if (error) throw error;
            if (data && !data.error) {
              const result: ModelagemResult = {
                gancho_original: data.gancho_original || "",
                analise_estrategia: data.analise_estrategia || "",
                analise_performance: data.analise_performance || "",
                legenda_original: data.legenda_original || "",
                analise_filmagem: data.analise_filmagem || "",
                titulo_sugerido: data.titulo_sugerido || "",
                copy_completa: data.copy_completa || "",
                orientacoes_filmagem: data.orientacoes_filmagem || "",
                formato_sugerido: data.formato_sugerido || formatoSaidaKey,
                transcricao_audio: data.transcricao_audio || null,
                analise_visual_detalhada: data.analise_visual_detalhada || null,
              };
              ideias.push({ produto, formatoSaida: formatoSaidaKey, formatoOrigem, result, link, isReplica: false });
            }
          } catch (err) {
            console.error("Erro na análise via link:", err);
          }
        }
      }
    } else {
      // Original flow with video upload
      for (const produto of selectedProducts) {
        const formatosParaAPI = formatosSaidaSelecionados as Formato[];
        const response = await analyzeVideoUploadMultiFormato(videoFile!, caption, [produto], formatosParaAPI, formatoOrigem);
        
        if (response && response.formatos) {
          for (const formatoSaidaKey of formatosSaidaSelecionados) {
            const result = response.formatos[formatoSaidaKey];
            if (result) {
              result.transcricao_audio = response.transcricao;
              result.analise_visual_detalhada = response.analise_visual;
              ideias.push({ produto, formatoSaida: formatoSaidaKey, formatoOrigem, result, link, isReplica: false });
            }
          }
        }
      }
    }

    if (ideias.length > 0) {
      setPendingIdeias(ideias);
      setCurrentIdeiaIndex(0);
      setStep("results");
    } else {
      toast.error("Não foi possível analisar o conteúdo");
      setStep("select-products");
    }
  };

  const handleAnalyzeReplica = async () => {
    if (!formatoOrigem || !link || formatosSaidaSelecionados.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isDirectLink && !videoFile) {
      toast.error("Faça upload do vídeo");
      return;
    }

    setStep("analyzing");

    const ideias: PendingIdeia[] = [];

    // Buscar o prompt de réplica personalizado
    let replicaPrompt = "";
    try {
      const { data } = await supabase
        .from("ai_prompts")
        .select("prompt")
        .eq("tipo", "replica")
        .eq("nome", "replica_otimizada")
        .maybeSingle();
      
      if (data?.prompt) {
        replicaPrompt = data.prompt;
      }
    } catch (error) {
      console.error("Erro ao buscar prompt de réplica:", error);
    }

    if (isDirectLink) {
      // Use edge function for IG/TikTok links
      for (const formatoSaidaKey of formatosSaidaSelecionados) {
        try {
          const { data, error } = await supabase.functions.invoke("analyze-instagram-video", {
            body: { link, tipo: formatoOrigem, produtos: replicaPrompt || "Réplica otimizada do conteúdo original, sem produto específico" },
          });

          if (error) throw error;
          if (data && !data.error) {
            const result: ModelagemResult = {
              gancho_original: data.gancho_original || "",
              analise_estrategia: data.analise_estrategia || "",
              analise_performance: data.analise_performance || "",
              legenda_original: data.legenda_original || "",
              analise_filmagem: data.analise_filmagem || "",
              titulo_sugerido: data.titulo_sugerido || "",
              copy_completa: data.copy_completa || "",
              orientacoes_filmagem: data.orientacoes_filmagem || "",
              formato_sugerido: data.formato_sugerido || formatoSaidaKey,
              transcricao_audio: data.transcricao_audio || null,
              analise_visual_detalhada: data.analise_visual_detalhada || null,
            };
            ideias.push({ 
              produto: REPLICA_PRODUTO, 
              formatoSaida: formatoSaidaKey, 
              formatoOrigem, 
              result, 
              link,
              isReplica: true 
            });
          }
        } catch (err) {
          console.error("Erro na análise réplica via link:", err);
        }
      }
    } else {
      // Original flow with video upload
      const formatosParaAPI = formatosSaidaSelecionados as Formato[];
      const response = await analyzeVideoUploadMultiFormato(
        videoFile!, 
        caption, 
        [], 
        formatosParaAPI, 
        formatoOrigem
      );
      
      if (response && response.formatos) {
        for (const formatoSaidaKey of formatosSaidaSelecionados) {
          const result = response.formatos[formatoSaidaKey];
          if (result) {
            result.transcricao_audio = response.transcricao;
            result.analise_visual_detalhada = response.analise_visual;
            ideias.push({ 
              produto: REPLICA_PRODUTO, 
              formatoSaida: formatoSaidaKey, 
              formatoOrigem, 
              result, 
              link,
              isReplica: true 
            });
          }
        }
      }
    }

    if (ideias.length > 0) {
      setPendingIdeias(ideias);
      setCurrentIdeiaIndex(0);
      setStep("results");
    } else {
      toast.error("Não foi possível analisar o conteúdo");
      setStep("select-products");
    }
  };

  const handleOpenIdeiaForm = () => {
    setIdeiaFormOpen(true);
  };

  const handleIdeiaEnviada = () => {
    setIdeiaFormOpen(false);
    
    if (currentIdeiaIndex < pendingIdeias.length - 1) {
      setCurrentIdeiaIndex((prev) => prev + 1);
      toast.success("Ideia enviada! Próximo formato/produto...");
    } else {
      toast.success("Todas as ideias foram enviadas ao Content Hub!");
      resetState();
    }
  };

  const handleSkipIdeia = () => {
    if (currentIdeiaIndex < pendingIdeias.length - 1) {
      setCurrentIdeiaIndex((prev) => prev + 1);
      toast.info("Pulando para o próximo formato/produto...");
    } else {
      toast.success("Modelagem concluída!");
      resetState();
    }
  };

  const resetState = () => {
    clearVideoPreview();
    setStep("select-origem");
    setFormatoOrigem(null);
    setFormatosSaidaSelecionados([]);
    setLink("");
    setVideoFile(null);
    setCaption("");
    setProdutosSelecionados([]);
    setPendingIdeias([]);
    setCurrentIdeiaIndex(0);
    setIsDirectLink(false);
    setExtractingLink(false);
    resetModelagem();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentIdeia = pendingIdeias[currentIdeiaIndex];

  if (loadingFormatos) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wand2 className="h-6 w-6" />
            Modelador de Conteúdo
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
          <Wand2 className="h-6 w-6" />
          Modelador de Conteúdo
        </h1>
        <p className="text-muted-foreground mt-1">
          Analise conteúdos virais e adapte para os produtos do seu escritório
        </p>
      </div>

      {/* STEP 1: Select Origin Format */}
      {step === "select-origem" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Formato do Conteúdo Original
            </CardTitle>
            <CardDescription>
              Selecione o tipo de conteúdo que você vai modelar (conteúdo de referência)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formatosOrigem.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum formato de origem configurado.</p>
                <p className="text-sm mt-1">Configure os formatos em Robôs → Prompts Modelador.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formatosOrigem.map((option) => {
                  const Icon = getFormatoIcon(option.icone);
                  const colors = getFormatoColors(option.cor);
                  return (
                    <Card
                      key={option.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        formatoOrigem === option.key && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleOrigemSelect(option.key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", colors.bgColor, colors.textColor)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{option.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {option.descricao || ""}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Select Output Formats */}
      {step === "select-saida" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Formatos de Saída
            </CardTitle>
            <CardDescription>
              Selecione os formatos para os quais deseja adaptar o conteúdo. A IA usará prompts específicos para cada combinação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Origin info */}
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">Conteúdo Original:</span>
                <Badge variant="secondary">
                  {formatoOrigem && getOrigemLabel(formatoOrigem)}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Selecione os Formatos de Saída Desejados *</Label>
              <p className="text-sm text-muted-foreground">
                Você pode selecionar mais de um formato. Para cada combinação (origem → saída), a IA usará um prompt especializado.
              </p>
              {formatosSaidaDB.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Nenhum formato de saída configurado.</p>
                  <p className="text-sm">Configure em Robôs → Prompts Modelador.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formatosSaidaDB.map((option) => {
                    const Icon = getFormatoIcon(option.icone);
                    const colors = getFormatoColors(option.cor);
                    const isSelected = formatosSaidaSelecionados.includes(option.key);
                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleFormatoSaidaToggle(option.key)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleFormatoSaidaToggle(option.key)}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className={cn("p-2 rounded-lg", isSelected ? colors.bgColor : "bg-muted", colors.textColor)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              {option.nome}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {option.descricao || ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {formatosSaidaSelecionados.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Combinações selecionadas:</strong>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formatosSaidaSelecionados.map((saidaKey) => (
                    <Badge key={saidaKey} variant="outline" className="text-xs">
                      {formatoOrigem && getOrigemLabel(formatoOrigem)} → {getSaidaLabel(saidaKey)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => {
                setFormatoOrigem(null);
                setFormatosSaidaSelecionados([]);
                setStep("select-origem");
              }}>
                Voltar
              </Button>
              <Button onClick={handleContinueToInput} disabled={formatosSaidaSelecionados.length === 0}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Input Link */}
      {step === "input-link" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Link do Conteúdo Original
            </CardTitle>
            <CardDescription>
              Cole o link do conteúdo que você quer modelar. Este link será salvo para referência futura no Content Hub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Origin and output summary */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Origem:</span>
                <Badge variant="secondary">{formatoOrigem && getOrigemLabel(formatoOrigem)}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Saídas:</span>
                {formatosSaidaSelecionados.map((key) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {getSaidaLabel(key)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link do Conteúdo (YouTube ou Instagram) *</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou https://www.instagram.com/reel/... ou https://www.tiktok.com/..."
              />
              <p className="text-xs text-muted-foreground">
                O link será usado como referência quando a ideia for enviada ao Content Hub
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("select-saida")}>
                Voltar
              </Button>
              <Button onClick={handleContinueToUpload} disabled={!link || extractingLink}>
                {extractingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extraindo vídeo automaticamente...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Upload Video */}
      {step === "upload-video" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload do Vídeo e Legenda
            </CardTitle>
            <CardDescription>
              Faça upload do vídeo baixado e cole a legenda original para análise completa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Origem:</span>
                <Badge variant="secondary">{formatoOrigem && getOrigemLabel(formatoOrigem)}</Badge>
                <span className="text-sm text-muted-foreground">→</span>
                {formatosSaidaSelecionados.map((key) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {getSaidaLabel(key)}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary hover:underline truncate"
                >
                  {link}
                </a>
              </div>
            </div>

            {/* Video Upload */}
            <div className="space-y-3">
              <Label>Arquivo de Vídeo *</Label>
              <Card
                className={cn(
                  "border-2 border-dashed transition-colors",
                  !videoFile && "cursor-pointer",
                  dragActive && "border-primary bg-primary/5",
                  videoFile && "border-green-500 bg-green-50 dark:bg-green-950/20"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !videoFile && fileInputRef.current?.click()}
              >
                <CardContent className="p-6">
                  {videoFile ? (
                    <div className="space-y-4">
                      {/* File info header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileVideo className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{videoFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(videoFile.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearVideoFile();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Video Preview Player */}
                      {videoPreviewUrl && videoFile && (
                        <div className="relative rounded-lg overflow-hidden bg-black">
                          <video
                            key={videoPreviewUrl || "no-preview"}
                            ref={videoRef}
                            src={videoPreviewUrl}
                            controls
                            className="w-full max-h-[400px] object-contain"
                            preload="metadata"
                          >
                            Seu navegador não suporta a reprodução de vídeos.
                          </video>
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            Pré-visualização
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-green-600 text-center">
                        ✓ Verifique se este é o vídeo correto antes de continuar
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">
                        Arraste o vídeo ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        MP4, WebM, MOV, AVI (máx. 50MB)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Caption - Optional */}
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda/Descrição do Conteúdo (opcional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Cole aqui a legenda completa do conteúdo original, incluindo hashtags e menções..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                A legenda ajuda a IA a entender melhor o contexto, mas não é obrigatória
              </p>
            </div>

            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                <strong>Dica:</strong> A IA irá transcrever o áudio do vídeo e analisar visualmente o conteúdo para gerar uma modelagem completa.
              </p>
            </div>

            <Separator />

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("input-link")}>
                Voltar
              </Button>
              <Button onClick={handleContinueToProducts} disabled={!videoFile}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Select Products */}
      {step === "select-products" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Selecionar Produtos
            </CardTitle>
            <CardDescription>
              Escolha os produtos para os quais deseja modelar o conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Origem:</span>
                <Badge variant="secondary">{formatoOrigem && getOrigemLabel(formatoOrigem)}</Badge>
                <span className="text-sm text-muted-foreground">→ Saídas:</span>
                {formatosSaidaSelecionados.map((key) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {getSaidaLabel(key)}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                  {link}
                </a>
              </div>
              {videoFile && (
                <div className="flex items-center gap-2">
                  <FileVideo className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{videoFile.name} ({formatFileSize(videoFile.size)})</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Selecione os Produtos para Modelagem *</Label>
              {loadingProdutos ? (
                <p className="text-sm text-muted-foreground">Carregando produtos...</p>
              ) : produtos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto cadastrado. Cadastre produtos na aba "Tipos de Produtos".
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        produtosSelecionados.includes(produto.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleProdutoToggle(produto.id)}
                    >
                      <Checkbox
                        checked={produtosSelecionados.includes(produto.id)}
                        onCheckedChange={() => handleProdutoToggle(produto.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {produto.nome}
                          </span>
                          <Badge className={`text-xs ${SETOR_COLORS[produto.setor]}`}>
                            {SETOR_LABELS[produto.setor]}
                          </Badge>
                        </div>
                        {produto.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {produto.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opção Réplica Otimizada */}
            <Separator />
            
            <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Copy className="h-5 w-5 text-violet-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Modelar Réplica Otimizada</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crie uma réplica do conteúdo sem associar a nenhum produto específico. 
                    Ideal para conteúdos virais que você quer adaptar para seu perfil.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3 border-violet-500/50 text-violet-600 hover:bg-violet-500/10"
                    onClick={handleAnalyzeReplica}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Modelar Réplica Otimizada
                  </Button>
                </div>
              </div>
            </div>

            {produtosSelecionados.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  <strong>Nota:</strong> Serão geradas {formatosSaidaSelecionados.length * produtosSelecionados.length} ideias ({formatosSaidaSelecionados.length} formato(s) de saída × {produtosSelecionados.length} produto(s))
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(isDirectLink ? "input-link" : "upload-video")}>
                Voltar
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={produtosSelecionados.length === 0}
              >
                Analisar com Produtos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: Analyzing */}
      {step === "analyzing" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Analisando Conteúdo
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              A IA está processando o conteúdo: transcrevendo o áudio, analisando visualmente e gerando modelagens para {formatosSaidaSelecionados.length} formato(s) de saída...
            </p>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Transformação:</strong> {formatoOrigem && getOrigemLabel(formatoOrigem)} → {formatosSaidaSelecionados.map(key => getSaidaLabel(key)).join(", ")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Isso pode levar alguns segundos dependendo da quantidade de formatos selecionados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* STEP 7: Results */}
      {step === "results" && currentIdeia && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                {currentIdeiaIndex + 1} de {pendingIdeias.length}
              </Badge>
              {currentIdeia.isReplica ? (
                <Badge className="bg-violet-500/20 text-violet-700 border-violet-500/30">
                  <Copy className="h-3 w-3 mr-1" />
                  Réplica Otimizada
                </Badge>
              ) : currentIdeia.produto && (
                <Badge className={SETOR_COLORS[currentIdeia.produto.setor]}>
                  {currentIdeia.produto.nome}
                </Badge>
              )}
              <Badge variant="secondary">
                {getOrigemLabel(currentIdeia.formatoOrigem)} → {getSaidaLabel(currentIdeia.formatoSaida)}
              </Badge>
            </div>
            {pendingIdeias.length > 1 && (
              <Button variant="ghost" size="sm" onClick={handleSkipIdeia}>
                Pular
              </Button>
            )}
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Modelagem: {getSaidaLabel(currentIdeia.formatoSaida)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <ExternalLink className="h-3 w-3" />
                    <a
                      href={currentIdeia.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {currentIdeia.link.slice(0, 60)}...
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModelagemResultsView
                result={currentIdeia.result}
                formatoSaida={currentIdeia.formatoSaida as Formato}
                formatoOrigem={currentIdeia.formatoOrigem}
              />

              <Separator />

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={resetState}>
                  Nova Modelagem
                </Button>
                <Button onClick={handleOpenIdeiaForm}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar ao Content Hub
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentIdeia && (
        <ModelagemIdeiaFormDialog
          open={ideiaFormOpen}
          onOpenChange={setIdeiaFormOpen}
          result={currentIdeia.result}
          produto={currentIdeia.produto}
          formato={currentIdeia.formatoSaida as Formato}
          linkOriginal={currentIdeia.link}
          onSuccess={handleIdeiaEnviada}
          isReplica={currentIdeia.isReplica}
        />
      )}
    </div>
  );
}
