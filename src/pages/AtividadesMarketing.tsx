import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useAtividadesMarketing, type Atividade } from "@/hooks/useAtividadesMarketing";
import { KanbanBoard } from "@/components/atividades/KanbanBoard";
import { AtividadeFormDialog } from "@/components/atividades/AtividadeFormDialog";
import { AtividadeDetailDialog } from "@/components/atividades/AtividadeDetailDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function AtividadesMarketing() {
  const {
    profiles,
    colunas,
    atividades,
    isLoading,
    createAtividade,
    updateAtividade,
    deleteAtividade,
    moveAtividade,
    addColuna,
    deleteColuna,
    addComentario,
    fetchComentarios,
    addAnexo,
    fetchAnexos,
    deleteAnexo,
  } = useAtividadesMarketing();

  const queryClient = useQueryClient();
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch comentarios for selected atividade
  const { data: comentarios = [] } = useQuery({
    queryKey: ["atividade-comentarios", selectedAtividade?.id],
    queryFn: () => (selectedAtividade ? fetchComentarios(selectedAtividade.id) : Promise.resolve([])),
    enabled: !!selectedAtividade,
  });

  // Fetch anexos for selected atividade
  const { data: anexos = [] } = useQuery({
    queryKey: ["atividade-anexos", selectedAtividade?.id],
    queryFn: () => (selectedAtividade ? fetchAnexos(selectedAtividade.id) : Promise.resolve([])),
    enabled: !!selectedAtividade,
  });

  const handleClickAtividade = (atividade: Atividade) => {
    setSelectedAtividade(atividade);
    setShowDetailDialog(true);
  };

  const handleAddComentario = (atividade_id: string, texto: string) => {
    addComentario.mutate(
      { atividade_id, texto },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["atividade-comentarios", atividade_id] });
        },
      }
    );
  };

  const handleAddAnexo = (atividade_id: string, file: File) => {
    addAnexo.mutate(
      { atividade_id, file },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["atividade-anexos", atividade_id] });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atividades</h1>
          <p className="text-muted-foreground">
            Gerencie as atividades da equipe de marketing
          </p>
        </div>
        <Button onClick={() => setShowFormDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Atividade
        </Button>
      </div>

      <KanbanBoard
        colunas={colunas}
        atividades={atividades}
        onMoveAtividade={(id, coluna_id) => moveAtividade.mutate({ id, coluna_id })}
        onClickAtividade={handleClickAtividade}
        onAddColuna={(nome) => addColuna.mutate(nome)}
        onDeleteColuna={(id) => deleteColuna.mutate(id)}
      />

      <AtividadeFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        profiles={profiles}
        colunas={colunas}
        onSubmit={(data) => createAtividade.mutate(data)}
        isSubmitting={createAtividade.isPending}
      />

      <AtividadeDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        atividade={selectedAtividade}
        profiles={profiles}
        colunas={colunas}
        comentarios={comentarios}
        anexos={anexos}
        onUpdate={(data) => updateAtividade.mutate(data)}
        onDelete={(id) => deleteAtividade.mutate(id)}
        onAddComentario={handleAddComentario}
        onAddAnexo={handleAddAnexo}
        onDeleteAnexo={(id) => deleteAnexo.mutate(id)}
        isUpdating={updateAtividade.isPending}
      />
    </div>
  );
}
