import { useState } from "react";
import { useCrmLeadCampos, useCreateCrmLeadCampo, useDeleteCrmLeadCampo, normalizeKey, type CrmLeadCampo } from "@/hooks/useCrmLeadCampos";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, FolderOpen, Pencil, Check, X, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";

interface DraggableCampoProps {
  campo: CrmLeadCampo & { secao_id?: string | null };
  isDragging?: boolean;
}

function DraggableCampo({ campo, isDragging, onEditDescricao, onDelete }: DraggableCampoProps & { onEditDescricao?: (campo: CrmLeadCampo & { secao_id?: string | null }) => void; onDelete?: (campo: CrmLeadCampo) => void }) {
  const desc = (campo as any).descricao;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
        isDragging ? "opacity-50 border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
      }`}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
      <span>{campo.nome}</span>
      {desc && desc.trim() ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-primary/60 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{desc}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
      <Badge variant="secondary" className="text-[10px] ml-auto">{campo.key}</Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={(e) => { e.stopPropagation(); onEditDescricao?.(campo); }}
        title="Editar descrição"
      >
        <Info className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
        onClick={(e) => { e.stopPropagation(); onDelete?.(campo); }}
        title="Excluir campo"
      >
        <X className="h-3 w-3" />
      </Button>
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
  const createCampo = useCreateCrmLeadCampo();
  const deleteCampo = useDeleteCrmLeadCampo();

  const [newSecaoName, setNewSecaoName] = useState("");
  const [newCampoName, setNewCampoName] = useState("");
  const [newCampoTipo, setNewCampoTipo] = useState("texto");
  const [editingSecao, setEditingSecao] = useState<string | null>(null);
  const [editingSecaoName, setEditingSecaoName] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editingDescCampo, setEditingDescCampo] = useState<(CrmLeadCampo & { secao_id?: string | null }) | null>(null);
  const [editingDescText, setEditingDescText] = useState("");
  const queryClient = useQueryClient();

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

  const handleCreateCampo = () => {
    if (!newCampoName.trim()) return;
    const key = normalizeKey(newCampoName.trim());
    if (!key) return;
    createCampo.mutate(
      { nome: newCampoName.trim(), key, tipo: newCampoTipo, ordem: (campos?.length || 0) + 1 },
      { onSuccess: () => { setNewCampoName(""); setNewCampoTipo("texto"); } }
    );
  };

  const handleDeleteCampo = (campo: CrmLeadCampo) => {
    if (!confirm(`Excluir o campo "${campo.nome}"? Esta ação não pode ser desfeita.`)) return;
    deleteCampo.mutate(campo.id);
  };

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

  const handleEditDescricao = (campo: CrmLeadCampo & { secao_id?: string | null }) => {
    setEditingDescCampo(campo);
    setEditingDescText((campo as any).descricao || "");
  };

  const handleSaveDescricao = async () => {
    if (!editingDescCampo) return;
    const { error } = await supabase
      .from("crm_lead_campos" as any)
      .update({ descricao: editingDescText.trim() } as any)
      .eq("id", editingDescCampo.id);
    if (error) {
      const { toast } = await import("sonner");
      toast.error(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_campos"] });
      const { toast } = await import("sonner");
      toast.success("Descrição atualizada!");
    }
    setEditingDescCampo(null);
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
          Organize os campos em seções arrastando-os. Clique no ícone <Info className="h-3 w-3 inline" /> para adicionar uma descrição explicativa ao campo.
        </p>
      </div>

      {/* Editar descrição do campo */}
      {editingDescCampo && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Descrição do campo: {editingDescCampo.nome}</span>
            </div>
            <Textarea
              value={editingDescText}
              onChange={(e) => setEditingDescText(e.target.value)}
              placeholder="Explique o que este campo representa (ex: CPF do titular da conta bancária)"
              rows={2}
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingDescCampo(null)}>
                <X className="h-3.5 w-3.5 mr-1" />Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveDescricao}>
                <Check className="h-3.5 w-3.5 mr-1" />Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criar novo campo */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Nome do campo (ex: Estado Civil)"
          value={newCampoName}
          onChange={(e) => setNewCampoName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateCampo()}
          className="max-w-xs"
        />
        <Select value={newCampoTipo} onValueChange={setNewCampoTipo}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="texto">Texto</SelectItem>
            <SelectItem value="numero">Número</SelectItem>
            <SelectItem value="data">Data</SelectItem>
            <SelectItem value="select">Seleção</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCreateCampo} disabled={createCampo.isPending || !newCampoName.trim()}>
          <Plus className="h-4 w-4 mr-1" />Novo Campo
        </Button>
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
          onEditDescricao={handleEditDescricao}
          onDeleteCampo={handleDeleteCampo}
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
             onEditDescricao={handleEditDescricao}
             onDeleteCampo={handleDeleteCampo}
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
  onEditDescricao,
  onDeleteCampo,
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
  onEditDescricao?: (campo: CrmLeadCampo & { secao_id?: string | null }) => void;
  onDeleteCampo?: (campo: CrmLeadCampo) => void;
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
              <DraggableCampoWrapper key={campo.id} campo={campo} onEditDescricao={onEditDescricao} onDeleteCampo={onDeleteCampo} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableCampoWrapper({ campo, onEditDescricao, onDeleteCampo }: { campo: CrmLeadCampo & { secao_id?: string | null }; onEditDescricao?: (campo: CrmLeadCampo & { secao_id?: string | null }) => void; onDeleteCampo?: (campo: CrmLeadCampo) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: campo.id });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <DraggableCampo campo={campo} isDragging={isDragging} onEditDescricao={onEditDescricao} onDelete={onDeleteCampo} />
    </div>
  );
}
