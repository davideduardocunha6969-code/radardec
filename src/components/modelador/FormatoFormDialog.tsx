import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ICONE_OPTIONS = [
  { value: "play", label: "Play (Vídeo curto)" },
  { value: "video", label: "Video (Vídeo longo)" },
  { value: "layout-grid", label: "Grid (Carrossel)" },
  { value: "image", label: "Image (Estático)" },
  { value: "book-open", label: "Book (Blog)" },
  { value: "newspaper", label: "Newspaper (Publicação)" },
  { value: "file-text", label: "File Text (Documento)" },
  { value: "mic", label: "Mic (Podcast)" },
  { value: "mail", label: "Mail (Email)" },
  { value: "message-square", label: "Message (Chat)" },
];

const COR_OPTIONS = [
  { value: "red", label: "Vermelho", class: "bg-red-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "purple", label: "Roxo", class: "bg-purple-500" },
  { value: "amber", label: "Âmbar", class: "bg-amber-500" },
  { value: "cyan", label: "Ciano", class: "bg-cyan-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "orange", label: "Laranja", class: "bg-orange-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "indigo", label: "Índigo", class: "bg-indigo-500" },
];

export interface FormatoFormData {
  key: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
}

interface FormatoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "origem" | "saida";
  initialData?: FormatoFormData | null;
  onSave: (data: FormatoFormData) => Promise<void>;
  isSaving: boolean;
}

export function FormatoFormDialog({
  open,
  onOpenChange,
  tipo,
  initialData,
  onSave,
  isSaving,
}: FormatoFormDialogProps) {
  const [formData, setFormData] = useState<FormatoFormData>({
    key: "",
    nome: "",
    descricao: "",
    icone: "play",
    cor: "red",
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          key: "",
          nome: "",
          descricao: "",
          icone: "play",
          cor: "red",
        });
      }
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!formData.key.trim() || !formData.nome.trim()) return;
    await onSave(formData);
  };

  const generateKey = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleNomeChange = (nome: string) => {
    setFormData((prev) => ({
      ...prev,
      nome,
      key: isEditing ? prev.key : generateKey(nome),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Novo"} Formato de {tipo === "origem" ? "Origem" : "Saída"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite os detalhes do formato."
              : `Crie um novo formato de ${tipo === "origem" ? "origem (conteúdo original)" : "saída (resultado)"} para a matriz.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Podcast"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">Chave (identificador único)</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
              placeholder="Ex: podcast"
              disabled={isEditing}
            />
            <p className="text-xs text-muted-foreground">
              Usado internamente para identificar o formato. Não pode ser alterado depois.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ex: Episódio de 30-60 min"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select
                value={formData.icone}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, icone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <Select
                value={formData.cor}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, cor: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${opt.class}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !formData.key.trim() || !formData.nome.trim()}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
