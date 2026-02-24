import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Mic, MicOff, Loader2, ClipboardList, Heart, Brain, BookOpen, Presentation, Star, Volume2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type RoboCoach } from "@/hooks/useRobosCoach";
import { useActiveScriptSdr } from "@/hooks/useScriptsSdr";
import { Progress } from "@/components/ui/progress";
import { useScribe, CommitStrategy, AudioFormat } from "@elevenlabs/react";
import { ChecklistCard } from "./coaching/ChecklistCard";
import { ObjectionsCard } from "./coaching/ObjectionsCard";
import { DynamicChecklistCard } from "./coaching/DynamicChecklistCard";
import {
  QUALIFICATION_QUESTIONS,
  INSTRUCTIONS_TEXT,
  type CoachingAnalysis,
  type Objection,
  type DynamicItem,
  type ChecklistItem,
} from "./coaching/coachingData";
import ReactMarkdown from "react-markdown";

export interface AudioMonitorInfo {
  hasMicAudio: boolean;
  hasSystemAudio: boolean;
  micLevel: number;
  systemLevel: number;
  duration: number;
}

interface RealtimeCoachingPanelProps {
  coach: RoboCoach;
  leadNome: string;
  leadContext?: string;
  isRecording: boolean;
  audioStream: MediaStream | null;
  topBarOnly?: boolean;
  bottomOnly?: boolean;
  audioMonitor?: AudioMonitorInfo;
}

