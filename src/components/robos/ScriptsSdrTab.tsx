import { useState } from "react";
import {
  useScriptsSdr,
  useCreateScriptSdr,
  useUpdateScriptSdr,
  useDeleteScriptSdr,
  type ScriptSdr,
  type ScriptItem,
} from "@/hooks/useScriptsSdr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  ClipboardList,
  X,
  GripVertical,
  CalendarCheck,
} from "lucide-react";

function generateId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30) || `item_${Date.now()}`;
}

function DEFAULT_SHOW_RATE_ITEMS(): ScriptItem[] {
  return [
    { id: "reafirmacao", label: "Reafirmação", description: "Perfeito, então ficou (dia da semana) às (horário). Nesse horário o especialista vai calcular e revisar sua rescisão junto com o senhor." },
    { id: "antecipacao_mental", label: "Antecipação mental", description: "Em 20 minutos o senhor já vai saber se tem diferença para receber ou se está tudo certo." },
    { id: "autoridade_closer", label: "Autoridade do closer", description: "Quem vai te atender é um especialista em cálculos de motoristas, ele faz isso todos os dias." },
    { id: "ambiente", label: "Ambiente", description: "É importante estar num lugar tranquilo, com internet boa, para conseguir entender tudo com calma." },
    { id: "inclusao_familiar", label: "Inclusão familiar", description: "Se quiser, pode fazer junto com sua esposa ou alguém da família. É até bom para ajudarem o Sr. caso o Sr. precise." },
    { id: "microcompromisso", label: "Microcompromisso explícito", description: "O senhor consegue estar disponível nesse horário sem dirigir ou fazer outra coisa?" },
    { id: "exclusividade_agenda", label: "Exclusividade da agenda", description: "Esse horário fica reservado só para o senhor, porque a agenda do especialista é bem corrida." },
    { id: "regra_imprevisto", label: "Regra do imprevisto", description: "Se surgir qualquer imprevisto, me avisa antes para a gente remarcar e encaixar outra pessoa no lugar, combinado?" },
    { id: "confirmacao_lembrete", label: "Confirmação + lembrete", description: "Eu já vou te mandar a confirmação no WhatsApp com um vídeo de apresentação do escritório e 15 minutos antes eu te lembro novamente." },
  ];
}

interface ScriptItemEditorProps {
  title: string;
  icon: React.ReactNode;
  items: ScriptItem[];
  onChange: (items: ScriptItem[]) => void;
}

function ScriptItemEditor({ title, icon, items, onChange }: ScriptItemEditorProps) {
  const addItem = () => {
    onChange([...items, { id: `item_${Date.now()}`, label: "", description: "" }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "label" | "description", value: string) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === "label") newItem.id = generateId(value);
      return newItem;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">{icon}{title}</h4>
        <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />Item
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
          Nenhum item. Clique em "+ Item" para adicionar.
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start bg-muted/30 rounded-md p-2">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-2 opacity-40" />
            <div className="flex-1 space-y-1">
              <Input
                value={item.label}
                onChange={(e) => updateItem(i, "label", e.target.value)}
                placeholder="Título (ex: Jornada diária)"
                className="h-8 text-sm"
              />
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Fala/pergunta sugerida (ex: Qual era sua jornada diária?)"
                className="text-xs min-h-[60px] resize-y"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(i)}>
              <X className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScriptsSdrTab() {
  const { data: scripts, isLoading } = useScriptsSdr();
  const createScript = useCreateScriptSdr();
  const updateScript = useUpdateScriptSdr();
  const deleteScript = useDeleteScriptSdr();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScriptSdr | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    apresentacao: [] as ScriptItem[],
    qualificacao: [] as ScriptItem[],
    show_rate: [] as ScriptItem[],
  });

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "", descricao: "", apresentacao: [], qualificacao: [], show_rate: DEFAULT_SHOW_RATE_ITEMS() });
    setFormOpen(true);
  };

  const openEdit = (s: ScriptSdr) => {
    setEditing(s);
    setForm({
      nome: s.nome,
      descricao: s.descricao || "",
      apresentacao: s.apresentacao,
      qualificacao: s.qualificacao,
      show_rate: s.show_rate?.length ? s.show_rate : DEFAULT_SHOW_RATE_ITEMS(),
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.nome) return;
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      apresentacao: form.apresentacao.filter((i) => i.label.trim()),
      qualificacao: form.qualificacao.filter((i) => i.label.trim()),
      show_rate: form.show_rate.filter((i) => i.label.trim()),
    };
    if (editing) {
      updateScript.mutate({ id: editing.id, ...payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createScript.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Scripts SDR
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure os scripts com falas de apresentação e perguntas de qualificação que o SDR deve seguir.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />Novo Script
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !scripts?.length ? (
        <Card className="border-dashed border-emerald-500/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 text-emerald-600/50" />
            <p className="font-medium">Nenhum Script SDR cadastrado</p>
            <p className="text-sm">Crie um script com as perguntas e falas que o SDR deve seguir durante as ligações.</p>
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />Criar Script
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scripts.map((s) => (
            <Card key={s.id} className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-base">{s.nome}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={s.ativo ? "default" : "secondary"} className="text-[10px]">
                      {s.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Switch
                      checked={s.ativo}
                      onCheckedChange={(ativo) => updateScript.mutate({ id: s.id, ativo })}
                      className="scale-75"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.descricao && <p className="text-sm text-muted-foreground">{s.descricao}</p>}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />{s.apresentacao.length} apresentação
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <ClipboardList className="h-3 w-3" />{s.qualificacao.length} qualificação
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CalendarCheck className="h-3 w-3" />{s.show_rate?.length || 0} show rate
                  </Badge>
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteScript.mutate(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Novo"} Script SDR</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="space-y-5 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Script Motorista Trabalhista" />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição" />
                </div>
              </div>

              <Separator />

              <ScriptItemEditor
                title="Falas de Apresentação"
                icon={<FileText className="h-4 w-4 text-emerald-500" />}
                items={form.apresentacao}
                onChange={(apresentacao) => setForm({ ...form, apresentacao })}
              />

              <Separator />

              <ScriptItemEditor
                title="Perguntas de Qualificação"
                icon={<ClipboardList className="h-4 w-4 text-blue-500" />}
                items={form.qualificacao}
                onChange={(qualificacao) => setForm({ ...form, qualificacao })}
              />

              <Separator />

              <ScriptItemEditor
                title="Falas de Show Rate"
                icon={<CalendarCheck className="h-4 w-4 text-amber-500" />}
                items={form.show_rate}
                onChange={(show_rate) => setForm({ ...form, show_rate })}
              />

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || createScript.isPending || updateScript.isPending}>
              {(createScript.isPending || updateScript.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
