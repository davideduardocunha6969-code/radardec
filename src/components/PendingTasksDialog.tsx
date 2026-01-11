import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertCircle, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskData } from "@/hooks/useSheetData";
import { calculateBusinessDays } from "@/utils/businessDays";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = () => {
    const header = "Tarefa\tNº Processo\tColaborador\tData Envio\tDias";
    const rows = tasksWithDays.map((task) => {
      const dataEnvio = task.dataDistribuicao
        ? format(task.dataDistribuicao, "dd/MM/yyyy", { locale: ptBR })
        : "-";
      return `${task.tarefa}\t${task.numeroProcesso || "-"}\t${task.colaborador}\t${dataEnvio}\t${task.daysSinceDistribution}`;
    });
    
    const text = [header, ...rows].join("\n");
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Dados copiados para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Tarefas Pendentes ({tasks.length})
            </DialogTitle>
            {tasks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            )}
          </div>
        </DialogHeader>

        {tasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa pendente encontrada.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Tarefa</TableHead>
                  <TableHead className="w-[15%]">Nº Processo</TableHead>
                  <TableHead className="w-[18%]">Colaborador</TableHead>
                  <TableHead className="w-[17%]">Data Envio</TableHead>
                  <TableHead className="w-[15%] text-right">Dias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksWithDays.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{task.tarefa}</TableCell>
                    <TableCell>{task.numeroProcesso || "-"}</TableCell>
                    <TableCell>{task.colaborador}</TableCell>
                    <TableCell>
                      {task.dataDistribuicao
                        ? format(task.dataDistribuicao, "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          task.daysSinceDistribution > 30
                            ? "text-destructive font-semibold"
                            : task.daysSinceDistribution > 14
                            ? "text-warning font-semibold"
                            : ""
                        }
                      >
                        {task.daysSinceDistribution}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
