import { useState, useMemo } from "react";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useTiposProdutos,
  TipoProduto,
  TipoProdutoInput,
  Setor,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const SETOR_ORDER: Setor[] = ["previdenciario", "bancario", "trabalhista", "civel"];

export default function TiposProdutos() {
  const { produtos, isLoading, createProduto, updateProduto, deleteProduto } =
    useTiposProdutos();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<TipoProduto | null>(null);
  const [editingProduto, setEditingProduto] = useState<TipoProduto | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<Setor, boolean>>({
    previdenciario: true,
    bancario: true,
    trabalhista: true,
    civel: true,
  });

  // Group products by sector
  const produtosPorSetor = useMemo(() => {
    const grouped: Record<Setor, TipoProduto[]> = {
      previdenciario: [],
      bancario: [],
      trabalhista: [],
      civel: [],
    };

    produtos.forEach((produto) => {
      if (grouped[produto.setor]) {
        grouped[produto.setor].push(produto);
      }
    });

    return grouped;
  }, [produtos]);

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

  const toggleSection = (setor: Setor) => {
    setExpandedSections((prev) => ({
      ...prev,
      [setor]: !prev[setor],
    }));
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
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-12 flex flex-col items-center justify-center">
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
        </div>
      ) : (
        <div className="space-y-4">
          {SETOR_ORDER.map((setor) => {
            const produtosDoSetor = produtosPorSetor[setor];
            if (produtosDoSetor.length === 0) return null;

            return (
              <Collapsible
                key={setor}
                open={expandedSections[setor]}
                onOpenChange={() => toggleSection(setor)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg cursor-pointer hover:bg-card/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge className={SETOR_COLORS[setor]}>
                        {SETOR_LABELS[setor]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {produtosDoSetor.length} produto{produtosDoSetor.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedSections[setor] ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    {produtosDoSetor.map((produto) => (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between p-4 bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => handleView(produto)}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {produto.nome}
                          </h3>
                          {produto.descricao && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {produto.descricao.replace(/<[^>]*>/g, "").substring(0, 80)}
                              {produto.descricao.length > 80 ? "..." : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
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
