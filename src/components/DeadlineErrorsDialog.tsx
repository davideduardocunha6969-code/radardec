import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timer, AlertCircle, Copy, Check } from "lucide-react";
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
import { DeadlineError } from "@/hooks/useSheetData";
import { useToast } from "@/hooks/use-toast";

interface DeadlineErrorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: DeadlineError[];
}

export function DeadlineErrorsDialog({
  open,
  onOpenChange,
  errors,
}: DeadlineErrorsDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const sortedErrors = useMemo(() => {
    return [...errors].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.getTime() - a.date.getTime();
    });
  }, [errors]);

  const copyToClipboard = () => {
    const header = "Data do Erro\tController\tNº Processo";
    const rows = sortedErrors.map((error) => {
      const dataErro = error.date
        ? format(error.date, "dd/MM/yyyy", { locale: ptBR })
        : "-";
      return `${dataErro}\t${error.controller}\t${error.processNumber || "-"}`;
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-destructive" />
              Erros de Prazo ({errors.length})
            </DialogTitle>
            {errors.length > 0 && (
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

        {errors.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum erro de prazo encontrado.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Data do Erro</TableHead>
                  <TableHead className="w-[35%]">Controller</TableHead>
                  <TableHead className="w-[35%]">Nº Processo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedErrors.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {error.date
                        ? format(error.date, "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{error.controller}</TableCell>
                    <TableCell>{error.processNumber || "-"}</TableCell>
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
