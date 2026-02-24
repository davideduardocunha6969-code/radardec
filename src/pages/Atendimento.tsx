import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppCallRecorder } from "@/components/crm/WhatsAppCallRecorder";
import { VoipDialer } from "@/components/crm/VoipDialer";
import { RealtimeCoachingPanel } from "@/components/crm/RealtimeCoachingPanel";
import { CoachingErrorBoundary } from "@/components/crm/coaching/CoachingErrorBoundary";
import { Badge } from "@/components/ui/badge";
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

  const handleRecordingStateChange = useCallback((isRecording: boolean, stream: MediaStream | null) => {
    setActiveRecording(isRecording);
    setActiveAudioStream(stream);
  }, []);

  // Wait for auth session to be restored from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
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
  }, [leadId]);

  // Update window title
  useEffect(() => {
    if (lead) {
      document.title = `Atendimento — ${lead.nome}`;
    }
    return () => { document.title = "RadarDEC"; };
  }, [lead]);

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
      {/* Compact header */}
      <header className="border-b bg-card px-4 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoEscritorio} alt="Logo" className="h-7" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{lead.nome}</span>
            </div>
            {lead.endereco && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {numero}
            </div>
          </div>
        </div>
      </header>

      {/* Lead context bar */}
      {(lead.resumo_caso || lead.dados_extras) && (
        <div className="border-b bg-muted/30 px-4 py-1.5 shrink-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground overflow-x-auto">
            {(lead.dados_extras as Record<string, string>)?.empresa && (
              <span>Empresa: <strong className="text-foreground">{(lead.dados_extras as Record<string, string>).empresa}</strong></span>
            )}
            {(lead.dados_extras as Record<string, string>)?.cargo && (
              <span>Cargo: <strong className="text-foreground">{(lead.dados_extras as Record<string, string>).cargo}</strong></span>
            )}
            {(lead.dados_extras as Record<string, string>)?.data_admissao && (
              <span>Admissão: {(lead.dados_extras as Record<string, string>).data_admissao}</span>
            )}
            {(lead.dados_extras as Record<string, string>)?.data_demissao && (
              <span>Demissão: {(lead.dados_extras as Record<string, string>).data_demissao}</span>
            )}
            {lead.resumo_caso && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span className="truncate max-w-xs">{lead.resumo_caso}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 p-4 flex flex-col gap-3">
        {/* Call controls */}
        <div className="shrink-0">
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
