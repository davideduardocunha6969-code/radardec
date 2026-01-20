import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Filter, X } from "lucide-react";
import { useAtividadesMarketing, type Atividade, type Prioridade, PRIORIDADE_LABELS } from "@/hooks/useAtividadesMarketing";
import { KanbanBoard } from "@/components/atividades/KanbanBoard";
import { AtividadeFormDialog } from "@/components/atividades/AtividadeFormDialog";
import { AtividadeDetailDialog } from "@/components/atividades/AtividadeDetailDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  
  // Filter states
  const [filterResponsavel, setFilterResponsavel] = useState<string>("all");
  const [filterPrioridade, setFilterPrioridade] = useState<string>("all");

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

  // Filtered atividades
  const filteredAtividades = useMemo(() => {
    return atividades.filter((a) => {
      const matchResponsavel = filterResponsavel === "all" || a.responsavel_id === filterResponsavel;
      const matchPrioridade = filterPrioridade === "all" || a.prioridade === filterPrioridade;
      return matchResponsavel && matchPrioridade;
    });
  }, [atividades, filterResponsavel, filterPrioridade]);

  const hasActiveFilters = filterResponsavel !== "all" || filterPrioridade !== "all";

  const clearFilters = () => {
    setFilterResponsavel("all");
    setFilterPrioridade("all");
  };

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
      {/* Header */}
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

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtros:</span>
        </div>

        <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            {(Object.keys(PRIORIDADE_LABELS) as Prioridade[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PRIORIDADE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {filteredAtividades.length} de {atividades.length} atividades
          </Badge>
        </div>
      </div>

      <KanbanBoard
        colunas={colunas}
        atividades={filteredAtividades}
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
