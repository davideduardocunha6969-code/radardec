import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Download,
  FileText,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrmChamadas, type CrmChamada } from "@/hooks/useCrmChamadas";
import { supabase } from "@/integrations/supabase/client";

interface LeadContatosTabProps {
  leadId: string;
}

const statusMap: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  completada: { label: "Atendida", icon: PhoneIncoming, color: "bg-green-500/10 text-green-700" },
  finalizada: { label: "Atendida", icon: PhoneIncoming, color: "bg-green-500/10 text-green-700" },
  em_chamada: { label: "Em chamada", icon: Phone, color: "bg-blue-500/10 text-blue-700" },
  iniciando: { label: "Iniciando", icon: Phone, color: "bg-muted text-muted-foreground" },
  cancelada: { label: "Não atendida", icon: PhoneOff, color: "bg-destructive/10 text-destructive" },
  erro: { label: "Erro", icon: PhoneOff, color: "bg-destructive/10 text-destructive" },
  nao_atendida: { label: "Não atendida", icon: PhoneOff, color: "bg-destructive/10 text-destructive" },
};

function wasAnswered(status: string) {
  return ["completada", "finalizada"].includes(status);
}

export function LeadContatosTab({ leadId }: LeadContatosTabProps) {
  const { data: chamadas, isLoading } = useCrmChamadas(leadId);
  const [transcricaoOpen, setTranscricaoOpen] = useState<CrmChamada | null>(null);

  const handleDownloadAudio = async (chamada: CrmChamada) => {
    const url = chamada.audio_url || chamada.recording_url;
    if (!url) return;

    // If it's a storage path (not full URL), get signed URL
    if (!url.startsWith("http")) {
      const { data } = await supabase.storage
        .from("atendimentos-audio")
        .createSignedUrl(url, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
      return;
    }
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chamadas?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Phone className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum contato realizado ainda.</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-3">
          {chamadas.map((chamada) => {
            const answered = wasAnswered(chamada.status);
            const statusInfo = statusMap[chamada.status] || statusMap.iniciando;
            const StatusIcon = statusInfo.icon;
            const hasAudio = !!(chamada.audio_url || chamada.recording_url);
            const hasTranscricao = !!chamada.transcricao;

            return (
              <div
                key={chamada.id}
                className="border rounded-lg p-3 space-y-2"
              >
                {/* Header: date + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(new Date(chamada.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <Badge variant="outline" className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>

                {/* Phone number */}
                <p className="text-xs text-muted-foreground">{chamada.numero_discado}</p>

                {/* Duration */}
                {chamada.duracao_segundos && (
                  <p className="text-xs text-muted-foreground">
                    Duração: {Math.floor(chamada.duracao_segundos / 60)}m {chamada.duracao_segundos % 60}s
                  </p>
                )}

                {/* AI Summary */}
                {answered && chamada.resumo_ia && (
                  <div className="bg-muted rounded-md p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <MessageSquare className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">Resumo IA</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{chamada.resumo_ia}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1">
                  {hasTranscricao && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setTranscricaoOpen(chamada)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Transcrição
                    </Button>
                  )}
                  {hasAudio && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDownloadAudio(chamada)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Áudio
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Transcription dialog */}
      <Dialog open={!!transcricaoOpen} onOpenChange={(o) => !o && setTranscricaoOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transcrição da Ligação</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {transcricaoOpen?.transcricao}
            </p>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
