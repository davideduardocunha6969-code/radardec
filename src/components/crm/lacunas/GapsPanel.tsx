import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, Copy, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCrmLeadCampos } from "@/hooks/useCrmLeadCampos";
import { estimarImpactoCampo } from "@/utils/trabalhista/calculator";
import { getFieldValue } from "@/utils/trabalhista/types";
import { useToast } from "@/hooks/use-toast";
import type { DadosExtrasMap } from "@/utils/trabalhista/types";

interface GapsPanelProps {
  leadId: string;
  coachId: string;
  dados: DadosExtrasMap;
  dadosLoading: boolean;
}

interface GapWithImpact {
  key: string;
  nome: string;
  impacto_estimado: number;
}

interface AiGapResult {
  key: string;
  pergunta_sugerida: string;
  prioridade: string;
  justificativa: string;
  urgencia?: string;
  contexto_para_o_closer?: string;
}

export function GapsPanel({ leadId, coachId, dados, dadosLoading }: GapsPanelProps) {
  const { data: campos } = useCrmLeadCampos();
  const { toast } = useToast();
  const [aiResults, setAiResults] = useState<AiGapResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGapsHashRef = useRef("");

  // Calculate gaps locally
  const gaps: GapWithImpact[] = (campos || [])
    .filter(c => {
      const { valor } = getFieldValue(dados, c.key);
      return !valor;
    })
    .map(c => ({
      key: c.key,
      nome: c.nome,
      impacto_estimado: estimarImpactoCampo(c.key, dados),
    }))
    .sort((a, b) => b.impacto_estimado - a.impacto_estimado);

  const gapsWithImpact = gaps.filter(g => g.impacto_estimado > 0);
  const gapsHash = gapsWithImpact.map(g => g.key).join(",");

  // Debounced AI call when gaps change
  useEffect(() => {
    if (dadosLoading || !coachId || gapsHash === lastGapsHashRef.current) return;
    if (gapsWithImpact.length < 3) {
      setAiResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      lastGapsHashRef.current = gapsHash;
      setAnalyzing(true);

      try {
        const { data, error } = await supabase.functions.invoke("analyze-gaps", {
          body: {
            leadId,
            coachId,
            gaps: gapsWithImpact.map(g => ({
              key: g.key,
              nome: g.nome,
              impacto_estimado: g.impacto_estimado,
            })),
          },
        });

        if (error) {
          console.error("[Lacunas] Error:", error);
          return;
        }

        setAiResults(data?.lacunas_priorizadas || []);
      } catch (e) {
        console.error("[Lacunas] Error:", e);
      } finally {
        setAnalyzing(false);
      }
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [gapsHash, dadosLoading, coachId, leadId, gapsWithImpact]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Pergunta copiada para a área de transferência." });
  }, [toast]);

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const getPriorityBadge = (impacto: number) => {
    if (impacto >= 50000) return <Badge className="bg-red-500 text-white text-[10px]">Alta</Badge>;
    if (impacto >= 10000) return <Badge className="bg-yellow-500 text-white text-[10px]">Média</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Baixa</Badge>;
  };

  // Merge AI results with local gaps
  const aiMap = new Map(aiResults.map(r => [r.key, r]));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          Lacunas e Perguntas Sugeridas
          {gapsWithImpact.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {gapsWithImpact.length} lacuna{gapsWithImpact.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {analyzing && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {dadosLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : gapsWithImpact.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Todos os campos relevantes já estão preenchidos.
          </p>
        ) : gapsWithImpact.length < 3 ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground italic flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Poucas lacunas restantes — análise IA desativada.
            </p>
            {gapsWithImpact.map(g => (
              <div key={g.key} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5 border border-border/50">
                <span className="truncate">{g.nome}</span>
                <span className="text-muted-foreground shrink-0">{formatBRL(g.impacto_estimado)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {gapsWithImpact.map(g => {
              const ai = aiMap.get(g.key);
              return (
                <div
                  key={g.key}
                  className="rounded-lg border border-border/50 bg-card/50 p-2.5 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(g.impacto_estimado)}
                    <span className="text-xs font-medium truncate flex-1">{g.nome}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatBRL(g.impacto_estimado)}
                    </span>
                  </div>

                  {ai?.pergunta_sugerida ? (
                    <div className="flex items-start gap-1.5">
                      <p className="text-xs text-foreground/80 italic flex-1">
                        "{ai.pergunta_sugerida}"
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => handleCopy(ai.pergunta_sugerida)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : analyzing ? (
                    <div className="h-4 bg-muted/50 rounded animate-pulse" />
                  ) : null}

                  {ai?.contexto_para_o_closer && (
                    <p className="text-[10px] text-muted-foreground">
                      💡 {ai.contexto_para_o_closer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
