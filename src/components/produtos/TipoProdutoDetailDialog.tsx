import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import {
  TipoProduto,
  SETOR_LABELS,
  SETOR_COLORS,
} from "@/hooks/useTiposProdutos";

interface TipoProdutoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: TipoProduto | null;
  onEdit: () => void;
}

export function TipoProdutoDetailDialog({
  open,
  onOpenChange,
  produto,
  onEdit,
}: TipoProdutoDetailDialogProps) {
  if (!produto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{produto.nome}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={SETOR_COLORS[produto.setor]}>
                {SETOR_LABELS[produto.setor]}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {produto.descricao && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Descrição
              </h4>
              <p className="text-foreground whitespace-pre-wrap">
                {produto.descricao}
              </p>
            </div>
          )}

          {produto.caracteristicas && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Características
              </h4>
              <p className="text-foreground whitespace-pre-wrap">
                {produto.caracteristicas}
              </p>
            </div>
          )}

          {produto.perfil_cliente_ideal && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Perfil do Cliente Ideal
              </h4>
              <p className="text-foreground whitespace-pre-wrap">
                {produto.perfil_cliente_ideal}
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-4 border-t border-border">
            Criado em: {new Date(produto.created_at).toLocaleDateString("pt-BR")}
            {produto.updated_at !== produto.created_at && (
              <> · Atualizado em: {new Date(produto.updated_at).toLocaleDateString("pt-BR")}</>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
