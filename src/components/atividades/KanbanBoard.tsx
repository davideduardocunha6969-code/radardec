import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, GripVertical, MoreVertical, Plus, Trash2, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Atividade, Coluna } from "@/hooks/useAtividadesMarketing";
import { PRIORIDADE_LABELS, PRIORIDADE_COLORS } from "@/hooks/useAtividadesMarketing";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  colunas: Coluna[];
  atividades: Atividade[];
  onMoveAtividade: (id: string, coluna_id: string) => void;
  onClickAtividade: (atividade: Atividade) => void;
  onAddColuna: (nome: string) => void;
  onDeleteColuna: (id: string) => void;
}

export function KanbanBoard({
  colunas,
  atividades,
  onMoveAtividade,
  onClickAtividade,
  onAddColuna,
  onDeleteColuna,
}: KanbanBoardProps) {
  const [novaColunaName, setNovaColunaName] = useState("");
  const [showAddColuna, setShowAddColuna] = useState(false);
  const [draggedAtividade, setDraggedAtividade] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, atividadeId: string) => {
    setDraggedAtividade(atividadeId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, colunaId: string) => {
    e.preventDefault();
    if (draggedAtividade) {
      onMoveAtividade(draggedAtividade, colunaId);
      setDraggedAtividade(null);
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
    return atividades.filter((a) => a.coluna_id === colunaId);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {colunas.map((coluna) => {
        const colAtividades = getAtividadesByColuna(coluna.id);
        return (
          <div
            key={coluna.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, coluna.id)}
          >
            <Card className="h-full bg-muted/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {coluna.nome}
                    <Badge variant="secondary" className="text-xs">
                      {colAtividades.length}
                    </Badge>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteColuna(coluna.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Coluna
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {colAtividades.map((atividade) => {
                  const isPastDue = atividade.prazo_fatal && isPast(new Date(atividade.prazo_fatal));
                  return (
                    <Card
                      key={atividade.id}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-shadow",
                        draggedAtividade === atividade.id && "opacity-50"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, atividade.id)}
                      onClick={() => onClickAtividade(atividade)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                          <div className="flex-1 space-y-2">
                            <Badge className={cn("text-xs", PRIORIDADE_COLORS[atividade.prioridade])}>
                              {PRIORIDADE_LABELS[atividade.prioridade]}
                            </Badge>
                            <p className="text-sm line-clamp-3">{atividade.atividade}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {atividade.responsavel && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {atividade.responsavel.display_name}
                            </div>
                          )}
                          {atividade.prazo_fatal && (
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                isPastDue && "text-destructive"
                              )}
                            >
                              <Calendar className="h-3 w-3" />
                              {format(new Date(atividade.prazo_fatal), "dd/MM", { locale: ptBR })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        );
      })}

      {/* Add Column */}
      <div className="flex-shrink-0 w-80">
        {showAddColuna ? (
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder="Nome da coluna"
                value={novaColunaName}
                onChange={(e) => setNovaColunaName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddColuna()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddColuna}>
                  Adicionar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddColuna(false);
                    setNovaColunaName("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full h-12 border-dashed"
            onClick={() => setShowAddColuna(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Coluna
          </Button>
        )}
      </div>
    </div>
  );
}
