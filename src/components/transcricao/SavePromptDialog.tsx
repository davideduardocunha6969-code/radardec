import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SavePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  onSave: (nome: string, descricao: string) => Promise<boolean>;
}

export function SavePromptDialog({
  open,
  onOpenChange,
  promptText,
  onSave,
}: SavePromptDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nome.trim()) return;

    setIsSaving(true);
    const success = await onSave(nome.trim(), descricao.trim());
    setIsSaving(false);

    if (success) {
      setNome("");
      setDescricao("");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNome("");
      setDescricao("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salvar Prompt</DialogTitle>
          <DialogDescription>
            Salve este prompt para reutilização rápida. Ele ficará disponível na lista de prompts
            e também em Robôs → Prompts Transcrições.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Prompt *</Label>
            <Input
              id="nome"
              placeholder="Ex: Análise de argumentos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              placeholder="Ex: Identifica e resume os principais argumentos das partes"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={promptText}
              readOnly
              className="min-h-[100px] bg-muted/50 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nome.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Prompt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
