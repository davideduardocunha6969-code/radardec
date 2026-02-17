import { useState } from "react";
import { useRobosCoach, useCreateRoboCoach, useUpdateRoboCoach, useDeleteRoboCoach, type RoboCoach } from "@/hooks/useRobosCoach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Bot, Loader2, ClipboardCheck } from "lucide-react";

export default function RobosCoach() {
  const { data: robos, isLoading } = useRobosCoach();
  const createRobo = useCreateRoboCoach();
  const updateRobo = useUpdateRoboCoach();
  const deleteRobo = useDeleteRoboCoach();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoboCoach | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", instrucoes: "", tipo: "coaching" });

  const coachingRobos = robos?.filter((r) => r.tipo !== "feedback_sdr") || [];
  const feedbackRobo = robos?.find((r) => r.tipo === "feedback_sdr") || null;

  const openNew = (tipo: string = "coaching") => {
    setEditing(null);
    setForm({
      nome: tipo === "feedback_sdr" ? "Coach Feedback SDR" : "",
      descricao: tipo === "feedback_sdr" ? "Instruções para análise automática de atendimento do SDR após cada ligação" : "",
      instrucoes: "",
      tipo,
    });
    setFormOpen(true);
  };

  const openEdit = (r: RoboCoach) => {
    setEditing(r);
    setForm({ nome: r.nome, descricao: r.descricao || "", instrucoes: r.instrucoes, tipo: r.tipo || "coaching" });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.instrucoes) return;
    if (editing) {
      updateRobo.mutate({ id: editing.id, nome: form.nome, descricao: form.descricao, instrucoes: form.instrucoes }, { onSuccess: () => setFormOpen(false) });
    } else {
      createRobo.mutate({ nome: form.nome, descricao: form.descricao, instrucoes: form.instrucoes, tipo: form.tipo }, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Robô Coach</h1>
          <p className="text-sm text-muted-foreground">Cadastre IAs de coaching para auxiliar SDRs durante ligações em tempo real.</p>
        </div>
        <Button onClick={() => openNew("coaching")}>
          <Plus className="h-4 w-4 mr-2" />Novo Coach
        </Button>
      </div>

      {/* Feedback SDR Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <ClipboardCheck className="h-5 w-5 text-amber-600" />
          Coach Feedback SDR
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Configure as instruções para a IA que avalia automaticamente o atendimento do SDR após cada ligação finalizada.
        </p>
        {feedbackRobo ? (
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">{feedbackRobo.nome}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={feedbackRobo.ativo ? "default" : "secondary"} className="text-[10px]">
                    {feedbackRobo.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Switch
                    checked={feedbackRobo.ativo}
                    onCheckedChange={(ativo) => updateRobo.mutate({ id: feedbackRobo.id, ativo })}
                    className="scale-75"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedbackRobo.descricao && <p className="text-sm text-muted-foreground">{feedbackRobo.descricao}</p>}
              <div className="bg-muted rounded-md p-3 max-h-32 overflow-auto">
                <p className="text-xs whitespace-pre-wrap">{feedbackRobo.instrucoes.slice(0, 300)}{feedbackRobo.instrucoes.length > 300 ? "..." : ""}</p>
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(feedbackRobo)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-amber-500/30">
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mb-2 text-amber-600/50" />
              <p className="font-medium text-sm">Nenhum Coach Feedback SDR configurado</p>
              <p className="text-xs">Configure as instruções para avaliação automática dos atendimentos.</p>
              <Button className="mt-3" size="sm" onClick={() => openNew("feedback_sdr")}>
                <Plus className="h-4 w-4 mr-2" />Criar Coach Feedback SDR
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coaching Realtime Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-primary" />
          Coaches de Tempo Real
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : !coachingRobos.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mb-3" />
              <p className="font-medium">Nenhum Robô Coach cadastrado</p>
              <p className="text-sm">Crie um coach com instruções específicas para auxiliar SDRs durante ligações.</p>
              <Button className="mt-4" onClick={() => openNew("coaching")}><Plus className="h-4 w-4 mr-2" />Criar Coach</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coachingRobos.map((r) => (
              <Card key={r.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{r.nome}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={r.ativo ? "default" : "secondary"} className="text-[10px]">
                        {r.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Switch
                        checked={r.ativo}
                        onCheckedChange={(ativo) => updateRobo.mutate({ id: r.id, ativo })}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.descricao && <p className="text-sm text-muted-foreground">{r.descricao}</p>}
                  <div className="bg-muted rounded-md p-3 max-h-32 overflow-auto">
                    <p className="text-xs whitespace-pre-wrap">{r.instrucoes.slice(0, 300)}{r.instrucoes.length > 300 ? "..." : ""}</p>
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRobo.mutate(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Novo"} {form.tipo === "feedback_sdr" ? "Coach Feedback SDR" : "Robô Coach"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Coach Trabalhista" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição do objetivo deste coach" />
            </div>
            <div>
              <label className="text-sm font-medium">Instruções da IA *</label>
              <p className="text-xs text-muted-foreground mb-1">
                {form.tipo === "feedback_sdr"
                  ? "Defina os critérios de avaliação que a IA usará para dar nota e feedback ao SDR após cada ligação."
                  : "Defina as instruções detalhadas que a IA usará para analisar as conversas e dar sugestões ao SDR."}
              </p>
              <Textarea
                value={form.instrucoes}
                onChange={(e) => setForm({ ...form, instrucoes: e.target.value })}
                placeholder={form.tipo === "feedback_sdr"
                  ? "Avalie o SDR considerando: tom de voz, rapport, qualificação do lead, tratamento de objeções..."
                  : "Você é um assistente de vendas especializado em direito trabalhista..."}
                rows={12}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || !form.instrucoes || createRobo.isPending || updateRobo.isPending}>
              {(createRobo.isPending || updateRobo.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
