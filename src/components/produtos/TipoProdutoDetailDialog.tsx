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
import { CollapsibleRichField } from "./CollapsibleRichField";
import { ProdutoAnexosSection } from "./ProdutoAnexosSection";
import { Separator } from "@/components/ui/separator";

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
          {/* Rich Content Fields - Read Only */}
          <div className="space-y-4">
            {produto.descricao && (
              <CollapsibleRichField
                id="descricao-view"
                label="Descrição do Produto"
                value={produto.descricao}
                onChange={() => {}}
                readOnly
                defaultExpanded={false}
              />
            )}

            {produto.caracteristicas && (
              <CollapsibleRichField
                id="caracteristicas-view"
                label="Características"
                value={produto.caracteristicas}
                onChange={() => {}}
                readOnly
                defaultExpanded={false}
              />
            )}

            {produto.perfil_cliente_ideal && (
              <CollapsibleRichField
                id="perfil-view"
                label="Perfil do Cliente Ideal"
                value={produto.perfil_cliente_ideal}
                onChange={() => {}}
                readOnly
                defaultExpanded={false}
              />
            )}

            {produto.estrutura_editorial && (
              <CollapsibleRichField
                id="estrutura-editorial-view"
                label="Estrutura de Linha Editorial (SEO + Mídias Sociais)"
                value={produto.estrutura_editorial}
                onChange={() => {}}
                readOnly
                defaultExpanded={false}
              />
            )}
          </div>

          <Separator />

          {/* File Attachments - Read Only */}
          <ProdutoAnexosSection tipoProdutoId={produto.id} readOnly />

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
