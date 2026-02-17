import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Objection } from "./coachingData";

interface ObjectionsCardProps {
  objections: Objection[];
}

export function ObjectionsCard({ objections }: ObjectionsCardProps) {
  const addressed = objections.filter((o) => o.addressed).length;

  return (
    <Card className="border-border/60 flex flex-col min-h-0">
      <CardHeader className="pb-1.5 px-3 pt-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
            Objeções (RAPOVECA)
          </CardTitle>
          {objections.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {addressed}/{objections.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2.5 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {objections.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                Nenhuma objeção detectada ainda.
              </p>
            )}
            {objections.map((obj) => (
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
                  <div className="min-w-0">
                    <p className={`font-medium ${obj.addressed ? "line-through opacity-70" : ""}`}>
                      {obj.objection}
                    </p>
                    {!obj.addressed && (
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight italic">
                        💬 {obj.suggested_response}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
