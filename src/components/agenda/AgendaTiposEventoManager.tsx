import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useAgendaTiposEvento,
  useCreateAgendaTipoEvento,
  useUpdateAgendaTipoEvento,
  useDeleteAgendaTipoEvento,
  type AgendaTipoEvento,
} from "@/hooks/useAgendaTiposEvento";

const ICON_OPTIONS = [
  { value: "phone-call", label: "Telefone" },
  { value: "clipboard-list", label: "Tarefa" },
  { value: "lock", label: "Bloqueio" },
  { value: "gavel", label: "Audiência" },
  { value: "calendar", label: "Calendário" },
  { value: "users", label: "Reunião" },
  { value: "briefcase", label: "Trabalho" },
  { value: "clock", label: "Horário" },
];

const COLOR_OPTIONS = [
  "#10b981", "#6366f1", "#ef4444", "#f59e0b",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#64748b",
];

export function AgendaTiposEventoManager() {
  const { data: tipos, isLoading } = useAgendaTiposEvento();
  const createMutation = useCreateAgendaTipoEvento();
  const updateMutation = useUpdateAgendaTipoEvento();
  const deleteMutation = useDeleteAgendaTipoEvento();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaTipoEvento | null>(null);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(COLOR_OPTIONS[0]);
  const [icone, setIcone] = useState("calendar");

  const openCreate = () => {
    setEditing(null);
    setNome("");
    setCor(COLOR_OPTIONS[0]);
    setIcone("calendar");
    setDialogOpen(true);
  };

  const openEdit = (tipo: AgendaTipoEvento) => {
    setEditing(tipo);
    setNome(tipo.nome);
    setCor(tipo.cor);
    setIcone(tipo.icone);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, nome: nome.trim(), cor, icone });
    } else {
      await createMutation.mutateAsync({ nome: nome.trim(), cor, icone });
    }
    setDialogOpen(false);
  };

  const handleToggleAtivo = (tipo: AgendaTipoEvento) => {
    updateMutation.mutate({ id: tipo.id, ativo: !tipo.ativo });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tipos de Evento da Agenda</h3>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {tipos?.map((tipo) => (
            <div
              key={tipo.id}
              className="flex items-center gap-3 rounded-lg border p-3 bg-card"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: tipo.cor }}
              />
              <span className="flex-1 text-sm font-medium">{tipo.nome}</span>
              <Badge variant="outline" className="text-[10px]">
                {tipo.icone}
              </Badge>
              <Switch
                checked={tipo.ativo}
                onCheckedChange={() => handleToggleAtivo(tipo)}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tipo)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteMutation.mutate(tipo.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {!tipos?.length && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum tipo de evento cadastrado.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Tipo" : "Novo Tipo de Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Reunião de equipe" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${cor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setCor(c)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Ícone</Label>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {ICON_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={icone === opt.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setIcone(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!nome.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
