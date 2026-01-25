import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mic, 
  MicOff, 
  Square, 
  Pause, 
  Play, 
  Monitor, 
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CallRecorderProps {
  onRecordingComplete: (audioBlob: Blob, durationSeconds: number) => void;
  onRecordingStart?: () => void;
  isProcessing?: boolean;
}

export function CallRecorder({ 
  onRecordingComplete, 
  onRecordingStart,
  isProcessing = false 
}: CallRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasSystemAudio, setHasSystemAudio] = useState(false);
  const [hasMicAudio, setHasMicAudio] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const systemAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const updateLevels = useCallback(() => {
    if (micAnalyserRef.current) {
      const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
      micAnalyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setMicLevel(Math.min(100, (average / 128) * 100));
    }

    if (systemAnalyserRef.current) {
      const dataArray = new Uint8Array(systemAnalyserRef.current.frequencyBinCount);
      systemAnalyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setSystemLevel(Math.min(100, (average / 128) * 100));
    }

    if (isRecording && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    }
  }, [isRecording, isPaused]);

  const stopAllStreams = useCallback(() => {
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    streamsRef.current = [];
  }, []);

  const startRecording = async () => {
    setError(null);
    setShowInstructions(false);
    chunksRef.current = [];

    try {
      // Request display media with audio (system audio)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Required by some browsers
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Check if we got audio from the display
      const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
      setHasSystemAudio(hasDisplayAudio);

      // Request microphone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setHasMicAudio(true);
      streamsRef.current = [displayStream, micStream];

      // Create AudioContext to mix streams
      audioContextRef.current = new AudioContext();
      const destination = audioContextRef.current.createMediaStreamDestination();

      // Add microphone to mix
      const micSource = audioContextRef.current.createMediaStreamSource(micStream);
      micAnalyserRef.current = audioContextRef.current.createAnalyser();
      micAnalyserRef.current.fftSize = 256;
      micSource.connect(micAnalyserRef.current);
      micSource.connect(destination);

      // Add system audio to mix if available
      if (hasDisplayAudio) {
        const displayAudioTrack = displayStream.getAudioTracks()[0];
        const systemAudioStream = new MediaStream([displayAudioTrack]);
        const systemSource = audioContextRef.current.createMediaStreamSource(systemAudioStream);
        systemAnalyserRef.current = audioContextRef.current.createAnalyser();
        systemAnalyserRef.current.fftSize = 256;
        systemSource.connect(systemAnalyserRef.current);
        systemSource.connect(destination);
      }

      // Create MediaRecorder with mixed audio
      const mixedStream = destination.stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mediaRecorderRef.current = new MediaRecorder(mixedStream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(audioBlob, duration);
      };

      // Handle display stream ending (user stops sharing)
      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (isRecording) {
          stopRecording();
        }
      });

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start level monitoring
      updateLevels();

      onRecordingStart?.();
    } catch (err) {
      console.error("Error starting recording:", err);
      stopAllStreams();
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Permissão negada. Por favor, permita o acesso ao microfone e compartilhamento de tela.");
        } else if (err.name === "NotFoundError") {
          setError("Microfone não encontrado. Verifique se há um dispositivo de áudio conectado.");
        } else {
          setError(`Erro ao iniciar gravação: ${err.message}`);
        }
      } else {
        setError("Erro desconhecido ao iniciar gravação.");
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      stopAllStreams();

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setHasSystemAudio(false);
      setHasMicAudio(false);
      setMicLevel(0);
      setSystemLevel(0);
    }
  }, [isRecording, duration, onRecordingComplete, stopAllStreams]);

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      updateLevels();
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stopAllStreams();
      audioContextRef.current?.close();
    };
  }, [stopAllStreams]);

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Processando transcrição...</p>
          <p className="text-sm text-muted-foreground">
            Isso pode levar alguns minutos dependendo da duração da gravação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Gravação de Chamada
        </CardTitle>
        <CardDescription>
          Grave chamadas do WhatsApp Web ou Google Meet capturando o áudio do cliente e do closer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showInstructions && !isRecording && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instruções importantes:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Abra o WhatsApp Web ou Google Meet no navegador Chrome</li>
                <li>Inicie a chamada com o cliente</li>
                <li>Clique em "Iniciar Gravação" abaixo</li>
                <li>Na janela que aparecer, selecione a guia/janela da chamada</li>
                <li><strong>Marque a opção "Compartilhar áudio"</strong> para captar o cliente</li>
                <li>Clique em "Compartilhar"</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isRecording && (
          <div className="space-y-4">
            {/* Timer */}
            <div className="flex items-center justify-center gap-4">
              <div className={`h-4 w-4 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`} />
              <span className="text-3xl font-mono font-bold">{formatTime(duration)}</span>
            </div>

            {/* Audio levels */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <Mic className="h-4 w-4" />
                  <span className="text-sm">Microfone</span>
                </div>
                <Progress value={micLevel} className="flex-1 h-2" />
                {hasMicAudio ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <MicOff className="h-4 w-4 text-destructive" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">Sistema</span>
                </div>
                <Progress value={systemLevel} className="flex-1 h-2" />
                {hasSystemAudio ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {!hasSystemAudio && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Áudio do sistema não detectado. Verifique se você marcou "Compartilhar áudio" ao selecionar a guia.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button onClick={startRecording} size="lg" className="gap-2">
              <Mic className="h-5 w-5" />
              Iniciar Gravação
            </Button>
          ) : (
            <>
              <Button
                onClick={togglePause}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5" />
                    Retomar
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5" />
                    Pausar
                  </>
                )}
              </Button>

              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Finalizar Gravação
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
