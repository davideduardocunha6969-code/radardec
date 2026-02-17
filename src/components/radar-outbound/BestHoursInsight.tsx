import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

interface BestHoursInsightProps {
  hourlyData: { hora: string; efetuadas: number; atendidas: number }[];
}

export default function BestHoursInsight({ hourlyData }: BestHoursInsightProps) {
  const insights = useMemo(() => {
    const withRate = hourlyData
      .filter((h) => h.efetuadas >= 2)
      .map((h) => ({
        ...h,
        taxa: h.efetuadas > 0 ? (h.atendidas / h.efetuadas) * 100 : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa);

    const topEfetuadas = [...hourlyData].sort((a, b) => b.efetuadas - a.efetuadas).slice(0, 3);
    const topAtendidas = [...hourlyData].sort((a, b) => b.atendidas - a.atendidas).slice(0, 3);

    return { topTaxa: withRate.slice(0, 3), topEfetuadas, topAtendidas };
  }, [hourlyData]);

  if (insights.topEfetuadas.every((h) => h.efetuadas === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sem dados suficientes</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">🎯 Maior Taxa de Atendimento</h4>
        <div className="space-y-1.5">
          {insights.topTaxa.map((h, i) => (
            <div key={h.hora} className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {h.hora}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {h.atendidas}/{h.efetuadas} ligações
                </span>
                <Badge variant={h.taxa >= 50 ? "default" : "secondary"}>
                  {Math.round(h.taxa)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">📞 Mais Ligações Efetuadas</h4>
        <div className="space-y-1.5">
          {insights.topEfetuadas.filter((h) => h.efetuadas > 0).map((h) => (
            <div key={h.hora} className="flex items-center justify-between text-sm">
              <span className="font-medium">{h.hora}</span>
              <span className="text-muted-foreground">{h.efetuadas} ligações</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">✅ Mais Atendidas</h4>
        <div className="space-y-1.5">
          {insights.topAtendidas.filter((h) => h.atendidas > 0).map((h) => (
            <div key={h.hora} className="flex items-center justify-between text-sm">
              <span className="font-medium">{h.hora}</span>
              <span className="text-muted-foreground">{h.atendidas} atendidas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
