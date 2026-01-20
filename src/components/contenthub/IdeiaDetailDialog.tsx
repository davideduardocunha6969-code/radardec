import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Trash2 } from "lucide-react";
import {
  Setor,
  Formato,
  SETOR_LABELS,
  FORMATO_LABELS,
} from "@/hooks/useConteudosMidia";
import { IdeiaConteudo, IdeiaConteudoInput } from "@/hooks/useIdeiasConteudo";

interface IdeiaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideia: IdeiaConteudo | null;
  onUpdate: (data: Partial<IdeiaConteudoInput> & { id: string }) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

export function IdeiaDetailDialog({
  open,
  onOpenChange,
  ideia,
  onUpdate,
  onDelete,
  isAdmin,
}: IdeiaDetailDialogProps) {
  const [editedData, setEditedData] = useState<Partial<IdeiaConteudoInput>>({});

  useEffect(() => {
    if (ideia) {
      setEditedData({
        setor: ideia.setor,
        formato: ideia.formato,
        titulo: ideia.titulo,
        gancho: ideia.gancho || "",
        orientacoes_filmagem: ideia.orientacoes_filmagem || "",
        copy_completa: ideia.copy_completa || "",
        link_inspiracao: ideia.link_inspiracao || "",
        link_video_drive: ideia.link_video_drive || "",
        semana_publicacao: ideia.semana_publicacao,
      });
    }
  }, [ideia]);

  if (!ideia) return null;

  const handleFieldChange = <K extends keyof IdeiaConteudoInput>(
    field: K,
    value: IdeiaConteudoInput[K]
  ) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate({ id: ideia.id, ...editedData });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Detalhes da Ideia</span>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir ideia?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A ideia será permanentemente excluída.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDelete(ideia.id);
                        onOpenChange(false);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={editedData.setor}
                onValueChange={(v) => handleFieldChange("setor", v as Setor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SETOR_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato</Label>
              <Select
                value={editedData.formato}
                onValueChange={(v) => handleFieldChange("formato", v as Formato)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMATO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semana</Label>
              <Select
                value={editedData.semana_publicacao?.toString() || "none"}
                onValueChange={(v) => handleFieldChange("semana_publicacao", v === "none" ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semana" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">—</SelectItem>
                  {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Semana {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={editedData.titulo || ""}
              onChange={(e) => handleFieldChange("titulo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Gancho</Label>
            <Textarea
              value={editedData.gancho || ""}
              onChange={(e) => handleFieldChange("gancho", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Orientações para Filmagem</Label>
            <Textarea
              value={editedData.orientacoes_filmagem || ""}
              onChange={(e) => handleFieldChange("orientacoes_filmagem", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Copy Completa</Label>
            <Textarea
              value={editedData.copy_completa || ""}
              onChange={(e) => handleFieldChange("copy_completa", e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Link de Inspiração
                {editedData.link_inspiracao && (
                  <a
                    href={editedData.link_inspiracao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Label>
              <Input
                value={editedData.link_inspiracao || ""}
                onChange={(e) => handleFieldChange("link_inspiracao", e.target.value)}
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Link do Drive
                {editedData.link_video_drive && (
                  <a
                    href={editedData.link_video_drive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Label>
              <Input
                value={editedData.link_video_drive || ""}
                onChange={(e) => handleFieldChange("link_video_drive", e.target.value)}
                type="url"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
