import { useState } from "react";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useTiposProdutos,
  TipoProduto,
  TipoProdutoInput,
  SETOR_LABELS,
  SETOR_COLORS,
} from "@/hooks/useTiposProdutos";
import { TipoProdutoFormDialog } from "@/components/produtos/TipoProdutoFormDialog";
import { TipoProdutoDetailDialog } from "@/components/produtos/TipoProdutoDetailDialog";
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

export default function TiposProdutos() {
  const { produtos, isLoading, createProduto, updateProduto, deleteProduto } =
    useTiposProdutos();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<TipoProduto | null>(null);
  const [editingProduto, setEditingProduto] = useState<TipoProduto | null>(null);

  const handleCreate = () => {
    setEditingProduto(null);
    setFormOpen(true);
  };

  const handleEdit = (produto: TipoProduto) => {
    setEditingProduto(produto);
    setFormOpen(true);
  };

  const handleView = (produto: TipoProduto) => {
    setSelectedProduto(produto);
    setDetailOpen(true);
  };

  const handleDelete = (produto: TipoProduto) => {
    setSelectedProduto(produto);
    setDeleteOpen(true);
  };

  const handleSubmit = async (input: TipoProdutoInput) => {
    if (editingProduto) {
      await updateProduto.mutateAsync({ ...input, id: editingProduto.id });
    } else {
      await createProduto.mutateAsync(input);
    }
    setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (selectedProduto) {
      await deleteProduto.mutateAsync(selectedProduto.id);
      setDeleteOpen(false);
      setSelectedProduto(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Tipos de Produtos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os produtos jurídicos do escritório para modelagem de conteúdo
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando produtos...
        </div>
      ) : produtos.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Cadastre os tipos de produtos jurídicos do seu escritório para usar na modelagem de conteúdo.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Produto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map((produto) => (
            <Card
              key={produto.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleView(produto)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {produto.nome}
                  </CardTitle>
                  <Badge className={SETOR_COLORS[produto.setor]}>
                    {SETOR_LABELS[produto.setor]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {produto.descricao || "Sem descrição"}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(produto);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(produto);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TipoProdutoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingProduto}
        isLoading={createProduto.isPending || updateProduto.isPending}
      />

      <TipoProdutoDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        produto={selectedProduto}
        onEdit={() => {
          setDetailOpen(false);
          if (selectedProduto) handleEdit(selectedProduto);
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{selectedProduto?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
