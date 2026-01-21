import { useState, useRef, useCallback } from "react";
import { Wand2, Video, Loader2, ExternalLink, ArrowRight, Send, AlertCircle, Film, Upload, X, FileVideo, SquareStack, ImageIcon, BookOpen, Newspaper } from "lucide-react";
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
import { ModelagemIdeiaFormDialog } from "@/components/modelador/ModelagemIdeiaFormDialog";
import { ModelagemResultsView } from "@/components/modelador/ModelagemResultsView";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de formato expandidos para incluir blog_post e publicacao
type FormatoCompleto = Formato | "blog_post" | "publicacao";

interface PendingIdeia {
  produto: TipoProduto;
  formatoSaida: Formato;
  formatoOrigem: FormatoCompleto;
  result: ModelagemResult;
  link: string;
}

// Opções de formato de ORIGEM (conteúdo original)
const FORMATO_ORIGEM_OPTIONS: { value: FormatoCompleto; label: string; icon: React.ReactNode; description: string; disponivel: boolean }[] = [
  { value: "video", label: "Vídeo Curto", icon: <Video className="h-5 w-5" />, description: "Reels, Shorts, TikTok", disponivel: true },
  { value: "video_longo", label: "Vídeo Longo", icon: <Film className="h-5 w-5" />, description: "YouTube (5-15min)", disponivel: true },
  { value: "carrossel", label: "Carrossel", icon: <SquareStack className="h-5 w-5" />, description: "5-10 slides", disponivel: false },
  { value: "estatico", label: "Post Estático", icon: <ImageIcon className="h-5 w-5" />, description: "Imagem única", disponivel: false },
  { value: "blog_post", label: "Blog Post", icon: <BookOpen className="h-5 w-5" />, description: "Artigo de blog", disponivel: false },
  { value: "publicacao", label: "Publicação", icon: <Newspaper className="h-5 w-5" />, description: "Post de texto", disponivel: false },
];

// Opções de formato de SAÍDA (conteúdo modelado)
const FORMATO_SAIDA_OPTIONS: { value: Formato; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "video", label: "Vídeo Curto", icon: <Video className="h-5 w-5" />, description: "Reels, Shorts (30-90s)" },
  { value: "video_longo", label: "Vídeo Longo", icon: <Film className="h-5 w-5" />, description: "YouTube (5-15min)" },
  { value: "carrossel", label: "Carrossel", icon: <SquareStack className="h-5 w-5" />, description: "5-10 slides" },
  { value: "estatico", label: "Estático", icon: <ImageIcon className="h-5 w-5" />, description: "Imagem única" },
];

