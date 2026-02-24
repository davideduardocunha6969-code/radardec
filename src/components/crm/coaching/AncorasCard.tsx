import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor } from "lucide-react";

interface AncoraEmocional {
  frase: string;
  categoria: string;
  intensidade: string;
  utilizado: boolean;
  turno_capturado: number;
}

interface AncorasCardProps {
  ancoras: AncoraEmocional[];
}

const CATEGORIA_LABELS: Record<string, string> = {
  sacrificio_familiar: "Sacrifício Familiar",
  injustica_financeira: "Injustiça Financeira",
  saude_comprometida: "Saúde Comprometida",
  medo_futuro: "Medo do Futuro",
  revolta_empregador: "Revolta",
  dignidade_ferida: "Dignidade Ferida",
};

const INTENSIDADE_COLORS: Record<string, string> = {
  alta: "border-red-500/40 bg-red-500/5",
  media: "border-amber-500/40 bg-amber-500/5",
  baixa: "border-muted-foreground/20 bg-muted/30",
};

export function AncorasCard({ ancoras }: AncorasCardProps) {
  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-1 px-2.5 pt-2 shrink-0">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Anchor className="h-3.5 w-3.5 text-cyan-500" />
          Âncoras Emocionais
          {ancoras.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">{ancoras.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <div className="space-y-1.5">
          {ancoras.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-3">
              Aguardando frases emocionais do cliente...
            </p>
          )}
          {ancoras.map((a, i) => (
            <div
              key={i}
              className={`rounded-md border px-2 py-1.5 text-xs ${INTENSIDADE_COLORS[a.intensidade] || INTENSIDADE_COLORS.media} ${a.utilizado ? "opacity-50" : ""}`}
            >
              <p className="italic leading-tight">"{a.frase}"</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-muted-foreground">
                  {CATEGORIA_LABELS[a.categoria] || a.categoria}
                </span>
                <span className="text-[9px] text-muted-foreground">•</span>
                <span className="text-[9px] text-muted-foreground capitalize">{a.intensidade}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
