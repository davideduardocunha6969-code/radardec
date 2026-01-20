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
  ConteudoMidia,
  ConteudoMidiaInput,
  Setor,
  Formato,
  Status,
  SETOR_LABELS,
  FORMATO_LABELS,
  STATUS_LABELS,
} from "@/hooks/useConteudosMidia";

interface ConteudoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ConteudoMidiaInput) => void;
  initialData?: ConteudoMidia | null;
  isLoading?: boolean;
}

export function ConteudoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: ConteudoFormDialogProps) {
  const [formData, setFormData] = useState<ConteudoMidiaInput>({
    setor: "trabalhista",
    formato: "video",
    titulo: "",
    gancho: "",
    orientacoes_filmagem: "",
    copy_completa: "",
    link_inspiracao: "",
    status: "a_gravar",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        setor: initialData.setor,
        formato: initialData.formato,
        titulo: initialData.titulo,
        gancho: initialData.gancho || "",
        orientacoes_filmagem: initialData.orientacoes_filmagem || "",
        copy_completa: initialData.copy_completa || "",
        link_inspiracao: initialData.link_inspiracao || "",
        status: initialData.status,
      });
    } else {
      setFormData({
        setor: "trabalhista",
        formato: "video",
        titulo: "",
        gancho: "",
        orientacoes_filmagem: "",
        copy_completa: "",
        link_inspiracao: "",
        status: "a_gravar",
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Conteúdo" : "Novo Conteúdo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <Select
                value={formData.setor}
                onValueChange={(value: Setor) =>
                  setFormData({ ...formData, setor: value })
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
              <Label htmlFor="formato">Formato</Label>
              <Select
                value={formData.formato}
                onValueChange={(value: Formato) =>
                  setFormData({ ...formData, formato: value })
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
            <Label htmlFor="titulo">Título da Postagem</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              required
              placeholder="Digite o título..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gancho">Gancho</Label>
            <Textarea
              id="gancho"
              value={formData.gancho}
              onChange={(e) =>
                setFormData({ ...formData, gancho: e.target.value })
              }
              placeholder="Digite o gancho..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orientacoes_filmagem">Orientações para Filmagem</Label>
            <Textarea
              id="orientacoes_filmagem"
              value={formData.orientacoes_filmagem}
              onChange={(e) =>
                setFormData({ ...formData, orientacoes_filmagem: e.target.value })
              }
              placeholder="Descreva as orientações..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copy_completa">Copy Completa</Label>
            <Textarea
              id="copy_completa"
              value={formData.copy_completa}
              onChange={(e) =>
                setFormData({ ...formData, copy_completa: e.target.value })
              }
              placeholder="Digite a copy completa..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_inspiracao">Link do Modelo de Inspiração</Label>
            <Input
              id="link_inspiracao"
              value={formData.link_inspiracao}
              onChange={(e) =>
                setFormData({ ...formData, link_inspiracao: e.target.value })
              }
              placeholder="https://..."
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Status) =>
                setFormData({ ...formData, status: value })
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.titulo}>
              {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
