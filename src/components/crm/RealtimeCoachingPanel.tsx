import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Mic, MicOff, Loader2, ClipboardList, Heart, Brain, BookOpen, Presentation, Star, Volume2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { type RoboCoach } from "@/hooks/useRobosCoach";
import { useActiveScriptSdr, type ScriptSdr } from "@/hooks/useScriptsSdr";
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
  type CoachingState,
  type CoachingSugestaoAtiva,
  type CoachingRealtimeResponse,
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
  micStream: MediaStream | null;
  systemStream: MediaStream | null;
  topBarOnly?: boolean;
  bottomOnly?: boolean;
  audioMonitor?: AudioMonitorInfo;
  script?: ScriptSdr | null;
}

interface LabeledTranscript {
  id: string;
  text: string;
  speaker: "sdr" | "lead";
  timestamp: number;
}

export function RealtimeCoachingPanel({
  coach,
  leadNome,
  leadContext,
  isRecording,
  micStream,
  systemStream,
  topBarOnly,
  bottomOnly,
  audioMonitor,
  script: scriptProp,
}: RealtimeCoachingPanelProps) {
  // Use script from prop (funil config) or fallback to global active script
  const { data: fallbackScript } = useActiveScriptSdr();
  const activeScript = scriptProp !== undefined ? scriptProp : fallbackScript;

  const [apresentacaoDone, setApresentacaoDone] = useState<string[]>([]);
  const [qualificationDone, setQualificationDone] = useState<string[]>([]);
  const [showRateDone, setShowRateDone] = useState<string[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [recaItems, setRecaItems] = useState<DynamicItem[]>([]);
  const [ralocaItems, setRalocaItems] = useState<DynamicItem[]>([]);
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());
  const [generatingItemFor, setGeneratingItemFor] = useState<string | null>(null);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [labeledTranscripts, setLabeledTranscripts] = useState<LabeledTranscript[]>([]);
  const [sdrPartial, setSdrPartial] = useState("");
  const [leadPartial, setLeadPartial] = useState("");
  const lastAnalyzedRef = useRef("");
  const isAnalyzingRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const lastAnalyzedIndexRef = useRef(0);
  const coachingStateRef = useRef<CoachingState>({
    sugestoes_ativas: [],
    sugestoes_encerradas: [],
  });
  // Refs for detector items to avoid stale closures in requestAnalysis
  const recaItemsRef = useRef<DynamicItem[]>([]);
  const ralocaItemsRef = useRef<DynamicItem[]>([]);
  const objectionsRef = useRef<Objection[]>([]);
  recaItemsRef.current = recaItems;
  ralocaItemsRef.current = ralocaItems;
  objectionsRef.current = objections;

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
      if (!transcript || transcript.trim().length < 10 || transcript === lastAnalyzedRef.current || isAnalyzingRef.current) return;
      
      // Build delta transcript from new entries only
      const allEntries = labeledTranscriptsRef.current;
      const newEntries = allEntries.slice(lastAnalyzedIndexRef.current);
      if (newEntries.length === 0) return;
      
      const newTranscript = newEntries
        .map((t) => `[${t.speaker === "sdr" ? "SDR" : "Lead"}]: ${t.text}`)
        .join("\n");
      
      console.log(`[Coaching] Delta: ${newEntries.length} novas entradas (${newTranscript.length} chars)`);
      lastAnalyzedRef.current = transcript;
      lastAnalyzedIndexRef.current = allEntries.length;
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      try {
        // Build coaching items for detector (current items on screen)
        const coachingItemsForDetector = {
          reca: recaItemsRef.current.map(i => ({ id: i.id, label: i.label, description: i.description })),
          raloca: ralocaItemsRef.current.map(i => ({ id: i.id, label: i.label, description: i.description })),
          objections: objectionsRef.current.map(o => ({ id: o.id, label: o.objection, description: o.suggested_response })),
        };

        // Two AI calls in parallel: detector (full transcript) + coaching (delta + state)
        const [scriptResult, coachResult] = await Promise.all([
          supabase.functions.invoke("script-checker", {
            body: {
              transcript,
              scriptItems: {
                qualificacao: qualificationItems,
                apresentacao: apresentacaoItems,
                show_rate: showRateItems,
              },
              coachingItems: coachingItemsForDetector,
              detectorPrompt: coach.instrucoes_detector || undefined,
            },
          }),
          supabase.functions.invoke("coaching-realtime", {
            body: {
              newTranscript,
              coachingState: coachingStateRef.current,
              coachInstructions: coach.instrucoes,
              leadName: leadNome,
              leadContext,
            },
          }),
        ]);

        // Process detector result (script items strikethrough only)
        if (scriptResult.error) {
          console.error("[Coaching] script-checker error:", scriptResult.error);
        } else {
          const analysis = scriptResult.data?.analysis;
          console.log("[Coaching] detector result:", JSON.stringify(analysis));
          if (analysis) {
            setApresentacaoDone(prev => {
              const merged = new Set(prev);
              for (const id of (analysis.apresentacao_done || [])) merged.add(id);
              return Array.from(merged);
            });
            setQualificationDone(prev => {
              const merged = new Set(prev);
              for (const id of (analysis.qualification_done || [])) merged.add(id);
              return Array.from(merged);
            });
            setShowRateDone(prev => {
              const merged = new Set(prev);
              for (const id of (analysis.show_rate_done || [])) merged.add(id);
              return Array.from(merged);
            });
          }
        }

        // Process coaching-realtime result (updates + new_items)
        if (coachResult.error) {
          console.error("[Coaching] coaching-realtime error:", coachResult.error);
        } else {
          const response = coachResult.data?.analysis as CoachingRealtimeResponse | undefined;
          if (response) {
            // Apply updates to existing items
            const updates = response.updates || [];
            for (const upd of updates) {
              if (upd.new_status === "DITO" || upd.new_status === "TIMING_PASSOU") {
                // Move from ativas to encerradas in persistent state
                const item = coachingStateRef.current.sugestoes_ativas.find(s => s.id === upd.id);
                if (item) {
                  coachingStateRef.current = {
                    sugestoes_ativas: coachingStateRef.current.sugestoes_ativas.filter(s => s.id !== upd.id),
                    sugestoes_encerradas: [...coachingStateRef.current.sugestoes_encerradas, {
                      id: item.id,
                      gatilho: item.gatilho,
                      classificacao: item.classificacao,
                      status: upd.new_status,
                    }],
                  };
                }
                // Update UI state
                if (upd.new_status === "DITO") {
                  setRecaItems(prev => prev.map(i => i.id === upd.id ? { ...i, done: true } : i));
                  setRalocaItems(prev => prev.map(i => i.id === upd.id ? { ...i, done: true } : i));
                  setObjections(prev => prev.map(o => o.id === upd.id ? { ...o, addressed: true } : o));
                } else {
                  // TIMING_PASSOU — discard from UI
                  setDiscardedIds(prev => new Set(prev).add(upd.id));
                }
              }
            }

            // Add new items
            const newItems = response.new_items;
            if (newItems) {
              // Add to persistent state + UI
              for (const o of (newItems.objections || [])) {
                const exists = coachingStateRef.current.sugestoes_ativas.some(s => s.id === o.id)
                  || coachingStateRef.current.sugestoes_encerradas.some(s => s.id === o.id);
                if (!exists) {
                  coachingStateRef.current.sugestoes_ativas.push({
                    id: o.id,
                    gatilho: o.objection,
                    classificacao: "RAPOVECA",
                    resposta_sugerida: o.suggested_response,
                    status: "aguardando",
                  });
                }
              }
              for (const i of (newItems.reca_items || [])) {
                const exists = coachingStateRef.current.sugestoes_ativas.some(s => s.id === i.id)
                  || coachingStateRef.current.sugestoes_encerradas.some(s => s.id === i.id);
                if (!exists) {
                  coachingStateRef.current.sugestoes_ativas.push({
                    id: i.id,
                    gatilho: i.label,
                    classificacao: "RECA",
                    resposta_sugerida: i.description,
                    status: "aguardando",
                  });
                }
              }
              for (const i of (newItems.raloca_items || [])) {
                const exists = coachingStateRef.current.sugestoes_ativas.some(s => s.id === i.id)
                  || coachingStateRef.current.sugestoes_encerradas.some(s => s.id === i.id);
                if (!exists) {
                  coachingStateRef.current.sugestoes_ativas.push({
                    id: i.id,
                    gatilho: i.label,
                    classificacao: "RALOCA",
                    resposta_sugerida: i.description,
                    status: "aguardando",
                  });
                }
              }

              // Update UI states (merge, don't replace)
              setObjections(prev => {
                const merged = new Map(prev.map(o => [o.id, o]));
                for (const o of (newItems.objections || [])) {
                  if (!merged.has(o.id)) merged.set(o.id, o);
                }
                return Array.from(merged.values());
              });
              setRecaItems(prev => {
                const merged = new Map(prev.map(i => [i.id, i]));
                for (const i of (newItems.reca_items || [])) {
                  if (!merged.has(i.id)) merged.set(i.id, i);
                }
                return Array.from(merged.values());
              });
              setRalocaItems(prev => {
                const merged = new Map(prev.map(i => [i.id, i]));
                for (const i of (newItems.raloca_items || [])) {
                  if (!merged.has(i.id)) merged.set(i.id, i);
                }
                return Array.from(merged.values());
              });
            }
          }
        }
      } catch (e) {
        console.error("[Coaching] Request error:", e);
      } finally {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    },
    [coach.instrucoes, coach.instrucoes_detector, leadNome, leadContext, qualificationItems, apresentacaoItems, showRateItems]
  );

  // Filter out STT hallucinations that occur during silence
  const isHallucination = useCallback((text: string): boolean => {
    const cleaned = text.trim().toLowerCase();
    if (!cleaned) return true;
    
    // Filter very short texts (less than 2 real words)
    const words = cleaned.replace(/[^\w\sáàâãéèêíïóôõúüç]/gi, "").trim().split(/\s+/).filter(w => w.length > 1);
    if (words.length < 2) return true;
    
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
      // New silence hallucination patterns
      /^que\s+[ée]\s+o\??$/i,
      /^o\s+qu[ée]\??$/i,
      /^\.+$/,
      /^[\s\W]{0,5}$/,
    ];
    for (const pattern of hallucinationPatterns) {
      if (pattern.test(cleaned)) return true;
    }
    return false;
  }, []);

  // Ref to accumulate full labeled transcript for AI analysis
  const labeledTranscriptsRef = useRef<LabeledTranscript[]>([]);

  // Helper: build full transcript string with speaker labels
  const buildFullTranscript = useCallback(() => {
    return labeledTranscriptsRef.current
      .map((t) => `[${t.speaker === "sdr" ? "SDR" : "Lead"}]: ${t.text}`)
      .join("\n");
  }, []);

  const addTranscript = useCallback((text: string, speaker: "sdr" | "lead") => {
    if (!text?.trim() || isHallucination(text)) return;
    const entry: LabeledTranscript = {
      id: `${speaker}-${Date.now()}-${Math.random()}`,
      text: text.trim(),
      speaker,
      timestamp: Date.now(),
    };
    labeledTranscriptsRef.current = [...labeledTranscriptsRef.current, entry];
    setLabeledTranscripts([...labeledTranscriptsRef.current]);
    // Auto-scroll to bottom
    setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    requestAnalysis(buildFullTranscript());
  }, [isHallucination, requestAnalysis, buildFullTranscript]);

  // --- Dual Scribe connections: SDR (mic) and Lead (system audio) ---
  // NOTE: No microphone option = manual mode. We pipe audio via sendAudio().
  const sdrScribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "por",
    commitStrategy: CommitStrategy.VAD,
    onCommittedTranscript: (data) => addTranscript(data.text, "sdr"),
    onPartialTranscript: (data) => setSdrPartial(data.text || ""),
    onError: (err) => console.error("[Coaching] SDR Scribe error:", err),
  });

  const leadScribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "por",
    commitStrategy: CommitStrategy.VAD,
    onCommittedTranscript: (data) => addTranscript(data.text, "lead"),
    onPartialTranscript: (data) => setLeadPartial(data.text || ""),
    onError: (err) => console.error("[Coaching] Lead Scribe error:", err),
  });

  // Connect both Scribe instances when recording starts
  useEffect(() => {
    if (!isRecording) return;
    let cancelled = false;

    const connectBoth = async () => {
      try {
        setConnectionError(null);

        // Get 2 tokens in parallel
        const [sdrTokenRes, leadTokenRes] = await Promise.all([
          supabase.functions.invoke("elevenlabs-scribe-token"),
          supabase.functions.invoke("elevenlabs-scribe-token"),
        ]);

        if (sdrTokenRes.error || !sdrTokenRes.data?.token) {
          setConnectionError("Erro ao obter token SDR: " + (sdrTokenRes.error?.message || "No token"));
          return;
        }
        if (leadTokenRes.error || !leadTokenRes.data?.token) {
          setConnectionError("Erro ao obter token Lead: " + (leadTokenRes.error?.message || "No token"));
          return;
        }
        if (cancelled) return;

        // Connect in manual audio mode — pass audioFormat + sampleRate at connect time
        await Promise.all([
          sdrScribe.connect({
            token: sdrTokenRes.data.token,
            audioFormat: AudioFormat.PCM_16000,
            sampleRate: 16000,
          }),
          leadScribe.connect({
            token: leadTokenRes.data.token,
            audioFormat: AudioFormat.PCM_16000,
            sampleRate: 16000,
          }),
        ]);

        if (cancelled) {
          sdrScribe.disconnect();
          leadScribe.disconnect();
          return;
        }
        setConnectionError(null);
        console.log("[Coaching] Dual Scribe connected (SDR + Lead)");
      } catch (e: any) {
        console.error("[Coaching] Connection error:", e);
        setConnectionError("Erro ao conectar: " + (e.message || String(e)));
      }
    };

    connectBoth();
    return () => {
      cancelled = true;
      sdrScribe.disconnect();
      leadScribe.disconnect();
      labeledTranscriptsRef.current = [];
      lastAnalyzedIndexRef.current = 0;
      coachingStateRef.current = { sugestoes_ativas: [], sugestoes_encerradas: [] };
      setLabeledTranscripts([]);
      setSdrPartial("");
      setLeadPartial("");
    };
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to pipe a MediaStream into a Scribe instance at 16 kHz PCM16
  const pipeStreamToScribe = useCallback((stream: MediaStream, scribeInstance: ReturnType<typeof useScribe>) => {
    // Browser may ignore the sampleRate hint; we'll resample if needed
    const ctx = new AudioContext({ sampleRate: 16000 });
    const actualRate = ctx.sampleRate;
    const targetRate = 16000;
    const source = ctx.createMediaStreamSource(stream);
    const bufferSize = 4096;
    const processor = ctx.createScriptProcessor(bufferSize, 1, 1);

    // Simple linear resampler for when browser ignores sampleRate hint
    const resample = (input: Float32Array, fromRate: number, toRate: number): Float32Array => {
      if (fromRate === toRate) return input;
      const ratio = fromRate / toRate;
      const outLen = Math.round(input.length / ratio);
      const output = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const srcIdx = i * ratio;
        const lo = Math.floor(srcIdx);
        const hi = Math.min(lo + 1, input.length - 1);
        const frac = srcIdx - lo;
        output[i] = input[lo] * (1 - frac) + input[hi] * frac;
      }
      return output;
    };

    processor.onaudioprocess = (e) => {
      const rawFloat32 = e.inputBuffer.getChannelData(0);
      // Resample if the AudioContext didn't honor 16kHz
      const float32 = actualRate !== targetRate
        ? resample(rawFloat32, actualRate, targetRate)
        : rawFloat32;
      const pcm16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      scribeInstance.sendAudio(btoa(binary));
    };

    source.connect(processor);
    // Connect to destination to keep processing alive (output is silent anyway)
    processor.connect(ctx.destination);
    console.log(`[Coaching] Audio piping started: ctx.sampleRate=${actualRate}, target=${targetRate}`);
    return () => {
      processor.disconnect();
      source.disconnect();
      ctx.close();
    };
  }, []);

  // Pipe mic stream → SDR Scribe
  useEffect(() => {
    if (!micStream || !sdrScribe.isConnected) return;
    const cleanup = pipeStreamToScribe(micStream, sdrScribe);
    console.log("[Coaching] Mic audio piping started (SDR)");
    return cleanup;
  }, [micStream, sdrScribe.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pipe system stream → Lead Scribe
  useEffect(() => {
    if (!systemStream || !leadScribe.isConnected) return;
    const cleanup = pipeStreamToScribe(systemStream, leadScribe);
    console.log("[Coaching] System audio piping started (Lead)");
    return cleanup;
  }, [systemStream, leadScribe.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Manual check/discard handlers ---
  const handleCheckApresentacao = useCallback((id: string) => {
    setApresentacaoDone(prev => [...new Set([...prev, id])]);
  }, []);
  const handleCheckQualificacao = useCallback((id: string) => {
    setQualificationDone(prev => [...new Set([...prev, id])]);
  }, []);
  const handleCheckShowRate = useCallback((id: string) => {
    setShowRateDone(prev => [...new Set([...prev, id])]);
  }, []);
  const handleCheckReca = useCallback((id: string) => {
    setRecaItems(prev => prev.map(i => i.id === id ? { ...i, done: true } : i));
    // Sync persistent state
    const item = coachingStateRef.current.sugestoes_ativas.find(s => s.id === id);
    if (item) {
      coachingStateRef.current = {
        sugestoes_ativas: coachingStateRef.current.sugestoes_ativas.filter(s => s.id !== id),
        sugestoes_encerradas: [...coachingStateRef.current.sugestoes_encerradas, { id: item.id, gatilho: item.gatilho, classificacao: item.classificacao, status: "DITO" }],
      };
    }
  }, []);
  const handleCheckRaloca = useCallback((id: string) => {
    setRalocaItems(prev => prev.map(i => i.id === id ? { ...i, done: true } : i));
    const item = coachingStateRef.current.sugestoes_ativas.find(s => s.id === id);
    if (item) {
      coachingStateRef.current = {
        sugestoes_ativas: coachingStateRef.current.sugestoes_ativas.filter(s => s.id !== id),
        sugestoes_encerradas: [...coachingStateRef.current.sugestoes_encerradas, { id: item.id, gatilho: item.gatilho, classificacao: item.classificacao, status: "DITO" }],
      };
    }
  }, []);
  const handleAddressedObjection = useCallback((id: string) => {
    setObjections(prev => prev.map(o => o.id === id ? { ...o, addressed: true } : o));
    const item = coachingStateRef.current.sugestoes_ativas.find(s => s.id === id);
    if (item) {
      coachingStateRef.current = {
        sugestoes_ativas: coachingStateRef.current.sugestoes_ativas.filter(s => s.id !== id),
        sugestoes_encerradas: [...coachingStateRef.current.sugestoes_encerradas, { id: item.id, gatilho: item.gatilho, classificacao: item.classificacao, status: "DITO" }],
      };
    }
  }, []);
  const handleDiscard = useCallback((id: string) => {
    setDiscardedIds(prev => new Set(prev).add(id));
    const item = coachingStateRef.current.sugestoes_ativas.find(s => s.id === id);
    if (item) {
      coachingStateRef.current = {
        sugestoes_ativas: coachingStateRef.current.sugestoes_ativas.filter(s => s.id !== id),
        sugestoes_encerradas: [...coachingStateRef.current.sugestoes_encerradas, { id: item.id, gatilho: item.gatilho, classificacao: item.classificacao, status: "DESCARTADO" }],
      };
    }
  }, []);

  // Generate a coaching item from a specific lead phrase
  const handleGenerateFromLead = useCallback(async (transcriptEntry: LabeledTranscript, type: "reca" | "raloca" | "rapoveca") => {
    setGeneratingItemFor(transcriptEntry.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-coaching-item", {
        body: {
          leadPhrase: transcriptEntry.text,
          type,
          leadName: leadNome,
          coachInstructions: type === "reca" ? coach.instrucoes_reca
            : type === "raloca" ? coach.instrucoes_raloca
            : coach.instrucoes_radoveca,
        },
      });

      if (error) throw error;
      if (!data?.item) throw new Error("No item returned");

      const item = data.item;

      if (type === "rapoveca") {
        const itemId = item.id || `manual-${Date.now()}`;
        setObjections(prev => [...prev, {
          id: itemId,
          objection: item.objection,
          suggested_response: item.suggested_response,
          addressed: false,
        }]);
        coachingStateRef.current.sugestoes_ativas.push({
          id: itemId, gatilho: item.objection, classificacao: "RAPOVECA",
          resposta_sugerida: item.suggested_response, status: "aguardando",
        });
      } else {
        const itemId = item.id || `manual-${Date.now()}`;
        const newItem: DynamicItem = {
          id: itemId,
          label: item.label,
          description: item.description,
          done: false,
        };
        const classificacao = type === "reca" ? "RECA" as const : "RALOCA" as const;
        if (type === "reca") {
          setRecaItems(prev => [...prev, newItem]);
        } else {
          setRalocaItems(prev => [...prev, newItem]);
        }
        coachingStateRef.current.sugestoes_ativas.push({
          id: itemId, gatilho: item.label, classificacao,
          resposta_sugerida: item.description, status: "aguardando",
        });
      }

      toast({ title: "Sugestão gerada!", description: `Item ${type.toUpperCase()} adicionado com sucesso.` });
    } catch (e: any) {
      console.error("[Coaching] generate-coaching-item error:", e);
      toast({ title: "Erro ao gerar sugestão", description: e.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setGeneratingItemFor(null);
    }
  }, [leadNome, coach.instrucoes_reca, coach.instrucoes_raloca, coach.instrucoes_radoveca, toast]);

  if (!isRecording) return null;

  const isConnected = sdrScribe.isConnected || leadScribe.isConnected;

  // Unified top bar: transcription + audio monitor in one card
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const topBar = (
    <Card className="border-primary/20 flex flex-col h-full max-h-full overflow-hidden">
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
      <CardContent className="px-3 pb-2 flex-1 min-h-0 overflow-hidden">
        {connectionError && <p className="text-[10px] text-destructive mb-1">{connectionError}</p>}
        <div className="h-[180px] overflow-y-auto pr-1">
          <div className="space-y-0.5 text-xs">
            {labeledTranscripts.map((t) => (
              t.speaker === "lead" ? (
                <Popover key={t.id}>
                  <PopoverTrigger asChild>
                    <p className="cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors text-foreground">
                      <span className="font-semibold text-muted-foreground">Lead:</span>{" "}
                      {t.text}
                      {generatingItemFor === t.id && <Loader2 className="inline h-3 w-3 ml-1 animate-spin text-primary" />}
                    </p>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1.5 flex gap-1" side="top" align="start">
                    {generatingItemFor === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary mx-4 my-1" />
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] gap-1 px-2"
                          onClick={() => handleGenerateFromLead(t, "reca")}
                        >
                          <Heart className="h-3 w-3 text-red-500" />
                          RECA
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] gap-1 px-2"
                          onClick={() => handleGenerateFromLead(t, "raloca")}
                        >
                          <Brain className="h-3 w-3 text-purple-500" />
                          RALOCA
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] gap-1 px-2"
                          onClick={() => handleGenerateFromLead(t, "rapoveca")}
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          RAPOVECA
                        </Button>
                      </>
                    )}
                  </PopoverContent>
                </Popover>
              ) : (
                <p key={t.id} className="text-primary">
                  <span className="font-semibold text-muted-foreground">SDR:</span>{" "}
                  {t.text}
                </p>
              )
            ))}
            {(sdrPartial || leadPartial) && (
              <>
                {sdrPartial && <p className="text-primary/60 italic"><span className="font-semibold">SDR:</span> {sdrPartial}</p>}
                {leadPartial && <p className="text-muted-foreground italic"><span className="font-semibold">Lead:</span> {leadPartial}</p>}
              </>
            )}
            {!labeledTranscripts.length && !sdrPartial && !leadPartial && (
              <p className="text-muted-foreground text-xs text-center py-2">Aguardando fala...</p>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
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
            items={apresentacaoItems.filter(i => !discardedIds.has(i.id))}
            completedIds={apresentacaoDone}
            className="flex-none"
            onCheck={handleCheckApresentacao}
            onDiscard={handleDiscard}
          />
        )}
        <ChecklistCard
          title="Qualificação"
          icon={ClipboardList}
          iconColor="text-blue-500"
          items={qualificationItems.filter(i => !discardedIds.has(i.id))}
          completedIds={qualificationDone}
          onCheck={handleCheckQualificacao}
          onDiscard={handleDiscard}
        />
        {showRateItems.length > 0 && (
          <ChecklistCard
            title="Show Rate"
            icon={Star}
            iconColor="text-amber-500"
            items={showRateItems.filter(i => !discardedIds.has(i.id))}
            completedIds={showRateDone}
            className="flex-none"
            onCheck={handleCheckShowRate}
            onDiscard={handleDiscard}
          />
        )}
      </div>

      {/* Column 2: Objeções + RECA + RALOCA */}
      <div className="flex-1 flex flex-col gap-2">
        <ObjectionsCard
          objections={objections.filter(o => !discardedIds.has(o.id))}
          onAddressed={handleAddressedObjection}
          onDiscard={handleDiscard}
        />
        <DynamicChecklistCard
          title="RECA — Emocionais"
          icon={Heart}
          iconColor="text-red-500"
          items={recaItems.filter(i => !discardedIds.has(i.id))}
          emptyMessage="Aguardando análise..."
          onCheck={handleCheckReca}
          onDiscard={handleDiscard}
        />
        <DynamicChecklistCard
          title="RALOCA — Lógicos"
          icon={Brain}
          iconColor="text-purple-500"
          items={ralocaItems.filter(i => !discardedIds.has(i.id))}
          emptyMessage="Aguardando análise..."
          onCheck={handleCheckRaloca}
          onDiscard={handleDiscard}
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
