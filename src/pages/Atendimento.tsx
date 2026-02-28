import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppCallRecorder, type AudioStreamsInfo } from "@/components/crm/WhatsAppCallRecorder";
import { VoipDialer } from "@/components/crm/VoipDialer";
import { RealtimeCoachingPanel, type AudioMonitorInfo, type LabeledTranscript } from "@/components/crm/RealtimeCoachingPanel";
import { CoachingErrorBoundary } from "@/components/crm/coaching/CoachingErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Phone, User, MapPin, FileText, Loader2, FileSearch, HelpCircle, Calculator } from "lucide-react";
import { GapsPanel } from "@/components/crm/lacunas/GapsPanel";
import { DataExtractorPanel } from "@/components/crm/extrator/DataExtractorPanel";
import { ValuesEstimationPanel } from "@/components/crm/estimativa/ValuesEstimationPanel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLeadDadosSync } from "@/hooks/useLeadDadosSync";
import type { RoboCoach } from "@/hooks/useRobosCoach";
import type { LeadTelefone } from "@/hooks/useCrmOutbound";
import type { ScriptSdr } from "@/hooks/useScriptsSdr";
import logoEscritorio from "@/assets/logo-escritorio.webp";

interface LeadData {
  id: string;
  nome: string;
  endereco: string | null;
  resumo_caso: string | null;
  telefones: LeadTelefone[];
  coluna_id: string;
  funil_id: string;
  dados_extras: Record<string, string> | null;
}

