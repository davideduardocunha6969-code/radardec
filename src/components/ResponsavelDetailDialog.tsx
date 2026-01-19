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

interface ResponsavelDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responsavel: string;
  atividades: Atividade[];
}

export function ResponsavelDetailDialog({ open, onOpenChange, responsavel, atividades }: ResponsavelDetailDialogProps) {
  const tarefasDoResponsavel = atividades.filter(a => a.responsavel === responsavel);
  
  const tiposCount = tarefasDoResponsavel.reduce((acc, a) => {
    if (a.tipoTarefa) {
      acc[a.tipoTarefa] = (acc[a.tipoTarefa] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const ranking = Object.entries(tiposCount)
    .sort((a, b) => b[1] - a[1]);

  const total = tarefasDoResponsavel.length;
  const maxCount = ranking.length > 0 ? ranking[0][1] : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Detalhamento: {responsavel}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Total de tarefas concluídas: <span className="font-semibold text-foreground">{total}</span>
          </div>
          
          <div className="space-y-3">
            {ranking.map(([tipo, count], index) => {
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              const barPercentage = (count / maxCount) * 100;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
              
              return (
                <div key={tipo} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium flex items-center gap-2">
                      {medal && <span>{medal}</span>}
                      {tipo}
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
                Nenhum tipo de tarefa encontrado para este responsável.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
