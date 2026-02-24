import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Loader2, ClipboardList, Presentation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type RoboCoach } from "@/hooks/useRobosCoach";
import { type ScriptSdr } from "@/hooks/useScriptsSdr";
import { Progress } from "@/components/ui/progress";
import { useScribe, CommitStrategy, AudioFormat } from "@elevenlabs/react";
import { ChecklistCard } from "./coaching/ChecklistCard";
import { ObjectionsCard } from "./coaching/ObjectionsCard";
import { RadarCard } from "./coaching/RadarCard";
import { AncorasCard } from "./coaching/AncorasCard";
import { DizerAgoraCard } from "./coaching/DizerAgoraCard";
import {
  QUALIFICATION_QUESTIONS,
  type CoachingAnalysis,
  type Objection,
  type ChecklistItem,
} from "./coaching/coachingData";

interface RealtimeCoachingPanelProps {
  coach: RoboCoach;
  leadNome: string;
  leadContext?: string;
  isRecording: boolean;
  audioStream: MediaStream | null;
  script?: ScriptSdr | null;
  leadId?: string;
}

interface RadarData {
  prova_tecnica: number;
  confianca_closer: number;
  conviccao_cliente: number;
  resistencia: number;
}

interface AncoraEmocional {
  frase: string;
  categoria: string;
  intensidade: string;
  utilizado: boolean;
  turno_capturado: number;
}