export default function Atendimento() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId") || "";
  const numero = searchParams.get("numero") || "";
  const tipo = searchParams.get("tipo") || "whatsapp";
  const funilId = searchParams.get("funilId") || "";
  const papel = searchParams.get("papel") || "sdr";

  const [lead, setLead] = useState<LeadData | null>(null);
  const [coach, setCoach] = useState<RoboCoach | null>(null);
  const [script, setScript] = useState<ScriptSdr | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRecording, setActiveRecording] = useState(false);
  const [audioStreams, setAudioStreams] = useState<AudioStreamsInfo>({ micStream: null, systemStream: null, mixedStream: null });

  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [audioMonitor, setAudioMonitor] = useState<AudioMonitorInfo | undefined>(undefined);
  const [activePanel, setActivePanel] = useState<"extrator" | "lacunas" | "estimativa" | null>(null);
  const [transcriptChunks, setTranscriptChunks] = useState<LabeledTranscript[]>([]);
  const stopCallRef = useRef<(() => void) | null>(null);

  // Single source of truth for lead dados — shared across all 3 panels
  const leadDadosSync = useLeadDadosSync(lead?.id ?? null);

  const handleRecordingStateChange = useCallback((isRecording: boolean, streams: AudioStreamsInfo) => {
    setActiveRecording(isRecording);
    setAudioStreams(streams);
    if (!isRecording) setAudioMonitor(undefined);
  }, []);

  const handleAudioMonitorUpdate = useCallback((info: AudioMonitorInfo) => {
    setAudioMonitor(info);
  }, []);

  const handleTranscriptUpdate = useCallback((transcripts: LabeledTranscript[]) => {
    setTranscriptChunks(transcripts);
  }, []);

  // Wait for auth session to be restored from localStorage
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setAuthChecked(true);
      }
    });

    const timeout = setTimeout(() => {
      setAuthChecked(true);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!leadId || !isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch lead
        const { data: leadData } = await supabase
          .from("crm_leads")
          .select("id, nome, endereco, resumo_caso, telefones, coluna_id, funil_id, dados_extras")
          .eq("id", leadId)
          .single();

        if (!leadData) return;
        setLead(leadData as unknown as LeadData);

        // Fetch funnel to get coach and script based on papel
        const resolvedFunilId = funilId || leadData.funil_id;
        if (resolvedFunilId) {
          const { data: funilData } = await supabase
            .from("crm_funis")
            .select("robo_coach_sdr_id, robo_coach_closer_id, script_sdr_id, script_closer_id")
            .eq("id", resolvedFunilId)
            .single();

          if (funilData) {
            // Get coach based on papel
            const coachId = papel === "closer" ? funilData.robo_coach_closer_id : funilData.robo_coach_sdr_id;
            if (coachId) {
              const { data: coachData } = await supabase
                .from("robos_coach")
                .select("*")
                .eq("id", coachId)
                .single();
              if (coachData) setCoach(coachData as unknown as RoboCoach);
            }

            // Get script based on papel
            const scriptId = papel === "closer" ? funilData.script_closer_id : funilData.script_sdr_id;
            if (scriptId) {
              const { data: scriptData } = await supabase
                .from("scripts_sdr")
                .select("*")
                .eq("id", scriptId)
                .single();
              if (scriptData) {
                const s = scriptData as unknown as ScriptSdr;
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
        console.error("[Atendimento] Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [leadId, isAuthenticated, funilId, papel]);

  // Auto-stop call on page close
  useEffect(() => {
    if (!activeRecording) return;
    const handlePageHide = () => {
      if (stopCallRef.current) {
        stopCallRef.current();
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [activeRecording]);

  // Update window title
  useEffect(() => {
    if (lead) {
      document.title = `Atendimento — ${lead.nome}`;
    }
    return () => { document.title = "RadarDEC"; };
  }, [lead]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Lead não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="gradient-primary px-4 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoEscritorio} alt="Logo" className="h-7" />
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-white/70" />
              <span className="font-semibold text-sm text-white">{lead.nome}</span>
            </div>
            {lead.endereco && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <MapPin className="h-3 w-3" />
                {lead.endereco}
              </div>
            )}
            <Badge variant="outline" className="text-xs text-white/80 border-white/30">
              {papel === "closer" ? "Closer" : "SDR"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {activeRecording && (
              <Badge className="bg-red-500 text-white animate-pulse gap-1">
                <span className="h-2 w-2 rounded-full bg-white" />
                Gravando
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-white/60">
              <Phone className="h-3 w-3" />
              {numero}
            </div>
          </div>
        </div>
      </header>

      {/* Lead context bar */}
      {(lead.resumo_caso || lead.dados_extras) && (
        <div className="border-b bg-muted/30 px-4 py-2 shrink-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {Object.entries((lead.dados_extras as Record<string, string>) || {}).map(([key, value]) => (
              value ? (
                <span key={key} className="inline-flex items-center gap-1 bg-background/60 rounded px-2 py-0.5 border border-border/50">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                  <strong className="text-foreground">{value}</strong>
                </span>
              ) : null
            ))}
            {lead.resumo_caso && (
              <span className="inline-flex items-center gap-1 bg-background/60 rounded px-2 py-0.5 border border-border/50">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground truncate max-w-md">{lead.resumo_caso}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 p-3 flex flex-col gap-2">
        {/* Top row: Transcription (left) + Call controls (right) */}
        <div className="shrink-0 flex gap-2 items-start">
          {activeRecording && coach && (
            <div className="flex-1 min-w-0">
              <CoachingErrorBoundary>
                <RealtimeCoachingPanel
                  coach={coach}
                  leadNome={lead.nome}
                  leadContext={lead.resumo_caso || undefined}
                  isRecording={activeRecording}
                  micStream={audioStreams.micStream}
                  systemStream={audioStreams.systemStream}
                  topBarOnly
                  audioMonitor={audioMonitor}
                  script={script}
                  onTranscriptUpdate={handleTranscriptUpdate}
                />
              </CoachingErrorBoundary>
            </div>
          )}
          <div className="w-fit shrink-0">
            {tipo === "whatsapp" ? (
              <WhatsAppCallRecorder
                leadId={lead.id}
                leadNome={lead.nome}
                numero={numero}
                papel={papel}
                onRecordingStateChange={handleRecordingStateChange}
                onAudioMonitorUpdate={handleAudioMonitorUpdate}
                stopRef={stopCallRef}
              />
            ) : (
              <VoipDialer
                leadId={lead.id}
                leadNome={lead.nome}
                numero={numero}
                papel={papel}
                onRecordingStateChange={handleRecordingStateChange}
                stopRef={stopCallRef}
              />
            )}
          </div>
        </div>

        {/* Coaching panel — script cards below */}
        {activeRecording && coach && (
          <div className="flex-1 min-h-0">
            <CoachingErrorBoundary>
              <RealtimeCoachingPanel
                coach={coach}
                leadNome={lead.nome}
                leadContext={lead.resumo_caso || undefined}
                  isRecording={activeRecording}
                  micStream={audioStreams.micStream}
                  systemStream={audioStreams.systemStream}
                  bottomOnly
                  script={script}
              />
            </CoachingErrorBoundary>
          </div>
        )}
      </div>

      {/* Backdrop — click outside to close */}
      {activePanel && (
        <div className="fixed inset-0 z-30" onClick={() => setActivePanel(null)} />
      )}

      {/* Overlay sidebar — icon bar + sliding panel */}
      <TooltipProvider delayDuration={200}>
        {/* Icon bar */}
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

        {/* Sliding overlay panel */}
        {activePanel && (
          <div className="fixed top-0 bottom-0 right-14 w-1/3 min-w-[320px] max-w-[480px] z-40 bg-background border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-4">
              {activePanel === "extrator" && lead && coach && (
                <DataExtractorPanel
                  leadId={lead.id}
                  coachId={coach.id}
                  transcriptChunks={transcriptChunks}
                  dados={leadDadosSync.dados}
                  dadosLoading={leadDadosSync.loading}
                  setField={leadDadosSync.setField}
                  setFields={leadDadosSync.setFields}
                />
              )}
              {activePanel === "lacunas" && lead && coach && (
                <GapsPanel
                  leadId={lead.id}
                  coachId={coach.id}
                  dados={leadDadosSync.dados}
                  dadosLoading={leadDadosSync.loading}
                />
              )}
              {activePanel === "estimativa" && lead && (
                <ValuesEstimationPanel
                  dados={leadDadosSync.dados}
                  loading={leadDadosSync.loading}
                />
              )}
            </div>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}
