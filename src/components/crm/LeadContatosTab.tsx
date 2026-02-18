import { useState, useCallback, useEffect, useMemo } from "react";
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
  Star,
  ClipboardCheck,
  RefreshCw,
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
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
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Bot, User } from "lucide-react";

interface LeadContatosTabProps {
  leadId: string;
}

const statusMap: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  completada: { label: "Atendida", icon: PhoneIncoming, color: "bg-green-500/10 text-green-700" },
  finalizada: { label: "Atendida", icon: PhoneIncoming, color: "bg-green-500/10 text-green-700" },
  gravacao_pronta: { label: "Atendida", icon: PhoneIncoming, color: "bg-green-500/10 text-green-700" },
  processando_transcricao: { label: "Processando", icon: Phone, color: "bg-yellow-500/10 text-yellow-700" },
  em_chamada: { label: "Em chamada", icon: Phone, color: "bg-blue-500/10 text-blue-700" },
  iniciando: { label: "Iniciando", icon: Phone, color: "bg-muted text-muted-foreground" },
  cancelada: { label: "Não atendida", icon: PhoneOff, color: "bg-destructive/10 text-destructive" },
  erro: { label: "Erro", icon: PhoneOff, color: "bg-destructive/10 text-destructive" },
  nao_atendida: { label: "Não atendida", icon: PhoneOff, color: "bg-destructive/10 text-destructive" },
  interrompida: { label: "Interrompida", icon: PhoneOff, color: "bg-yellow-500/10 text-yellow-700" },
};

function wasAnswered(status: string) {
  return ["completada", "finalizada", "gravacao_pronta"].includes(status);
}

function getNotaColor(nota: number): string {
  if (nota >= 8) return "bg-green-500/10 text-green-700 border-green-500/30";
  if (nota >= 5) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
  return "bg-red-500/10 text-red-700 border-red-500/30";
}

