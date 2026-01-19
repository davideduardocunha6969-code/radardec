import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Atividade {
  dataTarefa: string;
  dataConclusao: string;
  prazoFatal: string;
  tipoTarefa: string;
  responsavel: string;
  cliente: string;
  numeroProcesso: string;
}

interface TipoTarefaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoTarefa: string;
  atividades: Atividade[];
}

export function TipoTarefaDetailDialog({ open, onOpenChange, tipoTarefa, atividades }: TipoTarefaDetailDialogProps) {
  const tarefasDoTipo = atividades.filter(a => a.tipoTarefa === tipoTarefa);
  
  const responsaveisCount = tarefasDoTipo.reduce((acc, a) => {
    if (a.responsavel) {
      acc[a.responsavel] = (acc[a.responsavel] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const ranking = Object.entries(responsaveisCount)
    .sort((a, b) => b[1] - a[1]);

  const total = tarefasDoTipo.length;
  const maxCount = ranking.length > 0 ? ranking[0][1] : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Detalhamento: {tipoTarefa}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Total de tarefas deste tipo: <span className="font-semibold text-foreground">{total}</span>
          </div>
          
          <div className="space-y-3">
            {ranking.map(([responsavel, count], index) => {
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              const barPercentage = (count / maxCount) * 100;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
              
              return (
                <div key={responsavel} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium flex items-center gap-2">
                      {medal && <span>{medal}</span>}
                      {responsavel}
                    </span>
                    <span className="text-muted-foreground">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <Progress value={barPercentage} className="h-2" />
                </div>
              );
            })}
            
            {ranking.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum responsável encontrado para este tipo de tarefa.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
