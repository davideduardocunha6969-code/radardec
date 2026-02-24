import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppCallRecorder } from "@/components/crm/WhatsAppCallRecorder";
import { VoipDialer } from "@/components/crm/VoipDialer";
import { RealtimeCoachingPanel } from "@/components/crm/RealtimeCoachingPanel";
import { CoachingErrorBoundary } from "@/components/crm/coaching/CoachingErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Phone, User, MapPin, FileText, Loader2 } from "lucide-react";
import type { RoboCoach } from "@/hooks/useRobosCoach";
import type { LeadTelefone } from "@/hooks/useCrmOutbound";
import logoEscritorio from "@/assets/logo-escritorio.webp";

interface LeadData {
  id: string;
  nome: string;
  endereco: string | null;
  resumo_caso: string | null;
  telefones: LeadTelefone[];
  coluna_id: string;
  dados_extras: Record<string, string> | null;
}

export default function Atendimento() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId") || "";
  const numero = searchParams.get("numero") || "";
  const tipo = searchParams.get("tipo") || "whatsapp";
  const funilId = searchParams.get("funilId") || "";

  const [lead, setLead] = useState<LeadData | null>(null);
  const [coach, setCoach] = useState<RoboCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRecording, setActiveRecording] = useState(false);
  const [activeAudioStream, setActiveAudioStream] = useState<MediaStream | null>(null);

  const [showCloseWarning, setShowCloseWarning] = useState(false);

  const handleRecordingStateChange = useCallback((isRecording: boolean, stream: MediaStream | null) => {
    setActiveRecording(isRecording);
    setActiveAudioStream(stream);
  }, []);

  // Wait for auth session to be restored from localStorage
  useEffect(() => {
    // Listen for auth state changes FIRST — this is the authoritative source
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });

    // Then check for existing session; if found, use it immediately
    // If not found, DON'T mark authChecked yet — wait for onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setAuthChecked(true);
      }
    });

    // Fallback timeout: if after 3s neither callback fired, mark as checked
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
          .select("id, nome, endereco, resumo_caso, telefones, coluna_id, dados_extras")
          .eq("id", leadId)
          .single();

        if (!leadData) return;
        setLead(leadData as unknown as LeadData);

        // Fetch column to get coach
        const { data: colunaData } = await supabase
          .from("crm_colunas")
          .select("robo_coach_id, robo_coach_closer_id")
          .eq("id", leadData.coluna_id)
          .single();

        const coachId = colunaData?.robo_coach_id || colunaData?.robo_coach_closer_id;
        if (coachId) {
          const { data: coachData } = await supabase
            .from("robos_coach")
            .select("*")
            .eq("id", coachId)
            .single();
          if (coachData) setCoach(coachData as unknown as RoboCoach);
        }
      } catch (e) {
        console.error("[Atendimento] Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [leadId, isAuthenticated]);

  // Block window close while recording
  useEffect(() => {
    if (!activeRecording) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Você tem uma chamada em andamento. Deseja encerrar?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeRecording]);

  // Update window title
  useEffect(() => {
    if (lead) {
      document.title = `Atendimento — ${lead.nome}`;
    }
    return () => { document.title = "RadarDEC"; };
  }, [lead]);

  // Auth guard: wait for check, then redirect if not authenticated
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
      {/* Header — azul marinho escuro */}
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
        {/* Call controls — compact */}
        <div className="shrink-0 flex justify-end">
          <div className="w-fit">
            {tipo === "whatsapp" ? (
              <WhatsAppCallRecorder
                leadId={lead.id}
                leadNome={lead.nome}
                numero={numero}
                onRecordingStateChange={handleRecordingStateChange}
              />
            ) : (
              <VoipDialer
                leadId={lead.id}
                leadNome={lead.nome}
                numero={numero}
                onRecordingStateChange={handleRecordingStateChange}
              />
            )}
          </div>
        </div>

        {/* Coaching panel */}
        {activeRecording && coach && (
          <div className="flex-1 min-h-0">
            <CoachingErrorBoundary>
              <RealtimeCoachingPanel
                coach={coach}
                leadNome={lead.nome}
                leadContext={lead.resumo_caso || undefined}
                isRecording={activeRecording}
                audioStream={activeAudioStream}
              />
            </CoachingErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
