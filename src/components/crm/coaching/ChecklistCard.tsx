import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCircle2, Circle, Trash2, Database } from "lucide-react";
import type { ChecklistItem } from "./coachingData";
import type { LucideIcon } from "lucide-react";

interface ChecklistCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  items: ChecklistItem[];
  completedIds: string[];
  className?: string;
  onCheck?: (id: string) => void;
  onDiscard?: (id: string) => void;
}

export const ChecklistCard = forwardRef<HTMLDivElement, ChecklistCardProps>(function ChecklistCard({ title, icon: Icon, iconColor = "text-primary", items, completedIds, className, onCheck, onDiscard }, ref) {
  const doneCount = completedIds.length;
  const total = items.length;

  return (
    <Card ref={ref} className={`border-border/60 flex flex-col ${className || ""}`}>
      <CardHeader className="pb-1 px-2.5 pt-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
            {title}
          </CardTitle>
          <span className="text-[10px] font-medium text-muted-foreground">
            {doneCount}/{total}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <div className="space-y-0.5">
            {[...items]
              .sort((a, b) => {
                const aDone = completedIds.includes(a.id);
                const bDone = completedIds.includes(b.id);
                if (aDone === bDone) return 0;
                return aDone ? 1 : -1;
              })
              .map((item) => {
              const done = completedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-1.5 rounded px-1.5 py-1 text-xs transition-colors ${
                    done ? "bg-primary/8 text-foreground" : "text-muted-foreground"
                  }`}
                  style={{ paddingLeft: item.depth ? `${item.depth * 16 + 6}px` : undefined }}
                >
                  {item.depth ? (
                    done ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-3 w-3 shrink-0 mt-0.5 opacity-30" />
                    )
                  ) : done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className={`font-medium ${done ? "line-through opacity-70" : ""} ${item.depth ? "text-[11px]" : ""}`}>
                      {item.label}
                    </span>
                    {item.campo_lead_key && !done && (
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1 ml-1.5 gap-0.5 align-middle">
                        <Database className="h-2 w-2" />
                        {item.campo_lead_key}
                      </Badge>
                    )}
                    {item.description && !done && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {!done && (onCheck || onDiscard) && (
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
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
});
