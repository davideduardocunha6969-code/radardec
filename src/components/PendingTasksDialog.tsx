import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Calendar, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TaskData } from "@/hooks/useSheetData";
import { calculateBusinessDays } from "@/utils/businessDays";

interface PendingTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskData[];
  holidays: Date[];
}

export function PendingTasksDialog({
  open,
  onOpenChange,
  tasks,
  holidays,
}: PendingTasksDialogProps) {
  const today = new Date();

  const tasksWithDays = useMemo(() => {
    return tasks
      .map((task) => {
        const daysSinceDistribution = task.dataDistribuicao
          ? calculateBusinessDays(task.dataDistribuicao, today, holidays)
          : 0;
        return { ...task, daysSinceDistribution };
      })
      .sort((a, b) => b.daysSinceDistribution - a.daysSinceDistribution);
  }, [tasks, holidays, today]);

  const getDaysColor = (days: number) => {
    if (days > 30) return "destructive";
    if (days > 14) return "warning";
    return "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Tarefas Pendentes ({tasks.length})
          </DialogTitle>
        </DialogHeader>

        {tasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa pendente encontrada.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {tasksWithDays.map((task, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="font-medium leading-tight">{task.tarefa}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span>{task.colaborador}</span>
                        </div>
                        
                        {task.dataDistribuicao && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {format(task.dataDistribuicao, "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge variant={getDaysColor(task.daysSinceDistribution) as any}>
                      {task.daysSinceDistribution} {task.daysSinceDistribution === 1 ? "dia" : "dias"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
