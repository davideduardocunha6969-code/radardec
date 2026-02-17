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
  MessageCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [resumoOpen, setResumoOpen] = useState<CrmChamada | null>(null);

  const handleDownloadAudio = async (chamada: CrmChamada) => {
    const url = chamada.audio_url || chamada.recording_url;
    if (!url) return;
    if (!url.startsWith("http")) {
      const { data } = await supabase.storage
        .from("atendimentos-audio")
        .createSignedUrl(url, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Data</TableHead>
              <TableHead className="text-xs">Canal</TableHead>
              <TableHead className="text-xs">Número</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Duração</TableHead>
              <TableHead className="text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chamadas.map((chamada) => {
              const statusInfo = statusMap[chamada.status] || statusMap.iniciando;
              const hasAudio = !!(chamada.audio_url || chamada.recording_url);
              const hasTranscricao = !!chamada.transcricao;
              const hasResumo = !!(wasAnswered(chamada.status) && chamada.resumo_ia);

              return (
                <TableRow key={chamada.id}>
                  <TableCell className="text-xs whitespace-nowrap py-2">
                    {format(new Date(chamada.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="py-2">
                    {(chamada as any).canal === "whatsapp" ? (
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700">
                        <MessageCircle className="h-3 w-3 mr-0.5" />
                        WhatsApp
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700">
                        <Phone className="h-3 w-3 mr-0.5" />
                        VoIP
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-2">{chamada.numero_discado}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2">
                    {chamada.duracao_segundos
                      ? `${Math.floor(chamada.duracao_segundos / 60)}m${chamada.duracao_segundos % 60}s`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      {hasResumo && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setResumoOpen(chamada)}>
                              <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Resumo IA</TooltipContent>
                        </Tooltip>
                      )}
                      {hasTranscricao && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTranscricaoOpen(chamada)}>
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Transcrição</TooltipContent>
                        </Tooltip>
                      )}
                      {hasAudio && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadAudio(chamada)}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download áudio</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Resumo IA dialog */}
      <Dialog open={!!resumoOpen} onOpenChange={(o) => !o && setResumoOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Resumo da Ligação (IA)
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {resumoOpen?.resumo_ia}
            </p>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Transcription dialog */}
      <Dialog open={!!transcricaoOpen} onOpenChange={(o) => !o && setTranscricaoOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transcrição da Ligação</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-5">
              {(transcricaoOpen?.transcricao || "").split("\n").filter(Boolean).map((line, i) => {
                const match = line.match(/^\[(.+?)\]:\s*(.*)$/);
                if (match) {
                  const [, speaker, text] = match;
                  return (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <span className="text-xs font-semibold text-primary">{speaker}</span>
                      <p className="text-sm leading-relaxed mt-1">{text}</p>
                    </div>
                  );
                }
                return <p key={i} className="text-sm leading-relaxed">{line}</p>;
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}