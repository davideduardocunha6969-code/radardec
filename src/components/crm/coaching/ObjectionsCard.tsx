import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CheckCircle2, Circle, ShieldAlert, Trash2, HelpCircle } from "lucide-react";
import type { Objection } from "./coachingData";

interface ObjectionsCardProps {
  objections: Objection[];
  onAddressed?: (id: string) => void;
  onDiscard?: (id: string) => void;
  techniqueLabel?: string;
}

export function ObjectionsCard({ objections, onAddressed, onDiscard, techniqueLabel = "RAPOVECA" }: ObjectionsCardProps) {
  const addressed = objections.filter((o) => o.addressed).length;

  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-1 px-2.5 pt-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
            Objeções ({techniqueLabel})
          </CardTitle>
          {objections.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {addressed}/{objections.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <div className="space-y-1.5">
            {objections.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                Nenhuma objeção detectada ainda.
              </p>
            )}
            {[...objections]
              .sort((a, b) => {
                if (a.addressed === b.addressed) return 0;
                return a.addressed ? 1 : -1;
              })
              .map((obj) => (
              <div
                key={obj.id}
                className={`rounded-md border px-2.5 py-2 text-xs transition-colors ${
                  obj.addressed
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-orange-500/30 bg-orange-500/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {obj.addressed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${obj.addressed ? "line-through opacity-70" : ""}`}>
                      {obj.objection}
                    </p>
                    {!obj.addressed && (
                      <>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-tight italic">
                          💬 {obj.suggested_response}
                        </p>
                        {obj.pergunta_sugerida && (
                          <p className="text-[10px] text-primary mt-1 leading-tight flex items-start gap-1">
                            <HelpCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            {obj.pergunta_sugerida}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {!obj.addressed && (onAddressed || onDiscard) && (
                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                      {onAddressed && (
                        <button
                          onClick={() => onAddressed(obj.id)}
                          className="p-0.5 rounded hover:bg-green-500/20 text-green-600 transition-colors"
                          title="Marcar como respondida"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      {onDiscard && (
                        <button
                          onClick={() => onDiscard(obj.id)}
                          className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="Descartar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
