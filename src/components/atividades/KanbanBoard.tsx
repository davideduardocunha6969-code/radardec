import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, GripVertical, MoreVertical, Pencil, Plus, Trash2, User, Clock, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Atividade, Coluna } from "@/hooks/useAtividadesMarketing";
import { PRIORIDADE_LABELS, PRIORIDADE_COLORS } from "@/hooks/useAtividadesMarketing";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanBoardProps {
  colunas: Coluna[];
  atividades: Atividade[];
  onMoveAtividade: (id: string, coluna_id: string) => void;
  onClickAtividade: (atividade: Atividade) => void;
  onAddColuna: (nome: string) => void;
  onDeleteColuna: (id: string) => void;
  onRenameColuna: (id: string, nome: string) => void;
  onReorderColunas: (orderedIds: string[]) => void;
}

const COLUNA_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  "Pendentes": { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  "Em Andamento": { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  "Retificação": { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
  "Finalizado": { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
};

const getDeadlineStatus = (prazo: string | null) => {
  if (!prazo) return null;
  const date = new Date(prazo);
  const today = new Date();
  const diff = differenceInDays(date, today);
  
  if (isPast(date)) return { status: "overdue", label: "Atrasado", color: "text-red-600 dark:text-red-400" };
  if (diff <= 1) return { status: "urgent", label: "Urgente", color: "text-orange-600 dark:text-orange-400" };
  if (diff <= 3) return { status: "soon", label: "Em breve", color: "text-amber-600 dark:text-amber-400" };
  return { status: "ok", label: "", color: "text-muted-foreground" };
};

export function KanbanBoard({
  colunas,
  atividades,
  onMoveAtividade,
  onClickAtividade,
  onAddColuna,
  onDeleteColuna,
  onRenameColuna,
  onReorderColunas,
}: KanbanBoardProps) {
  const [novaColunaName, setNovaColunaName] = useState("");
  const [showAddColuna, setShowAddColuna] = useState(false);
  const [editingColunaId, setEditingColunaId] = useState<string | null>(null);
  const [editingColunaName, setEditingColunaName] = useState("");
  const [draggedAtividade, setDraggedAtividade] = useState<string | null>(null);
  const [dragOverColuna, setDragOverColuna] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, atividadeId: string) => {
    setDraggedAtividade(atividadeId);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight delay for better visual feedback
    setTimeout(() => {
      const element = e.target as HTMLElement;
      element.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.target as HTMLElement;
    element.style.opacity = "1";
    setDraggedAtividade(null);
    setDragOverColuna(null);
  };

  const handleDragOver = (e: React.DragEvent, colunaId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColuna(colunaId);
  };

  const handleDragLeave = () => {
    setDragOverColuna(null);
  };

  const handleDrop = (e: React.DragEvent, colunaId: string) => {
    e.preventDefault();
    if (draggedAtividade) {
      onMoveAtividade(draggedAtividade, colunaId);
      setDraggedAtividade(null);
      setDragOverColuna(null);
    }
  };

  const handleAddColuna = () => {
    if (novaColunaName.trim()) {
      onAddColuna(novaColunaName.trim());
      setNovaColunaName("");
      setShowAddColuna(false);
    }
  };

  const getAtividadesByColuna = (colunaId: string) => {
    return atividades
      .filter((a) => a.coluna_id === colunaId)
      .sort((a, b) => {
        // Sort by priority: emergencia > urgente > importante > util
        const priorityOrder = { emergencia: 0, urgente: 1, importante: 2, util: 3 };
        return priorityOrder[a.prioridade] - priorityOrder[b.prioridade];
      });
  };

  const getColunaColors = (nome: string) => {
    return COLUNA_COLORS[nome] || { bg: "bg-muted/30", border: "border-border", dot: "bg-muted-foreground" };
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor)
  );

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = colunas.findIndex((c) => c.id === active.id);
    const newIndex = colunas.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = [...colunas];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    onReorderColunas(newOrder.map((c) => c.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
      <SortableContext items={colunas.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-4 h-full">
          {colunas.map((coluna) => {
            const colAtividades = getAtividadesByColuna(coluna.id);
            const colors = getColunaColors(coluna.nome);
            const isDropTarget = dragOverColuna === coluna.id;

            return (
              <SortableColumn
                key={coluna.id}
                coluna={coluna}
                colAtividades={colAtividades}
                colors={colors}
                isDropTarget={isDropTarget}
                editingColunaId={editingColunaId}
                editingColunaName={editingColunaName}
                setEditingColunaId={setEditingColunaId}
                setEditingColunaName={setEditingColunaName}
                onRenameColuna={onRenameColuna}
                onDeleteColuna={onDeleteColuna}
                draggedAtividade={draggedAtividade}
                onDragOver={(e) => handleDragOver(e, coluna.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, coluna.id)}
                onDragStartCard={handleDragStart}
                onDragEndCard={handleDragEnd}
                onClickAtividade={onClickAtividade}
              />
              <div className="p-3 border-b border-inherit shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                    {editingColunaId === coluna.id ? (
                      <Input
                        autoFocus
                        value={editingColunaName}
                        onChange={(e) => setEditingColunaName(e.target.value)}
                        onBlur={() => {
                          if (editingColunaName.trim() && editingColunaName.trim() !== coluna.nome) {
                            onRenameColuna(coluna.id, editingColunaName.trim());
                          }
                          setEditingColunaId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editingColunaName.trim() && editingColunaName.trim() !== coluna.nome) {
                              onRenameColuna(coluna.id, editingColunaName.trim());
                            }
                            setEditingColunaId(null);
                          } else if (e.key === "Escape") {
                            setEditingColunaId(null);
                          }
                        }}
                        className="h-6 text-sm font-semibold px-1 py-0 w-28"
                      />
                    ) : (
                      <h3
                        className="font-semibold text-sm text-foreground cursor-pointer"
                        onDoubleClick={() => {
                          setEditingColunaId(coluna.id);
                          setEditingColunaName(coluna.nome);
                        }}
                      >
                        {coluna.nome}
                      </h3>
                    )}
                    <Badge
                      variant="secondary" 
                      className="text-[10px] font-medium bg-background/80 h-5"
                    >
                      {colAtividades.length}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:bg-background/50"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setEditingColunaId(coluna.id);
                          setEditingColunaName(coluna.nome);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Renomear Coluna
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => onDeleteColuna(coluna.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Coluna
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {colAtividades.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5" />
                    </div>
                    <p className="text-sm">Nenhuma atividade</p>
                  </div>
                )}
                
                {colAtividades.map((atividade) => {
                  const deadlineStatus = getDeadlineStatus(atividade.prazo_fatal);
                  const isOverdue = deadlineStatus?.status === "overdue";
                  
                  return (
                    <Card
                      key={atividade.id}
                      className={cn(
                        "group cursor-pointer transition-all duration-200",
                        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
                        "active:scale-[0.98]",
                        "bg-card border-border/50",
                        draggedAtividade === atividade.id && "opacity-50 rotate-2 scale-95",
                        isOverdue && "border-l-4 border-l-red-500"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, atividade.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onClickAtividade(atividade)}
                    >
                      <CardContent className="p-4">
                        {/* Header with priority and drag handle */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <Badge 
                            className={cn(
                              "text-xs font-medium shadow-sm",
                              PRIORIDADE_COLORS[atividade.prioridade],
                              atividade.prioridade === "emergencia" && "animate-pulse"
                            )}
                          >
                            {atividade.prioridade === "emergencia" && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {PRIORIDADE_LABELS[atividade.prioridade]}
                          </Badge>
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                        </div>

                        {/* Activity description */}
                        <p className="text-sm font-medium text-foreground line-clamp-3 mb-4 leading-relaxed">
                          {atividade.atividade}
                        </p>

                        {/* Footer with metadata */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          {atividade.responsavel ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {atividade.responsavel.display_name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground/50">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3 w-3" />
                              </div>
                              <span className="text-xs">Sem responsável</span>
                            </div>
                          )}

                          {atividade.prazo_fatal && (
                            <div
                              className={cn(
                                "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
                                isOverdue 
                                  ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400" 
                                  : deadlineStatus?.status === "urgent"
                                    ? "bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {isOverdue ? (
                                <Clock className="h-3 w-3" />
                              ) : (
                                <Calendar className="h-3 w-3" />
                              )}
                              {format(new Date(atividade.prazo_fatal), "dd MMM", { locale: ptBR })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}