import { useState } from "react";
import { useCrmLeadCampos, type CrmLeadCampo } from "@/hooks/useCrmLeadCampos";
import {
  useCrmLeadSecoes,
  useCreateCrmLeadSecao,
  useUpdateCrmLeadSecao,
  useDeleteCrmLeadSecao,
  useUpdateCampoSecao,
  type CrmLeadSecao,
} from "@/hooks/useCrmLeadSecoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, FolderOpen, Pencil, Check, X } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";

interface DraggableCampoProps {
  campo: CrmLeadCampo & { secao_id?: string | null };
  isDragging?: boolean;
}

function DraggableCampo({ campo, isDragging }: DraggableCampoProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
        isDragging ? "opacity-50 border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
      }`}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
      <span>{campo.nome}</span>
      <Badge variant="secondary" className="text-[10px] ml-auto">{campo.key}</Badge>
    </div>
  );
}

export function LeadSecoesConfig() {
  const { data: campos, isLoading: camposLoading } = useCrmLeadCampos();
  const { data: secoes, isLoading: secoesLoading } = useCrmLeadSecoes();
  const createSecao = useCreateCrmLeadSecao();
  const updateSecao = useUpdateCrmLeadSecao();
  const deleteSecao = useDeleteCrmLeadSecao();
  const updateCampoSecao = useUpdateCampoSecao();

  const [newSecaoName, setNewSecaoName] = useState("");
  const [editingSecao, setEditingSecao] = useState<string | null>(null);
  const [editingSecaoName, setEditingSecaoName] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Extend campos with secao_id from DB
  const camposExtended = (campos as (CrmLeadCampo & { secao_id?: string | null })[]) || [];

  // Group campos by secao
  const camposSemSecao = camposExtended.filter((c) => !c.secao_id);
  const camposPorSecao = (secoes || []).map((s) => ({
    secao: s,
    campos: camposExtended.filter((c) => c.secao_id === s.id),
  }));

  const handleCreateSecao = () => {
    if (!newSecaoName.trim()) return;
    createSecao.mutate(
      { nome: newSecaoName.trim(), ordem: (secoes?.length || 0) + 1 },
      { onSuccess: () => setNewSecaoName("") }
    );
  };

  const handleRenameSecao = (id: string) => {
    if (!editingSecaoName.trim()) return;
    updateSecao.mutate(
      { id, nome: editingSecaoName.trim() },
      { onSuccess: () => setEditingSecao(null) }
    );
  };

  const handleDeleteSecao = (id: string) => {
    if (!confirm("Excluir esta seção? Os campos voltarão para 'Sem seção'.")) return;
    deleteSecao.mutate(id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const campoId = String(active.id);
    const targetId = String(over.id);

    // Target is a secao droppable area
    const targetSecaoId = targetId.startsWith("secao:")
      ? targetId.replace("secao:", "")
      : targetId === "sem-secao"
        ? null
        : null;

    // If dropped on another campo, find its secao
    const targetCampo = camposExtended.find((c) => c.id === targetId);
    const finalSecaoId = targetSecaoId !== undefined
      ? targetSecaoId
      : targetCampo
        ? targetCampo.secao_id || null
        : undefined;

    if (finalSecaoId === undefined) return;

    const campo = camposExtended.find((c) => c.id === campoId);
    if (!campo || campo.secao_id === finalSecaoId) return;

    updateCampoSecao.mutate({ campoId, secaoId: finalSecaoId });
  };

  const activeCampo = activeDragId
    ? camposExtended.find((c) => c.id === activeDragId)
    : null;

  if (camposLoading || secoesLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Seções dos Dados do Lead</h2>
        <p className="text-sm text-muted-foreground">
          Organize os campos em seções arrastando-os. Campos sem seção aparecerão no topo.
        </p>
      </div>

      {/* Criar nova seção */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nome da nova seção (ex: Dados pessoais)"
          value={newSecaoName}
          onChange={(e) => setNewSecaoName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateSecao()}
          className="max-w-sm"
        />
        <Button onClick={handleCreateSecao} disabled={createSecao.isPending || !newSecaoName.trim()}>
          <Plus className="h-4 w-4 mr-1" />Nova Seção
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Campos sem seção */}
        <DroppableSection
          id="sem-secao"
          title="Sem seção"
          icon={<FolderOpen className="h-4 w-4 text-muted-foreground" />}
          campos={camposSemSecao}
        />

        {/* Seções */}
        {camposPorSecao.map(({ secao, campos: secaoCampos }) => (
          <DroppableSection
            key={secao.id}
            id={`secao:${secao.id}`}
            title={secao.nome}
            campos={secaoCampos}
            isEditing={editingSecao === secao.id}
            editName={editingSecaoName}
            onEditNameChange={setEditingSecaoName}
            onStartEdit={() => { setEditingSecao(secao.id); setEditingSecaoName(secao.nome); }}
            onConfirmEdit={() => handleRenameSecao(secao.id)}
            onCancelEdit={() => setEditingSecao(null)}
            onDelete={() => handleDeleteSecao(secao.id)}
          />
        ))}

        <DragOverlay>
          {activeCampo ? <DraggableCampo campo={activeCampo} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ──────────────── Droppable Section ──────────────── */

import { useDroppable, useDraggable } from "@dnd-kit/core";

function DroppableSection({
  id,
  title,
  icon,
  campos,
  isEditing,
  editName,
  onEditNameChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onDelete,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  campos: (CrmLeadCampo & { secao_id?: string | null })[];
  isEditing?: boolean;
  editName?: string;
  onEditNameChange?: (v: string) => void;
  onStartEdit?: () => void;
  onConfirmEdit?: () => void;
  onCancelEdit?: () => void;
  onDelete?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card className={`transition-colors ${isOver ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  className="h-7 text-sm w-48"
                  value={editName}
                  onChange={(e) => onEditNameChange?.(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onConfirmEdit?.()}
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onConfirmEdit}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            )}
            <Badge variant="secondary" className="text-[10px]">{campos.length}</Badge>
          </div>
          {id !== "sem-secao" && !isEditing && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStartEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent ref={setNodeRef} className="px-4 pb-4">
        {campos.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3 text-center border border-dashed rounded-md">
            Arraste campos para esta seção
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {campos.map((campo) => (
              <DraggableCampoWrapper key={campo.id} campo={campo} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableCampoWrapper({ campo }: { campo: CrmLeadCampo & { secao_id?: string | null } }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: campo.id });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <DraggableCampo campo={campo} isDragging={isDragging} />
    </div>
  );
}
