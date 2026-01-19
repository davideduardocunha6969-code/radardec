import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, XCircle, User } from "lucide-react";
import { AtividadeTrabalhista } from "@/hooks/useTrabalhistaData";
import { useMemo } from "react";

interface AtividadesPrazoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividades: AtividadeTrabalhista[];
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try ISO format
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  return null;
}

export function AtividadesPrazoDialog({ open, onOpenChange, atividades }: AtividadesPrazoDialogProps) {
  const analysisByResponsavel = useMemo(() => {
    const analysis: Record<string, { noPrazo: number; foraPrazo: number; total: number }> = {};
    
    atividades.forEach(a => {
      if (!a.responsavel || !a.dataConclusao || !a.prazoFatal) return;
      
      const dataConclusao = parseDate(a.dataConclusao);
      const prazoFatal = parseDate(a.prazoFatal);
      
      if (!dataConclusao || !prazoFatal) return;
      
      if (!analysis[a.responsavel]) {
        analysis[a.responsavel] = { noPrazo: 0, foraPrazo: 0, total: 0 };
      }
      
      analysis[a.responsavel].total++;
      
      if (dataConclusao <= prazoFatal) {
        analysis[a.responsavel].noPrazo++;
      } else {
        analysis[a.responsavel].foraPrazo++;
      }
    });
    
    return Object.entries(analysis)
      .map(([responsavel, data]) => ({
        responsavel,
        noPrazo: data.noPrazo,
        foraPrazo: data.foraPrazo,
        total: data.total,
        taxaAcerto: data.total > 0 ? (data.noPrazo / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.taxaAcerto - a.taxaAcerto);
  }, [atividades]);

  const getVariantClasses = (rate: number) => {
    if (rate >= 90) {
      return {
        bg: "bg-green-50 dark:bg-green-950/30",
        iconColor: "text-green-500",
        text: "Dentro da Meta",
        textColor: "text-green-600 dark:text-green-400",
      };
    } else if (rate >= 75) {
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        iconColor: "text-amber-500",
        text: "Atenção",
        textColor: "text-amber-600 dark:text-amber-400",
      };
    } else {
      return {
        bg: "bg-red-50 dark:bg-red-950/30",
        iconColor: "text-red-500",
        text: "Fora da Meta",
        textColor: "text-red-600 dark:text-red-400",
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Cumprimento de Prazo por Responsável
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {analysisByResponsavel.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhum dado de cumprimento encontrado
            </div>
          ) : (
            <div className="grid gap-3">
              {analysisByResponsavel.map((item, index) => {
                const variant = getVariantClasses(item.taxaAcerto);
                
                return (
                  <div
                    key={item.responsavel}
                    className={`rounded-lg border p-4 ${variant.bg}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className={`h-4 w-4 ${variant.iconColor}`} />
                        <span className="font-medium">{item.responsavel}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${variant.textColor}`}>
                          {item.taxaAcerto.toFixed(1)}%
                        </span>
                        <p className={`text-xs ${variant.textColor}`}>{variant.text}</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={item.taxaAcerto} 
                      className="h-2 mb-3"
                    />
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>No prazo: {item.noPrazo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span>Fora do prazo: {item.foraPrazo}</span>
                      </div>
                      <span>Total: {item.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}