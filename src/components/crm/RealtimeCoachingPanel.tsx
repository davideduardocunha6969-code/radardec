import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type RoboCoach } from "@/hooks/useRobosCoach";
import { Progress } from "@/components/ui/progress";
import { useScribe, CommitStrategy } from "@elevenlabs/react";

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
}: RealtimeCoachingPanelProps) {
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  const insightIdRef = useRef(0);
  const lastAnalyzedRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAnalyzingRef = useRef(false);
  const allTranscriptsRef = useRef<string[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Request coaching insight from AI
  const requestInsight = useCallback(async (transcript: string) => {
    if (!transcript || transcript === lastAnalyzedRef.current || isAnalyzingRef.current) return;
    lastAnalyzedRef.current = transcript;
    setIsAnalyzing(true);
    isAnalyzingRef.current = true;

    try {
      console.log("[Coaching] Requesting AI insight for transcript length:", transcript.length);
      const { data, error } = await supabase.functions.invoke("coaching-realtime", {
        body: {
          transcript,
          coachInstructions: coach.instrucoes,
          leadName: leadNome,
          leadContext,
        },
      });

      if (error) {
        console.error("[Coaching] AI error:", error);
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
      console.error("[Coaching] Request error:", e);
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, [coach.instrucoes, leadNome, leadContext]);

  // Use the ElevenLabs useScribe hook
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "por",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      console.log("[Scribe] Partial:", data.text?.substring(0, 60));
    },
    onCommittedTranscript: (data) => {
      console.log("[Scribe] Committed:", data.text);
      if (data.text?.trim()) {
        allTranscriptsRef.current = [...allTranscriptsRef.current, data.text];
        const fullTranscript = allTranscriptsRef.current.join("\n");
        requestInsight(fullTranscript);
      }
    },
  });

  // Connect/disconnect scribe based on recording state
  useEffect(() => {
    if (!isRecording) return;

    let cancelled = false;

    const connectScribe = async () => {
      try {
        console.log("[Scribe] Getting token...");
        setConnectionError(null);

        const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
        if (error || !data?.token) {
          const errMsg = error?.message || "No token received";
          console.error("[Scribe] Token error:", errMsg);
          setConnectionError("Erro ao obter token: " + errMsg);
          return;
        }

        if (cancelled) return;

        console.log("[Scribe] Token received, connecting with microphone...");
        await scribe.connect({
          token: data.token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        console.log("[Scribe] Connected successfully!");
        setConnectionError(null);
      } catch (e: any) {
        console.error("[Scribe] Connection error:", e);
        setConnectionError("Erro ao conectar: " + (e.message || String(e)));
      }
    };

    connectScribe();

    return () => {
      cancelled = true;
      scribe.disconnect();
      allTranscriptsRef.current = [];
    };
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mic level animation from getUserMedia (separate from scribe)
  useEffect(() => {
    if (!isRecording || !scribe.isConnected) {
      setMicLevel(0);
      return;
    }

    // Simple pulse animation to show it's active
    let level = 0;
    let direction = 1;
    const updateLevel = () => {
      level += direction * 2;
      if (level >= 60) direction = -1;
      if (level <= 10) direction = 1;
      setMicLevel(level);
      animFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isRecording, scribe.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll insights
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [insights]);

  if (!isRecording) return null;

  const isConnected = scribe.isConnected;

  return (
    <div className="flex gap-3 mt-3 min-h-0 flex-1">
      {/* Left 2/3: AI Coaching Insights */}
      <Card className="border-primary/20 flex-[2] flex flex-col min-h-0">
        <CardHeader className="pb-2 px-3 pt-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-primary" />
              {coach.nome}
            </CardTitle>
            {isAnalyzing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 flex-1 min-h-0">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none [&_strong]:text-primary [&_strong]:font-semibold">
                    {insight.text.split('\n').map((line, i) => {
                      const formatted = line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/📌/g, '<span class="text-base">📌</span>')
                        .replace(/💡/g, '<span class="text-base">💡</span>')
                        .replace(/✅/g, '<span class="text-base">✅</span>')
                        .replace(/⚠️/g, '<span class="text-base">⚠️</span>');
                      return <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    })}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-2 block border-t border-primary/5 pt-1">
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

      {/* Right 1/3: Live Transcription */}
      <Card className="border-primary/20 flex-[1] flex flex-col min-h-0">
        <CardHeader className="pb-2 px-3 pt-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {isConnected ? <Mic className="h-3.5 w-3.5 text-primary" /> : <MicOff className="h-3.5 w-3.5 text-muted-foreground" />}
              Transcrição
            </CardTitle>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
              {isConnected ? "Ao vivo" : "Conectando..."}
            </Badge>
          </div>
          <Progress value={micLevel} className="h-1 mt-1" />
        </CardHeader>
        <CardContent className="px-3 pb-3 flex-1 min-h-0">
          {connectionError && (
            <p className="text-xs text-destructive mb-2">{connectionError}</p>
          )}
          <ScrollArea className="h-full">
            <div className="space-y-1.5 text-xs">
              {scribe.committedTranscripts.map((t) => (
                <p key={t.id} className="text-foreground">{t.text}</p>
              ))}
              {scribe.partialTranscript && (
                <p className="text-muted-foreground italic">{scribe.partialTranscript}</p>
              )}
              {!scribe.committedTranscripts.length && !scribe.partialTranscript && (
                <p className="text-muted-foreground text-xs text-center py-8">
                  Aguardando fala...
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
