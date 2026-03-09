import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateChamada, useUpdateChamada } from "@/hooks/useCrmChamadas";
import { toast } from "sonner";


interface VoipDialerProps {
  leadId: string;
  leadNome: string;
  numero: string;
  papel?: string;
  onCallStatusChange?: (status: string) => void;
  onRecordingStateChange?: (isRecording: boolean, streams: { micStream: MediaStream | null; systemStream: MediaStream | null; mixedStream: MediaStream | null }) => void;
  stopRef?: React.MutableRefObject<(() => void) | null>;
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

export function VoipDialer({ leadId, leadNome, numero, papel, onCallStatusChange, onRecordingStateChange, stopRef }: VoipDialerProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [chamadaId, setChamadaId] = useState<string | null>(null);

  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const createChamada = useCreateChamada();
  const updateChamada = useUpdateChamada();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
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
    if (!numero) {
      toast.error("Telefone não informado");
      return;
    }

    try {
      setCallStatus("connecting");

      console.log("[VoIP] Requesting Twilio token...");
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke("twilio-token");

      if (tokenError || !tokenData?.token) {
        console.error("[VoIP] Token error:", tokenError, tokenData);
        throw new Error(tokenError?.message || "Erro ao obter token do Twilio");
      }
      console.log("[VoIP] Token received, initializing device...");

      const { Device } = await import("@twilio/voice-sdk");
      const device = new Device(tokenData.token, {
        logLevel: 1,
      });
      deviceRef.current = device;

      // Wait for device to be registered
      await new Promise<void>((resolve, reject) => {
        device.on("registered", () => {
          console.log("[VoIP] Device registered");
          resolve();
        });
        device.on("error", (err: any) => {
          console.error("[VoIP] Device error:", err);
          reject(err);
        });
        device.register();
      });

      console.log("[VoIP] Creating chamada record...");
      const chamada = await createChamada.mutateAsync({
        lead_id: leadId,
        numero_discado: numero,
        papel,
      });
      setChamadaId(chamada.id);

      // Format number for Brazil
      const cleanDigits = numero.replace(/\D/g, "");
      const withoutCountry = cleanDigits.startsWith("55") && cleanDigits.length > 11
        ? cleanDigits.slice(2)
        : cleanDigits;
      const formattedNumber = `+55${withoutCountry}`;
      console.log("[VoIP] Connecting to:", formattedNumber);

      const call = await device.connect({
        params: { To: formattedNumber },
      });

      callRef.current = call;

      call.on("ringing", () => {
        setCallStatus("ringing");
        updateChamada.mutate({ id: chamada.id, leadId, status: "discando", twilio_call_sid: call.parameters?.CallSid || "" });
      });

      call.on("accept", async () => {
        setCallStatus("in-progress");
        const callSid = call.parameters?.CallSid || "";
        updateChamada.mutate({ id: chamada.id, leadId, status: "em_chamada", twilio_call_sid: callSid });

        // Start Twilio server-side recording only now that the call is answered
        if (callSid) {
          try {
            console.log("[VoIP] Starting server-side recording for answered call:", callSid);
            await supabase.functions.invoke("twilio-webhook", {
              body: { action: "start-recording", callSid },
            });
          } catch (e) {
            console.warn("[VoIP] Failed to start recording:", e);
          }
        }

        // Capture audio streams for live transcription
        let micStream: MediaStream | null = null;
        let remoteStream: MediaStream | null = null;
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          micStreamRef.current = micStream;
          console.log("[VoIP] Mic stream captured for transcription");
        } catch (e) {
          console.warn("[VoIP] Failed to capture mic stream:", e);
        }
        try {
          remoteStream = (call as any).getRemoteStream?.() || null;
          console.log("[VoIP] Remote stream:", remoteStream ? "captured" : "not available");
        } catch (e) {
          console.warn("[VoIP] Failed to get remote stream:", e);
        }

        onRecordingStateChange?.(true, { micStream, systemStream: remoteStream, mixedStream: null });
      });

      const stopMicStream = () => {
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(t => t.stop());
          micStreamRef.current = null;
        }
      };

      call.on("disconnect", () => {
        setCallStatus("completed");
        updateChamada.mutate({ id: chamada.id, leadId, status: "finalizada", duracao_segundos: duration });
        stopMicStream();
        onRecordingStateChange?.(false, { micStream: null, systemStream: null, mixedStream: null });
        cleanupCall();
      });

      call.on("cancel", () => {
        setCallStatus("completed");
        updateChamada.mutate({ id: chamada.id, leadId, status: "cancelada" });
        stopMicStream();
        onRecordingStateChange?.(false, { micStream: null, systemStream: null, mixedStream: null });
        cleanupCall();
      });

      call.on("reject", () => {
        setCallStatus("busy");
        updateChamada.mutate({ id: chamada.id, leadId, status: "ocupado" });
        stopMicStream();
        onRecordingStateChange?.(false, { micStream: null, systemStream: null, mixedStream: null });
        cleanupCall();
      });

      call.on("error", (error: any) => {
        console.error("Call error:", error);
        setCallStatus("failed");
        updateChamada.mutate({ id: chamada.id, leadId, status: "falhou" });
        stopMicStream();
        onRecordingStateChange?.(false, { micStream: null, systemStream: null, mixedStream: null });
        toast.error("Erro na chamada: " + (error.message || "Erro desconhecido"));
        cleanupCall();
      });
    } catch (error: any) {
      console.error("Error starting call:", error);
      setCallStatus("failed");
      toast.error("Erro ao iniciar chamada: " + (error.message || "Erro desconhecido"));
      setTimeout(() => setCallStatus("idle"), 3000);
    }
  }, [numero, leadId, createChamada, updateChamada, duration]);

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

  // Expose stop function to parent via ref
  useEffect(() => {
    if (stopRef) {
      stopRef.current = (callStatus === "in-progress" || callStatus === "ringing") ? endCall : null;
    }
  }, [callStatus, stopRef, endCall]);

  const toggleMute = useCallback(() => {
    if (callRef.current) {
      const newMuted = !isMuted;
      callRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const isInCall = callStatus === "in-progress" || callStatus === "ringing" || callStatus === "connecting";

  if (callStatus === "idle") {
    return (
      <Button
        size="sm"
        className="gap-1.5"
        onClick={startCall}
        disabled={!numero}
      >
        <Phone className="h-3.5 w-3.5" />
        Ligar
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-3 space-y-3">
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

            {isInCall ? (
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
