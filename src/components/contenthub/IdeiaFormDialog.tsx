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
import {
  Setor,
  Formato,
  SETOR_LABELS,
  FORMATO_LABELS,
} from "@/hooks/useConteudosMidia";
import { IdeiaConteudoInput } from "@/hooks/useIdeiasConteudo";

interface IdeiaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IdeiaConteudoInput) => void;
  isLoading?: boolean;
}

export function IdeiaFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: IdeiaFormDialogProps) {
  const [formData, setFormData] = useState<IdeiaConteudoInput>({
    setor: "trabalhista",
    formato: "video",
    titulo: "",
    gancho: "",
    orientacoes_filmagem: "",
    copy_completa: "",
    link_inspiracao: "",
    link_video_drive: "",
    semana_publicacao: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;
    onSubmit(formData);
    setFormData({
      setor: "trabalhista",
      formato: "video",
      titulo: "",
      gancho: "",
      orientacoes_filmagem: "",
      copy_completa: "",
      link_inspiracao: "",
      link_video_drive: "",
      semana_publicacao: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ideia de Conteúdo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={formData.setor}
                onValueChange={(v) => setFormData({ ...formData, setor: v as Setor })}
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
                value={formData.formato}
                onValueChange={(v) => setFormData({ ...formData, formato: v as Formato })}
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
            <Label>Título da Postagem *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Digite o título..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Gancho</Label>
            <Textarea
              value={formData.gancho || ""}
              onChange={(e) => setFormData({ ...formData, gancho: e.target.value })}
              placeholder="Digite o gancho..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Orientações para Filmagem</Label>
            <Textarea
              value={formData.orientacoes_filmagem || ""}
              onChange={(e) => setFormData({ ...formData, orientacoes_filmagem: e.target.value })}
              placeholder="Digite as orientações..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Copy Completa</Label>
            <Textarea
              value={formData.copy_completa || ""}
              onChange={(e) => setFormData({ ...formData, copy_completa: e.target.value })}
              placeholder="Digite a copy completa..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link de Inspiração</Label>
              <Input
                value={formData.link_inspiracao || ""}
                onChange={(e) => setFormData({ ...formData, link_inspiracao: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label>Link do Drive</Label>
              <Input
                value={formData.link_video_drive || ""}
                onChange={(e) => setFormData({ ...formData, link_video_drive: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Semana de Publicação</Label>
            <Select
              value={formData.semana_publicacao?.toString() || "none"}
              onValueChange={(v) => setFormData({ ...formData, semana_publicacao: v === "none" ? null : parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a semana" />
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.titulo.trim()}>
              {isLoading ? "Criando..." : "Criar Ideia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
