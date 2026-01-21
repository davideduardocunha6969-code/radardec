import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Mic,
  Eye,
  Lightbulb,
  FileText,
  Target,
  Film,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Layout,
  Palette,
} from "lucide-react";
import { ModelagemResult, AnaliseVisualDetalhada } from "@/hooks/useModelagemConteudo";
import { FORMATO_LABELS, Formato } from "@/hooks/useConteudosMidia";

interface ModelagemResultsViewProps {
  result: ModelagemResult;
  formatoSaida: Formato;
  formatoOrigem: string;
}

interface ProcessStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "completed" | "active" | "pending";
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function ProcessStep({ icon, title, description, status, children, defaultOpen = false }: ProcessStepProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const statusColors = {
    completed: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300",
    active: "bg-primary/10 border-primary/30 text-primary",
    pending: "bg-muted/50 border-muted text-muted-foreground",
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-between p-4 h-auto rounded-xl border transition-all ${statusColors[status]} hover:opacity-80`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              {icon}
            </div>
            <div className="text-left">
              <span className="font-semibold block">{title}</span>
              <span className="text-xs opacity-70">{description}</span>
            </div>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 pl-4 border-l-2 border-border ml-6">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ContentBlockProps {
  label: string;
  content: string;
  variant?: "default" | "highlight" | "subtle";
}

function ContentBlock({ label, content, variant = "default" }: ContentBlockProps) {
  const variantStyles = {
    default: "bg-muted/50 border-border",
    highlight: "bg-primary/5 border-primary/20",
    subtle: "bg-background border-border/50",
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <h5 className="text-xs font-medium text-primary mb-2 uppercase tracking-wide">{label}</h5>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

export function ModelagemResultsView({ result, formatoSaida, formatoOrigem }: ModelagemResultsViewProps) {
  const isVideoFormat = formatoSaida === "video" || formatoSaida === "video_longo";
  const getOrigemLabel = (formato: string) => {
    const labels: Record<string, string> = {
      video: "Vídeo Curto",
      video_longo: "Vídeo Longo",
      carrossel: "Carrossel",
      estatico: "Estático",
      blog: "Blog Post",
      publicacao: "Publicação",
    };
    return labels[formato] || formato;
  };

  return (
    <div className="space-y-6">
      {/* AI Pipeline Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
        <div className="p-2 rounded-lg bg-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Pipeline de Análise IA</h3>
          <p className="text-xs text-muted-foreground">
            Transformação: <span className="font-medium text-primary">{getOrigemLabel(formatoOrigem)}</span> → <span className="font-medium text-primary">{FORMATO_LABELS[formatoSaida]}</span>
          </p>
        </div>
        <Badge variant="outline" className="border-green-500/50 text-green-600">
          Concluído
        </Badge>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pipeline" className="gap-2">
            <Zap className="h-4 w-4" />
            Processo da IA
          </TabsTrigger>
          <TabsTrigger value="output" className="gap-2">
            <FileText className="h-4 w-4" />
            Resultado Final
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6 space-y-4">
          {/* Step 1: Audio Transcription */}
          {result.transcricao_audio && (
            <ProcessStep
              icon={<Mic className="h-5 w-5 text-blue-500" />}
              title="Transcrição de Áudio"
              description="ElevenLabs Scribe v2 • Diarização ativada"
              status="completed"
            >
              <ContentBlock
                label="Texto transcrito"
                content={result.transcricao_audio}
                variant="subtle"
              />
            </ProcessStep>
          )}

          {/* Step 2: Visual Analysis */}
          {result.analise_visual_detalhada && (
            <ProcessStep
              icon={<Eye className="h-5 w-5 text-purple-500" />}
              title="Análise Visual"
              description="Gemini 2.5 Flash • Análise de frames"
              status="completed"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ContentBlock
                  label="Cenário"
                  content={result.analise_visual_detalhada.cenario}
                  variant="subtle"
                />
                <ContentBlock
                  label="Enquadramento"
                  content={result.analise_visual_detalhada.enquadramento}
                  variant="subtle"
                />
                <ContentBlock
                  label="Transições"
                  content={result.analise_visual_detalhada.transicoes}
                  variant="subtle"
                />
                <ContentBlock
                  label="Postura do Apresentador"
                  content={result.analise_visual_detalhada.postura_apresentador}
                  variant="subtle"
                />
                <ContentBlock
                  label="Elementos Visuais"
                  content={result.analise_visual_detalhada.elementos_visuais}
                  variant="subtle"
                />
                <ContentBlock
                  label="Ritmo de Edição"
                  content={result.analise_visual_detalhada.ritmo_edicao}
                  variant="subtle"
                />
              </div>
            </ProcessStep>
          )}

          {/* Step 3: Content Analysis */}
          <ProcessStep
            icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
            title="Análise de Conteúdo"
            description="Gemini 3 Flash Preview • Estratégia e performance"
            status="completed"
            defaultOpen
          >
            <div className="space-y-4">
              {result.gancho_original && (
                <ContentBlock
                  label="Gancho Original Identificado"
                  content={result.gancho_original}
                  variant="highlight"
                />
              )}
              {result.analise_estrategia && (
                <ContentBlock
                  label="Estratégia de Conteúdo"
                  content={result.analise_estrategia}
                />
              )}
              {result.analise_performance && (
                <ContentBlock
                  label="Análise de Performance"
                  content={result.analise_performance}
                />
              )}
              {result.legenda_original && (
                <ContentBlock
                  label="Legenda Original"
                  content={result.legenda_original}
                  variant="subtle"
                />
              )}
              {result.analise_filmagem && (
                <ContentBlock
                  label="Análise de Produção"
                  content={result.analise_filmagem}
                />
              )}
            </div>
          </ProcessStep>

          {/* Step 4: Content Generation */}
          <ProcessStep
            icon={isVideoFormat ? <Film className="h-5 w-5 text-green-500" /> : <Layout className="h-5 w-5 text-green-500" />}
            title={`Geração de Conteúdo: ${FORMATO_LABELS[formatoSaida]}`}
            description="Gemini 3 Flash Preview • Adaptação de formato"
            status="completed"
            defaultOpen
          >
            <div className="space-y-4">
              <ContentBlock
                label="Título Sugerido"
                content={result.titulo_sugerido}
                variant="highlight"
              />
              <ContentBlock
                label={isVideoFormat ? "Roteiro / Copy Completa" : "Copy / Textos"}
                content={result.copy_completa}
              />
              {result.orientacoes_filmagem && (
                <ContentBlock
                  label={isVideoFormat ? "Orientações de Produção" : "Orientações de Design"}
                  content={result.orientacoes_filmagem}
                />
              )}
            </div>
          </ProcessStep>
        </TabsContent>

        <TabsContent value="output" className="mt-6 space-y-6">
          {/* Title */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
                Título Sugerido
              </h4>
            </div>
            <p className="text-lg font-semibold text-foreground leading-relaxed">
              {result.titulo_sugerido}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {result.gancho_original && (
                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      Gancho
                    </h4>
                  </div>
                  <p className="text-sm text-foreground">{result.gancho_original}</p>
                </div>
              )}

              {result.analise_estrategia && (
                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
                      Estratégia Identificada
                    </h4>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{result.analise_estrategia}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
                    {isVideoFormat ? "Roteiro Completo" : "Copy Completa"}
                  </h4>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto pr-2">
                  {result.copy_completa}
                </p>
              </div>

              {result.orientacoes_filmagem && (
                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    {isVideoFormat ? (
                      <Film className="h-4 w-4 text-primary" />
                    ) : (
                      <Palette className="h-4 w-4 text-primary" />
                    )}
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
                      {isVideoFormat ? "Orientações de Produção" : "Orientações de Design"}
                    </h4>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {result.orientacoes_filmagem}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
