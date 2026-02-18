import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  PhoneOff,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Mic,
  Volume2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateChamada, useUpdateChamada } from "@/hooks/useCrmChamadas";
import { toast } from "sonner";

interface WhatsAppAICallButtonProps {
  leadId: string;
  leadNome: string;
  numero: string;
}

type AICallStatus = "idle" | "connecting" | "active" | "done" | "error";

const formatPhone = (numero: string): string => {
  const digits = numero.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
};

export function WhatsAppAICallButton({ leadId, leadNome, numero }: WhatsAppAICallButtonProps) {
  const [aiStatus, setAiStatus] = useState<AICallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [chamadaId, setChamadaId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  // Use refs to avoid stale closures in callbacks
  const aiStatusRef = useRef<AICallStatus>("idle");
  const chamadaIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(0);

  const createChamada = useCreateChamada();
  const updateChamada = useUpdateChamada();

  const updateStatus = useCallback((newStatus: AICallStatus) => {
    aiStatusRef.current = newStatus;
    setAiStatus(newStatus);
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[AI WhatsApp] ✅ Connected to ElevenLabs agent");
      updateStatus("active");
      // Start timer
      durationRef.current = 0;
      setDuration(0);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(d => d + 1);
      }, 1000);
      toast.success("IA conectada! Agora inicie a ligação no WhatsApp e coloque no viva-voz.");
    },
    onDisconnect: () => {
      console.log("[AI WhatsApp] Disconnected. Status was:", aiStatusRef.current);
      // Only transition to "done" if we were actually active
      if (aiStatusRef.current === "active") {
        updateStatus("done");
        if (chamadaIdRef.current) {
          updateChamada.mutate({
            id: chamadaIdRef.current,
            leadId,
            status: "finalizada",
            duracao_segundos: durationRef.current,
          });
        }
      }
      // Clean up timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    onError: (err) => {
      console.error("[AI WhatsApp] ❌ Error:", err);
      setError(typeof err === "string" ? err : "Erro na conexão com o agente IA. Verifique se o agente está configurado corretamente no ElevenLabs.");
      updateStatus("error");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    onMessage: (message) => {
      console.log("[AI WhatsApp] Message:", message);
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startAICall = useCallback(async () => {
    if (!numero) {
      toast.error("Telefone não informado");
      return;
    }
    setError(null);
    updateStatus("connecting");

    try {
      // 1. Request microphone permission first
      console.log("[AI WhatsApp] Requesting microphone...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[AI WhatsApp] Microphone granted");

      // 2. Get conversation token from edge function
      console.log("[AI WhatsApp] Getting conversation token...");
      const { data, error: fnError } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );
      
      if (fnError) {
        console.error("[AI WhatsApp] Token error:", fnError);
        throw new Error(fnError.message || "Erro ao obter token do agente IA");
      }
      
      if (!data?.token) {
        console.error("[AI WhatsApp] No token in response:", data);
        throw new Error(data?.error || "Token não recebido do agente IA");
      }

      console.log("[AI WhatsApp] Token received, agent_id:", data.agent_id);

      // 3. Create chamada record
      const chamada = await createChamada.mutateAsync({
        lead_id: leadId,
        numero_discado: numero,
        canal: "whatsapp",
      });
      setChamadaId(chamada.id);
      chamadaIdRef.current = chamada.id;
      updateChamada.mutate({ id: chamada.id, leadId, status: "em_chamada" });

      // 4. Start ElevenLabs conversation via WebRTC
      console.log("[AI WhatsApp] Starting ElevenLabs session...");
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
      console.log("[AI WhatsApp] Session started successfully");

      // 5. Open WhatsApp - do this AFTER agent is connecting
      const formattedPhone = formatPhone(numero);
      const waUrl = `whatsapp://send?phone=${formattedPhone}`;
      try {
        (window.top || window).location.assign(waUrl);
      } catch {
        window.location.assign(waUrl);
      }
    } catch (err: any) {
      console.error("[AI WhatsApp] Error starting:", err);
      updateStatus("error");
      if (err.name === "NotAllowedError") {
        setError("Permissão de microfone negada. Permita o acesso ao microfone.");
      } else {
        setError(err.message || "Erro ao iniciar chamada IA");
      }
    }
  }, [numero, leadId, leadNome, conversation, createChamada, updateChamada, updateStatus]);

  const stopAICall = useCallback(async () => {
    console.log("[AI WhatsApp] Stopping...");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await conversation.endSession();
    updateStatus("done");
    if (chamadaIdRef.current) {
      updateChamada.mutate({
        id: chamadaIdRef.current,
        leadId,
        status: "finalizada",
        duracao_segundos: durationRef.current,
      });
    }
  }, [conversation, leadId, updateChamada, updateStatus]);

  if (aiStatus === "connecting") {
    return (
      <Button size="sm" disabled className="gap-1.5 bg-purple-600 text-white">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Conectando IA...
      </Button>
    );
  }

  if (aiStatus === "done") {
    return (
      <Card className="border-purple-500/20">
        <CardContent className="flex items-center gap-3 p-3">
          <CheckCircle2 className="h-5 w-5 text-purple-600" />
          <span className="text-sm">Chamada IA finalizada!</span>
          <Button variant="outline" size="sm" onClick={() => { updateStatus("idle"); setChamadaId(null); chamadaIdRef.current = null; }} className="ml-auto">
            Nova chamada
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (aiStatus === "error") {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-3 space-y-2">
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={() => { updateStatus("idle"); setError(null); }}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (aiStatus === "active") {
    return (
      <Card className="border-purple-500/20">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="h-3 w-3 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xl font-mono font-bold">{formatTime(duration)}</span>
            <Badge variant="outline" className="text-[10px]">
              {conversation.isSpeaking ? "🗣️ IA Falando" : "👂 Ouvindo"}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Mic className="h-3.5 w-3.5" />
              <span className="w-20">Microfone</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">Captando áudio</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Volume2 className="h-3.5 w-3.5" />
              <span className="w-20">Agente IA</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">Respondendo pelo alto-falante</span>
            </div>
          </div>

          <Alert className="py-2 border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-700">
              <strong>Importante:</strong> Coloque o WhatsApp no <strong>viva-voz</strong> para que a IA escute o lead e o lead escute a IA.
            </AlertDescription>
          </Alert>

          <Button variant="destructive" size="sm" className="gap-1 w-full" onClick={stopAICall}>
            <PhoneOff className="h-3.5 w-3.5" />
            Encerrar IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  // idle
  return (
    <Button
      size="sm"
      className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
      onClick={startAICall}
      disabled={!numero}
    >
      <Bot className="h-3.5 w-3.5" />
      IA WhatsApp
    </Button>
  );
}
