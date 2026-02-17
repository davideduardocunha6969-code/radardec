import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateChamada, useUpdateChamada } from "@/hooks/useCrmChamadas";
import { toast } from "sonner";
import type { CrmLead, LeadTelefone } from "@/hooks/useCrmOutbound";

interface VoipDialerProps {
  lead: CrmLead;
  onCallStatusChange?: (status: string) => void;
}

type CallStatus = "idle" | "connecting" | "ringing" | "in-progress" | "completed" | "failed" | "busy" | "no-answer";

const statusLabels: Record<CallStatus, string> = {
  idle: "Pronto",
  connecting: "Conectando...",
  ringing: "Chamando...",
  "in-progress": "Em chamada",
  completed: "Finalizada",
  failed: "Falhou",
  busy: "Ocupado",
  "no-answer": "Sem resposta",
};

const statusColors: Record<CallStatus, string> = {
  idle: "bg-muted text-muted-foreground",
  connecting: "bg-yellow-500/20 text-yellow-700",
  ringing: "bg-blue-500/20 text-blue-700",
  "in-progress": "bg-green-500/20 text-green-700",
  completed: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
  busy: "bg-orange-500/20 text-orange-700",
  "no-answer": "bg-orange-500/20 text-orange-700",
};

export function VoipDialer({ lead, onCallStatusChange }: VoipDialerProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedPhone, setSelectedPhone] = useState<string>(
    lead.telefones[0]?.numero || ""
  );
  const [chamadaId, setChamadaId] = useState<string | null>(null);

  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const createChamada = useCreateChamada();
  const updateChamada = useUpdateChamada();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callRef.current) {
        try { callRef.current.disconnect(); } catch {}
      }
      if (deviceRef.current) {
        try { deviceRef.current.destroy(); } catch {}
      }
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (callStatus === "in-progress") {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [callStatus]);

  // Notify parent of status changes
  useEffect(() => {
    onCallStatusChange?.(callStatus);
  }, [callStatus, onCallStatusChange]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startCall = useCallback(async () => {
    if (!selectedPhone) {
      toast.error("Selecione um telefone para discar");
      return;
    }

    try {
      setCallStatus("connecting");

      // Get Twilio token
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke("twilio-token");

      if (tokenError || !tokenData?.token) {
        throw new Error(tokenError?.message || "Erro ao obter token do Twilio");
      }

      // Dynamic import of Twilio Voice SDK
      const { Device } = await import("@twilio/voice-sdk");

      // Initialize device
      const device = new Device(tokenData.token);

      deviceRef.current = device;

      // Create chamada record
      const chamada = await createChamada.mutateAsync({
        lead_id: lead.id,
        numero_discado: selectedPhone,
      });
      setChamadaId(chamada.id);

      // Connect the call
      const call = await device.connect({
        params: {
          To: selectedPhone,
        },
      });

      callRef.current = call;

      // Call event listeners
      call.on("ringing", () => {
        setCallStatus("ringing");
        updateChamada.mutate({
          id: chamada.id,
          leadId: lead.id,
          status: "discando",
          twilio_call_sid: call.parameters?.CallSid || "",
        });
      });

      call.on("accept", () => {
        setCallStatus("in-progress");
        updateChamada.mutate({
          id: chamada.id,
          leadId: lead.id,
          status: "em_chamada",
          twilio_call_sid: call.parameters?.CallSid || "",
        });
      });

      call.on("disconnect", () => {
        setCallStatus("completed");
        updateChamada.mutate({
          id: chamada.id,
          leadId: lead.id,
          status: "finalizada",
          duracao_segundos: duration,
        });
        cleanupCall();
      });

      call.on("cancel", () => {
        setCallStatus("completed");
        updateChamada.mutate({
          id: chamada.id,
          leadId: lead.id,
          status: "cancelada",
        });
        cleanupCall();
      });

      call.on("reject", () => {
        setCallStatus("busy");
        updateChamada.mutate({
          id: chamada.id,
          leadId: lead.id,
          status: "ocupado",
        });
        cleanupCall();
      });

      call.on("error", (error: any) => {
        console.error("Call error:", error);
        setCallStatus("failed");
        updateChamada.mutate({
          id: chamada.id,
          leadId: lead.id,
          status: "falhou",
        });
        toast.error("Erro na chamada: " + (error.message || "Erro desconhecido"));
        cleanupCall();
      });
    } catch (error: any) {
      console.error("Error starting call:", error);
      setCallStatus("failed");
      toast.error("Erro ao iniciar chamada: " + (error.message || "Erro desconhecido"));

      setTimeout(() => setCallStatus("idle"), 3000);
    }
  }, [selectedPhone, lead.id, createChamada, updateChamada, duration]);

  const cleanupCall = () => {
    callRef.current = null;
    setChamadaId(null);
    setTimeout(() => setCallStatus("idle"), 3000);
  };

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (callRef.current) {
      const newMuted = !isMuted;
      callRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const isInCall = callStatus === "in-progress" || callStatus === "ringing" || callStatus === "connecting";

  return (
    <Card className="border-primary/20">
      <CardContent className="p-3 space-y-3">
        {/* Phone selector */}
        {lead.telefones.length > 1 && callStatus === "idle" && (
          <select
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={selectedPhone}
            onChange={(e) => setSelectedPhone(e.target.value)}
          >
            {lead.telefones.map((t: LeadTelefone, i: number) => (
              <option key={i} value={t.numero}>
                {t.numero} ({t.tipo})
              </option>
            ))}
          </select>
        )}

        {/* Status and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={statusColors[callStatus]}>
              {statusLabels[callStatus]}
            </Badge>
            {callStatus === "in-progress" && (
              <span className="text-sm font-mono text-muted-foreground">
                {formatDuration(duration)}
              </span>
            )}
          </div>

          <div className="flex gap-1">
            {isInCall && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4 text-destructive" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}

            {callStatus === "idle" ? (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={startCall}
                disabled={!selectedPhone}
              >
                <Phone className="h-3.5 w-3.5" />
                Ligar
              </Button>
            ) : isInCall ? (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={endCall}
              >
                <PhoneOff className="h-3.5 w-3.5" />
                Desligar
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
