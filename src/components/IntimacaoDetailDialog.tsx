import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { IntimacaoPrevidenciario } from "@/hooks/useSheetData";

interface IntimacaoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: string;
  intimacoes: IntimacaoPrevidenciario[];
}

export function IntimacaoDetailDialog({
  open,
  onOpenChange,
  colaborador,
  intimacoes,
}: IntimacaoDetailDialogProps) {
  // Calcula dias de atraso
  const calcDiasAtraso = (prazoFatal: Date | null): number => {
    if (!prazoFatal) return 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(prazoFatal);
    prazo.setHours(0, 0, 0, 0);
    const diffTime = hoje.getTime() - prazo.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Ordena por prazo fatal (mais antigos primeiro)
  const sortedIntimacoes = [...intimacoes].sort((a, b) => {
    if (!a.prazoFatal) return 1;
    if (!b.prazoFatal) return -1;
    return a.prazoFatal.getTime() - b.prazoFatal.getTime();
  });

  const handleCopy = () => {
    const header = "Nº Processo\tPrazo Fatal\tTipo Compromisso\tDias Atraso";
    const rows = sortedIntimacoes.map((int) => {
      const prazoStr = int.prazoFatal
        ? int.prazoFatal.toLocaleDateString("pt-BR")
        : "-";
      const diasAtraso = calcDiasAtraso(int.prazoFatal);
      return `${int.numeroProcesso}\t${prazoStr}\t${int.tipoCompromisso}\t${diasAtraso}`;
    });
    
    const text = [header, ...rows].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Dados copiados para a área de transferência");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Intimações em Atraso - {colaborador} ({intimacoes.length})
          </DialogTitle>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
        </DialogHeader>
        
        <div className="overflow-auto flex-1 mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Nº Processo</TableHead>
                <TableHead className="min-w-[100px]">Prazo Fatal</TableHead>
                <TableHead className="min-w-[150px]">Tipo Compromisso</TableHead>
                <TableHead className="text-right min-w-[80px]">Dias Atraso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIntimacoes.map((intimacao, index) => {
                const diasAtraso = calcDiasAtraso(intimacao.prazoFatal);
                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {intimacao.numeroProcesso || "-"}
                    </TableCell>
                    <TableCell>
                      {intimacao.prazoFatal
                        ? intimacao.prazoFatal.toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>{intimacao.tipoCompromisso || "-"}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${
                          diasAtraso > 30
                            ? "bg-destructive/20 text-destructive"
                            : diasAtraso > 14
                            ? "bg-warning/20 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {diasAtraso} dias
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
