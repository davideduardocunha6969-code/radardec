import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Radar } from "lucide-react";

interface RadarData {
  prova_tecnica: number;
  confianca_closer: number;
  conviccao_cliente: number;
  resistencia: number;
}

interface RadarCardProps {
  radar: RadarData;
  faseAtual: number;
  podeFechar: boolean;
}

const RADAR_ITEMS = [
  { key: "prova_tecnica" as const, label: "Prova Técnica", color: "bg-blue-500" },
  { key: "confianca_closer" as const, label: "Confiança", color: "bg-emerald-500" },
  { key: "conviccao_cliente" as const, label: "Convicção", color: "bg-amber-500" },
  { key: "resistencia" as const, label: "Resistência", color: "bg-red-500", inverted: true },
];

const FASES = ["", "Apresentação", "Investigação", "Valor", "Leitura Emocional", "Transição", "Fechamento"];

export function RadarCard({ radar, faseAtual, podeFechar }: RadarCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-1 px-2.5 pt-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Radar className="h-3.5 w-3.5 text-primary" />
            Radar — Fase {faseAtual}: {FASES[faseAtual] || ""}
          </CardTitle>
          {podeFechar && (
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              PODE FECHAR
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2.5 pb-2 space-y-1.5">
        {RADAR_ITEMS.map((item) => {
          const value = radar[item.key];
          const pct = (value / 10) * 100;
          return (
            <div key={item.key} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <span className={`text-[10px] font-bold ${item.inverted ? (value > 5 ? "text-red-500" : "text-emerald-500") : (value >= 7 ? "text-emerald-500" : value >= 4 ? "text-amber-500" : "text-muted-foreground")}`}>
                  {value}/10
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
