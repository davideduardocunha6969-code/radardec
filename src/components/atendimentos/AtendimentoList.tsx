import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, Trash2, Loader2, Phone, Clock } from "lucide-react";
import { Atendimento } from "@/hooks/useAtendimentosClosers";

interface AtendimentoListProps {
  atendimentos: Atendimento[];
  isLoading: boolean;
  onNewAtendimento: () => void;
  onViewAtendimento: (atendimento: Atendimento) => void;
  onDeleteAtendimento: (id: string) => Promise<boolean>;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  gravando: { label: "Gravando", variant: "secondary" },
  processando: { label: "Processando", variant: "default" },
  concluido: { label: "Concluído", variant: "default" },
  erro: { label: "Erro", variant: "destructive" },
};

export function AtendimentoList({
  atendimentos,
  isLoading,
  onNewAtendimento,
  onViewAtendimento,
  onDeleteAtendimento,
}: AtendimentoListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await onDeleteAtendimento(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Meus Atendimentos
            </CardTitle>
            <CardDescription>
              Grave e transcreva suas chamadas com clientes
            </CardDescription>
          </div>
          <Button onClick={onNewAtendimento} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Atendimento
          </Button>
        </CardHeader>
        <CardContent>
          {atendimentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum atendimento registrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece gravando sua primeira chamada com um cliente
              </p>
              <Button onClick={onNewAtendimento} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Atendimento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.map((atendimento) => {
                  const status = statusConfig[atendimento.status] || statusConfig.pendente;
                  return (
                    <TableRow key={atendimento.id}>
                      <TableCell>
                        {format(new Date(atendimento.data_atendimento), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDuration(atendimento.duracao_segundos)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewAtendimento(atendimento)}
                            disabled={atendimento.status === "processando"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(atendimento.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A gravação e transcrição serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
