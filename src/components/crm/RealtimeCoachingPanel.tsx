import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type RoboCoach } from "@/hooks/useRobosCoach";
import { useActiveScriptSdr } from "@/hooks/useScriptsSdr";
import { useScribe, CommitStrategy, AudioFormat } from "@elevenlabs/react";
import { ScriptCard, RecaCard, RalocaCard, RadovecaCard, ShowRateCard } from "./coaching/CommandCenterCards";
import { TranscriptionPanel } from "./coaching/TranscriptionPanel";
import {
  QUALIFICATION_QUESTIONS,
  INSTRUCTIONS_TEXT,
  type Objection,
  type DynamicItem,
  type ChecklistItem,
  type ShowRateAnalysis,
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
  audioStream,
}: RealtimeCoachingPanelProps) {
  const { data: activeScript } = useActiveScriptSdr();

  const [apresentacaoDone, setApresentacaoDone] = useState<string[]>([]);
  const [qualificationDone, setQualificationDone] = useState<string[]>([]);
  const [fechamentoDone, setFechamentoDone] = useState<string[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [recaItems, setRecaItems] = useState<DynamicItem[]>([]);
  const [ralocaItems, setRalocaItems] = useState<DynamicItem[]>([]);
  const [showRateData, setShowRateData] = useState<ShowRateAnalysis | null>(null);
  const [prevShowRateScore, setPrevShowRateScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  const lastAnalyzedRef = useRef("");
  const isAnalyzingRef = useRef(false);
  const allTranscriptsRef = useRef<string[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const qualificationItems: ChecklistItem[] = activeScript?.qualificacao?.length
    ? activeScript.qualificacao
    : QUALIFICATION_QUESTIONS;

  const apresentacaoItems: ChecklistItem[] = activeScript?.apresentacao?.length
    ? activeScript.apresentacao
    : [];

  const fechamentoItems: ChecklistItem[] = activeScript?.fechamento?.length
    ? activeScript.fechamento
    : [];

  const showRateItems: ChecklistItem[] = activeScript?.show_rate?.length
    ? activeScript.show_rate
    : [];

  const requestAnalysis = useCallback(
    async (transcript: string) => {
      if (!transcript || transcript.trim().length < 10 || transcript === lastAnalyzedRef.current || isAnalyzingRef.current) return;
      lastAnalyzedRef.current = transcript;
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      const baseBody = { transcript, leadName: leadNome, leadContext };

      try {
        const [scriptRes, recaRes, ralocaRes, radovecaRes, showrateRes] = await Promise.allSettled([
          supabase.functions.invoke("coaching-realtime", {
            body: { ...baseBody, mode: "script", scriptItems: { qualificacao: qualificationItems, apresentacao: apresentacaoItems, fechamento: fechamentoItems } },
          }),
          supabase.functions.invoke("coaching-realtime", {
            body: { ...baseBody, mode: "reca", coachInstructions: coach.instrucoes_reca || coach.instrucoes },
          }),
          supabase.functions.invoke("coaching-realtime", {
            body: { ...baseBody, mode: "raloca", coachInstructions: coach.instrucoes_raloca || coach.instrucoes },
          }),
          supabase.functions.invoke("coaching-realtime", {
            body: { ...baseBody, mode: "radoveca", coachInstructions: coach.instrucoes_radoveca || coach.instrucoes },
          }),
          supabase.functions.invoke("coaching-realtime", {
            body: { ...baseBody, mode: "showrate", showRateItems, coachInstructions: coach.instrucoes_noshow || "" },
          }),
        ]);

        if (scriptRes.status === "fulfilled" && scriptRes.value.data?.analysis) {
          const a = scriptRes.value.data.analysis;
          setApresentacaoDone(a.apresentacao_done || []);
          setQualificationDone(a.qualification_done || []);
          setFechamentoDone(a.fechamento_done || []);
        }
        if (recaRes.status === "fulfilled" && recaRes.value.data?.analysis) {
          setRecaItems(recaRes.value.data.analysis.reca_items || []);
        }
        if (ralocaRes.status === "fulfilled" && ralocaRes.value.data?.analysis) {
          setRalocaItems(ralocaRes.value.data.analysis.raloca_items || []);
        }
        if (radovecaRes.status === "fulfilled" && radovecaRes.value.data?.analysis) {
          setObjections(radovecaRes.value.data.analysis.objections || []);
        }
        if (showrateRes.status === "fulfilled" && showrateRes.value.data?.analysis) {
          const sr = showrateRes.value.data.analysis;
          setPrevShowRateScore(showRateData?.score ?? null);
          setShowRateData(sr);
        }
      } catch (e) {
        console.error("[Coaching] Request error:", e);
      } finally {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    },
    [coach.instrucoes, coach.instrucoes_reca, coach.instrucoes_raloca, coach.instrucoes_radoveca, coach.instrucoes_noshow, leadNome, leadContext, qualificationItems, apresentacaoItems, fechamentoItems, showRateItems, showRateData?.score]
  );

  // Filter STT hallucinations
  const isHallucination = useCallback((text: string): boolean => {
    const cleaned = text.trim().toLowerCase();
    if (!cleaned) return true;
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

  // Manual audio piping
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const scribeConnectedRef = useRef(false);
  const scribeRef = useRef(scribe);
  scribeRef.current = scribe;

  useEffect(() => {
    if (!isRecording) return;
    let cancelled = false;
    // Track whether we created our own mic stream (so we know to stop it on cleanup)
    let ownsMicStream = false;

    const connectScribe = async () => {
      try {
        setConnectionError(null);
        const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
        if (error || !data?.token) {
          setConnectionError("Erro ao obter token: " + (error?.message || "No token"));
          return;
        }
        if (cancelled) return;

        await scribe.connect({ token: data.token, audioFormat: AudioFormat.PCM_16000, sampleRate: 16000 });
        scribeConnectedRef.current = true;
        if (cancelled) { scribe.disconnect(); scribeConnectedRef.current = false; return; }

        // Use the mixed audioStream (mic + system) from the recorder when available
        // This ensures we transcribe BOTH the SDR and the lead's audio
        let streamToUse: MediaStream;
        if (audioStream && audioStream.getAudioTracks().length > 0) {
          console.log("[Coaching] Using mixed audioStream (mic + system audio) with", audioStream.getAudioTracks().length, "tracks");
          streamToUse = audioStream;
        } else {
          console.log("[Coaching] No mixed stream available, falling back to mic-only");
          ownsMicStream = true;
          try {
            streamToUse = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
          } catch {
            try {
              streamToUse = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const audioInput = devices.find((d) => d.kind === "audioinput");
              if (!audioInput) { setConnectionError("Nenhum microfone encontrado"); return; }
              streamToUse = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: audioInput.deviceId } },
              });
            }
          }
        }
        if (cancelled) {
          if (ownsMicStream) streamToUse.getTracks().forEach(t => t.stop());
          scribe.disconnect(); scribeConnectedRef.current = false;
          return;
        }
        micStreamRef.current = streamToUse;

        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(streamToUse);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!scribeConnectedRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          const uint8 = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = btoa(binary);
          try { scribeRef.current.sendAudio(base64, { sampleRate: 16000 }); } catch {}
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
        setConnectionError(null);
      } catch (e: any) {
        console.error("[Coaching] Connection error:", e);
        setConnectionError("Erro ao conectar: " + (e.message || String(e)));
      }
    };

    connectScribe();
    return () => {
      cancelled = true;
      if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
      // Only stop tracks if we created them ourselves; the recorder owns the mixed stream
      if (ownsMicStream && micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); }
      micStreamRef.current = null;
      scribeConnectedRef.current = false;
      scribe.disconnect();
      allTranscriptsRef.current = [];
    };
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRecording || !scribe.isConnected) { setMicLevel(0); return; }
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
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isRecording, scribe.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isRecording) return null;

  const filteredTranscripts = scribe.committedTranscripts.filter((t) => !isHallucination(t.text));

  // Priority highlights
  const hasHighIntensityObjection = objections.some(o => !o.addressed && o.intensity === "alta");
  const lowShowRate = (showRateData?.score ?? 100) < 55;

  return (
    <div className="flex gap-3 mt-3 overflow-hidden" style={{ height: 'calc(100vh - 260px)' }}>
      {/* ─── LEFT COLUMN (70%) — Command Grid ─── */}
      <div className="flex-[7] flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
        {/* Row 1: Script + RECA */}
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: '35%' }}>
          <ScriptCard
            apresentacaoItems={apresentacaoItems}
            qualificationItems={qualificationItems}
            fechamentoItems={fechamentoItems}
            apresentacaoDone={apresentacaoDone}
            qualificationDone={qualificationDone}
            fechamentoDone={fechamentoDone}
          />
          <RecaCard items={recaItems} />
        </div>

        {/* Row 2: RALOCA + RADOVECA */}
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: '30%' }}>
          <RalocaCard items={ralocaItems} />
          <div className={`transition-all duration-300 ${hasHighIntensityObjection ? "ring-2 ring-red-500/30 rounded-lg" : ""}`}>
            <RadovecaCard objections={objections} />
          </div>
        </div>

        {/* Row 3: Show Rate (full width) */}
        <div className={`transition-all duration-300 ${lowShowRate ? "ring-2 ring-orange-500/30 rounded-lg" : ""}`}>
          <ShowRateCard showRate={showRateData} prevScore={prevShowRateScore} />
        </div>

        {/* Instructions button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1 shrink-0">
              <BookOpen className="h-3 w-3" />
              Instruções do Roteiro
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Instruções de Qualificação</SheetTitle>
            </SheetHeader>
            <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
              <ReactMarkdown>{INSTRUCTIONS_TEXT}</ReactMarkdown>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ─── RIGHT COLUMN (30%) — Transcription ─── */}
      <div className="flex-[3] min-h-0">
        <TranscriptionPanel
          isConnected={scribe.isConnected}
          isAnalyzing={isAnalyzing}
          connectionError={connectionError}
          micLevel={micLevel}
          committedTranscripts={filteredTranscripts}
          partialTranscript={scribe.partialTranscript}
        />
      </div>
    </div>
  );
}
