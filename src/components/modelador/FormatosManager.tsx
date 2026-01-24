import { useState, useCallback } from "react";
import { Plus, Settings } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { FormatoFormDialog, FormatoFormData } from "./FormatoFormDialog";
import { SortableFormatoItem } from "./SortableFormatoItem";
import {
  FormatoOrigem,
  FormatoSaida,
  UpdateFormatoParams,
  CreateFormatoParams,
} from "@/hooks/useFormatosModelador";

interface FormatosManagerProps {
  formatosOrigem: FormatoOrigem[];
  formatosSaida: FormatoSaida[];
  onCreateOrigem: (params: CreateFormatoParams) => Promise<any>;
  onCreateSaida: (params: CreateFormatoParams) => Promise<any>;
  onUpdateOrigem: (params: UpdateFormatoParams) => Promise<boolean>;
  onUpdateSaida: (params: UpdateFormatoParams) => Promise<boolean>;
  onDeleteOrigem: (id: string) => Promise<boolean>;
  onDeleteSaida: (id: string) => Promise<boolean>;
}

export function FormatosManager({
  formatosOrigem,
  formatosSaida,
  onCreateOrigem,
  onCreateSaida,
  onUpdateOrigem,
  onUpdateSaida,
  onDeleteOrigem,
  onDeleteSaida,
}: FormatosManagerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingTipo, setEditingTipo] = useState<"origem" | "saida">("origem");
  const [editingFormato, setEditingFormato] = useState<
    FormatoOrigem | FormatoSaida | null
  >(null);
  const [deletingFormato, setDeletingFormato] = useState<{
    id: string;
    nome: string;
    tipo: "origem" | "saida";
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddClick = (tipo: "origem" | "saida") => {
    setEditingTipo(tipo);
    setEditingFormato(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = (
    formato: FormatoOrigem | FormatoSaida,
    tipo: "origem" | "saida"
  ) => {
    setEditingTipo(tipo);
    setEditingFormato(formato);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (
    formato: FormatoOrigem | FormatoSaida,
    tipo: "origem" | "saida"
  ) => {
    setDeletingFormato({ id: formato.id, nome: formato.nome, tipo });
    setDeleteDialogOpen(true);
  };

  const handleSaveFormato = async (data: FormatoFormData) => {
    setIsSaving(true);
    try {
      if (editingFormato) {
        const updateFn =
          editingTipo === "origem" ? onUpdateOrigem : onUpdateSaida;
        await updateFn({
          id: editingFormato.id,
          key: data.key,
          nome: data.nome,
          descricao: data.descricao || undefined,
          icone: data.icone,
          cor: data.cor,
        });
      } else {
        const createFn =
          editingTipo === "origem" ? onCreateOrigem : onCreateSaida;
        await createFn({
          key: data.key,
          nome: data.nome,
          descricao: data.descricao || undefined,
          icone: data.icone,
          cor: data.cor,
        });
      }
      setFormDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingFormato) return;

    const deleteFn =
      deletingFormato.tipo === "origem" ? onDeleteOrigem : onDeleteSaida;
    await deleteFn(deletingFormato.id);
    setDeleteDialogOpen(false);
    setDeletingFormato(null);
  };

  const handleDragEndOrigem = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = formatosOrigem.findIndex((f) => f.id === active.id);
        const newIndex = formatosOrigem.findIndex((f) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(formatosOrigem, oldIndex, newIndex);

          // Update ordem for all affected items
          const updates = reordered.map((item, index) => ({
            id: item.id,
            ordem: index,
          }));

          // Execute updates in parallel
          await Promise.all(updates.map((u) => onUpdateOrigem(u)));
        }
      }
    },
    [formatosOrigem, onUpdateOrigem]
  );

  const handleDragEndSaida = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = formatosSaida.findIndex((f) => f.id === active.id);
        const newIndex = formatosSaida.findIndex((f) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(formatosSaida, oldIndex, newIndex);

          // Update ordem for all affected items
          const updates = reordered.map((item, index) => ({
            id: item.id,
            ordem: index,
          }));

          // Execute updates in parallel
          await Promise.all(updates.map((u) => onUpdateSaida(u)));
        }
      }
    },
    [formatosSaida, onUpdateSaida]
  );

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Formatos
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Gerenciar Formatos</SheetTitle>
            <SheetDescription>
              Arraste para reordenar os formatos. A ordem define a posição na matriz.
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="origem" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="origem">
                Origem
                <Badge variant="secondary" className="ml-2">
                  {formatosOrigem.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="saida">
                Saída
                <Badge variant="secondary" className="ml-2">
                  {formatosSaida.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="origem" className="space-y-4 mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAddClick("origem")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Formato de Origem
              </Button>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndOrigem}
              >
                <SortableContext
                  items={formatosOrigem.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {formatosOrigem.map((f) => (
                      <SortableFormatoItem
                        key={f.id}
                        formato={f}
                        tipo="origem"
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </TabsContent>

            <TabsContent value="saida" className="space-y-4 mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAddClick("saida")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Formato de Saída
              </Button>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndSaida}
              >
                <SortableContext
                  items={formatosSaida.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {formatosSaida.map((f) => (
                      <SortableFormatoItem
                        key={f.id}
                        formato={f}
                        tipo="saida"
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <FormatoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        tipo={editingTipo}
        initialData={
          editingFormato
            ? {
                key: editingFormato.key,
                nome: editingFormato.nome,
                descricao: editingFormato.descricao || "",
                icone: editingFormato.icone,
                cor: editingFormato.cor,
              }
            : null
        }
        onSave={handleSaveFormato}
        isSaving={isSaving}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o formato "{deletingFormato?.nome}
              "? Prompts associados a este formato serão mantidos, mas ficarão
              órfãos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