export function RealtimeCoachingPanel({
  coach,
  leadNome,
  leadContext,
  isRecording,
  topBarOnly,
  bottomOnly,
  audioMonitor,
}: RealtimeCoachingPanelProps) {
  const { data: activeScript } = useActiveScriptSdr();

  const [apresentacaoDone, setApresentacaoDone] = useState<string[]>([]);
  const [qualificationDone, setQualificationDone] = useState<string[]>([]);
  const [showRateDone, setShowRateDone] = useState<string[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [recaItems, setRecaItems] = useState<DynamicItem[]>([]);
  const [ralocaItems, setRalocaItems] = useState<DynamicItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  const lastAnalyzedRef = useRef("");
  const isAnalyzingRef = useRef(false);
  const allTranscriptsRef = useRef<string[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Qualification items from script or fallback
  const qualificationItems: ChecklistItem[] = activeScript?.qualificacao?.length
    ? activeScript.qualificacao
    : QUALIFICATION_QUESTIONS;
  
  // Apresentacao items from script
  const apresentacaoItems: ChecklistItem[] = activeScript?.apresentacao?.length
    ? activeScript.apresentacao
    : [];

  const showRateItems: ChecklistItem[] = activeScript?.show_rate?.length
    ? activeScript.show_rate
    : [];

  const instructionsText = INSTRUCTIONS_TEXT;

  const requestAnalysis = useCallback(
    async (transcript: string) => {
      // Require at least 40 chars of real transcript to avoid analyzing noise/silence
      if (!transcript || transcript.trim().length < 10 || transcript === lastAnalyzedRef.current || isAnalyzingRef.current) return;
      lastAnalyzedRef.current = transcript;
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      try {
        const { data, error } = await supabase.functions.invoke("coaching-realtime", {
          body: {
            transcript,
            coachInstructions: coach.instrucoes,
            leadName: leadNome,
            leadContext,
            scriptItems: {
              qualificacao: qualificationItems,
              apresentacao: apresentacaoItems,
              show_rate: showRateItems,
            },
          },
        });

        if (error) {
          console.error("[Coaching] AI error:", error);
          return;
        }

        const analysis: CoachingAnalysis | undefined = data?.analysis;
        if (analysis) {
          setApresentacaoDone(analysis.apresentacao_done || []);
          setQualificationDone(analysis.qualification_done || []);
          setShowRateDone(analysis.show_rate_done || []);
          setObjections(analysis.objections || []);
          setRecaItems(analysis.reca_items || []);
          setRalocaItems(analysis.raloca_items || []);
        }
      } catch (e) {
        console.error("[Coaching] Request error:", e);
      } finally {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    },
    [coach.instrucoes, leadNome, leadContext, qualificationItems, apresentacaoItems, showRateItems]
  );

  // Filter out STT hallucinations that occur during silence
  const isHallucination = useCallback((text: string): boolean => {
    const cleaned = text.trim().toLowerCase();
    if (!cleaned) return true;
    // Known hallucination patterns from Scribe model during silence
    const hallucinationPatterns = [
      /p[ií]lulas\s+do\s+evangelho/i,
      /colabore\s+conosco/i,
      /nosso\s+time\s+de\s+colaboradores/i,
      /seja\s+voc[êe]\s+tamb[ée]m\s+um\s+volunt[áa]rio/i,
      /acesse\s+nosso\s+grupo/i,
      /tradu[çc][ãa]o/i,
      /transcri[çc][ãa]o.*facebook/i,
      /o\s+que\s+[ée]\s+o\s+que\s+[ée]/i,
      /legendas?\s+por\s+comunidade/i,
      /inscreva[\s-]*se/i,
      /obrigad[oa]\s+por\s+assistir/i,
      /amara\.org/i,
    ];
    for (const pattern of hallucinationPatterns) {
      if (pattern.test(cleaned)) return true;
    }
    return false;
  }, []);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "por",
    commitStrategy: CommitStrategy.VAD,
    onCommittedTranscript: (data) => {
      if (data.text?.trim() && !isHallucination(data.text)) {
        allTranscriptsRef.current = [...allTranscriptsRef.current, data.text];
        const fullTranscript = allTranscriptsRef.current.join("\n");
        requestAnalysis(fullTranscript);
      }
    },
  });

  useEffect(() => {
    if (!isRecording) return;
    let cancelled = false;

    const connectScribe = async () => {
      try {
        setConnectionError(null);

        // 1. Get Scribe token
        const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
        if (error || !data?.token) {
          setConnectionError("Erro ao obter token: " + (error?.message || "No token"));
          return;
        }
        if (cancelled) return;

        // 2. Connect Scribe WITH native microphone (simplest & most reliable)
        await scribe.connect({
          token: data.token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (cancelled) { scribe.disconnect(); return; }

        setConnectionError(null);
        console.log("[Coaching] Scribe connected with native microphone");
      } catch (e: any) {
        console.error("[Coaching] Connection error:", e);
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

  useEffect(() => {
    if (!isRecording || !scribe.isConnected) {
      setMicLevel(0);
      return;
    }
    let level = 0;
    let direction = 1;
    const update = () => {
      level += direction * 2;
      if (level >= 60) direction = -1;
      if (level <= 10) direction = 1;
      setMicLevel(level);
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording, scribe.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isRecording) return null;

  const isConnected = scribe.isConnected;

  // Unified top bar: transcription + audio monitor in one card
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const topBar = (
    <Card className="border-primary/20 flex flex-col h-full">
      <CardHeader className="pb-1 px-3 pt-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            {isConnected ? (
              <Mic className="h-3.5 w-3.5 text-primary" />
            ) : (
              <MicOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            Transcrição em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            {audioMonitor && (
              <>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono font-semibold text-foreground">{formatTime(audioMonitor.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  <Progress value={audioMonitor.micLevel} className="h-1 w-10" />
                  {audioMonitor.hasMicAudio ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <MicOff className="h-3 w-3 text-destructive" />}
                </div>
                <div className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  <Progress value={audioMonitor.systemLevel} className="h-1 w-10" />
                  {audioMonitor.hasSystemAudio ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                </div>
              </>
            )}
            <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
              {isConnected ? "Ao vivo" : "Conectando..."}
            </Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1 px-2">
                  <BookOpen className="h-3 w-3" />
                  Instruções
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Instruções de Qualificação</SheetTitle>
                </SheetHeader>
                <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
                  <ReactMarkdown>{instructionsText}</ReactMarkdown>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 flex-1 min-h-0">
        {connectionError && <p className="text-[10px] text-destructive mb-1">{connectionError}</p>}
        <ScrollArea className="h-full">
          <div className="space-y-0.5 text-xs">
            {scribe.committedTranscripts
              .filter((t) => !isHallucination(t.text))
              .map((t) => (
                <p key={t.id} className="text-foreground">{t.text}</p>
              ))}
            {scribe.partialTranscript && (
              <p className="text-muted-foreground italic">{scribe.partialTranscript}</p>
            )}
            {!scribe.committedTranscripts.length && !scribe.partialTranscript && (
              <p className="text-muted-foreground text-xs text-center py-2">Aguardando fala...</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (topBarOnly) return topBar;

  // Script cards (bottom section)
  const scriptCards = (
    <div className="flex gap-2 flex-1 min-h-0 overflow-y-auto h-full">
      {/* Column 1: Apresentação + Qualificação + Show Rate */}
      <div className="flex-1 flex flex-col gap-2">
        {apresentacaoItems.length > 0 && (
          <ChecklistCard
            title="Apresentação"
            icon={Presentation}
            iconColor="text-emerald-500"
            items={apresentacaoItems}
            completedIds={apresentacaoDone}
            className="flex-none"
          />
        )}
        <ChecklistCard
          title="Qualificação"
          icon={ClipboardList}
          iconColor="text-blue-500"
          items={qualificationItems}
          completedIds={qualificationDone}
        />
        {showRateItems.length > 0 && (
          <ChecklistCard
            title="Show Rate"
            icon={Star}
            iconColor="text-amber-500"
            items={showRateItems}
            completedIds={showRateDone}
            className="flex-none"
          />
        )}
      </div>

      {/* Column 2: Objeções + RECA + RALOCA */}
      <div className="flex-1 flex flex-col gap-2">
        <ObjectionsCard objections={objections} />
        <DynamicChecklistCard
          title="RECA — Emocionais"
          icon={Heart}
          iconColor="text-red-500"
          items={recaItems}
          emptyMessage="Aguardando análise..."
        />
        <DynamicChecklistCard
          title="RALOCA — Lógicos"
          icon={Brain}
          iconColor="text-purple-500"
          items={ralocaItems}
          emptyMessage="Aguardando análise..."
        />
      </div>
    </div>
  );

  if (bottomOnly) return scriptCards;

  // Full layout (fallback)
  return (
    <div className="flex flex-col gap-2 overflow-hidden h-full">
      <div className="shrink-0" style={{ maxHeight: '160px' }}>
        {topBar}
      </div>
      {scriptCards}
    </div>
  );
}
