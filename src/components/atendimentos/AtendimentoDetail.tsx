import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Clock, Copy, Download, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Atendimento, Segmento } from "@/hooks/useAtendimentosClosers";

interface AtendimentoDetailProps {
  atendimento: Atendimento;
  onBack: () => void;
  speakerNames?: Record<string, string>;
}

const speakerColors: Record<string, string> = {
  "Falante 1": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Falante 2": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Falante 3": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Falante 4": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Falante 5": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

export function AtendimentoDetail({ atendimento, onBack, speakerNames = {} }: AtendimentoDetailProps) {
  const { toast } = useToast();
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "-";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const getSpeakerName = (speaker: string): string => {
    return speakerNames[speaker] || speaker;
  };

  const getSpeakerColor = (speaker: string): string => {
    return speakerColors[speaker] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const getFormattedText = (): string => {
    if (!atendimento.segmentos || atendimento.segmentos.length === 0) {
      return atendimento.transcricao_texto || "";
    }

    return atendimento.segmentos
      .map((s) => `[${formatTime(s.inicio)}] ${getSpeakerName(s.falante)}: ${s.texto}`)
      .join("\n\n");
  };

  const uniqueSpeakers = useMemo(() => {
    if (!atendimento.segmentos) return [];
    return [...new Set(atendimento.segmentos.map((s) => s.falante))];
  }, [atendimento.segmentos]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedText());
      toast({
        title: "Copiado!",
        description: "Transcrição copiada para a área de transferência.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const downloadAsText = () => {
    const content = getFormattedText();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atendimento_${format(new Date(atendimento.data_atendimento), "yyyy-MM-dd_HH-mm")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAsText} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhes do Atendimento</CardTitle>
              <CardDescription>
                {format(new Date(atendimento.data_atendimento), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </CardDescription>
            </div>
            <Badge variant={atendimento.status === "concluido" ? "default" : "secondary"}>
              {atendimento.status === "concluido" ? "Concluído" : atendimento.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Duração: {formatDuration(atendimento.duracao_segundos)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{uniqueSpeakers.length} participantes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speaker Legend */}
      {uniqueSpeakers.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <div className="flex flex-wrap gap-2">
              {uniqueSpeakers.map((speaker) => (
                <Badge key={speaker} className={getSpeakerColor(speaker)}>
                  <User className="h-3 w-3 mr-1" />
                  {getSpeakerName(speaker)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      <Card>
        <CardHeader>
          <CardTitle>Transcrição</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {atendimento.segmentos && atendimento.segmentos.length > 0 ? (
              <div className="space-y-4">
                {atendimento.segmentos.map((segmento, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSpeakerColor(segmento.falante)} variant="outline">
                        {getSpeakerName(segmento.falante)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(segmento.inicio)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed pl-2 border-l-2 border-muted">
                      {segmento.texto}
                    </p>
                  </div>
                ))}
              </div>
            ) : atendimento.transcricao_texto ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {atendimento.transcricao_texto}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma transcrição disponível
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
