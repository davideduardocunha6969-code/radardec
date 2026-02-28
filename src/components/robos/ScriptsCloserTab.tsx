import { useState } from "react";
import {
  useScriptsCloser,
  useCreateScriptCloser,
  useUpdateScriptCloser,
  useDeleteScriptCloser,
  type ScriptCloser,
} from "@/hooks/useScriptsCloser";
import type { ScriptItem } from "@/hooks/useScriptsSdr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  ClipboardList,
  Briefcase,
  HandshakeIcon,
  FileSearch,
} from "lucide-react";
import { ScriptItemEditor } from "./ScriptItemEditor";
import { Textarea } from "@/components/ui/textarea";




export default function ScriptsCloserTab() {
  const { data: scripts, isLoading } = useScriptsCloser();
  const createScript = useCreateScriptCloser();
  const updateScript = useUpdateScriptCloser();
  const deleteScript = useDeleteScriptCloser();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScriptCloser | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    apresentacao: [] as ScriptItem[],
    qualificacao: [] as ScriptItem[],
    fechamento: [] as ScriptItem[],
    instrucoes_extrator: "",
  });

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "", descricao: "", apresentacao: [], qualificacao: [], fechamento: [], instrucoes_extrator: "" });
    setFormOpen(true);
  };

  const openEdit = (s: ScriptCloser) => {
    setEditing(s);
    setForm({
      nome: s.nome,
      descricao: s.descricao || "",
      apresentacao: s.apresentacao,
      qualificacao: s.qualificacao,
      fechamento: (s as any).fechamento || [],
      instrucoes_extrator: s.instrucoes_extrator || "",
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
      fechamento: form.fechamento.filter((i) => i.label.trim()),
      instrucoes_extrator: form.instrucoes_extrator,
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
            <Briefcase className="h-5 w-5 text-violet-600" />
            Scripts Closer
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure os scripts com falas de apresentação e perguntas de qualificação para o Closer.
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
        <Card className="border-dashed border-violet-500/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mb-3 text-violet-600/50" />
            <p className="font-medium">Nenhum Script Closer cadastrado</p>
            <p className="text-sm">Crie um script com as falas e perguntas que o Closer deve seguir durante os atendimentos.</p>
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />Criar Script
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scripts.map((s) => (
            <Card key={s.id} className="border-violet-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-violet-600" />
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
                    <HandshakeIcon className="h-3 w-3" />{((s as any).fechamento || []).length} fechamento
                  </Badge>
                  {s.instrucoes_extrator && (
                    <Badge variant="secondary" className="gap-1">
                      <FileSearch className="h-3 w-3" />Extrator IA
                    </Badge>
                  )}
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
            <DialogTitle>{editing ? "Editar" : "Novo"} Script Closer</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="space-y-5 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Script Closer Trabalhista" />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição" />
                </div>
              </div>
              <Separator />
              <ScriptItemEditor
                title="Falas de Apresentação"
                icon={<FileText className="h-4 w-4 text-violet-500" />}
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
                title="Fechamento"
                icon={<HandshakeIcon className="h-4 w-4 text-emerald-500" />}
                items={form.fechamento}
                onChange={(fechamento) => setForm({ ...form, fechamento })}
              />
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-amber-500" />
                  <label className="text-sm font-medium">Prompt da IA Extratora</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instruções que a IA usará para extrair dados estruturados da transcrição do atendimento.
                </p>
                <Textarea
                  value={form.instrucoes_extrator}
                  onChange={(e) => setForm({ ...form, instrucoes_extrator: e.target.value })}
                  placeholder="Cole aqui o prompt completo da IA Extratora..."
                  className="min-h-[200px] font-mono text-xs"
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
