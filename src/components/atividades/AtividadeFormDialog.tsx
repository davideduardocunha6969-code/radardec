import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Responsavel, Coluna, AtividadeInsert } from "@/hooks/useAtividadesMarketing";

interface AtividadeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responsaveis: Responsavel[];
  colunas: Coluna[];
  onSubmit: (data: AtividadeInsert) => void;
  onAddResponsavel: (nome: string) => void;
  isSubmitting?: boolean;
}

export function AtividadeFormDialog({
  open,
  onOpenChange,
  responsaveis,
  colunas,
  onSubmit,
  onAddResponsavel,
  isSubmitting,
}: AtividadeFormDialogProps) {
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [atividade, setAtividade] = useState("");
  const [prazoFatal, setPrazoFatal] = useState("");
  const [colunaId, setColunaId] = useState("");
  const [novoResponsavel, setNovoResponsavel] = useState("");
  const [showAddResponsavel, setShowAddResponsavel] = useState(false);

  const pendentesColuna = colunas.find((c) => c.nome === "Pendentes");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atividade.trim()) return;

    onSubmit({
      responsavel_id: responsavelId || null,
      coluna_id: colunaId || pendentesColuna?.id || colunas[0]?.id,
      atividade: atividade.trim(),
      prazo_fatal: prazoFatal || null,
    });

    // Reset form
    setResponsavelId("");
    setAtividade("");
    setPrazoFatal("");
    setColunaId("");
    onOpenChange(false);
  };

  const handleAddResponsavel = () => {
    if (novoResponsavel.trim()) {
      onAddResponsavel(novoResponsavel.trim());
      setNovoResponsavel("");
      setShowAddResponsavel(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <div className="flex gap-2">
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowAddResponsavel(!showAddResponsavel)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showAddResponsavel && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nome do novo responsável"
                  value={novoResponsavel}
                  onChange={(e) => setNovoResponsavel(e.target.value)}
                />
                <Button type="button" onClick={handleAddResponsavel} size="sm">
                  Adicionar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="atividade">Atividade *</Label>
            <Textarea
              id="atividade"
              placeholder="Descreva a atividade a ser realizada..."
              value={atividade}
              onChange={(e) => setAtividade(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prazo">Prazo Fatal</Label>
            <Input
              id="prazo"
              type="date"
              value={prazoFatal}
              onChange={(e) => setPrazoFatal(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coluna">Coluna Inicial</Label>
            <Select value={colunaId} onValueChange={setColunaId}>
              <SelectTrigger>
                <SelectValue placeholder="Pendentes (padrão)" />
              </SelectTrigger>
              <SelectContent>
                {colunas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !atividade.trim()}>
              {isSubmitting ? "Criando..." : "Criar Atividade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
