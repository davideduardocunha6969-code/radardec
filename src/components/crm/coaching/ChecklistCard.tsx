import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChecklistItem } from "./coachingData";
import type { LucideIcon } from "lucide-react";

interface ChecklistCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  items: ChecklistItem[];
  completedIds: string[];
}

export function ChecklistCard({ title, icon: Icon, iconColor = "text-primary", items, completedIds }: ChecklistCardProps) {
  const doneCount = completedIds.length;
  const total = items.length;

  return (
    <Card className="border-border/60 flex flex-col min-h-0">
      <CardHeader className="pb-1.5 px-3 pt-2.5 shrink-0">
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
      <CardContent className="px-3 pb-2.5 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {items.map((item) => {
              const done = completedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                    done ? "bg-primary/8 text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40" />
                  )}
                  <div className="min-w-0">
                    <span className={`font-medium ${done ? "line-through opacity-70" : ""}`}>
                      {item.label}
                    </span>
                    {item.description && !done && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