export function LeadContatosTab({ leadId }: LeadContatosTabProps) {
  const { data: chamadas, isLoading } = useCrmChamadas(leadId);
  const queryClient = useQueryClient();

  // Fetch profiles for SDR names
  const userIds = useMemo(() => {
    if (!chamadas) return [];
    return [...new Set(chamadas.map(c => c.user_id))];
  }, [chamadas]);

  const { data: profilesMap } = useQuery({
    queryKey: ["profiles_map", userIds],
    queryFn: async () => {
      if (!userIds.length) return {} as Record<string, string>;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      const map: Record<string, string> = {};
      data?.forEach(p => { map[p.user_id] = p.display_name; });
      return map;
    },
    enabled: userIds.length > 0,
  });
  const [transcricaoOpen, setTranscricaoOpen] = useState<CrmChamada | null>(null);
  const [resumoOpen, setResumoOpen] = useState<CrmChamada | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<CrmChamada | null>(null);
  const [runningFeedbackIds, setRunningFeedbackIds] = useState<Set<string>>(new Set());
  const [custoOpen, setCustoOpen] = useState<CrmChamada | null>(null);
  const [resumoContatos, setResumoContatos] = useState<string | null>(null);
  const [resumoContatosLoading, setResumoContatosLoading] = useState(false);
  const [resumoContatosExpanded, setResumoContatosExpanded] = useState(true);
  const [resumoSavedAt, setResumoSavedAt] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load saved summary from lead record
  useEffect(() => {
    const loadSavedResumo = async () => {
      const { data } = await supabase
        .from("crm_leads")
        .select("resumo_ia_contatos, resumo_ia_contatos_at")
        .eq("id", leadId)
        .single();
      if (data?.resumo_ia_contatos) {
        setResumoContatos(data.resumo_ia_contatos);
        setResumoSavedAt(data.resumo_ia_contatos_at);
      }
      setInitialLoadDone(true);
    };
    loadSavedResumo();
  }, [leadId]);

  // Detect if there are new contacts after the saved summary
  const hasNewContacts = useMemo(() => {
    if (!resumoSavedAt || !chamadas?.length) return false;
    const savedDate = new Date(resumoSavedAt);
    return chamadas.some((c) => new Date(c.created_at) > savedDate);
  }, [resumoSavedAt, chamadas]);

  const handleRunFeedback = async (chamadaId: string) => {
    setRunningFeedbackIds(prev => new Set(prev).add(chamadaId));
    try {
      const { data, error } = await supabase.functions.invoke("feedback-chamada", {
        body: { chamadaId },
      });
      if (error) throw error;
      toast.success(`Feedback gerado! Nota: ${data?.nota ?? "-"}/10`);
      queryClient.invalidateQueries({ queryKey: ["crm_chamadas", leadId] });
    } catch (e: any) {
      toast.error("Erro ao gerar feedback: " + (e.message || "Erro desconhecido"));
    } finally {
      setRunningFeedbackIds(prev => {
        const next = new Set(prev);
        next.delete(chamadaId);
        return next;
      });
    }
  };

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

  const handleGerarResumoContatos = useCallback(async () => {
    setResumoContatosLoading(true);
    setResumoContatosExpanded(true);
    try {
      const { data, error } = await supabase.functions.invoke("resumo-contatos-lead", {
        body: { leadId },
      });
      if (error) throw error;
      const resumo = data?.resumo || "Não foi possível gerar o resumo.";
      setResumoContatos(resumo);

      // Save to lead record
      const now = new Date().toISOString();
      await supabase
        .from("crm_leads")
        .update({ resumo_ia_contatos: resumo, resumo_ia_contatos_at: now } as any)
        .eq("id", leadId);
      setResumoSavedAt(now);
    } catch (e: any) {
      toast.error("Erro ao gerar resumo: " + (e.message || "Erro desconhecido"));
    } finally {
      setResumoContatosLoading(false);
    }
  }, [leadId]);

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
      {/* AI Summary Section */}
      <div className="mb-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Resumo IA dos Contatos</span>
            {resumoSavedAt && (
              <span className="text-[10px] text-muted-foreground">
                (salvo em {format(new Date(resumoSavedAt), "dd/MM/yy HH:mm", { locale: ptBR })})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {resumoContatos && !resumoContatosLoading && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setResumoContatosExpanded(!resumoContatosExpanded)}
              >
                {resumoContatosExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </div>
        {hasNewContacts && resumoContatos && (
          <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2">
            <span className="text-xs text-amber-700">
              ⚠️ Novos contatos realizados após o último resumo.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] gap-1 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
              onClick={handleGerarResumoContatos}
              disabled={resumoContatosLoading}
            >
              {resumoContatosLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Atualizar Resumo
            </Button>
          </div>
        )}
        {resumoContatosLoading && !resumoContatos && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analisando chamadas e transcrições...
          </div>
        )}
        {resumoContatos && resumoContatosExpanded && (
          <div className="px-4 pb-3 border-t border-border/50 pt-3">
            <div className="text-sm leading-relaxed space-y-1 prose prose-sm max-w-none dark:prose-invert">
              {resumoContatos.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-1.5" />;
                if (/^#{1,3}\s/.test(trimmed)) {
                  const text = trimmed.replace(/^#{1,3}\s+/, '');
                  return <p key={i} className="font-semibold text-foreground mt-2 mb-0.5">{text}</p>;
                }
                if (/^\*\*/.test(trimmed)) {
                  const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={i} className="text-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />;
                }
                if (/^[-•]\s/.test(trimmed)) {
                  const text = trimmed.replace(/^[-•]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return (
                    <div key={i} className="flex items-start gap-2 ml-2">
                      <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                      <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: text }} />
                    </div>
                  );
                }
                const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return <p key={i} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />;
              })}
            </div>
          </div>
        )}
        {!resumoContatos && !resumoContatosLoading && initialLoadDone && (
          <div className="px-4 pb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Nenhum resumo gerado ainda.</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleGerarResumoContatos}
              disabled={resumoContatosLoading}
            >
              <Sparkles className="h-3 w-3" />
              Gerar Resumo
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{chamadas.length} contato(s) registrado(s)</span>
      </div>
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Data</TableHead>
              <TableHead className="text-xs">Canal</TableHead>
              <TableHead className="text-xs">Responsável</TableHead>
              <TableHead className="text-xs">Número</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Duração</TableHead>
              <TableHead className="text-xs">Encerrada por</TableHead>
              <TableHead className="text-xs">Nota IA</TableHead>
              <TableHead className="text-xs">Custo</TableHead>
              <TableHead className="text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chamadas.map((chamada) => {
              const statusInfo = statusMap[chamada.status] || statusMap.iniciando;
              const hasAudio = !!(chamada.audio_url || chamada.recording_url);
              const hasTranscricao = !!chamada.transcricao;
              const hasResumo = !!(wasAnswered(chamada.status) && chamada.resumo_ia);
              const hasFeedback = !!(chamada as any).feedback_ia;
              const nota = (chamada as any).nota_ia as number | null;

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
                  <TableCell className="py-2">
                    {(chamada as any).canal === "ia" ? (
                      <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700">
                        <Bot className="h-3 w-3 mr-0.5" />
                        IA
                      </Badge>
                    ) : (
                      <span className="text-xs flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {profilesMap?.[chamada.user_id] || "—"}
                      </span>
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
                  <TableCell className="py-2">
                    {(chamada as any).encerrado_por === "lead" ? (
                      <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-700">Lead</Badge>
                    ) : (chamada as any).encerrado_por === "sdr" ? (
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700">SDR</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    {nota !== null && nota !== undefined ? (
                      <Badge variant="outline" className={`text-[10px] font-bold ${getNotaColor(nota)}`}>
                        <Star className="h-3 w-3 mr-0.5 fill-current" />
                        {nota}/10
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    {(() => {
                      const custo = (chamada as any).custo_detalhado as Record<string, number> | null;
                      if (!custo) return <span className="text-xs text-muted-foreground">-</span>;
                      const totalUsd = (custo.twilio_chamada || 0) + (custo.twilio_gravacao || 0) + (custo.elevenlabs_transcricao || 0) + (custo.lovable_ia_feedback || 0) + (custo.storage || 0) + (custo.edge_functions || 0);
                      const cotacao = custo.cotacao_brl || 5.50;
                      const totalBrl = totalUsd * cotacao;
                      return (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto py-0.5 px-1.5 text-[10px] font-mono text-emerald-700 hover:text-emerald-800"
                          onClick={() => setCustoOpen(chamada)}
                        >
                          R$ {totalBrl.toFixed(2)}
                        </Button>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      {hasTranscricao && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={runningFeedbackIds.has(chamada.id)}
                              onClick={() => handleRunFeedback(chamada.id)}
                            >
                              {runningFeedbackIds.has(chamada.id) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{hasFeedback ? "Regerar Feedback IA" : "Gerar Feedback IA"}</TooltipContent>
                        </Tooltip>
                      )}
                      {hasFeedback && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFeedbackOpen(chamada)}>
                              <ClipboardCheck className="h-3.5 w-3.5 text-amber-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Feedback IA</TooltipContent>
                        </Tooltip>
                      )}
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

      {/* Feedback IA dialog */}
      <Dialog open={!!feedbackOpen} onOpenChange={(o) => !o && setFeedbackOpen(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-amber-600" />
              Feedback do Atendimento (IA)
              {(feedbackOpen as any)?.nota_ia !== null && (feedbackOpen as any)?.nota_ia !== undefined && (
                <Badge variant="outline" className={`ml-2 ${getNotaColor((feedbackOpen as any).nota_ia)}`}>
                  <Star className="h-3 w-3 mr-0.5 fill-current" />
                  {(feedbackOpen as any).nota_ia}/10
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="text-sm leading-relaxed space-y-1 px-2">
              {((feedbackOpen as any)?.feedback_ia || "").split('\n').map((line: string, i: number) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;

                const formatText = (text: string) =>
                  text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

                const formatted = formatText(trimmed);

                // Nota Final: XX/100 or NOTA: X
                const isNotaFinal = /^Nota\s*Final:\s*\d+/i.test(trimmed);
                const isNota = /^NOTA:\s*\d/i.test(trimmed);

                if (isNotaFinal || isNota) {
                  return (
                    <div key={i} className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="text-lg font-bold text-primary" dangerouslySetInnerHTML={{ __html: formatted }} />
                    </div>
                  );
                }

                // Separator lines
                const isSeparator = /^={3,}$/.test(trimmed) || /^-{3,}$/.test(trimmed);
                if (isSeparator) return <hr key={i} className="my-3 border-border/50" />;

                // Section headers
                const isSectionHeader = /^(📊|✅|⚠️|💡|🎯|➡️|🏁)/.test(trimmed)
                  || /^\d+\)\s+[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ]/.test(trimmed)
                  || /^(Classificação|Resumo executivo|Penalidades|Estado predominante|Integração estratégica|Tipo de fechamento|Timing|Construção de valor|Probabilidade estimada)/i.test(trimmed);

                if (isSectionHeader) {
                  return (
                    <div
                      key={i}
                      className="font-semibold text-base text-foreground mt-4 mb-1 border-b border-border/50 pb-1"
                      dangerouslySetInnerHTML={{ __html: formatted }}
                    />
                  );
                }

                // Table rows
                const isTableRow = /^\|.*\|$/.test(trimmed);
                const isTableSeparator = /^\|[\s\-:|]+\|$/.test(trimmed);
                if (isTableSeparator) return null;
                if (isTableRow) {
                  const cells = trimmed.split('|').filter(Boolean).map(c => c.trim());
                  return (
                    <div key={i} className="grid grid-cols-4 gap-1 py-1 px-1 text-xs border-b border-border/30">
                      {cells.map((cell, ci) => (
                        <span
                          key={ci}
                          className={ci === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}
                          dangerouslySetInnerHTML={{ __html: formatText(cell) }}
                        />
                      ))}
                    </div>
                  );
                }

                // Bullets
                const isBullet = /^[-•–]\s/.test(trimmed) || /^\*\s{1,}/.test(trimmed);
                const isNumbered = /^\d+[.)]\s/.test(trimmed) && !/^\d+\)\s+[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ]/.test(trimmed);
                if (isBullet || isNumbered) {
                  const bulletText = isBullet ? trimmed.replace(/^[-•–*]\s+/, '') : trimmed;
                  return (
                    <div key={i} className="flex items-start gap-2 ml-3 py-0.5">
                      <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                      <span dangerouslySetInnerHTML={{ __html: formatText(bulletText) }} />
                    </div>
                  );
                }

                // Labels
                const isLabel = /^(Momento|O que poderia|Trecho original|Versão melhorada|Oportunidade|RECA|RALOCA|RAPOVECA|Justificativa).*:/i.test(trimmed);
                if (isLabel) {
                  return (
                    <p key={i} className="font-medium text-foreground mt-2" dangerouslySetInnerHTML={{ __html: formatted }} />
                  );
                }

                return (
                  <p key={i} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Resumo IA dialog */}
      <Dialog open={!!resumoOpen} onOpenChange={(o) => !o && setResumoOpen(null)}>
        <DialogContent className="max-w-5xl">
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
        <DialogContent className="max-w-5xl">
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

      {/* Cost breakdown dialog */}
      <Dialog open={!!custoOpen} onOpenChange={(o) => !o && setCustoOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Detalhamento de Custos
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const custo = (custoOpen as any)?.custo_detalhado as Record<string, number> | null;
            if (!custo) return <p className="text-sm text-muted-foreground">Custos não calculados para esta chamada.</p>;

            const cotacao = custo.cotacao_brl || 5.50;
            const toBrl = (usd: number) => (usd * cotacao);

            const items = [
              { label: "Twilio — Chamada VoIP", desc: `${custo.duracao_min?.toFixed(1) || 0} min × $0.0663/min`, valueUsd: custo.twilio_chamada || 0 },
              { label: "Twilio — Gravação", desc: `${custo.duracao_min?.toFixed(1) || 0} min × $0.0025/min`, valueUsd: custo.twilio_gravacao || 0 },
              { label: "ElevenLabs — Transcrição", desc: `Scribe v2 (${custo.duracao_min?.toFixed(1) || 0} min)`, valueUsd: custo.elevenlabs_transcricao || 0 },
              { label: "Lovable IA — Feedback", desc: `Gemini 2.5 Flash (${custo.ia_tokens_input || 0} in / ${custo.ia_tokens_output || 0} out tokens)`, valueUsd: custo.lovable_ia_feedback || 0 },
              { label: "Storage — Áudio", desc: `${custo.audio_size_mb?.toFixed(2) || 0} MB armazenado`, valueUsd: custo.storage || 0 },
              { label: "Edge Functions", desc: "Webhook + Processamento + Feedback", valueUsd: custo.edge_functions || 0 },
            ];

            const totalUsd = items.reduce((s, i) => s + i.valueUsd, 0);
            const totalBrl = toBrl(totalUsd);

            return (
              <div className="space-y-3">
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-foreground">R$ {toBrl(item.valueUsd).toFixed(4)}</span>
                        <p className="text-[9px] text-muted-foreground font-mono">(${item.valueUsd.toFixed(4)})</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t-2 border-border">
                  <span className="text-sm font-bold">Total</span>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-emerald-700">R$ {totalBrl.toFixed(2)}</span>
                    <p className="text-[9px] text-muted-foreground font-mono">(${totalUsd.toFixed(4)})</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  * Cotação USD/BRL utilizada: R$ {cotacao.toFixed(4)} (data da ligação). Valores estimados.
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
