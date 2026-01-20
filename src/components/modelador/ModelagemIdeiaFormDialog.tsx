import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { TipoProduto, SETOR_LABELS, SETOR_COLORS } from "@/hooks/useTiposProdutos";
import { ModelagemResult } from "@/hooks/useModelagemConteudo";
import { useIdeiasConteudo, IdeiaConteudoInput } from "@/hooks/useIdeiasConteudo";
import {
  FORMATO_LABELS,
  PRIORIDADE_LABELS,
} from "@/hooks/useConteudosMidia";

interface ModelagemIdeiaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: TipoProduto;
  result: ModelagemResult;
  linkOriginal: string;
  onSuccess: () => void;
}

type Setor = "previdenciario" | "trabalhista" | "bancario";
type Formato = "video" | "video_longo" | "carrossel" | "estatico";
type Prioridade = "planejado" | "hot";

const FORMATO_MAP: Record<string, Formato> = {
  video: "video",
  video_longo: "video_longo",
  carrossel: "carrossel",
  estatico: "estatico",
};

export function ModelagemIdeiaFormDialog({
  open,
  onOpenChange,
  produto,
  result,
  linkOriginal,
  onSuccess,
}: ModelagemIdeiaFormDialogProps) {
  const { createIdeia } = useIdeiasConteudo();

  const [formData, setFormData] = useState<IdeiaConteudoInput>({
    setor: produto.setor as Setor,
    formato: "video",
    titulo: "",
    gancho: "",
    orientacoes_filmagem: "",
    copy_completa: "",
    link_inspiracao: "",
    link_video_drive: "",
    prioridade: "planejado",
    semana_publicacao: null,
  });

  useEffect(() => {
    if (open && result) {
      const formato = FORMATO_MAP[result.formato_sugerido] || "video";
      
      setFormData({
        setor: produto.setor as Setor,
        formato,
        titulo: result.titulo_sugerido || "",
        gancho: result.gancho_original || "",
        orientacoes_filmagem: result.orientacoes_filmagem || "",
        copy_completa: result.copy_completa || "",
        link_inspiracao: linkOriginal,
        link_video_drive: "",
        prioridade: "planejado",
        semana_publicacao: null,
      });
    }
  }, [open, result, produto, linkOriginal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createIdeia.mutateAsync(formData);
      onSuccess();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Criar Ideia para Content Hub</DialogTitle>
            <Badge className={SETOR_COLORS[produto.setor]}>
              {produto.nome}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <Select
                value={formData.setor}
                onValueChange={(value) =>
                  setFormData({ ...formData, setor: value as Setor })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SETOR_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
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
                onValueChange={(value) =>
                  setFormData({ ...formData, formato: value as Formato })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMATO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) =>
                  setFormData({ ...formData, prioridade: value as Prioridade })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDADE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semana_publicacao">Semana de Publicação</Label>
              <Input
                id="semana_publicacao"
                type="number"
                min={1}
                max={52}
                value={formData.semana_publicacao || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    semana_publicacao: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="1-52"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              placeholder="Título da postagem"
              required
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
              placeholder="Gancho que deve ser utilizado no vídeo"
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
              placeholder="Orientações gerais de como produzir este conteúdo..."
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
              placeholder="Roteiro completo do conteúdo a ser gravado..."
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="link_inspiracao">Link de Inspiração</Label>
              <Input
                id="link_inspiracao"
                value={formData.link_inspiracao}
                onChange={(e) =>
                  setFormData({ ...formData, link_inspiracao: e.target.value })
                }
                placeholder="Link do conteúdo original"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_video_drive">Link do Vídeo (Drive)</Label>
              <Input
                id="link_video_drive"
                value={formData.link_video_drive || ""}
                onChange={(e) =>
                  setFormData({ ...formData, link_video_drive: e.target.value })
                }
                placeholder="Link do Google Drive"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createIdeia.isPending || !formData.titulo}>
              <Send className="h-4 w-4 mr-2" />
              {createIdeia.isPending ? "Enviando..." : "Enviar ao Content Hub"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
