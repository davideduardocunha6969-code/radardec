import { useMemo } from "react";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskData } from "@/hooks/useSheetData";
import { calculateBusinessDays } from "@/utils/businessDays";

interface ControllerAvg {
  controller: string;
  avgDays: number;
  completedTasks: number;
}

interface AvgCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskData[];
  holidays: Date[];
}

export function AvgCompletionDialog({
  open,
  onOpenChange,
  tasks,
  holidays,
}: AvgCompletionDialogProps) {
  const avgByController = useMemo(() => {
    const controllerData: Record<string, { totalDays: number; count: number }> = {};
    
    tasks.forEach(task => {
      if (task.dataDistribuicao && task.dataCumprimento) {
        const businessDays = calculateBusinessDays(
          task.dataDistribuicao,
          task.dataCumprimento,
          holidays
        );
        const adjustedDays = Math.max(0, businessDays - 1);
        
        if (!controllerData[task.controller]) {
          controllerData[task.controller] = { totalDays: 0, count: 0 };
        }
        controllerData[task.controller].totalDays += adjustedDays;
        controllerData[task.controller].count++;
      }
    });
    
    return Object.entries(controllerData)
      .map(([controller, data]) => ({
        controller,
        avgDays: data.count > 0 ? data.totalDays / data.count : 0,
        completedTasks: data.count,
      }))
      .sort((a, b) => a.avgDays - b.avgDays);
  }, [tasks, holidays]);

  const getVariantClasses = (avgDays: number) => {
    if (avgDays > 2) {
      return {
        bg: "bg-destructive/10 border-destructive/20",
        icon: "text-destructive",
        text: "Fora da Meta",
      };
    } else if (avgDays === 2) {
      return {
        bg: "bg-warning/10 border-warning/20",
        icon: "text-warning",
        text: "Atenção, Limite da Meta",
      };
    } else {
      return {
        bg: "bg-success/10 border-success/20",
        icon: "text-success",
        text: "Dentro da Meta",
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Média de Cumprimento por Controller
          </DialogTitle>
        </DialogHeader>

        {avgByController.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa concluída encontrada.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {avgByController.map((item) => {
                const variant = getVariantClasses(item.avgDays);
                return (
                  <div
                    key={item.controller}
                    className={`rounded-lg border p-4 ${variant.bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm truncate">
                          {item.controller}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className={`h-4 w-4 ${variant.icon}`} />
                          <span className="text-2xl font-bold">
                            {item.avgDays.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">dias</span>
                        </div>
                        <p className={`text-xs mt-1 font-medium ${variant.icon}`}>
                          {variant.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.completedTasks} {item.completedTasks === 1 ? "tarefa concluída" : "tarefas concluídas"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
