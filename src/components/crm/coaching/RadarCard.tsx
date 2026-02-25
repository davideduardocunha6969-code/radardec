import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Radar } from "lucide-react";
import type { RadarValues } from "./coachingData";

interface RadarCardProps {
  values: RadarValues | null;
  isLoading?: boolean;
}

const INDICATORS = [
  { key: "prova_tecnica" as const, label: "Prova Técnica", color: "bg-blue-500" },
  { key: "confianca" as const, label: "Confiança", color: "bg-emerald-500" },
  { key: "conviccao" as const, label: "Convicção", color: "bg-amber-500" },
  { key: "resistencia" as const, label: "Resistência", color: "bg-red-500" },
  { key: "prob_fechamento" as const, label: "Prob. Fechamento", color: "bg-purple-500" },
] as const;

export function RadarCard({ values, isLoading }: RadarCardProps) {
  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-1 px-2.5 pt-2 shrink-0">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Radar className="h-3.5 w-3.5 text-primary" />
          Radar do Lead
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        {!values && !isLoading && (
          <p className="text-[10px] text-muted-foreground text-center py-3">
            Aguardando análise...
          </p>
        )}
        {isLoading && !values && (
          <p className="text-[10px] text-muted-foreground text-center py-3 animate-pulse">
            Analisando...
          </p>
        )}
        {values && (
          <div className="space-y-1.5">
            {INDICATORS.map(({ key, label, color }) => {
              const ind = values[key];
              if (!ind) return null;
              const pct = Math.min(100, Math.max(0, ind.valor * 10));
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-medium text-foreground">{label}</span>
                    <span className="text-[10px] font-bold text-foreground">{ind.valor}/10</span>
                  </div>
                  <Progress value={pct} className={`h-1.5 [&>div]:${color}`} />
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                    {ind.justificativa}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
