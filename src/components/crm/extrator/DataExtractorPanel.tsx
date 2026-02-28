import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSearch, CheckCircle, AlertTriangle, Lock, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCrmLeadCampos } from "@/hooks/useCrmLeadCampos";
import type { LabeledTranscript } from "@/components/crm/RealtimeCoachingPanel";
import type { DadosExtrasField, DadosExtrasMap } from "@/utils/trabalhista/types";
import type { UseLeadDadosSyncReturn } from "@/hooks/useLeadDadosSync";

interface DataExtractorPanelProps {
  leadId: string;
  coachId: string;
  transcriptChunks: LabeledTranscript[];
  dados: DadosExtrasMap;
  dadosLoading: boolean;
  setField: UseLeadDadosSyncReturn["setField"];
  setFields: UseLeadDadosSyncReturn["setFields"];
}

interface ExtractedField {
  key: string;
  valor: string;
  confianca: string;
}

export function DataExtractorPanel({ leadId, coachId, transcriptChunks, dados, dadosLoading, setField, setFields }: DataExtractorPanelProps) {
  const { data: campos } = useCrmLeadCampos();
  const [extracting, setExtracting] = useState(false);
  const [pendingReview, setPendingReview] = useState<ExtractedField[]>([]);
  const [autoFilled, setAutoFilled] = useState<ExtractedField[]>([]);
  const lastProcessedCountRef = useRef(0);
  const processingRef = useRef(false);

  const campoMap = new Map((campos || []).map(c => [c.key, c.nome]));

  // Process new transcript chunks
  useEffect(() => {
    if (
      !coachId ||
      !leadId ||
      transcriptChunks.length === 0 ||
      transcriptChunks.length === lastProcessedCountRef.current ||
      processingRef.current
    ) return;

    const newChunks = transcriptChunks.slice(lastProcessedCountRef.current);
    if (newChunks.length === 0) return;

    processingRef.current = true;
    lastProcessedCountRef.current = transcriptChunks.length;

    const transcript = newChunks
      .map(c => `[${c.speaker === "sdr" ? "SDR" : "Lead"}]: ${c.text}`)
      .join("\n");

    setExtracting(true);

    supabase.functions.invoke("extract-lead-data", {
      body: { leadId, coachId, transcript },
    }).then(({ data, error }) => {
      if (error) {
        console.error("[Extrator] Error:", error);
        return;
      }

      const extraidos: ExtractedField[] = data?.extraidos || [];
      const highConf: ExtractedField[] = [];
      const reviewNeeded: ExtractedField[] = [];

      for (const item of extraidos) {
        if (item.confianca === "alta") {
          highConf.push(item);
        } else {
          reviewNeeded.push(item);
        }
      }

      if (highConf.length > 0) {
        setAutoFilled(prev => {
          const map = new Map(prev.map(f => [f.key, f]));
          highConf.forEach(f => map.set(f.key, f));
          return Array.from(map.values());
        });
        // Save high confidence via hook (will skip manual fields)
        setFields(highConf.map(f => ({
          key: f.key,
          valor: f.valor,
          origem: "extrator_automatico" as DadosExtrasField["origem"],
          confianca: "alta" as DadosExtrasField["confianca"],
        })));
      }

      if (reviewNeeded.length > 0) {
        setPendingReview(prev => {
          const map = new Map(prev.map(f => [f.key, f]));
          reviewNeeded.forEach(f => map.set(f.key, f));
          return Array.from(map.values());
        });
      }
    }).finally(() => {
      setExtracting(false);
      processingRef.current = false;
    });
  }, [transcriptChunks.length, coachId, leadId, setFields]);

  const handleConfirm = useCallback(async (field: ExtractedField) => {
    await setField(field.key, field.valor, "preenchimento_manual");
    setPendingReview(prev => prev.filter(f => f.key !== field.key));
    setAutoFilled(prev => [...prev, { ...field, confianca: "alta" }]);
  }, [setField]);

  // Get manual fields from dados
  const manualFields = Object.entries(dados)
    .filter(([, v]) => typeof v === "object" && v.origem === "preenchimento_manual")
    .map(([key, v]) => ({ key, valor: typeof v === "string" ? v : v.valor }));

  const totalExtracted = autoFilled.length + pendingReview.length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-primary" />
          Extrator de Dados
          {totalExtracted > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {totalExtracted} extraído{totalExtracted !== 1 ? "s" : ""}
            </Badge>
          )}
          {extracting && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dadosLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Auto-filled (high confidence) */}
            {autoFilled.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Preenchidos automaticamente
                </p>
                {autoFilled.map(f => (
                  <div key={f.key} className="flex items-center gap-2 text-xs bg-green-500/10 rounded px-2 py-1.5 border border-green-500/20">
                    <span className="text-muted-foreground truncate">{campoMap.get(f.key) || f.key}:</span>
                    <strong className="text-foreground truncate">{f.valor}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Pending review (medium/low confidence) */}
            {pendingReview.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Revisão necessária
                </p>
                {pendingReview.map(f => (
                  <div key={f.key} className="flex items-center gap-2 text-xs bg-yellow-500/10 rounded px-2 py-1.5 border border-yellow-500/20">
                    <span className="text-muted-foreground truncate flex-1">
                      {campoMap.get(f.key) || f.key}: <strong className="text-foreground">{f.valor}</strong>
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{f.confianca}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 shrink-0 text-green-600 hover:text-green-700"
                      onClick={() => handleConfirm(f)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual / locked fields */}
            {manualFields.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Preenchidos manualmente
                </p>
                {manualFields.slice(0, 5).map(f => (
                  <div key={f.key} className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1.5 border border-border/50">
                    <span className="text-muted-foreground truncate">{campoMap.get(f.key) || f.key}:</span>
                    <strong className="text-foreground truncate">{f.valor}</strong>
                  </div>
                ))}
                {manualFields.length > 5 && (
                  <p className="text-[10px] text-muted-foreground">+{manualFields.length - 5} campos manuais</p>
                )}
              </div>
            )}

            {/* Empty state */}
            {totalExtracted === 0 && manualFields.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Aguardando transcrição para extrair dados automaticamente...
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
