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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TipoProduto,
  TipoProdutoInput,
  Setor,
  SETOR_LABELS,
} from "@/hooks/useTiposProdutos";
import { CollapsibleRichField } from "./CollapsibleRichField";
import { ProdutoAnexosSection } from "./ProdutoAnexosSection";
import { Separator } from "@/components/ui/separator";

interface TipoProdutoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TipoProdutoInput) => Promise<void>;
  initialData?: TipoProduto | null;
  isLoading?: boolean;
}

export function TipoProdutoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: TipoProdutoFormDialogProps) {
  const [formData, setFormData] = useState<TipoProdutoInput>({
    nome: "",
    descricao: "",
    setor: "previdenciario",
    caracteristicas: "",
    perfil_cliente_ideal: "",
    estrutura_editorial: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome,
        descricao: initialData.descricao || "",
        setor: initialData.setor,
        caracteristicas: initialData.caracteristicas || "",
        perfil_cliente_ideal: initialData.perfil_cliente_ideal || "",
        estrutura_editorial: initialData.estrutura_editorial || "",
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        setor: "previdenciario",
        caracteristicas: "",
        perfil_cliente_ideal: "",
        estrutura_editorial: "",
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Aposentadoria por Idade"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setor">Setor *</Label>
              <Select
                value={formData.setor}
                onValueChange={(value) =>
                  setFormData({ ...formData, setor: value as Setor })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
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
          </div>

          <Separator />

          {/* Rich Content Fields */}
          <div className="space-y-4">
            <CollapsibleRichField
              id="descricao"
              label="Descrição do Produto"
              value={formData.descricao || ""}
              onChange={(value) => setFormData({ ...formData, descricao: value })}
              placeholder="Descreva o que é este produto jurídico, seus benefícios e aplicações..."
            />

            <CollapsibleRichField
              id="caracteristicas"
              label="Características"
              value={formData.caracteristicas || ""}
              onChange={(value) => setFormData({ ...formData, caracteristicas: value })}
              placeholder="Descreva as características principais, requisitos, diferenciais... Você pode colar imagens!"
            />

            <CollapsibleRichField
              id="perfil_cliente_ideal"
              label="Perfil do Cliente Ideal"
              value={formData.perfil_cliente_ideal || ""}
              onChange={(value) => setFormData({ ...formData, perfil_cliente_ideal: value })}
              placeholder="Descreva quem é o cliente ideal para este produto (idade, profissão, situação, dores, etc.)..."
            />

            <CollapsibleRichField
              id="estrutura_editorial"
              label="Estrutura de Linha Editorial (SEO + Mídias Sociais)"
              value={formData.estrutura_editorial || ""}
              onChange={(value) => setFormData({ ...formData, estrutura_editorial: value })}
              placeholder="Defina a estrutura editorial para SEO e mídias sociais: palavras-chave, tom de voz, formatos preferidos, hashtags, CTAs padrão..."
            />
          </div>

          <Separator />

          {/* File Attachments */}
          <ProdutoAnexosSection tipoProdutoId={initialData?.id || null} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.nome}>
              {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
