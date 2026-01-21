import { useState, useRef, useCallback } from "react";
import { Wand2, Video, FileText, Image, Loader2, ExternalLink, ArrowRight, Send, AlertCircle, Mic, Film, ChevronDown, Upload, X, FileVideo, SquareStack, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTiposProdutos, TipoProduto, SETOR_LABELS, SETOR_COLORS } from "@/hooks/useTiposProdutos";
import { useModelagemConteudo, ModelagemResult } from "@/hooks/useModelagemConteudo";
import { Formato, FORMATO_LABELS } from "@/hooks/useConteudosMidia";
import { ModelagemIdeiaFormDialog } from "@/components/modelador/ModelagemIdeiaFormDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isFieldVisibleForFormato } from "@/utils/formatoFields";

type TipoModelagem = "video" | "blog_post" | "publicacao";

interface PendingIdeia {
  produto: TipoProduto;
  formato: Formato;
  result: ModelagemResult;
  link: string;
}

const FORMATO_OPTIONS: { value: Formato; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "video", label: "Vídeo Curto", icon: <Video className="h-5 w-5" />, description: "Reels, Shorts (30-90s)" },
  { value: "video_longo", label: "Vídeo Longo", icon: <Film className="h-5 w-5" />, description: "YouTube (5-15min)" },
  { value: "carrossel", label: "Carrossel", icon: <SquareStack className="h-5 w-5" />, description: "5-10 slides" },
  { value: "estatico", label: "Estático", icon: <ImageIcon className="h-5 w-5" />, description: "Imagem única" },
];

