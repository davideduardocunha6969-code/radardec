import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeletedItem {
  id: string;
  titulo: string;
  setor: string;
  formato: string;
  deleted_at: string;
}

interface LixeiraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: DeletedItem[];
  isLoading: boolean;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}

export function LixeiraDialog({
  open,
  onOpenChange,
  title,
  items,
  isLoading,
  onRestore,
  onPurge,
}: LixeiraDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Itens excluídos. Você pode restaurá-los ou apagar permanentemente.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">A lixeira está vazia.</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2">Título</th>
                  <th className="text-left p-2">Setor</th>
                  <th className="text-left p-2">Formato</th>
                  <th className="text-left p-2">Excluído em</th>
                  <th className="text-right p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2 font-medium">{item.titulo}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">{item.setor}</Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-xs">{item.formato}</Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {format(new Date(item.deleted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="p-2 text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRestore(item.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O item "{item.titulo}" será removido para sempre.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onPurge(item.id)}>
                              Excluir permanentemente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
