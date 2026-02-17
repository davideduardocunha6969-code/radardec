import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Square,
  Pause,
  Play,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useCreateChamada, useUpdateChamada } from "@/hooks/useCrmChamadas";
import { toast } from "sonner";
import type { LeadTelefone } from "@/hooks/useCrmOutbound";

interface WhatsAppCallRecorderProps {
  leadId: string;
  leadNome: string;
  telefones: LeadTelefone[];
}

type RecordingStatus = "idle" | "recording" | "paused" | "processing" | "done" | "error";

const formatPhone = (numero: string): string => {
  // Strip non-digits
  const digits = numero.replace(/\D/g, "");
  // Add country code if missing
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
};

export function WhatsAppCallRecorder({ leadId, leadNome, telefones }: WhatsAppCallRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [hasSystemAudio, setHasSystemAudio] = useState(false);
  const [hasMicAudio, setHasMicAudio] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
  const [selectedPhone, setSelectedPhone] = useState(telefones[0]?.numero || "");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const systemAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const chamadaIdRef = useRef<string | null>(null);

  const createChamada = useCreateChamada();
  const updateChamada = useUpdateChamada();

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const updateLevels = useCallback(() => {
    if (micAnalyserRef.current) {
      const data = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
      micAnalyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;
      setMicLevel(Math.min(100, (avg / 128) * 100));
    }
    if (systemAnalyserRef.current) {
      const data = new Uint8Array(systemAnalyserRef.current.frequencyBinCount);
      systemAnalyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;
      setSystemLevel(Math.min(100, (avg / 128) * 100));
    }
    animationFrameRef.current = requestAnimationFrame(updateLevels);
  }, []);

  const stopAllStreams = useCallback(() => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    stopAllStreams();
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
  }, [stopAllStreams]);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, durationSecs: number) => {
    setStatus("processing");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Upload audio
      const fileName = `whatsapp_${leadId}_${Date.now()}.webm`;
      const { error: uploadErr } = await supabase.storage
        .from("atendimentos-audio")
        .upload(fileName, audioBlob, { contentType: "audio/webm" });
      if (uploadErr) throw uploadErr;

      // Update chamada record
      if (chamadaIdRef.current) {
        updateChamada.mutate({
          id: chamadaIdRef.current,
          leadId,
          status: "finalizada",
          duracao_segundos: durationSecs,
          audio_url: fileName,
        });
      }

      // Transcribe with speaker names
      const { data: userData } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userData.user?.id || "")
        .single();
      const userName = profileData?.display_name || "Operador";

      const { data: transcData, error: transcErr } = await supabase.functions.invoke("transcribe-voice", {
        body: {
          audioUrl: fileName,
          bucketName: "atendimentos-audio",
          speakerNames: {
            "speaker_0": userName,
            "speaker_1": leadNome,
            "0": userName,
            "1": leadNome,
          },
        },
      });

      if (transcErr) {
        console.error("Transcription error:", transcErr);
        toast.error("Gravação salva, mas houve erro na transcrição.");
      } else if (chamadaIdRef.current) {
        updateChamada.mutate({
          id: chamadaIdRef.current,
          leadId,
          transcricao: transcData?.text || "",
        });
        toast.success("Gravação transcrita com sucesso!");
      }

      setStatus("done");
      chamadaIdRef.current = null;
    } catch (err: any) {
      console.error("Error processing recording:", err);
      toast.error("Erro ao processar gravação: " + (err.message || ""));
      setStatus("error");
      setError(err.message);
    }
  }, [leadId, updateChamada]);

  const startWhatsAppCall = async () => {
    if (!selectedPhone) {
      toast.error("Selecione um telefone");
      return;
    }
    setError(null);

    try {
      // 1. Request screen share + system audio FIRST (before opening WhatsApp)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });

      const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
      setHasSystemAudio(hasDisplayAudio);

      // 2. Request microphone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setHasMicAudio(true);
      streamsRef.current = [displayStream, micStream];

      // 3. Mix audio streams
      audioContextRef.current = new AudioContext();
      const destination = audioContextRef.current.createMediaStreamDestination();

      const micSource = audioContextRef.current.createMediaStreamSource(micStream);
      micAnalyserRef.current = audioContextRef.current.createAnalyser();
      micAnalyserRef.current.fftSize = 256;
      micSource.connect(micAnalyserRef.current);
      micSource.connect(destination);

      if (hasDisplayAudio) {
        const systemStream = new MediaStream([displayStream.getAudioTracks()[0]]);
        const systemSource = audioContextRef.current.createMediaStreamSource(systemStream);
        systemAnalyserRef.current = audioContextRef.current.createAnalyser();
        systemAnalyserRef.current.fftSize = 256;
        systemSource.connect(systemAnalyserRef.current);
        systemSource.connect(destination);
      }

      // 4. Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      chunksRef.current = [];
      const recorder = new MediaRecorder(destination.stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        handleRecordingComplete(blob, duration);
      };

      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopRecording();
      });

      recorder.start(1000);
      setStatus("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      updateLevels();

      // 5. Create chamada record
      const chamada = await createChamada.mutateAsync({
        lead_id: leadId,
        numero_discado: selectedPhone,
      });
      chamadaIdRef.current = chamada.id;
      updateChamada.mutate({ id: chamada.id, leadId, status: "em_chamada" });

      // 6. Open WhatsApp call - use top window to avoid iframe blocking
      const formattedPhone = formatPhone(selectedPhone);
      const waUrl = `https://wa.me/${formattedPhone}`;
      try {
        (window.top || window).open(waUrl, "_blank");
      } catch {
        // Cross-origin restriction on window.top - fallback
        window.open(waUrl, "_blank");
      }

      toast.success("WhatsApp aberto! Inicie a ligação e o áudio será gravado.");
    } catch (err: any) {
      console.error("Error starting WhatsApp recording:", err);
      cleanup();
      if (err.name === "NotAllowedError") {
        setError("Permissão negada. Permita o acesso ao microfone e compartilhamento de tela.");
      } else {
        setError(`Erro: ${err.message}`);
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      setStatus("processing");
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
      stopAllStreams();
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      setHasSystemAudio(false);
      setHasMicAudio(false);
      setMicLevel(0);
      setSystemLevel(0);
    }
  }, [status, stopAllStreams]);

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (status === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      updateLevels();
      setStatus("recording");
    } else if (status === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
      setStatus("paused");
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  if (status === "processing") {
    return (
      <Card className="border-green-500/20">
        <CardContent className="flex items-center gap-3 p-3">
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          <span className="text-sm">Processando gravação e transcrição...</span>
        </CardContent>
      </Card>
    );
  }

  if (status === "done") {
    return (
      <Card className="border-green-500/20">
        <CardContent className="flex items-center gap-3 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm">Gravação processada com sucesso!</span>
          <Button variant="outline" size="sm" onClick={() => setStatus("idle")} className="ml-auto">
            Nova gravação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/20">
      <CardContent className="p-3 space-y-3">
        {/* Phone selector */}
        {telefones.length > 1 && status === "idle" && (
          <select
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={selectedPhone}
            onChange={(e) => setSelectedPhone(e.target.value)}
          >
            {telefones.map((t, i) => (
              <option key={i} value={t.numero}>
                {t.numero} ({t.tipo})
              </option>
            ))}
          </select>
        )}

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {(status === "recording" || status === "paused") && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className={`h-3 w-3 rounded-full ${status === "paused" ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`} />
              <span className="text-xl font-mono font-bold">{formatTime(duration)}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Mic className="h-3.5 w-3.5" />
                <span className="text-xs w-16">Microfone</span>
                <Progress value={micLevel} className="flex-1 h-1.5" />
                {hasMicAudio ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <MicOff className="h-3.5 w-3.5 text-destructive" />}
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5" />
                <span className="text-xs w-16">Sistema</span>
                <Progress value={systemLevel} className="flex-1 h-1.5" />
                {hasSystemAudio ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
              </div>
            </div>

            {!hasSystemAudio && (
              <p className="text-xs text-yellow-600">
                ⚠ Áudio do sistema não detectado. Marque "Compartilhar áudio" ao selecionar a guia.
              </p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Badge className="bg-green-500/20 text-green-700">
            <MessageCircle className="h-3 w-3 mr-1" />
            WhatsApp
          </Badge>

          <div className="flex gap-1">
            {status === "idle" ? (
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={startWhatsAppCall}
                disabled={!selectedPhone}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Ligar pelo WhatsApp
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className="gap-1" onClick={togglePause}>
                  {status === "paused" ? <><Play className="h-3.5 w-3.5" />Retomar</> : <><Pause className="h-3.5 w-3.5" />Pausar</>}
                </Button>
                <Button variant="destructive" size="sm" className="gap-1" onClick={stopRecording}>
                  <Square className="h-3.5 w-3.5" />Finalizar
                </Button>
              </>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
