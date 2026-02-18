import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAgendaTiposEvento } from "@/hooks/useAgendaTiposEvento";
import { useCreateAgendaEvento, useUpdateAgendaEvento, type AgendaEvento } from "@/hooks/useAgendaEventos";
import { format, addHours } from "date-fns";

interface EventoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento?: AgendaEvento | null;
  defaultDate?: Date;
}

export function EventoFormDialog({ open, onOpenChange, evento, defaultDate }: EventoFormDialogProps) {
  const { data: tipos } = useAgendaTiposEvento();
  const createEvento = useCreateAgendaEvento();
  const updateEvento = useUpdateAgendaEvento();

  const now = defaultDate || new Date();
  const defaultStart = format(now, "yyyy-MM-dd'T'HH:mm");
  const defaultEnd = format(addHours(now, 1), "yyyy-MM-dd'T'HH:mm");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoEventoId, setTipoEventoId] = useState<string>("");
  const [dataInicio, setDataInicio] = useState(defaultStart);
  const [dataFim, setDataFim] = useState(defaultEnd);
  const [diaInteiro, setDiaInteiro] = useState(false);

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo);
      setDescricao(evento.descricao || "");
      setTipoEventoId(evento.tipo_evento_id || "");
      setDataInicio(format(new Date(evento.data_inicio), "yyyy-MM-dd'T'HH:mm"));
      setDataFim(format(new Date(evento.data_fim), "yyyy-MM-dd'T'HH:mm"));
      setDiaInteiro(evento.dia_inteiro);
    } else {
      setTitulo("");
      setDescricao("");
      setTipoEventoId("");
      setDataInicio(defaultStart);
      setDataFim(defaultEnd);
      setDiaInteiro(false);
    }
  }, [evento, open, defaultStart, defaultEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = {
      titulo,
      descricao: descricao || undefined,
      tipo_evento_id: tipoEventoId || undefined,
      data_inicio: new Date(dataInicio).toISOString(),
      data_fim: new Date(dataFim).toISOString(),
      dia_inteiro: diaInteiro,
    };

    if (evento) {
      await updateEvento.mutateAsync({ id: evento.id, ...values });
    } else {
      await createEvento.mutateAsync(values);
    }
    onOpenChange(false);
  };

  const isLoading = createEvento.isPending || updateEvento.isPending;
  const tiposAtivos = tipos?.filter((t) => t.ativo) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ex: Reunião com cliente" />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Evento</Label>
            <Select value={tipoEventoId} onValueChange={setTipoEventoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposAtivos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.cor }} />
                      {t.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={diaInteiro} onCheckedChange={setDiaInteiro} />
            <Label>Dia inteiro</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Início *</Label>
              <Input
                type={diaInteiro ? "date" : "datetime-local"}
                value={diaInteiro ? dataInicio.split("T")[0] : dataInicio}
                onChange={(e) => setDataInicio(diaInteiro ? e.target.value + "T00:00" : e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fim *</Label>
              <Input
                type={diaInteiro ? "date" : "datetime-local"}
                value={diaInteiro ? dataFim.split("T")[0] : dataFim}
                onChange={(e) => setDataFim(diaInteiro ? e.target.value + "T23:59" : e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do evento..." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : evento ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
