import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Phone, PhoneOff, AlertCircle, Mic, MicOff,
  Clock, PhoneCall, PhoneMissed, X, User, MapPin, FileText,
  FileSearch, HelpCircle, Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Device } from "@twilio/voice-sdk";
import type { Call } from "@twilio/voice-sdk";
import { RealtimeCoachingPanel, type AudioMonitorInfo, type LabeledTranscript } from "@/components/crm/RealtimeCoachingPanel";
import { CoachingErrorBoundary } from "@/components/crm/coaching/CoachingErrorBoundary";
import { GapsPanel } from "@/components/crm/lacunas/GapsPanel";
import { DataExtractorPanel } from "@/components/crm/extrator/DataExtractorPanel";
import { ValuesEstimationPanel } from "@/components/crm/estimativa/ValuesEstimationPanel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLeadDadosSync } from "@/hooks/useLeadDadosSync";
import { getFieldValue, type DadosExtrasMap } from "@/utils/trabalhista/types";
import type { RoboCoach } from "@/hooks/useRobosCoach";
import type { ScriptSdr } from "@/hooks/useScriptsSdr";
import logoEscritorio from "@/assets/logo-escritorio.webp";

interface LeadInfo {
  leadId: string;
  leadNome: string;
  numero: string;
  status: string;
  callerId?: string;
  dddMatch?: boolean;
}

interface EnrichedLead extends LeadInfo {
  currentStatus: string;
}

const BROADCAST_CHANNEL_NAME = "power-dialer-audio";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  iniciando: { icon: <Clock className="h-4 w-4 text-muted-foreground" />, color: "text-muted-foreground", label: "Iniciando" },
  chamando: { icon: <Phone className="h-4 w-4 text-yellow-500 animate-pulse" />, color: "text-yellow-500", label: "Chamando..." },
  em_andamento: { icon: <Phone className="h-4 w-4 text-blue-500" />, color: "text-blue-500", label: "Discando" },
  em_chamada: { icon: <PhoneCall className="h-4 w-4 text-green-500" />, color: "text-green-500", label: "Atendeu! ✓" },
  nao_atendida: { icon: <PhoneMissed className="h-4 w-4 text-orange-500" />, color: "text-orange-500", label: "Não atendeu" },
  ocupado: { icon: <PhoneOff className="h-4 w-4 text-orange-500" />, color: "text-orange-500", label: "Ocupado" },
  cancelada: { icon: <X className="h-4 w-4 text-muted-foreground" />, color: "text-muted-foreground", label: "Cancelada" },
  falhou: { icon: <AlertCircle className="h-4 w-4 text-destructive" />, color: "text-destructive", label: "Falhou" },
  finalizada: { icon: <PhoneCall className="h-4 w-4 text-green-500" />, color: "text-green-500", label: "Finalizada" },
};

function formatPhoneDisplay(numero: string) {
  const clean = numero.replace(/\D/g, "").replace(/^55/, "");
  if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return numero;
}

