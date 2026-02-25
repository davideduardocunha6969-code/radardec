import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DynamicItem } from "./coachingData";
import type { LucideIcon } from "lucide-react";

interface DynamicChecklistCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  items: DynamicItem[];
  emptyMessage?: string;
  onCheck?: (id: string) => void;
  onDiscard?: (id: string) => void;
}

export function DynamicChecklistCard({
  title,
  icon: Icon,
  iconColor = "text-primary",
  items,
  emptyMessage = "Aguardando análise da IA...",
  onCheck,
  onDiscard,
}: DynamicChecklistCardProps) {
  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;

  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-1 px-2.5 pt-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
            {title}
          </CardTitle>
          {total > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {doneCount}/{total}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <div className="space-y-0.5">
            {items.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                {emptyMessage}
              </p>
            )}
            {[...items]
              .sort((a, b) => {
                if (a.done === b.done) return 0;
                return a.done ? 1 : -1;
              })
              .map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-1.5 rounded px-1.5 py-1 text-xs transition-colors ${
                  item.done ? "bg-primary/8 text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40" />
                )}
                <div className="min-w-0 flex-1">
                  <span className={`font-medium ${item.done ? "line-through opacity-70" : ""}`}>
                    {item.label}
                  </span>
                  {item.description && !item.done && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                      {item.description}
                    </p>
                  )}
                </div>
                {!item.done && (onCheck || onDiscard) && (
                  <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                    {onCheck && (
                      <button
                        onClick={() => onCheck(item.id)}
                        className="p-0.5 rounded hover:bg-green-500/20 text-green-600 transition-colors"
                        title="Marcar como feito"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    {onDiscard && (
                      <button
                        onClick={() => onDiscard(item.id)}
                        className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        title="Descartar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
