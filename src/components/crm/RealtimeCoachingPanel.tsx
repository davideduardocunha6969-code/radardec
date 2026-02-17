import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type RoboCoach } from "@/hooks/useRobosCoach";
import { Progress } from "@/components/ui/progress";

interface CoachingInsight {
  id: number;
  text: string;
  timestamp: Date;
}

interface RealtimeCoachingPanelProps {
  coach: RoboCoach;
  leadNome: string;
  leadContext?: string;
  isRecording: boolean;
  audioStream: MediaStream | null;
}

export function RealtimeCoachingPanel({
  coach,
  leadNome,
  leadContext,
  isRecording,
  audioStream,
}: RealtimeCoachingPanelProps) {
  const [partialTranscript, setPartialTranscript] = useState("");
  const [committedTranscripts, setCommittedTranscripts] = useState<string[]>([]);
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const insightIdRef = useRef(0);
  const lastAnalyzedRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const committedTranscriptsRef = useRef<string[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    committedTranscriptsRef.current = committedTranscripts;
  }, [committedTranscripts]);

  // Request coaching insight from AI
  const requestInsight = useCallback(async (transcript: string) => {
    if (!transcript || transcript === lastAnalyzedRef.current || isAnalyzing) return;
    lastAnalyzedRef.current = transcript;
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("coaching-realtime", {
        body: {
          transcript,
          coachInstructions: coach.instrucoes,
          leadName: leadNome,
          leadContext,
        },
      });

      if (error) {
        console.error("Coaching error:", error);
        return;
      }

      if (data?.insight && data.insight !== "✅ Continue a conversa normalmente.") {
        insightIdRef.current += 1;
        setInsights((prev) => [
          ...prev,
          { id: insightIdRef.current, text: data.insight, timestamp: new Date() },
        ]);
      }
    } catch (e) {
      console.error("Coaching request error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [coach.instrucoes, leadNome, leadContext, isAnalyzing]);

  // Connect to ElevenLabs Scribe WebSocket
  const connectScribe = useCallback(async () => {
    if (!audioStream || wsRef.current) return;

    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (error || !data?.token) {
        console.error("Failed to get scribe token:", error);
        return;
      }

      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${data.token}&language_code=por`
      );

      ws.onopen = () => {
        setIsConnected(true);
        // Send initial config
        ws.send(JSON.stringify({
          type: "configure",
          audio_format: {
            type: "pcm",
            sample_rate: 16000,
            encoding: "pcm_s16le",
          },
          commit_strategy: "vad",
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "partial_transcript") {
            setPartialTranscript(msg.text || "");
          } else if (msg.type === "committed_transcript") {
            const text = msg.text || "";
            if (text.trim()) {
              setCommittedTranscripts((prev) => {
                const updated = [...prev, text];
                // Use ref to avoid stale closure
                committedTranscriptsRef.current = updated;
                // Trigger AI analysis on each committed segment
                const fullTranscript = updated.join("\n");
                requestInsight(fullTranscript);
                return updated;
              });
              setPartialTranscript("");
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      ws.onerror = (e) => {
        console.error("Scribe WS error:", e);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
      };

      wsRef.current = ws;

      // Set up audio processing to send PCM data
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      
      // Analyser for level visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // ScriptProcessor to capture PCM and send via WS
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert float32 to int16
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Send as base64
        const bytes = new Uint8Array(int16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        ws.send(JSON.stringify({ type: "audio", data: base64 }));
      };

      // Animate mic level
      const updateLevel = () => {
        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setMicLevel(Math.min(100, (avg / 128) * 100));
        }
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.error("Scribe connection error:", e);
    }
  }, [audioStream, requestInsight]);

  // Cleanup
  const disconnectScribe = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (isRecording && audioStream) {
      connectScribe();
    } else {
      disconnectScribe();
    }
    return () => disconnectScribe();
  }, [isRecording, audioStream]);

  // Auto-scroll insights
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [insights]);

  if (!isRecording) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {/* Left: Live Transcription */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {isConnected ? <Mic className="h-3.5 w-3.5 text-primary" /> : <MicOff className="h-3.5 w-3.5 text-muted-foreground" />}
              Transcrição ao Vivo
            </CardTitle>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          <Progress value={micLevel} className="h-1 mt-1" />
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <ScrollArea className="h-[200px]">
            <div className="space-y-1.5 text-sm">
              {committedTranscripts.map((t, i) => (
                <p key={i} className="text-foreground">{t}</p>
              ))}
              {partialTranscript && (
                <p className="text-muted-foreground italic">{partialTranscript}</p>
              )}
              {!committedTranscripts.length && !partialTranscript && (
                <p className="text-muted-foreground text-xs text-center py-8">
                  Aguardando fala...
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: AI Coaching Insights */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-primary" />
              {coach.nome}
            </CardTitle>
            {isAnalyzing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <ScrollArea className="h-[200px]" ref={scrollRef}>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-primary/5 rounded-md p-2.5 border border-primary/10">
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{insight.text}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {insight.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              ))}
              {!insights.length && (
                <div className="text-center py-8">
                  <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Insights aparecerão aqui conforme a conversa avança.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