export default function AtendimentoAguardando() {
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");
  const status = params.get("status");

  const [session, setSession] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const advancingRef = useRef(false);

  // Audio bridge state
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const [answeredLeadName, setAnsweredLeadName] = useState("");

  // Inline coaching state
  const [callStreams, setCallStreams] = useState<{ mic: MediaStream | null; remote: MediaStream | null }>({ mic: null, remote: null });
  const [coach, setCoach] = useState<RoboCoach | null>(null);
  const [script, setScript] = useState<ScriptSdr | null>(null);
  const [leadData, setLeadData] = useState<any>(null);
  const [transcriptChunks, setTranscriptChunks] = useState<LabeledTranscript[]>([]);
  const [audioMonitor, setAudioMonitor] = useState<AudioMonitorInfo | undefined>(undefined);
  const [activePanel, setActivePanel] = useState<"extrator" | "lacunas" | "estimativa" | null>(null);
  const leadDadosSync = useLeadDadosSync(leadData?.id ?? null);

  const handleTranscriptUpdate = useCallback((transcripts: LabeledTranscript[]) => {
    setTranscriptChunks(transcripts);
  }, []);

  // Initialize BroadcastChannel
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  // Initialize Twilio Device on mount
  useEffect(() => {
    const initDevice = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("twilio-token");
        if (error || !data?.token) {
          console.error("[Aguardando] Failed to get Twilio token:", error);
          return;
        }

        const device = new Device(data.token, { logLevel: 1 });

        device.on("incoming", (call: Call) => {
          console.log("[Aguardando] Incoming call, auto-accepting. CallSid:", call.parameters?.CallSid);
          call.accept();
          activeCallRef.current = call;
          setCallActive(true);

          // Retry to capture native streams (up to 5 attempts, 500ms apart)
          const tryGetStreams = (attempt = 0) => {
            const localStream = (call as any).getLocalStream?.() ?? null;
            const remoteStream = (call as any).getRemoteStream?.() ?? null;
            if ((!localStream || !remoteStream) && attempt < 5) {
              setTimeout(() => tryGetStreams(attempt + 1), 500);
              return;
            }
            setCallStreams({ mic: localStream, remote: remoteStream });
            if (localStream) console.log("[Aguardando] Streams captured on attempt", attempt);
            else console.warn("[Aguardando] Failed to capture streams after 5 attempts");
          };
          setTimeout(() => tryGetStreams(), 500);

          // Start duration timer
          callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);

          call.on("disconnect", () => {
            console.log("[Aguardando] Call disconnected");
            handleCallEnded();
          });

          call.on("cancel", () => {
            console.log("[Aguardando] Call cancelled");
            handleCallEnded();
          });
        });

        await device.register();
        deviceRef.current = device;
        console.log("[Aguardando] Twilio Device registered");
      } catch (e) {
        console.error("[Aguardando] Device init error:", e);
      }
    };

    initDevice();

    return () => {
      deviceRef.current?.destroy();
      deviceRef.current = null;
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  const handleCallEnded = useCallback(() => {
    setCallActive(false);
    activeCallRef.current = null;
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    broadcastRef.current?.postMessage({ type: "call-ended" });
  }, []);

  // When session gets lead_atendido_id → set answered lead name
  useEffect(() => {
    if (!session?.lead_atendido_id) return;

    const leadsInfo = (session.leads_info || []) as LeadInfo[];
    const answeredLead = leadsInfo.find(l => l.leadId === session.lead_atendido_id);
    setAnsweredLeadName(answeredLead?.leadNome || "Lead");

    // Notify via BroadcastChannel
    broadcastRef.current?.postMessage({
      type: "call-active",
      leadId: session.lead_atendido_id,
      numero: session.telefone_atendido || "",
    });
  }, [session?.lead_atendido_id]);

  // Fetch coaching data when lead is answered
  useEffect(() => {
    if (!session?.lead_atendido_id) return;

    const fetchCoachingData = async () => {
      try {
        // Fetch lead
        const { data: leadRow } = await supabase
          .from("crm_leads")
          .select("id, nome, endereco, resumo_caso, telefones, coluna_id, funil_id, dados_extras")
          .eq("id", session.lead_atendido_id)
          .single();

        if (leadRow) setLeadData(leadRow);

        // Fetch funil → coach + script
        const resolvedFunilId = session.funil_id || leadRow?.funil_id;
        const papel = session.papel || "sdr";

        if (resolvedFunilId) {
          const { data: funilData } = await supabase
            .from("crm_funis")
            .select("robo_coach_sdr_id, robo_coach_closer_id, script_sdr_id, script_closer_id")
            .eq("id", resolvedFunilId)
            .single();

          if (funilData) {
            const coachId = papel === "closer" ? funilData.robo_coach_closer_id : funilData.robo_coach_sdr_id;
            if (coachId) {
              const { data: coachRow } = await supabase.from("robos_coach").select("*").eq("id", coachId).single();
              if (coachRow) setCoach(coachRow as unknown as RoboCoach);
            }

            const scriptId = papel === "closer" ? funilData.script_closer_id : funilData.script_sdr_id;
            if (scriptId) {
              const { data: scriptRow } = await supabase.from("scripts_sdr").select("*").eq("id", scriptId).single();
              if (scriptRow) {
                const s = scriptRow as unknown as ScriptSdr;
                setScript({
                  ...s,
                  apresentacao: Array.isArray(s.apresentacao) ? s.apresentacao : [],
                  qualificacao: Array.isArray(s.qualificacao) ? s.qualificacao : [],
                  show_rate: Array.isArray(s.show_rate) ? s.show_rate : [],
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("[Aguardando] Error fetching coaching data:", e);
      }
    };

    fetchCoachingData();
  }, [session?.lead_atendido_id, session?.funil_id, session?.papel]);

  // Fetch session via edge function (bypasses RLS)
  const fetchSessionViaEdge = useCallback(async (): Promise<any | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("power-dialer-session-status", {
        body: { sessionId },
      });
      if (error) return null;
      return data?.session || null;
    } catch {
      return null;
    }
  }, [sessionId]);

  const fetchSession = useCallback(async (retries = 15) => {
    if (!sessionId || !mountedRef.current) return;
    const result = await fetchSessionViaEdge();
    if (result) {
      setFetchError(false);
      setSession(result);
      return;
    }
    if (retries > 0) {
      setTimeout(() => fetchSession(retries - 1), 1000);
      return;
    }
    setFetchError(true);
  }, [sessionId, fetchSessionViaEdge]);

  // Initial fetch
  useEffect(() => {
    if (!sessionId) return;
    const timer = setTimeout(() => fetchSession(), 300);
    return () => clearTimeout(timer);
  }, [sessionId, fetchSession]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`pds-${sessionId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "power_dialer_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          if (mountedRef.current) setSession(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // POLLING FALLBACK: every 2s while session is active
  useEffect(() => {
    if (!sessionId || !session) return;
    const isActive = session.status === "ativo";
    if (!isActive) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      const result = await fetchSessionViaEdge();
      if (result && mountedRef.current) {
        setSession(result);
      }
    }, 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [sessionId, session?.status, fetchSessionViaEdge]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Derived data
  const leadsInfo = (session?.leads_info || []) as LeadInfo[];
  const queue = (session?.numeros_fila || []) as any[];
  const totalLeads = queue.length;
  const loteAtual = session?.lote_atual || 0;
  const batchSize = leadsInfo.length > 0 ? leadsInfo.length : 1;
  const loteMax = Math.ceil(totalLeads / batchSize);
  const progressPercent = loteMax > 0 ? ((loteAtual + 1) / loteMax) * 100 : 0;

  // Enrich leads with real-time status from resultado_por_numero
  const resultados = (session?.resultado_por_numero || {}) as Record<string, string>;
  const enrichedLeads: EnrichedLead[] = leadsInfo.map(li => ({
    ...li,
    currentStatus: resultados[li.numero] || li.status,
  }));

  // AUTO-ADVANCE: when all leads in batch have terminal status and no winner
  useEffect(() => {
    if (!session || !session.id || session.status !== "ativo" || session.lead_atendido_id) return;
    if (enrichedLeads.length === 0 || advancingRef.current) return;

    const terminalStatuses = ["nao_atendida", "ocupado", "cancelada", "falhou", "finalizada"];
    const allDone = enrichedLeads.every(li => terminalStatuses.includes(li.currentStatus));

    if (allDone) {
      advancingRef.current = true;
      console.log("[Aguardando] Batch done, advancing to next-batch");
      supabase.functions.invoke("power-dialer", {
        body: { action: "next-batch", sessionId: session.id },
      }).then(() => {
        advancingRef.current = false;
      }).catch(e => {
        console.error("[Aguardando] next-batch error:", e);
        advancingRef.current = false;
      });
    }
  }, [session?.resultado_por_numero, session?.status, session?.lead_atendido_id, enrichedLeads]);

  const handleCancel = async () => {
    if (!sessionId) return;
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("power-dialer", {
        body: { action: "cancel", sessionId },
      });
      if (error) toast.error("Erro ao cancelar discagem");
      else setSession((prev: any) => prev ? { ...prev, status: "cancelado" } : prev);
    } catch {
      toast.error("Erro ao cancelar discagem");
    }
    setCancelling(false);
  };

  const handleMuteToggle = () => {
    if (activeCallRef.current) {
      const newMuted = !muted;
      activeCallRef.current.mute(newMuted);
      setMuted(newMuted);
      broadcastRef.current?.postMessage({ type: "mute-changed", muted: newMuted });
    }
  };

  const handleHangup = () => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isFinished = session?.status === "finalizado_sem_atendimento" || session?.status === "cancelado" || session?.status === "expirado";
  const papel = session?.papel || "sdr";

  // === INLINE COACHING MODE — call is active with lead answered ===
  if (callActive && session?.lead_atendido_id) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="gradient-primary px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoEscritorio} alt="Logo" className="h-7" />
              <div className="h-6 w-px bg-white/20" />
              {leadData ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-white/70" />
                    <span className="font-semibold text-sm text-white">{leadData.nome}</span>
                  </div>
                  {leadData.endereco && (
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <MapPin className="h-3 w-3" />
                      {leadData.endereco}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-white/60">{answeredLeadName}</span>
              )}
              <Badge variant="outline" className="text-xs text-white/80 border-white/30">
                {papel === "closer" ? "Closer" : "SDR"}
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                Power Dialer
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-red-500 text-white animate-pulse gap-1">
                <span className="h-2 w-2 rounded-full bg-white" />
                Em chamada
              </Badge>
              <span className="text-sm font-mono text-white font-bold">{formatDuration(callDuration)}</span>
              <Button
                variant="ghost"
                size="sm"
                className={`text-white hover:bg-white/20 ${muted ? "bg-red-500/30" : ""}`}
                onClick={handleMuteToggle}
                title={muted ? "Desmutar" : "Mutar"}
              >
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-300 hover:bg-red-500/30 hover:text-white"
                onClick={handleHangup}
                title="Desligar"
              >
                <PhoneOff className="h-4 w-4 mr-1" />
                Desligar
              </Button>
            </div>
          </div>
        </header>

        {/* Lead context bar */}
        {leadData && (leadData.resumo_caso || leadData.dados_extras) && (
          <div className="border-b bg-muted/30 px-4 py-2 shrink-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {Object.entries((leadData.dados_extras as DadosExtrasMap) || {}).map(([key, raw]) => {
                const val = getFieldValue({ [key]: raw }, key).valor;
                if (!val) return null;
                return (
                  <span key={key} className="inline-flex items-center gap-1 bg-background/60 rounded px-2 py-0.5 border border-border/50">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                    <strong className="text-foreground">{val}</strong>
                  </span>
                );
              })}
              {leadData.resumo_caso && (
                <span className="inline-flex items-center gap-1 bg-background/60 rounded px-2 py-0.5 border border-border/50">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground truncate max-w-md">{leadData.resumo_caso}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Coaching panel with real streams */}
        <div className="flex-1 min-h-0 p-3 flex flex-col gap-2">
          {callStreams.mic ? (
            <CoachingErrorBoundary>
              <RealtimeCoachingPanel
                coach={coach}
                leadNome={leadData?.nome || answeredLeadName}
                leadContext={leadData?.resumo_caso || undefined}
                isRecording={true}
                micStream={callStreams.mic}
                systemStream={callStreams.remote}
                audioMonitor={audioMonitor}
                script={script}
                onTranscriptUpdate={handleTranscriptUpdate}
              />
            </CoachingErrorBoundary>
          ) : (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Conectando áudio...</span>
            </div>
          )}
        </div>

        {/* Backdrop — click outside to close panel */}
        {activePanel && (
          <div className="fixed inset-0 z-30" onClick={() => setActivePanel(null)} />
        )}

        {/* Overlay sidebar — icon bar + sliding panel */}
        <TooltipProvider delayDuration={200}>
          <div className="fixed right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
            {([
              { key: "extrator" as const, icon: FileSearch, label: "Extrator de Dados" },
              { key: "lacunas" as const, icon: HelpCircle, label: "Lacunas" },
              { key: "estimativa" as const, icon: Calculator, label: "Estimativa de Valores" },
            ]).map(({ key, icon: Icon, label }) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActivePanel(prev => prev === key ? null : key)}
                    className={`p-2.5 rounded-full transition-all shadow-md border ${
                      activePanel === key
                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110"
                        : "bg-card/80 backdrop-blur-sm text-foreground border-border/50 hover:bg-card hover:shadow-lg hover:scale-105"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {activePanel && (
            <div className="fixed top-0 bottom-0 right-14 w-1/3 min-w-[320px] max-w-[480px] z-40 bg-background border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="p-4">
                {activePanel === "extrator" && leadData && coach && (
                  <DataExtractorPanel
                    leadId={leadData.id}
                    coachId={coach.id}
                    scriptId={script?.id}
                    transcriptChunks={transcriptChunks}
                    dados={leadDadosSync.dados}
                    dadosLoading={leadDadosSync.loading}
                    setField={leadDadosSync.setField}
                    setFields={leadDadosSync.setFields}
                  />
                )}
                {activePanel === "lacunas" && leadData && coach && (
                  <GapsPanel
                    leadId={leadData.id}
                    coachId={coach.id}
                    scriptId={script?.id}
                    dados={leadDadosSync.dados}
                    dadosLoading={leadDadosSync.loading}
                  />
                )}
                {activePanel === "estimativa" && leadData && (
                  <ValuesEstimationPanel
                    dados={leadDadosSync.dados}
                    loading={leadDadosSync.loading}
                  />
                )}
              </div>
            </div>
          )}
        </TooltipProvider>

        <p className="text-xs text-center text-muted-foreground py-1 shrink-0">
          ⚠️ Não feche esta janela — o áudio da chamada está aqui.
        </p>
      </div>
    );
  }

  // === CALL ACTIVE but no lead_atendido_id yet (brief transitional state) ===
  if (callActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-[480px]">
          <CardContent className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Phone className="h-10 w-10 text-green-500" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              <p className="text-lg font-semibold text-green-600">Conectando...</p>
              <p className="text-2xl font-mono font-bold">{formatDuration(callDuration)}</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant={muted ? "destructive" : "outline"}
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={handleMuteToggle}
              >
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={handleHangup}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              ⚠️ Não feche esta janela — o áudio da chamada está aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Erro ao carregar sessão</p>
            <p className="text-sm text-muted-foreground text-center">Não foi possível conectar à sessão do Power Dialer. Tente novamente.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setFetchError(false); fetchSession(); }}>Tentar novamente</Button>
              <Button variant="outline" onClick={() => window.close()}>Fechar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((status === "iniciando" && !sessionId) || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Iniciando Power Dialer...</p>
            <p className="text-sm text-muted-foreground">Preparando as chamadas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[520px]">
        <CardContent className="py-8 space-y-6">
          {isFinished ? (
            <div className="flex flex-col items-center gap-4">
              <PhoneOff className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {session?.status === "cancelado" ? "Discagem cancelada" : "Nenhum lead atendeu"}
              </p>
              <Button variant="outline" onClick={() => window.close()}>Fechar</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Phone className="h-10 w-10 text-primary" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
                <p className="text-lg font-semibold">Discando...</p>
                <p className="text-sm text-muted-foreground">
                  Lote {loteAtual + 1} de {loteMax} • {totalLeads} leads na fila
                </p>
              </div>

              <Progress value={progressPercent} className="h-2" />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Lote atual — {enrichedLeads.length} chamadas simultâneas</p>
                {enrichedLeads.map((li, i) => {
                  const cfg = STATUS_CONFIG[li.currentStatus] || STATUS_CONFIG.em_andamento;
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm py-2 px-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex-shrink-0">{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{li.leadNome}</p>
                        <p className="text-xs text-muted-foreground">{formatPhoneDisplay(li.numero)}</p>
                        {li.callerId && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-muted-foreground">→ {formatPhoneDisplay(li.callerId)}</span>
                            {li.dddMatch ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                                DDD ✓
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                DDD próx.
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PhoneOff className="h-4 w-4 mr-2" />}
                Cancelar Discagem
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
