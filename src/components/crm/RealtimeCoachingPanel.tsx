import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Mic, MicOff, Loader2, ClipboardList, Heart, Brain, BookOpen, Presentation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type RoboCoach } from "@/hooks/useRobosCoach";
import { useActiveScriptSdr } from "@/hooks/useScriptsSdr";
import { Progress } from "@/components/ui/progress";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
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
  const { data: activeScript } = useActiveScriptSdr();

  const [apresentacaoDone, setApresentacaoDone] = useState<string[]>([]);
  const [qualificationDone, setQualificationDone] = useState<string[]>([]);
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

  const instructionsText = INSTRUCTIONS_TEXT;

  const requestAnalysis = useCallback(
    async (transcript: string) => {
      if (!transcript || transcript === lastAnalyzedRef.current || isAnalyzingRef.current) return;
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
    [coach.instrucoes, leadNome, leadContext, qualificationItems]
  );

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "por",
    commitStrategy: CommitStrategy.VAD,
    onCommittedTranscript: (data) => {
      if (data.text?.trim()) {
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
        const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
        if (error || !data?.token) {
          setConnectionError("Erro ao obter token: " + (error?.message || "No token"));
          return;
        }
        if (cancelled) return;
        await scribe.connect({
          token: data.token,
          microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        setConnectionError(null);
      } catch (e: any) {
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

  return (
    <div className="flex gap-2 mt-3 min-h-0 flex-1" style={{ height: 'calc(100vh - 260px)' }}>
      {/* Column 1: Apresentação + Qualificação */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {apresentacaoItems.length > 0 && (
          <ChecklistCard
            title="Apresentação"
            icon={Presentation}
            iconColor="text-emerald-500"
            items={apresentacaoItems}
            completedIds={apresentacaoDone}
          />
        )}
        <ChecklistCard
          title="Qualificação"
          icon={ClipboardList}
          iconColor="text-blue-500"
          items={qualificationItems}
          completedIds={qualificationDone}
        />
      </div>

      {/* Column 2: Objeções + RECA + RALOCA */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
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

      {/* Column 3: Transcrição */}
      <Card className="border-primary/20 flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-1 px-3 pt-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs flex items-center gap-1.5">
              {isConnected ? (
                <Mic className="h-3.5 w-3.5 text-primary" />
              ) : (
                <MicOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              Transcrição
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
                {isConnected ? "Ao vivo" : "Conectando..."}
              </Badge>
            </div>
          </div>
          <Progress value={micLevel} className="h-1 mt-1" />
        </CardHeader>
        <CardContent className="px-3 pb-2 flex-1 min-h-0">
          {connectionError && <p className="text-[10px] text-destructive mb-1">{connectionError}</p>}
          <ScrollArea className="h-full">
            <div className="space-y-1 text-xs">
              {scribe.committedTranscripts.map((t) => (
                <p key={t.id} className="text-foreground">{t.text}</p>
              ))}
              {scribe.partialTranscript && (
                <p className="text-muted-foreground italic">{scribe.partialTranscript}</p>
              )}
              {!scribe.committedTranscripts.length && !scribe.partialTranscript && (
                <p className="text-muted-foreground text-xs text-center py-6">Aguardando fala...</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="px-3 pb-2 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-[11px] h-7 gap-1">
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
      </Card>
    </div>
  );
}
