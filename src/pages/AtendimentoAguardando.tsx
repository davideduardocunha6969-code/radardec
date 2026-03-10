import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, PhoneOff, AlertCircle, Mic, MicOff, Clock, PhoneCall, PhoneMissed, X } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Device } from "@twilio/voice-sdk";
import type { Call } from "@twilio/voice-sdk";

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
  const atendimentoWindowRef = useRef<Window | null>(null);
  const [answeredLeadName, setAnsweredLeadName] = useState("");
  const [showOpenButton, setShowOpenButton] = useState(false);
  const [atendimentoUrl, setAtendimentoUrl] = useState("");

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

  // When session gets lead_atendido_id AND call is active → prepare atendimento button
  useEffect(() => {
    if (!session?.lead_atendido_id || !callActive) return;

    const leadsInfo = (session.leads_info || []) as LeadInfo[];
    const answeredLead = leadsInfo.find(l => l.leadId === session.lead_atendido_id);
    setAnsweredLeadName(answeredLead?.leadNome || "Lead");

    // Notify via BroadcastChannel
    broadcastRef.current?.postMessage({
      type: "call-active",
      leadId: session.lead_atendido_id,
      numero: session.telefone_atendido || "",
    });

    // Prepare URL but don't open automatically (popup blockers block non-user-gesture opens)
    const url = `/atendimento?leadId=${session.lead_atendido_id}&numero=${encodeURIComponent(session.telefone_atendido || "")}&tipo=voip&funilId=${session.funil_id}&papel=${session.papel}&powerDialerMode=true`;
    setAtendimentoUrl(url);
    setShowOpenButton(true);
  }, [session?.lead_atendido_id, callActive]);

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

  // === AUDIO BRIDGE MODE — call is active, show controls ===
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
              <p className="text-lg font-semibold text-green-600">Em chamada</p>
              <p className="text-sm text-muted-foreground">{answeredLeadName}</p>
              <p className="text-2xl font-mono font-bold">{formatDuration(callDuration)}</p>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant={muted ? "destructive" : "outline"}
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={handleMuteToggle}
                title={muted ? "Desmutar" : "Mutar"}
              >
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={handleHangup}
                title="Desligar"
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
