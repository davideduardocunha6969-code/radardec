import { useState } from "react";
import { Wand2, Video, FileText, Image, Loader2, ExternalLink, ArrowRight, Send, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTiposProdutos, TipoProduto, SETOR_LABELS, SETOR_COLORS } from "@/hooks/useTiposProdutos";
import { useModelagemConteudo, ModelagemResult, ScrapedPreview } from "@/hooks/useModelagemConteudo";
import { ModelagemIdeiaFormDialog } from "@/components/modelador/ModelagemIdeiaFormDialog";
import { toast } from "sonner";

type TipoModelagem = "video" | "blog_post" | "publicacao";

interface PendingIdeia {
  produto: TipoProduto;
  result: ModelagemResult;
  link: string;
}

export default function ModeladorConteudo() {
  const { produtos, isLoading: loadingProdutos } = useTiposProdutos();
  const { isAnalyzing, isScraping, scrapedPreview, scrapePreview, analyzeContent, resetState: resetModelagem } = useModelagemConteudo();

  const [step, setStep] = useState<"select-type" | "input-link" | "preview" | "select-products" | "analyzing" | "results">("select-type");
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoModelagem | null>(null);
  const [link, setLink] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [pendingIdeias, setPendingIdeias] = useState<PendingIdeia[]>([]);
  const [currentIdeiaIndex, setCurrentIdeiaIndex] = useState(0);
  const [ideiaFormOpen, setIdeiaFormOpen] = useState(false);

  const tipoLabels: Record<TipoModelagem, { label: string; icon: React.ReactNode; description: string }> = {
    video: {
      label: "Modelar Vídeo",
      icon: <Video className="h-6 w-6" />,
      description: "Analise vídeos do YouTube ou Instagram",
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

  const handleProdutoToggle = (produtoId: string) => {
    setProdutosSelecionados((prev) =>
      prev.includes(produtoId)
        ? prev.filter((id) => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  const handleScrapeLink = async () => {
    if (!link) {
      toast.error("Cole um link válido");
      return;
    }

    const preview = await scrapePreview(link);
    if (preview) {
      setStep("preview");
    }
  };

  const handleContinueToProducts = () => {
    setStep("select-products");
  };

  const handleAnalyze = async () => {
    if (!tipoSelecionado || !link || produtosSelecionados.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setStep("analyzing");

    const selectedProducts = produtos.filter((p) =>
      produtosSelecionados.includes(p.id)
    );

    // Analyze for each selected product
    const ideias: PendingIdeia[] = [];

    for (const produto of selectedProducts) {
      const result = await analyzeContent(link, tipoSelecionado, [produto]);
      if (result) {
        ideias.push({ produto, result, link });
      }
    }

    if (ideias.length > 0) {
      setPendingIdeias(ideias);
      setCurrentIdeiaIndex(0);
      setStep("results");
    } else {
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
      toast.success("Ideia enviada! Próximo produto...");
    } else {
      toast.success("Todas as ideias foram enviadas ao Content Hub!");
      resetState();
    }
  };

  const resetState = () => {
    setStep("select-type");
    setTipoSelecionado(null);
    setLink("");
    setProdutosSelecionados([]);
    setPendingIdeias([]);
    setCurrentIdeiaIndex(0);
    resetModelagem();
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
              Modelar Vídeo
            </CardTitle>
            <CardDescription>
              Cole o link do vídeo para extrair o conteúdo
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
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetState}>
                Voltar
              </Button>
              <Button
                onClick={handleScrapeLink}
                disabled={!link || isScraping}
              >
                {isScraping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extraindo Conteúdo...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Extrair e Visualizar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && scrapedPreview && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle>Conteúdo Extraído com Sucesso</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {link.slice(0, 60)}...
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Text content */}
              <div className="space-y-4">
                {scrapedPreview.title && (
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Título</h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                      {scrapedPreview.title}
                    </p>
                  </div>
                )}

                {scrapedPreview.description && (
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Descrição</h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                      {scrapedPreview.description}
                    </p>
                  </div>
                )}

                {scrapedPreview.author && (
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Autor</h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                      {scrapedPreview.author}
                    </p>
                  </div>
                )}

                {scrapedPreview.markdown && (
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Conteúdo da Página</h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {scrapedPreview.markdown.slice(0, 1000)}
                      {scrapedPreview.markdown.length > 1000 && "..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Screenshot */}
              <div>
                {scrapedPreview.screenshot ? (
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Screenshot da Página</h4>
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img
                        src={scrapedPreview.screenshot}
                        alt="Screenshot da página"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg p-8">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Screenshot não disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("input-link")}>
                Alterar Link
              </Button>
              <Button onClick={handleContinueToProducts}>
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

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("preview")}>
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
            <p className="text-muted-foreground text-center">
              A IA está analisando o conteúdo e gerando a modelagem para seus produtos...
            </p>
          </CardContent>
        </Card>
      )}

      {step === "results" && currentIdeia && (
        <div className="space-y-6">
          {pendingIdeias.length > 1 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Produto {currentIdeiaIndex + 1} de {pendingIdeias.length}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentIdeia.produto.nome}
              </span>
            </div>
          )}

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Análise do Conteúdo
                    <Badge className={SETOR_COLORS[currentIdeia.produto.setor]}>
                      {currentIdeia.produto.nome}
                    </Badge>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Gancho Utilizado
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

                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Motivos da Performance
                    </h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                      {currentIdeia.result.analise_performance}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Legenda Original
                    </h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                      {currentIdeia.result.legenda_original}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Análise de Filmagem/Edição
                    </h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                      {currentIdeia.result.analise_filmagem}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={resetState}>
                  Nova Modelagem
                </Button>
                <Button onClick={handleOpenIdeiaForm}>
                  <Send className="h-4 w-4 mr-2" />
                  Criar Ideia para Content Hub
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
          onSuccess={handleIdeiaEnviada}
        />
      )}
    </div>
  );
}
