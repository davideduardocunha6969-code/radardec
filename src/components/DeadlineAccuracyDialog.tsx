import { useMemo } from "react";
import { Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskData, DeadlineError } from "@/hooks/useSheetData";

interface ControllerAccuracy {
  controller: string;
  totalTasks: number;
  errors: number;
  accuracyRate: number;
}

interface DeadlineAccuracyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskData[];
  errors: DeadlineError[];
}

export function DeadlineAccuracyDialog({
  open,
  onOpenChange,
  tasks,
  errors,
}: DeadlineAccuracyDialogProps) {
  const accuracyByController = useMemo(() => {
    // Count tasks per controller
    const taskCounts: Record<string, number> = {};
    tasks.forEach(task => {
      const controller = task.controller || 'Não identificado';
      taskCounts[controller] = (taskCounts[controller] || 0) + 1;
    });

    // Count errors per controller
    const errorCounts: Record<string, number> = {};
    errors.forEach(error => {
      const controller = error.controller || 'Não identificado';
      errorCounts[controller] = (errorCounts[controller] || 0) + 1;
    });

    // Get all unique controllers from both tasks and errors
    const allControllers = new Set([
      ...Object.keys(taskCounts),
      ...Object.keys(errorCounts)
    ]);

    return Array.from(allControllers)
      .map(controller => {
        const totalTasks = taskCounts[controller] || 0;
        const controllerErrors = errorCounts[controller] || 0;
        const accuracyRate = totalTasks > 0 
          ? ((totalTasks - controllerErrors) / totalTasks) * 100 
          : 100;
        
        return {
          controller,
          totalTasks,
          errors: controllerErrors,
          accuracyRate,
        };
      })
      .filter(item => item.totalTasks > 0 || item.errors > 0)
      .sort((a, b) => a.accuracyRate - b.accuracyRate);
  }, [tasks, errors]);

  const getVariantClasses = (rate: number) => {
    if (rate < 99.80) {
      return {
        bg: "bg-destructive/10 border-destructive/20",
        icon: "text-destructive",
        text: "Fora da Meta",
      };
    } else if (rate === 99.80) {
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
            <Percent className="h-5 w-5 text-primary" />
            Taxa de Acerto Prazo por Controller
          </DialogTitle>
        </DialogHeader>

        {accuracyByController.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado encontrado.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {accuracyByController.map((item) => {
                const variant = getVariantClasses(item.accuracyRate);
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
                          <Percent className={`h-4 w-4 ${variant.icon}`} />
                          <span className="text-2xl font-bold">
                            {item.accuracyRate.toFixed(2)}%
                          </span>
                        </div>
                        <p className={`text-xs mt-1 font-medium ${variant.icon}`}>
                          {variant.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.totalTasks} tarefas | {item.errors} {item.errors === 1 ? "erro" : "erros"}
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
