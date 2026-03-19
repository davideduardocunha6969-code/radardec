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
    updateColuna,
    reorderColunas,
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
  const [filterDeadlineStatus, setFilterDeadlineStatus] = useState<string>("all");

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
      
      // Deadline status filter
      let matchDeadlineStatus = true;
      if (filterDeadlineStatus === "overdue") {
        matchDeadlineStatus = a.prazo_fatal ? isPast(new Date(a.prazo_fatal)) : false;
      } else if (filterDeadlineStatus === "dueSoon") {
        if (!a.prazo_fatal) {
          matchDeadlineStatus = false;
        } else {
          const diff = differenceInDays(new Date(a.prazo_fatal), new Date());
          matchDeadlineStatus = diff >= 0 && diff <= 2;
        }
      }
      
      return matchResponsavel && matchPrioridade && matchDeadlineStatus;
    });
  }, [atividades, filterResponsavel, filterPrioridade, filterDeadlineStatus]);

  const hasActiveFilters = filterResponsavel !== "all" || filterPrioridade !== "all" || filterDeadlineStatus !== "all";

  const clearFilters = () => {
    setFilterResponsavel("all");
    setFilterPrioridade("all");
    setFilterDeadlineStatus("all");
  };

  const handleClickAtividade = (atividade: Atividade) => {
    setSelectedAtividade(atividade);
    setShowDetailDialog(true);
  };

  // Alert card click handlers
  const handleAlertClick = (type: "overdue" | "dueSoon" | "emergency" | "urgent") => {
    clearFilters();
    if (type === "overdue" || type === "dueSoon") {
      setFilterDeadlineStatus(type);
    } else {
      setFilterPrioridade(type === "emergency" ? "emergencia" : "urgente");
    }
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
    <div className="flex flex-col h-full overflow-hidden p-4 min-h-0">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 shrink-0 mb-3">
        <h1 className="text-xl font-bold shrink-0">Atividades</h1>

        {/* Alert Cards - Inline compact */}
        <div className="flex items-center gap-1.5">
          {/* Overdue */}
          <button 
            onClick={() => handleAlertClick("overdue")}
            disabled={alertCounts.overdue === 0}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-left",
              alertCounts.overdue > 0 
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 cursor-pointer hover:border-red-400" 
                : "bg-muted/30 border-transparent cursor-default",
              filterDeadlineStatus === "overdue" && "ring-2 ring-red-500"
            )}
          >
            <AlertTriangle className={cn(
              "h-3.5 w-3.5",
              alertCounts.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-bold",
              alertCounts.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )}>
              {alertCounts.overdue}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Atrasadas</span>
          </button>

          {/* Due Soon */}
          <button 
            onClick={() => handleAlertClick("dueSoon")}
            disabled={alertCounts.dueSoon === 0}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-left",
              alertCounts.dueSoon > 0 
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 cursor-pointer hover:border-amber-400" 
                : "bg-muted/30 border-transparent cursor-default",
              filterDeadlineStatus === "dueSoon" && "ring-2 ring-amber-500"
            )}
          >
            <Clock className={cn(
              "h-3.5 w-3.5",
              alertCounts.dueSoon > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-bold",
              alertCounts.dueSoon > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            )}>
              {alertCounts.dueSoon}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Em breve</span>
          </button>

          {/* Emergency */}
          <button 
            onClick={() => handleAlertClick("emergency")}
            disabled={alertCounts.emergency === 0}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-left",
              alertCounts.emergency > 0 
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 cursor-pointer hover:border-rose-400" 
                : "bg-muted/30 border-transparent cursor-default",
              filterPrioridade === "emergencia" && "ring-2 ring-rose-500"
            )}
          >
            <Flame className={cn(
              "h-3.5 w-3.5",
              alertCounts.emergency > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-bold",
              alertCounts.emergency > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
            )}>
              {alertCounts.emergency}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Emergências</span>
          </button>

          {/* Urgent */}
          <button 
            onClick={() => handleAlertClick("urgent")}
            disabled={alertCounts.urgent === 0}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-left",
              alertCounts.urgent > 0 
                ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 cursor-pointer hover:border-orange-400" 
                : "bg-muted/30 border-transparent cursor-default",
              filterPrioridade === "urgente" && "ring-2 ring-orange-500"
            )}
          >
            <AlertTriangle className={cn(
              "h-3.5 w-3.5",
              alertCounts.urgent > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-bold",
              alertCounts.urgent > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
            )}>
              {alertCounts.urgent}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Urgentes</span>
          </button>
        </div>

        <Button onClick={() => setShowFormDialog(true)} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      {/* Filters Bar - Compact */}
      <div className="flex items-center gap-2 py-1.5 px-2 bg-muted/30 rounded-md border shrink-0 mb-3">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />

        <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
          <SelectTrigger className="w-[140px] h-7 text-xs bg-background">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-[120px] h-7 text-xs bg-background">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(Object.keys(PRIORIDADE_LABELS) as Prioridade[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PRIORIDADE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs text-muted-foreground px-1.5"
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        <Badge variant="outline" className="text-[10px] font-normal h-5 ml-auto">
          {filteredAtividades.length}/{atividades.length}
        </Badge>

        <div className="h-4 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => addColuna.mutate("Nova Coluna")}
          className="h-6 text-xs px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Coluna
        </Button>
      </div>

      {/* Kanban - Only this scrolls horizontally */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <KanbanBoard
          colunas={colunas}
          atividades={filteredAtividades}
          onMoveAtividade={(id, coluna_id) => moveAtividade.mutate({ id, coluna_id })}
          onClickAtividade={handleClickAtividade}
          onAddColuna={(nome) => addColuna.mutate(nome)}
          onDeleteColuna={(id) => deleteColuna.mutate(id)}
          onRenameColuna={(id, nome) => updateColuna.mutate({ id, nome })}
        />
      </div>

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