export function RealtimeCoachingPanel({
  coach,
  leadNome,
  leadContext,
  isRecording,
  script,
  leadId,
}: RealtimeCoachingPanelProps) {
  // V2 state
  const [radar, setRadar] = useState<RadarData>({ prova_tecnica: 0, confianca_closer: 5, conviccao_cliente: 0, resistencia: 0 });
  const [faseAtual, setFaseAtual] = useState(1);
  const [podeFechar, setPodeFechar] = useState(false);
  const [dizerAgora, setDizerAgora] = useState<string | null>(null);
  const [proximaPergunta, setProximaPergunta] = useState<string | null>(null);
  const [alertaCompliance, setAlertaCompliance] = useState<string | null>(null);
  const [ancoras, setAncoras] = useState<AncoraEmocional[]>([]);

  // Legacy-compatible state
  const [apresentacaoDone, setApresentacaoDone] = useState<string[]>([]);
  const [qualificationDone, setQualificationDone] = useState<string[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  const isAnalyzingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const sessionKeyRef = useRef(`${leadId || "unknown"}_${Date.now()}`);

  const qualificationItems: ChecklistItem[] = script?.qualificacao?.length
    ? script.qualificacao
    : QUALIFICATION_QUESTIONS;

  const apresentacaoItems: ChecklistItem[] = script?.apresentacao?.length
    ? script.apresentacao
    : [];

  const requestAnalysisV2 = useCallback(
    async (utterance: string) => {
      if (!utterance?.trim() || utterance.trim().length < 10 || isAnalyzingRef.current) return;
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      try {
        const { data, error } = await supabase.functions.invoke("coaching-realtime", {
          body: {
            session_key: sessionKeyRef.current,
            new_utterance: utterance,
            leadName: leadNome,
            leadContext,
            coachInstructions: coach.instrucoes,
            scriptItems: {
              qualificacao: qualificationItems,
              apresentacao: apresentacaoItems,
            },
          },
        });

        if (error) {
          console.error("[Coaching V2] AI error:", error);
          return;
        }

        const analysis = data?.analysis;
        if (analysis) {
          setApresentacaoDone(analysis.apresentacao_done || []);
          setQualificationDone(analysis.qualification_done || []);
          setObjections(analysis.objections || []);
          setDizerAgora(analysis.dizer_agora || null);
          setProximaPergunta(analysis.proxima_pergunta || null);
          setAlertaCompliance(analysis.alerta_compliance || null);
          if (analysis.radar) setRadar(analysis.radar);
          if (analysis.fase_atual) setFaseAtual(analysis.fase_atual);
          if (analysis.pode_fechar !== undefined) setPodeFechar(analysis.pode_fechar);
        }

        if (data?.ancoras) {
          setAncoras(data.ancoras);
        }
      } catch (e) {
        console.error("[Coaching V2] Request error:", e);
      } finally {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    },
    [coach.instrucoes, leadNome, leadContext, qualificationItems, apresentacaoItems]
  );

  // Filter STT hallucinations
  const isHallucination = useCallback((text: string): boolean => {
    const cleaned = text.trim().toLowerCase();
    if (!cleaned) return true;
    const hallucinationPatterns = [
      /p[ií]lulas\s+do\s+evangelho/i, /colabore\s+conosco/i,
      /nosso\s+time\s+de\s+colaboradores/i, /seja\s+voc[êe]\s+tamb[ée]m\s+um\s+volunt[áa]rio/i,
      /acesse\s+nosso\s+grupo/i, /tradu[çc][ãa]o/i, /transcri[çc][ãa]o.*facebook/i,
      /o\s+que\s+[ée]\s+o\s+que\s+[ée]/i, /legendas?\s+por\s+comunidade/i,
      /inscreva[\s-]*se/i, /obrigad[oa]\s+por\s+assistir/i, /amara\.org/i,
    ];
    return hallucinationPatterns.some((p) => p.test(cleaned));
  }, []);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "por",
    commitStrategy: CommitStrategy.VAD,
    onCommittedTranscript: (data) => {
      if (data.text?.trim() && !isHallucination(data.text)) {
        // V2: send each utterance individually
        requestAnalysisV2(data.text);
      }
    },
  });

  // Manual audio piping
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

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

        await scribe.connect({ token: data.token, audioFormat: AudioFormat.PCM_16000, sampleRate: 16000 });
        if (cancelled) { scribe.disconnect(); return; }

        let micStream: MediaStream;
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        } catch {
          try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInput = devices.find((d) => d.kind === "audioinput");
            if (!audioInput) { setConnectionError("Nenhum microfone encontrado"); return; }
            micStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: audioInput.deviceId } } });
          }
        }
        if (cancelled) { micStream.getTracks().forEach(t => t.stop()); scribe.disconnect(); return; }
        micStreamRef.current = micStream;

        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(micStream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!scribe.isConnected) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          const uint8 = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
          try { scribe.sendAudio(btoa(binary), { sampleRate: 16000 }); } catch { /* ignore */ }
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
        console.log("[Coaching V2] Scribe connected");
      } catch (e: any) {
        console.error("[Coaching V2] Connection error:", e);
        setConnectionError("Erro ao conectar: " + (e.message || String(e)));
      }
    };

    connectScribe();
    return () => {
      cancelled = true;
      if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
      scribe.disconnect();
    };
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mic level animation
  useEffect(() => {
    if (!isRecording || !scribe.isConnected) { setMicLevel(0); return; }
    let level = 0, direction = 1;
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

  const isConnected = scribe.isConnected;

  return (
    <div className="flex gap-2 mt-3 overflow-y-auto" style={{ height: 'calc(100vh - 260px)' }}>
      {/* Column 1: Radar + DIZER AGORA + Checklists */}
      <div className="flex-1 flex flex-col gap-2">
        <RadarCard radar={radar} faseAtual={faseAtual} podeFechar={podeFechar} />
        <DizerAgoraCard
          dizerAgora={dizerAgora}
          proximaPergunta={proximaPergunta}
          alertaCompliance={alertaCompliance}
        />
        {apresentacaoItems.length > 0 && (
          <ChecklistCard title="Apresentação" icon={Presentation} iconColor="text-emerald-500" items={apresentacaoItems} completedIds={apresentacaoDone} className="flex-none" />
        )}
        <ChecklistCard title="Qualificação" icon={ClipboardList} iconColor="text-blue-500" items={qualificationItems} completedIds={qualificationDone} />
      </div>

      {/* Column 2: Âncoras + Objeções + Transcrição */}
      <div className="flex-1 flex flex-col gap-2">
        <AncorasCard ancoras={ancoras} />
        <ObjectionsCard objections={objections} />

        {/* Compact Transcription */}
        <Card className="border-primary/20 flex-1 flex flex-col min-h-[0] self-stretch">
          <CardHeader className="pb-1 px-3 pt-2 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs flex items-center gap-1.5">
                {isConnected ? <Mic className="h-3.5 w-3.5 text-primary" /> : <MicOff className="h-3.5 w-3.5 text-muted-foreground" />}
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
                {scribe.committedTranscripts
                  .filter((t) => !isHallucination(t.text))
                  .map((t) => (
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
        </Card>
      </div>
    </div>
  );
}