export default function ModeladorConteudo() {
  const { produtos, isLoading: loadingProdutos } = useTiposProdutos();
  const { isAnalyzing, analyzeVideoUploadMultiFormato, resetState: resetModelagem } = useModelagemConteudo();

  const [step, setStep] = useState<"select-type" | "input-link" | "upload-video" | "select-formats" | "select-products" | "analyzing" | "results">("select-type");
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoModelagem | null>(null);
  const [link, setLink] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [formatosSelecionados, setFormatosSelecionados] = useState<Formato[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [pendingIdeias, setPendingIdeias] = useState<PendingIdeia[]>([]);
  const [currentIdeiaIndex, setCurrentIdeiaIndex] = useState(0);
  const [ideiaFormOpen, setIdeiaFormOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tipoLabels: Record<TipoModelagem, { label: string; icon: React.ReactNode; description: string }> = {
    video: {
      label: "Modelar Vídeo",
      icon: <Video className="h-6 w-6" />,
      description: "Faça upload de um vídeo para análise completa",
    },
    blog_post: {
      label: "Modelar Blog Post",
      icon: <FileText className="h-6 w-6" />,
      description: "Em breve",
    },
    publicacao: {
      label: "Modelar Publicação",
      icon: <Image className="h-6 w-6" />,
      description: "Em breve",
    },
  };

  const handleTipoSelect = (tipo: TipoModelagem) => {
    if (tipo !== "video") {
      toast.info("Esta funcionalidade estará disponível em breve!");
      return;
    }
    setTipoSelecionado(tipo);
    setStep("input-link");
  };

  const handleFormatoToggle = (formato: Formato) => {
    setFormatosSelecionados((prev) =>
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

  const handleContinueToUpload = () => {
    if (!link) {
      toast.error("Cole o link do vídeo original");
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
      } else {
        toast.error("Por favor, selecione um arquivo de vídeo ou áudio");
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  }, []);

  const clearVideoFile = () => {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinueToFormats = () => {
    if (!videoFile) {
      toast.error("Faça upload do vídeo");
      return;
    }
    if (!caption.trim()) {
      toast.error("Cole a legenda do vídeo");
      return;
    }
    setStep("select-formats");
  };

  const handleContinueToProducts = () => {
    if (formatosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um formato de conteúdo");
      return;
    }
    setStep("select-products");
  };

  const handleAnalyze = async () => {
    if (!tipoSelecionado || !link || !videoFile || !caption || formatosSelecionados.length === 0 || produtosSelecionados.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setStep("analyzing");

    const selectedProducts = produtos.filter((p) =>
      produtosSelecionados.includes(p.id)
    );

    // Analyze for each selected product with all formats
    const ideias: PendingIdeia[] = [];

    for (const produto of selectedProducts) {
      const response = await analyzeVideoUploadMultiFormato(videoFile, caption, [produto], formatosSelecionados);
      
      if (response && response.formatos) {
        // Create pending ideias for each format in the order selected
        for (const formato of formatosSelecionados) {
          const result = response.formatos[formato];
          if (result) {
            // Add transcription and visual analysis to each result
            result.transcricao_audio = response.transcricao;
            result.analise_visual_detalhada = response.analise_visual;
            ideias.push({ produto, formato, result, link });
          }
        }
      }
    }

    if (ideias.length > 0) {
      setPendingIdeias(ideias);
      setCurrentIdeiaIndex(0);
      setStep("results");
    } else {
      toast.error("Não foi possível analisar o vídeo");
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
    setStep("select-type");
    setTipoSelecionado(null);
    setLink("");
    setVideoFile(null);
    setCaption("");
    setFormatosSelecionados([]);
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

  const currentIdeia = pendingIdeias[currentIdeiaIndex];
  const showFilmingInstructions = currentIdeia && isFieldVisibleForFormato("orientacoes_filmagem", currentIdeia.formato);

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

      {step === "select-type" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(tipoLabels).map(([tipo, { label, icon, description }]) => (
            <Card
              key={tipo}
              className={`bg-card/50 backdrop-blur-sm border-border/50 cursor-pointer transition-all hover:border-primary/50 ${
                tipo !== "video" ? "opacity-50" : ""
              }`}
              onClick={() => handleTipoSelect(tipo as TipoModelagem)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {step === "input-link" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Link do Vídeo Original
            </CardTitle>
            <CardDescription>
              Cole o link do vídeo que você quer modelar. Este link será salvo para referência futura no Content Hub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="link">Link do Vídeo (YouTube ou Instagram) *</Label>
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
              <Button variant="outline" onClick={resetState}>
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
            {/* Link display */}
            <div className="p-3 bg-muted/50 rounded-lg">
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
            <div className="space-y-2">
              <Label>Arquivo de Vídeo *</Label>
              <Card
                className={cn(
                  "border-2 border-dashed transition-colors cursor-pointer",
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-10 w-10 text-green-600" />
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

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda/Descrição do Vídeo *</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Cole aqui a legenda completa do vídeo original, incluindo hashtags e menções..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Copie a legenda diretamente do Instagram/YouTube para uma análise mais precisa
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
              <Button onClick={handleContinueToFormats} disabled={!videoFile || !caption.trim()}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "select-formats" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SquareStack className="h-5 w-5" />
              Formatos de Conteúdo
            </CardTitle>
            <CardDescription>
              Selecione os formatos para os quais deseja adaptar o conteúdo. A IA gerará uma modelagem específica para cada formato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video info summary */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
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
              <Label>Selecione os Formatos Desejados *</Label>
              <p className="text-sm text-muted-foreground">
                Você pode selecionar mais de um formato. Para cada formato selecionado, a IA gerará uma modelagem adaptada.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FORMATO_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                      formatosSelecionados.includes(option.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleFormatoToggle(option.value)}
                  >
                    <Checkbox
                      checked={formatosSelecionados.includes(option.value)}
                      onCheckedChange={() => handleFormatoToggle(option.value)}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${formatosSelecionados.includes(option.value) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
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

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("upload-video")}>
                Voltar
              </Button>
              <Button onClick={handleContinueToProducts} disabled={formatosSelecionados.length === 0}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            {/* Video info summary */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Formatos:</span>
                {formatosSelecionados.map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs">
                    {FORMATO_LABELS[f]}
                  </Badge>
                ))}
              </div>
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
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        produtosSelecionados.includes(produto.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
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
                <strong>Nota:</strong> Serão geradas {formatosSelecionados.length * produtosSelecionados.length} ideias ({formatosSelecionados.length} formato(s) × {produtosSelecionados.length} produto(s))
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("select-formats")}>
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

      {step === "analyzing" && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Analisando Conteúdo
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              A IA está processando o vídeo: transcrevendo o áudio, analisando visualmente e gerando modelagens para {formatosSelecionados.length} formato(s)...
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Isso pode levar alguns segundos dependendo da quantidade de formatos selecionados.
            </p>
          </CardContent>
        </Card>
      )}

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
                {FORMATO_LABELS[currentIdeia.formato]}
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
                    Modelagem: {FORMATO_LABELS[currentIdeia.formato]}
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
              {/* Transcription and Visual Analysis Section */}
              {(currentIdeia.result.transcricao_audio || currentIdeia.result.analise_visual_detalhada) && (
                <div className="space-y-4">
                  {/* Audio Transcription */}
                  {currentIdeia.result.transcricao_audio && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-3 h-auto bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20">
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-blue-700 dark:text-blue-300">Transcrição do Áudio</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-blue-500 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {currentIdeia.result.transcricao_audio}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Visual Analysis */}
                  {currentIdeia.result.analise_visual_detalhada && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-3 h-auto bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20">
                          <div className="flex items-center gap-2">
                            <Film className="h-4 w-4 text-purple-500" />
                            <span className="font-medium text-purple-700 dark:text-purple-300">Análise Visual Detalhada</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-purple-500 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <h5 className="text-xs font-medium text-primary mb-1">Cenário</h5>
                            <p className="text-sm text-foreground">{currentIdeia.result.analise_visual_detalhada.cenario}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <h5 className="text-xs font-medium text-primary mb-1">Transições</h5>
                            <p className="text-sm text-foreground">{currentIdeia.result.analise_visual_detalhada.transicoes}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <h5 className="text-xs font-medium text-primary mb-1">Enquadramento</h5>
                            <p className="text-sm text-foreground">{currentIdeia.result.analise_visual_detalhada.enquadramento}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <h5 className="text-xs font-medium text-primary mb-1">Postura do Apresentador</h5>
                            <p className="text-sm text-foreground">{currentIdeia.result.analise_visual_detalhada.postura_apresentador}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <h5 className="text-xs font-medium text-primary mb-1">Elementos Visuais</h5>
                            <p className="text-sm text-foreground">{currentIdeia.result.analise_visual_detalhada.elementos_visuais}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <h5 className="text-xs font-medium text-primary mb-1">Ritmo de Edição</h5>
                            <p className="text-sm text-foreground">{currentIdeia.result.analise_visual_detalhada.ritmo_edicao}</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  <Separator />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Título Sugerido ({FORMATO_LABELS[currentIdeia.formato]})
                    </h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg font-medium">
                      {currentIdeia.result.titulo_sugerido}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Gancho
                    </h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                      {currentIdeia.result.gancho_original}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Análise da Estratégia
                    </h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                      {currentIdeia.result.analise_estrategia}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Copy Completa
                    </h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {currentIdeia.result.copy_completa}
                    </p>
                  </div>

                  {showFilmingInstructions && currentIdeia.result.orientacoes_filmagem && (
                    <div>
                      <h4 className="text-sm font-medium text-primary mb-2">
                        Orientações para Filmagem
                      </h4>
                      <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                        {currentIdeia.result.orientacoes_filmagem}
                      </p>
                    </div>
                  )}

                  {!showFilmingInstructions && currentIdeia.result.orientacoes_filmagem && (
                    <div>
                      <h4 className="text-sm font-medium text-primary mb-2">
                        Orientações de Design
                      </h4>
                      <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                        {currentIdeia.result.orientacoes_filmagem}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={resetState}>
                  Nova Modelagem
                </Button>
                <Button onClick={handleOpenIdeiaForm}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para o Content Hub
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
          produto={currentIdeia.produto}
          result={currentIdeia.result}
          linkOriginal={currentIdeia.link}
          formato={currentIdeia.formato}
          onSuccess={handleIdeiaEnviada}
        />
      )}
    </div>
  );
}
