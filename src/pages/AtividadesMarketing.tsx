import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Filter, X, AlertTriangle, Clock, Flame } from "lucide-react";
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
import { isPast, differenceInDays } from "date-fns";

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

  // Get final column ID (Finalizado)
  const finalizadoColumnId = useMemo(() => {
    const finalizadoCol = colunas.find(c => c.nome.toLowerCase() === "finalizado");
    return finalizadoCol?.id;
  }, [colunas]);

  // Calculate alert counts (excluding finalized)
  const alertCounts = useMemo(() => {
    const activeAtividades = atividades.filter(a => a.coluna_id !== finalizadoColumnId);
    
    const overdue = activeAtividades.filter(a => 
      a.prazo_fatal && isPast(new Date(a.prazo_fatal))
    ).length;

    const dueSoon = activeAtividades.filter(a => {
      if (!a.prazo_fatal) return false;
      const diff = differenceInDays(new Date(a.prazo_fatal), new Date());
      return diff >= 0 && diff <= 2;
    }).length;

    const emergency = activeAtividades.filter(a => a.prioridade === "emergencia").length;
    const urgent = activeAtividades.filter(a => a.prioridade === "urgente").length;

    return { overdue, dueSoon, emergency, urgent };
  }, [atividades, finalizadoColumnId]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      {/* Alert Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Overdue */}
        <div 
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
            alertCounts.overdue > 0 
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" 
              : "bg-muted/30 border-transparent"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            alertCounts.overdue > 0 
              ? "bg-red-100 dark:bg-red-900/50" 
              : "bg-muted"
          )}>
            <AlertTriangle className={cn(
              "h-5 w-5",
              alertCounts.overdue > 0 
                ? "text-red-600 dark:text-red-400 animate-pulse" 
                : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              alertCounts.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )}>
              {alertCounts.overdue}
            </p>
            <p className="text-xs text-muted-foreground">Atrasadas</p>
          </div>
        </div>

        {/* Due Soon */}
        <div 
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
            alertCounts.dueSoon > 0 
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" 
              : "bg-muted/30 border-transparent"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            alertCounts.dueSoon > 0 
              ? "bg-amber-100 dark:bg-amber-900/50" 
              : "bg-muted"
          )}>
            <Clock className={cn(
              "h-5 w-5",
              alertCounts.dueSoon > 0 
                ? "text-amber-600 dark:text-amber-400" 
                : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              alertCounts.dueSoon > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            )}>
              {alertCounts.dueSoon}
            </p>
            <p className="text-xs text-muted-foreground">Vencendo em breve</p>
          </div>
        </div>

        {/* Emergency */}
        <div 
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
            alertCounts.emergency > 0 
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" 
              : "bg-muted/30 border-transparent"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            alertCounts.emergency > 0 
              ? "bg-rose-100 dark:bg-rose-900/50" 
              : "bg-muted"
          )}>
            <Flame className={cn(
              "h-5 w-5",
              alertCounts.emergency > 0 
                ? "text-rose-600 dark:text-rose-400 animate-pulse" 
                : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              alertCounts.emergency > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
            )}>
              {alertCounts.emergency}
            </p>
            <p className="text-xs text-muted-foreground">Emergências</p>
          </div>
        </div>

        {/* Urgent */}
        <div 
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
            alertCounts.urgent > 0 
              ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" 
              : "bg-muted/30 border-transparent"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            alertCounts.urgent > 0 
              ? "bg-orange-100 dark:bg-orange-900/50" 
              : "bg-muted"
          )}>
            <AlertTriangle className={cn(
              "h-5 w-5",
              alertCounts.urgent > 0 
                ? "text-orange-600 dark:text-orange-400" 
                : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              alertCounts.urgent > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
            )}>
              {alertCounts.urgent}
            </p>
            <p className="text-xs text-muted-foreground">Urgentes</p>
          </div>
        </div>
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
