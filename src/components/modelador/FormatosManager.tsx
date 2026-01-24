import { useState } from "react";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Settings } from "lucide-react";
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
import { FormatoOrigem, FormatoSaida, UpdateFormatoParams, CreateFormatoParams } from "@/hooks/useFormatosModelador";
import { getFormatoIcon, getFormatoColors } from "@/utils/formatoIcons";
import { cn } from "@/lib/utils";

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
  const [editingFormato, setEditingFormato] = useState<FormatoOrigem | FormatoSaida | null>(null);
  const [deletingFormato, setDeletingFormato] = useState<{ id: string; nome: string; tipo: "origem" | "saida" } | null>(null);

  const handleAddClick = (tipo: "origem" | "saida") => {
    setEditingTipo(tipo);
    setEditingFormato(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = (formato: FormatoOrigem | FormatoSaida, tipo: "origem" | "saida") => {
    setEditingTipo(tipo);
    setEditingFormato(formato);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (formato: FormatoOrigem | FormatoSaida, tipo: "origem" | "saida") => {
    setDeletingFormato({ id: formato.id, nome: formato.nome, tipo });
    setDeleteDialogOpen(true);
  };

  const handleSaveFormato = async (data: FormatoFormData) => {
    setIsSaving(true);
    try {
      if (editingFormato) {
        const updateFn = editingTipo === "origem" ? onUpdateOrigem : onUpdateSaida;
        await updateFn({
          id: editingFormato.id,
          key: data.key,
          nome: data.nome,
          descricao: data.descricao || undefined,
          icone: data.icone,
          cor: data.cor,
        });
      } else {
        const createFn = editingTipo === "origem" ? onCreateOrigem : onCreateSaida;
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
    
    const deleteFn = deletingFormato.tipo === "origem" ? onDeleteOrigem : onDeleteSaida;
    await deleteFn(deletingFormato.id);
    setDeleteDialogOpen(false);
    setDeletingFormato(null);
  };

  const handleMoveUp = async (formato: FormatoOrigem | FormatoSaida, tipo: "origem" | "saida", list: (FormatoOrigem | FormatoSaida)[]) => {
    const index = list.findIndex((f) => f.id === formato.id);
    if (index <= 0) return;
    
    const updateFn = tipo === "origem" ? onUpdateOrigem : onUpdateSaida;
    const prevFormato = list[index - 1];
    
    await Promise.all([
      updateFn({ id: formato.id, ordem: prevFormato.ordem }),
      updateFn({ id: prevFormato.id, ordem: formato.ordem }),
    ]);
  };

  const handleMoveDown = async (formato: FormatoOrigem | FormatoSaida, tipo: "origem" | "saida", list: (FormatoOrigem | FormatoSaida)[]) => {
    const index = list.findIndex((f) => f.id === formato.id);
    if (index < 0 || index >= list.length - 1) return;
    
    const updateFn = tipo === "origem" ? onUpdateOrigem : onUpdateSaida;
    const nextFormato = list[index + 1];
    
    await Promise.all([
      updateFn({ id: formato.id, ordem: nextFormato.ordem }),
      updateFn({ id: nextFormato.id, ordem: formato.ordem }),
    ]);
  };

  const renderFormatoItem = (
    formato: FormatoOrigem | FormatoSaida,
    tipo: "origem" | "saida",
    list: (FormatoOrigem | FormatoSaida)[],
    index: number
  ) => {
    const Icon = getFormatoIcon(formato.icone);
    const colors = getFormatoColors(formato.cor);

    return (
      <div
        key={formato.id}
        className="flex items-center justify-between p-3 rounded-lg border bg-card"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded", colors.bgColor, colors.textColor)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{formato.nome}</p>
            <p className="text-xs text-muted-foreground">{formato.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleMoveUp(formato, tipo, list)}
            disabled={index === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleMoveDown(formato, tipo, list)}
            disabled={index === list.length - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEditClick(formato, tipo)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleDeleteClick(formato, tipo)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

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
              Adicione, edite ou remova formatos de origem e saída da matriz.
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
              <div className="space-y-2">
                {formatosOrigem.map((f, i) => renderFormatoItem(f, "origem", formatosOrigem, i))}
              </div>
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
              <div className="space-y-2">
                {formatosSaida.map((f, i) => renderFormatoItem(f, "saida", formatosSaida, i))}
              </div>
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
              Tem certeza que deseja excluir o formato "{deletingFormato?.nome}"?
              Prompts associados a este formato serão mantidos, mas ficarão órfãos.
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