export default function ModeladorConteudo() {
  const { produtos, isLoading: loadingProdutos } = useTiposProdutos();
  const { isAnalyzing, analyzeVideoUploadMultiFormato, resetState: resetModelagem } = useModelagemConteudo();

  const [step, setStep] = useState<"select-origem" | "select-saida" | "input-link" | "upload-video" | "select-products" | "analyzing" | "results">("select-origem");
  const [formatoOrigem, setFormatoOrigem] = useState<FormatoCompleto | null>(null);
  const [formatosSaida, setFormatosSaida] = useState<Formato[]>([]);
  const [link, setLink] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [pendingIdeias, setPendingIdeias] = useState<PendingIdeia[]>([]);
  const [currentIdeiaIndex, setCurrentIdeiaIndex] = useState(0);
  const [ideiaFormOpen, setIdeiaFormOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOrigemSelect = (formato: FormatoCompleto) => {
    const option = FORMATO_ORIGEM_OPTIONS.find(o => o.value === formato);
    if (!option?.disponivel) {
      toast.info("Esta funcionalidade estará disponível em breve!");
      return;
    }
    setFormatoOrigem(formato);
    setStep("select-saida");
  };

  const handleFormatoSaidaToggle = (formato: Formato) => {
    setFormatosSaida((prev) =>
      prev.includes(formato)
        ? prev.filter((f) => f !== formato)
        : [...prev, formato]
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
    if (formatosSaida.length === 0) {
      toast.error("Selecione pelo menos um formato de saída");
      return;
    }
    setStep("input-link");
  };

  const handleContinueToUpload = () => {
    if (!link) {
      toast.error("Cole o link do conteúdo original");
      return;
    }
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
        setVideoFile(file);
        // Create preview URL for video
        if (file.type.startsWith("video/")) {
          const url = URL.createObjectURL(file);
          setVideoPreviewUrl(url);
        } else {
          setVideoPreviewUrl(null);
        }
      } else {
        toast.error("Por favor, selecione um arquivo de vídeo ou áudio");
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      // Create preview URL for video
      if (file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);
      } else {
        setVideoPreviewUrl(null);
      }
    }
  }, []);

  const clearVideoFile = () => {
    // Revoke the old preview URL to free memory
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinueToProducts = () => {
    if (!videoFile) {
      toast.error("Faça upload do vídeo");
      return;
    }
    // Caption is now optional
    setStep("select-products");
  };

  const handleAnalyze = async () => {
    if (!formatoOrigem || !link || !videoFile || formatosSaida.length === 0 || produtosSelecionados.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setStep("analyzing");

    const selectedProducts = produtos.filter((p) =>
      produtosSelecionados.includes(p.id)
    );

    // Analyze for each selected product with all output formats
    const ideias: PendingIdeia[] = [];

    for (const produto of selectedProducts) {
      // Analyze video for this product with all output formats
      // Note: formatoOrigem is stored for reference but the hook currently doesn't use it
      const response = await analyzeVideoUploadMultiFormato(videoFile, caption, [produto], formatosSaida);
      
      if (response && response.formatos) {
        // Create pending ideias for each format in the order selected
        for (const formatoSaida of formatosSaida) {
          const result = response.formatos[formatoSaida];
          if (result) {
            // Add transcription and visual analysis to each result
            result.transcricao_audio = response.transcricao;
            result.analise_visual_detalhada = response.analise_visual;
            ideias.push({ produto, formatoSaida, formatoOrigem, result, link });
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
    // Revoke old preview URL to free memory
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    setStep("select-origem");
    setFormatoOrigem(null);
    setFormatosSaida([]);
    setLink("");
    setVideoFile(null);
    setCaption("");
    setProdutosSelecionados([]);
    setPendingIdeias([]);
    setCurrentIdeiaIndex(0);
    resetModelagem();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getOrigemLabel = (formato: FormatoCompleto) => {
    const option = FORMATO_ORIGEM_OPTIONS.find(o => o.value === formato);
    return option?.label || formato;
  };

  const currentIdeia = pendingIdeias[currentIdeiaIndex];

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FORMATO_ORIGEM_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    !option.disponivel && "opacity-50 cursor-not-allowed",
                    formatoOrigem === option.value && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleOrigemSelect(option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        option.disponivel ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {option.icon}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.disponivel ? option.description : "Em breve"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Select Output Formats */}
      {step === "select-saida" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SquareStack className="h-5 w-5" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FORMATO_SAIDA_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
                      formatosSaida.includes(option.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleFormatoSaidaToggle(option.value)}
                  >
                    <Checkbox
                      checked={formatosSaida.includes(option.value)}
                      onCheckedChange={() => handleFormatoSaidaToggle(option.value)}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg",
                        formatosSaida.includes(option.value) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {option.icon}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          {option.label}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formatosSaida.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Combinações selecionadas:</strong>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formatosSaida.map((saida) => (
                    <Badge key={saida} variant="outline" className="text-xs">
                      {formatoOrigem && getOrigemLabel(formatoOrigem)} → {FORMATO_LABELS[saida]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => {
                setFormatoOrigem(null);
                setFormatosSaida([]);
                setStep("select-origem");
              }}>
                Voltar
              </Button>
              <Button onClick={handleContinueToInput} disabled={formatosSaida.length === 0}>
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
              <Video className="h-5 w-5" />
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
                {formatosSaida.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">
                    {FORMATO_LABELS[f]}
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
                placeholder="https://www.youtube.com/watch?v=... ou https://www.instagram.com/reel/..."
              />
              <p className="text-xs text-muted-foreground">
                O link será usado como referência quando a ideia for enviada ao Content Hub
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("select-saida")}>
                Voltar
              </Button>
              <Button onClick={handleContinueToUpload} disabled={!link}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
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
                {formatosSaida.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">
                    {FORMATO_LABELS[f]}
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
                      {videoPreviewUrl && (
                        <div className="relative rounded-lg overflow-hidden bg-black">
                          <video
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
                {formatosSaida.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">
                    {FORMATO_LABELS[f]}
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

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                <strong>Nota:</strong> Serão geradas {formatosSaida.length * produtosSelecionados.length} ideias ({formatosSaida.length} formato(s) de saída × {produtosSelecionados.length} produto(s))
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("upload-video")}>
                Voltar
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={produtosSelecionados.length === 0}
              >
                Analisar Conteúdo
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
              A IA está processando o conteúdo: transcrevendo o áudio, analisando visualmente e gerando modelagens para {formatosSaida.length} formato(s) de saída...
            </p>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Transformação:</strong> {formatoOrigem && getOrigemLabel(formatoOrigem)} → {formatosSaida.map(f => FORMATO_LABELS[f]).join(", ")}
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
              <Badge className={SETOR_COLORS[currentIdeia.produto.setor]}>
                {currentIdeia.produto.nome}
              </Badge>
              <Badge variant="secondary">
                {getOrigemLabel(currentIdeia.formatoOrigem)} → {FORMATO_LABELS[currentIdeia.formatoSaida]}
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
                    Modelagem: {FORMATO_LABELS[currentIdeia.formatoSaida]}
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
                formatoSaida={currentIdeia.formatoSaida}
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
          formato={currentIdeia.formatoSaida}
          linkOriginal={currentIdeia.link}
          onSuccess={handleIdeiaEnviada}
        />
      )}
    </div>
  );
}
