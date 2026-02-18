import { useState, useCallback } from "react";
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

  const createChamada = useCreateChamada();
  const updateChamada = useUpdateChamada();

  const conversation = useConversation({
    onConnect: () => {
      console.log("[AI WhatsApp] Connected to ElevenLabs agent");
      setAiStatus("active");
      toast.success("IA conectada! Inicie a ligação no WhatsApp.");
    },
    onDisconnect: () => {
      console.log("[AI WhatsApp] Disconnected from agent");
      if (aiStatus === "active") {
        setAiStatus("done");
        if (chamadaId) {
          updateChamada.mutate({
            id: chamadaId,
            leadId,
            status: "finalizada",
          });
        }
      }
    },
    onError: (err) => {
      console.error("[AI WhatsApp] Error:", err);
      setError("Erro na conexão com o agente IA");
      setAiStatus("error");
    },
    onMessage: (message) => {
      console.log("[AI WhatsApp] Message:", message);
    },
  });

  const startAICall = useCallback(async () => {
    if (!numero) {
      toast.error("Telefone não informado");
      return;
    }
    setError(null);
    setAiStatus("connecting");

    try {
      // 1. Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Get conversation token from edge function
      const { data, error: fnError } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );
      if (fnError || !data?.token) {
        throw new Error(fnError?.message || "Não foi possível obter token do agente IA");
      }

      // 3. Create chamada record
      const chamada = await createChamada.mutateAsync({
        lead_id: leadId,
        numero_discado: numero,
        canal: "whatsapp",
      });
      setChamadaId(chamada.id);
      updateChamada.mutate({ id: chamada.id, leadId, status: "em_chamada" });

      // 4. Start ElevenLabs conversation via WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      // 5. Open WhatsApp call
      const formattedPhone = formatPhone(numero);
      const waUrl = `whatsapp://send?phone=${formattedPhone}`;
      try {
        (window.top || window).location.assign(waUrl);
      } catch {
        window.location.assign(waUrl);
      }
    } catch (err: any) {
      console.error("[AI WhatsApp] Error starting:", err);
      setAiStatus("error");
      if (err.name === "NotAllowedError") {
        setError("Permissão de microfone negada. Permita o acesso ao microfone.");
      } else {
        setError(err.message || "Erro ao iniciar chamada IA");
      }
    }
  }, [numero, leadId, leadNome, conversation, createChamada, updateChamada]);

  const stopAICall = useCallback(async () => {
    await conversation.endSession();
    setAiStatus("done");
    if (chamadaId) {
      updateChamada.mutate({ id: chamadaId, leadId, status: "finalizada" });
    }
  }, [conversation, chamadaId, leadId, updateChamada]);

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
          <Button variant="outline" size="sm" onClick={() => setAiStatus("idle")} className="ml-auto">
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
          <Button variant="outline" size="sm" onClick={() => setAiStatus("idle")}>
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
            <span className="text-sm font-medium">IA Ativa</span>
            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700">
              {conversation.isSpeaking ? "Falando..." : "Ouvindo..."}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Mic className="h-3.5 w-3.5" />
              <span className="w-16">Microfone</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Volume2 className="h-3.5 w-3.5" />
              <span className="w-16">Agente IA</span>
              {conversation.isSpeaking ? (
                <Badge variant="outline" className="text-[10px] bg-purple-500/10">Falando</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-muted">Aguardando</Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Inicie a ligação no WhatsApp. A IA escuta pelo microfone e responde pelo alto-falante.
          </p>

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
