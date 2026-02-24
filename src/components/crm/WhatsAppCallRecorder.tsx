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


export interface AudioStreamsInfo {
  micStream: MediaStream | null;
  systemStream: MediaStream | null;
  mixedStream: MediaStream | null;
}

interface WhatsAppCallRecorderProps {
  leadId: string;
  leadNome: string;
  numero: string;
  onRecordingStateChange?: (isRecording: boolean, streams: AudioStreamsInfo) => void;
  onAudioMonitorUpdate?: (info: { hasMicAudio: boolean; hasSystemAudio: boolean; micLevel: number; systemLevel: number; duration: number }) => void;
  stopRef?: React.MutableRefObject<(() => void) | null>;
}

type RecordingStatus = "idle" | "recording" | "paused" | "processing" | "done" | "error";

const formatPhone = (numero: string): string => {
  // Strip non-digits
  const digits = numero.replace(/\D/g, "");
  // Add country code if missing
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
};

export function WhatsAppCallRecorder({ leadId, leadNome, numero, onRecordingStateChange, onAudioMonitorUpdate, stopRef }: WhatsAppCallRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [hasSystemAudio, setHasSystemAudio] = useState(false);
  const [hasMicAudio, setHasMicAudio] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
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
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const durationRef = useRef(0);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedChunksRef = useRef(0);
  const mimeTypeRef = useRef("audio/webm");
  const manualStopRef = useRef(false);
  const audioContextDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const createChamada = useCreateChamada();
  const updateChamada = useUpdateChamada();

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const updateLevels = useCallback(() => {
    let ml = 0, sl = 0;
    if (micAnalyserRef.current) {
      const data = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
      micAnalyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;
      ml = Math.min(100, (avg / 128) * 100);
      setMicLevel(ml);
    }
    if (systemAnalyserRef.current) {
      const data = new Uint8Array(systemAnalyserRef.current.frequencyBinCount);
      systemAnalyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;
      sl = Math.min(100, (avg / 128) * 100);
      setSystemLevel(sl);
    }
    onAudioMonitorUpdate?.({
      hasMicAudio: hasMicAudio,
      hasSystemAudio: hasSystemAudio,
      micLevel: ml,
      systemLevel: sl,
      duration: durationRef.current,
    });
    animationFrameRef.current = requestAnimationFrame(updateLevels);
  }, [onAudioMonitorUpdate, hasMicAudio, hasSystemAudio]);

  const stopAllStreams = useCallback(() => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoSaveTimerRef.current) { clearInterval(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    stopAllStreams();
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
  }, [stopAllStreams]);

  // Save partial audio to storage (non-blocking)
  const savePartialAudio = useCallback(async () => {
    const chamadaId = chamadaIdRef.current;
    if (!chamadaId || chunksRef.current.length === 0) return;
    if (chunksRef.current.length === lastSavedChunksRef.current) return; // No new chunks
    try {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      const fileName = `whatsapp_partial_${leadId}_${chamadaId}.webm`;
      await supabase.storage
        .from("atendimentos-audio")
        .upload(fileName, blob, { contentType: "audio/webm", upsert: true });
      await supabase
        .from("crm_chamadas")
        .update({ audio_url: fileName, duracao_segundos: durationRef.current })
        .eq("id", chamadaId);
      lastSavedChunksRef.current = chunksRef.current.length;
      console.log("[AutoSave] Partial audio saved:", fileName, `${durationRef.current}s`);
    } catch (e) {
      console.error("[AutoSave] Error saving partial audio:", e);
    }
  }, [leadId]);

  // pagehide: save partial on actual page close (NOT on protocol dialogs like "Open WhatsApp?")
  // beforeunload fires for protocol handler dialogs on some browsers, which kills the recording.
  useEffect(() => {
    const handlePageHide = () => {
      if (chamadaIdRef.current && chunksRef.current.length > 0) {
        console.log("[PageHide] Saving partial audio before page unload");
        // The periodic auto-save should have covered most data already
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [leadId]);


  const handleRecordingComplete = useCallback(async (audioBlob: Blob, durationSecs: number) => {
    setStatus("processing");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Upload final audio
      const fileName = `whatsapp_${leadId}_${Date.now()}.webm`;
      const { error: uploadErr } = await supabase.storage
        .from("atendimentos-audio")
        .upload(fileName, audioBlob, { contentType: "audio/webm" });
      if (uploadErr) throw uploadErr;

      // Update chamada record with audio
      const currentChamadaId = chamadaIdRef.current;
      if (currentChamadaId) {
        updateChamada.mutate({
          id: currentChamadaId,
          leadId,
          duracao_segundos: durationSecs,
          audio_url: fileName,
        });
      }

      // Get user display name for transcription speaker labels
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      const userName = profileData?.display_name || "Operador";

      // Fire-and-forget: trigger background processing (transcription + feedback)
      // The edge function runs server-side, so user can navigate away
      if (currentChamadaId) {
        supabase.functions.invoke("process-chamada-background", {
          body: {
            chamadaId: currentChamadaId,
            leadId,
            leadNome,
            audioFileName: fileName,
            userName,
          },
        }).catch((e) => console.error("[Background] Failed to trigger:", e));
      }

      toast.success("Gravação salva! A transcrição será processada em segundo plano.");
      setStatus("done");
      chamadaIdRef.current = null;
    } catch (err: any) {
      console.error("Error processing recording:", err);
      toast.error("Erro ao processar gravação: " + (err.message || ""));
      setStatus("error");
      setError(err.message);
    }
  }, [leadId, leadNome, updateChamada]);

  const rebuildRecorderMicOnly = useCallback((mimeType: string) => {
    try {
      const mic = micStreamRef.current;
      if (!mic || mic.getTracks().every((t) => t.readyState !== "live")) {
        console.error("[WhatsApp] Mic stream also dead – cannot rebuild recorder");
        return;
      }
      // Create a fresh destination from mic only
      const ctx = audioContextRef.current || new AudioContext();
      if (!audioContextRef.current) audioContextRef.current = ctx;
      const dest = ctx.createMediaStreamDestination();
      const src = ctx.createMediaStreamSource(mic);
      src.connect(dest);
      audioContextDestRef.current = dest;

      const newRecorder = new MediaRecorder(dest.stream, { mimeType });
      mediaRecorderRef.current = newRecorder;
      newRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      newRecorder.onstop = () => {
        if (manualStopRef.current) {
          if (autoSaveTimerRef.current) { clearInterval(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
          const blob = new Blob(chunksRef.current, { type: mimeType });
          handleRecordingComplete(blob, durationRef.current);
        } else {
          console.warn("[WhatsApp] Rebuilt recorder also stopped unexpectedly – ignoring");
        }
      };
      newRecorder.start(1000);
      mixedStreamRef.current = dest.stream;
      setHasSystemAudio(false);
      console.log("[WhatsApp] Rebuilt recorder with mic-only successfully");
    } catch (err) {
      console.error("[WhatsApp] rebuildRecorderMicOnly failed:", err);
    }
  }, [handleRecordingComplete]);

  const startWhatsAppCall = async () => {
    if (!numero) {
      toast.error("Telefone não informado");
      return;
    }
    setError(null);

    // Force-release any lingering streams/context from previous attempts
    cleanup();
    // Give the browser a moment to fully release audio devices
    await new Promise((r) => setTimeout(r, 300));

    try {
      // 1. Request microphone FIRST (most reliable)
      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (micErr: any) {
        console.warn("[WhatsApp] Mic with constraints failed, retrying simple:", micErr);
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (micErr2: any) {
          console.warn("[WhatsApp] Simple mic also failed, trying with sampleRate:", micErr2);
          // Last resort: specify exact device constraints
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInput = devices.find((d) => d.kind === "audioinput");
          if (!audioInput) throw new Error("Nenhum microfone encontrado no dispositivo");
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: audioInput.deviceId } },
          });
        }
      }
      setHasMicAudio(true);

      // 2. Request screen share + system audio
      let displayStream: MediaStream | null = null;
      let hasDisplayAudio = false;
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        hasDisplayAudio = displayStream.getAudioTracks().length > 0;
      } catch (displayErr: any) {
        console.warn("[WhatsApp] getDisplayMedia with audio constraints failed, retrying simple:", displayErr);
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          hasDisplayAudio = displayStream!.getAudioTracks().length > 0;
        } catch (displayErr2: any) {
          console.warn("[WhatsApp] getDisplayMedia failed entirely, mic-only mode:", displayErr2);
          // Continue with mic-only recording
        }
      }
      setHasSystemAudio(hasDisplayAudio);

      // Immediately stop video tracks – we only need audio, and keeping
      // the video track alive causes the browser protocol dialog to kill it,
      // which cascades and stops the MediaRecorder.
      if (displayStream) {
        displayStream.getVideoTracks().forEach((t) => t.stop());
      }

      streamsRef.current = displayStream ? [displayStream, micStream] : [micStream];

      // 3. Mix audio streams
      audioContextRef.current = new AudioContext();
      const destination = audioContextRef.current.createMediaStreamDestination();

      const micSource = audioContextRef.current.createMediaStreamSource(micStream);
      micStreamRef.current = micStream;
      micAnalyserRef.current = audioContextRef.current.createAnalyser();
      micAnalyserRef.current.fftSize = 256;
      micSource.connect(micAnalyserRef.current);
      micSource.connect(destination);

      if (hasDisplayAudio && displayStream) {
        const sysAudioStream = new MediaStream([displayStream.getAudioTracks()[0]]);
        systemStreamRef.current = sysAudioStream;
        const systemSource = audioContextRef.current.createMediaStreamSource(sysAudioStream);
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
      lastSavedChunksRef.current = 0;
      mimeTypeRef.current = mimeType;
      manualStopRef.current = false;
      audioContextDestRef.current = destination;
      const recorder = new MediaRecorder(destination.stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (manualStopRef.current) {
          // Intentional stop – process the recording
          if (autoSaveTimerRef.current) { clearInterval(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
          const blob = new Blob(chunksRef.current, { type: mimeType });
          handleRecordingComplete(blob, durationRef.current);
        } else {
          // Unintentional stop (tracks died, e.g. WhatsApp protocol dialog)
          // Restart the recorder with whatever tracks are still alive
          console.warn("[WhatsApp] MediaRecorder stopped unexpectedly – attempting restart");
          try {
            if (destination.stream.getTracks().some((t) => t.readyState === "live")) {
              const newRecorder = new MediaRecorder(destination.stream, { mimeType });
              mediaRecorderRef.current = newRecorder;
              newRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
              };
              newRecorder.onstop = recorder.onstop; // reuse same handler
              newRecorder.start(1000);
              console.log("[WhatsApp] MediaRecorder restarted successfully");
            } else {
              // All tracks dead – fall back to mic-only recorder
              console.warn("[WhatsApp] All destination tracks dead, rebuilding with mic-only");
              rebuildRecorderMicOnly(mimeType);
            }
          } catch (restartErr) {
            console.error("[WhatsApp] Failed to restart MediaRecorder:", restartErr);
            rebuildRecorderMicOnly(mimeType);
          }
        }
      };

      // No auto-stop listener on display tracks
      recorder.start(1000);
      setStatus("recording");
      setDuration(0);
      durationRef.current = 0;
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
      }, 1000);
      updateLevels();

      // Start periodic auto-save every 30 seconds
      autoSaveTimerRef.current = setInterval(() => {
        savePartialAudio();
      }, 30_000);
      mixedStreamRef.current = destination.stream;
      onRecordingStateChange?.(true, {
        micStream: micStreamRef.current,
        systemStream: systemStreamRef.current,
        mixedStream: destination.stream,
      });

      // 5. Create chamada record
      const chamada = await createChamada.mutateAsync({
        lead_id: leadId,
        numero_discado: numero,
        canal: "whatsapp",
      });
      chamadaIdRef.current = chamada.id;
      updateChamada.mutate({ id: chamada.id, leadId, status: "em_chamada" });

      // 6. Open WhatsApp AFTER a small delay so the protocol dialog doesn't kill the recording
      setTimeout(() => {
        const formattedPhone = formatPhone(numero);
        const waUrl = `whatsapp://send?phone=${formattedPhone}`;
        const anchor = document.createElement("a");
        anchor.href = waUrl;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => document.body.removeChild(anchor), 200);
      }, 1500);

      toast.success("WhatsApp aberto! Inicie a ligação e o áudio será gravado.");
    } catch (err: any) {
      console.error("Error starting WhatsApp recording:", err);
      cleanup();
      setStatus("error");
      if (err.name === "NotAllowedError") {
        setError("Permissão negada. Permita o acesso ao microfone e compartilhamento de tela.");
        toast.error("Permissão negada. Permita o acesso ao microfone e compartilhamento de tela.");
      } else {
        setError(`Erro: ${err.message}`);
        toast.error(`Erro ao iniciar gravação: ${err.message}`);
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (status === "recording" || status === "paused")) {
      manualStopRef.current = true;
      savePartialAudio();
      mediaRecorderRef.current.stop();
      setStatus("processing");
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (autoSaveTimerRef.current) { clearInterval(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
      if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
      stopAllStreams();
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      setHasSystemAudio(false);
      setHasMicAudio(false);
      setMicLevel(0);
      setSystemLevel(0);
      mixedStreamRef.current = null;
      micStreamRef.current = null;
      systemStreamRef.current = null;
      onRecordingStateChange?.(false, { micStream: null, systemStream: null, mixedStream: null });
    }
  }, [status, stopAllStreams, onRecordingStateChange, savePartialAudio]);

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (status === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
      }, 1000);
      updateLevels();
      setStatus("recording");
    } else if (status === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
      setStatus("paused");
    }
  };

  // Expose stop function to parent via ref
  useEffect(() => {
    if (stopRef) {
      stopRef.current = (status === "recording" || status === "paused") ? stopRecording : null;
    }
  }, [status, stopRef, stopRecording]);

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

  if (status === "error") {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-3 space-y-2">
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={() => { setStatus("idle"); setError(null); }}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "idle") {
    return (
      <Button
        size="sm"
        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
        onClick={startWhatsAppCall}
        disabled={!numero}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Ligar pelo WhatsApp
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {error && (
        <span className="text-[10px] text-destructive max-w-[200px] truncate">{error}</span>
      )}
      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={togglePause}>
        {status === "paused" ? <><Play className="h-3 w-3" />Retomar</> : <><Pause className="h-3 w-3" />Pausar</>}
      </Button>
      <Button variant="destructive" size="sm" className="gap-1 h-7 text-xs" onClick={stopRecording}>
        <Square className="h-3 w-3" />Finalizar
      </Button>
    </div>
  );
}
