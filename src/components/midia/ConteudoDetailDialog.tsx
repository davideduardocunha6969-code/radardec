import { useState } from "react";
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
import { ExternalLink, Trash2, Video, Link2, CalendarDays } from "lucide-react";
import {
  ConteudoMidia,
  Setor,
  Formato,
  Status,
  SETOR_LABELS,
  FORMATO_LABELS,
  STATUS_LABELS,
} from "@/hooks/useConteudosMidia";
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
import { Separator } from "@/components/ui/separator";

interface ConteudoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conteudo: ConteudoMidia;
  onUpdate: (data: Partial<ConteudoMidia>) => void;
  onDelete: () => void;
  isAdmin?: boolean;
}

export function ConteudoDetailDialog({
  open,
  onOpenChange,
  conteudo,
  onUpdate,
  onDelete,
  isAdmin,
}: ConteudoDetailDialogProps) {
  const [editedData, setEditedData] = useState(conteudo);

  const handleFieldChange = (field: keyof ConteudoMidia, value: string | number | null) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleSave = () => {
    onUpdate({
      setor: editedData.setor,
      formato: editedData.formato,
      titulo: editedData.titulo,
      gancho: editedData.gancho,
      orientacoes_filmagem: editedData.orientacoes_filmagem,
      copy_completa: editedData.copy_completa,
      link_inspiracao: editedData.link_inspiracao,
      link_video_drive: editedData.link_video_drive,
      semana_publicacao: editedData.semana_publicacao,
      status: editedData.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="text-xl">Detalhes do Conteúdo</span>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este conteúdo? Esta ação não
                      pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info Section */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Setor</Label>
              <Select
                value={editedData.setor}
                onValueChange={(value: Setor) =>
                  handleFieldChange("setor", value)
                }
              >
                <SelectTrigger className="h-9">
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Formato</Label>
              <Select
                value={editedData.formato}
                onValueChange={(value: Formato) =>
                  handleFieldChange("formato", value)
                }
              >
                <SelectTrigger className="h-9">
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Semana
              </Label>
              <Select
                value={editedData.semana_publicacao?.toString() || "none"}
                onValueChange={(value) =>
                  handleFieldChange("semana_publicacao", value === "none" ? null : parseInt(value))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="—" />
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

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
              <Select
                value={editedData.status}
                onValueChange={(value: Status) =>
                  handleFieldChange("status", value)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Título da Postagem</Label>
            <Input
              value={editedData.titulo}
              onChange={(e) => handleFieldChange("titulo", e.target.value)}
              className="text-base font-medium"
            />
          </div>

          {/* Hook */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Gancho</Label>
            <Textarea
              value={editedData.gancho || ""}
              onChange={(e) => handleFieldChange("gancho", e.target.value)}
              rows={2}
              placeholder="Gancho para chamar atenção..."
              className="resize-none"
            />
          </div>

          {/* Filming Instructions */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Orientações para Filmagem</Label>
            <Textarea
              value={editedData.orientacoes_filmagem || ""}
              onChange={(e) =>
                handleFieldChange("orientacoes_filmagem", e.target.value)
              }
              rows={3}
              placeholder="Instruções detalhadas para gravação..."
              className="resize-none"
            />
          </div>

          {/* Full Copy */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Copy Completa</Label>
            <Textarea
              value={editedData.copy_completa || ""}
              onChange={(e) =>
                handleFieldChange("copy_completa", e.target.value)
              }
              rows={5}
              placeholder="Texto completo da postagem..."
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Link de Inspiração
              </Label>
              <div className="flex gap-2">
                <Input
                  value={editedData.link_inspiracao || ""}
                  onChange={(e) =>
                    handleFieldChange("link_inspiracao", e.target.value)
                  }
                  type="url"
                  placeholder="https://..."
                  className="flex-1"
                />
                {editedData.link_inspiracao && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(editedData.link_inspiracao!, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Link do Vídeo no Drive
              </Label>
              <div className="flex gap-2">
                <Input
                  value={editedData.link_video_drive || ""}
                  onChange={(e) =>
                    handleFieldChange("link_video_drive", e.target.value)
                  }
                  type="url"
                  placeholder="https://drive.google.com/..."
                  className="flex-1"
                />
                {editedData.link_video_drive && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(editedData.link_video_drive!, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
