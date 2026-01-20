import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Profile, Coluna, AtividadeInsert, Prioridade } from "@/hooks/useAtividadesMarketing";
import { PRIORIDADE_LABELS } from "@/hooks/useAtividadesMarketing";

interface AtividadeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: Profile[];
  colunas: Coluna[];
  onSubmit: (data: AtividadeInsert) => void;
  isSubmitting?: boolean;
}

export function AtividadeFormDialog({
  open,
  onOpenChange,
  profiles,
  colunas,
  onSubmit,
  isSubmitting,
}: AtividadeFormDialogProps) {
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [atividade, setAtividade] = useState("");
  const [prazoFatal, setPrazoFatal] = useState("");
  const [colunaId, setColunaId] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("util");

  const pendentesColuna = colunas.find((c) => c.nome === "Pendentes");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atividade.trim()) return;

    onSubmit({
      responsavel_id: responsavelId || null,
      coluna_id: colunaId || pendentesColuna?.id || colunas[0]?.id,
      atividade: atividade.trim(),
      prazo_fatal: prazoFatal || null,
      prioridade,
    });

    // Reset form
    setResponsavelId("");
    setAtividade("");
    setPrazoFatal("");
    setColunaId("");
    setPrioridade("util");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade *</Label>
            <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Prioridade)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORIDADE_LABELS) as Prioridade[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {PRIORIDADE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
