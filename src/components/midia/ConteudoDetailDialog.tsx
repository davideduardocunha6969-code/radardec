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
import { ExternalLink, Trash2 } from "lucide-react";
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

  const handleFieldChange = (field: keyof ConteudoMidia, value: string) => {
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
      status: editedData.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Detalhes do Conteúdo</span>
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={editedData.setor}
                onValueChange={(value: Setor) =>
                  handleFieldChange("setor", value)
                }
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
                onValueChange={(value: Formato) =>
                  handleFieldChange("formato", value)
                }
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
          </div>

          <div className="space-y-2">
            <Label>Título da Postagem</Label>
            <Input
              value={editedData.titulo}
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
              onChange={(e) =>
                handleFieldChange("orientacoes_filmagem", e.target.value)
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Copy Completa</Label>
            <Textarea
              value={editedData.copy_completa || ""}
              onChange={(e) =>
                handleFieldChange("copy_completa", e.target.value)
              }
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Link do Modelo de Inspiração</Label>
            <div className="flex gap-2">
              <Input
                value={editedData.link_inspiracao || ""}
                onChange={(e) =>
                  handleFieldChange("link_inspiracao", e.target.value)
                }
                type="url"
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
            <Label>Status</Label>
            <Select
              value={editedData.status}
              onValueChange={(value: Status) =>
                handleFieldChange("status", value)
              }
            >
              <SelectTrigger>
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

          <div className="flex justify-end gap-2 pt-4">
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
