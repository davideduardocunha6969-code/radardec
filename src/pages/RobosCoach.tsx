import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useRobosCoach, useCreateRoboCoach, useUpdateRoboCoach, useDeleteRoboCoach, type RoboCoach } from "@/hooks/useRobosCoach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Bot, Loader2, ClipboardCheck, FileText, Eye, Sparkles } from "lucide-react";
import ScriptsSdrTab from "@/components/robos/ScriptsSdrTab";
import ScriptsCloserTab from "@/components/robos/ScriptsCloserTab";
import { Briefcase } from "lucide-react";

const DEFAULT_DETECTOR_PROMPT = `Você é um detector de progresso de ligação SDR. Sua ÚNICA tarefa é analisar a transcrição e identificar quais itens JÁ FORAM DITOS ou COBERTOS pelo SDR.

REGRAS GERAIS:
- Seja MUITO FLEXÍVEL na detecção. Se o SDR cobriu o MESMO TEMA ou INTENÇÃO de um item, mesmo com palavras completamente diferentes, marque como feito.
- Erre para o lado de MARCAR MAIS itens como feitos. Na dúvida, marque.
- Analise APENAS as falas marcadas como [SDR] para itens de script (apresentação, qualificação, show rate).
- Para itens de coaching (RECA, RALOCA, objeções), verifique se o SDR JÁ UTILIZOU a sugestão dada ou abordou o tema.
- Retorne TODOS os IDs que foram cobertos, mesmo que parcialmente.
- Se um item foi coberto com sinônimos, paráfrases ou intenção similar, MARQUE COMO FEITO.
- NUNCA retorne IDs que não existem na lista fornecida.`;

export default function RobosCoach() {
  const { data: robos, isLoading } = useRobosCoach();
  const createRobo = useCreateRoboCoach();
  const updateRobo = useUpdateRoboCoach();
  const deleteRobo = useDeleteRoboCoach();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoboCoach | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", instrucoes: "", instrucoes_detector: "", instrucoes_radar: "", tipo: "coaching" });

  const coachingSdrRobos = robos?.filter((r) => r.tipo === "coaching") || [];
  const coachingCloserRobos = robos?.filter((r) => r.tipo === "coaching_closer") || [];
  const feedbackRobos = robos?.filter((r) => r.tipo === "feedback_sdr") || [];

  const openNew = (tipo: string = "coaching") => {
    setEditing(null);
    setForm({
      nome: tipo === "feedback_sdr" ? "Coach Feedback SDR" : "",
      descricao: tipo === "feedback_sdr" ? "Instruções para análise automática de atendimento do SDR após cada ligação" : "",
      instrucoes: "",
      instrucoes_detector: (tipo === "coaching" || tipo === "coaching_closer") ? DEFAULT_DETECTOR_PROMPT : "",
      instrucoes_radar: "",
      tipo,
    });
    setFormOpen(true);
  };

  const openEdit = (r: RoboCoach) => {
    setEditing(r);
    setForm({
      nome: r.nome,
      descricao: r.descricao || "",
      instrucoes: r.instrucoes,
      instrucoes_detector: r.instrucoes_detector || "",
      instrucoes_radar: r.instrucoes_radar || "",
      tipo: r.tipo || "coaching",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.instrucoes) return;
    const payload: any = { nome: form.nome, descricao: form.descricao, instrucoes: form.instrucoes, instrucoes_detector: form.instrucoes_detector, instrucoes_radar: form.tipo === "coaching_closer" ? form.instrucoes_radar : null };
    if (editing) {
      updateRobo.mutate({ id: editing.id, ...payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createRobo.mutate({ ...payload, tipo: form.tipo }, { onSuccess: () => setFormOpen(false) });
    }
  };

  const isCoachingType = form.tipo === "coaching" || form.tipo === "coaching_closer";
  const isCloserType = form.tipo === "coaching_closer";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Robô Coach</h1>
        <p className="text-sm text-muted-foreground">Gerencie coaches de IA e scripts para SDRs.</p>
      </div>

      <Tabs defaultValue="coaching_sdr" className="w-full">
        <TabsList>
          <TabsTrigger value="coaching_sdr" className="gap-1.5">
            <Bot className="h-4 w-4" />Coaches SDR
          </TabsTrigger>
          <TabsTrigger value="coaching_closer" className="gap-1.5">
            <Briefcase className="h-4 w-4" />Coaches Closer
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <ClipboardCheck className="h-4 w-4" />Coaches Feedback
          </TabsTrigger>
          <TabsTrigger value="scripts" className="gap-1.5">
            <FileText className="h-4 w-4" />Scripts SDR
          </TabsTrigger>
          <TabsTrigger value="scripts_closer" className="gap-1.5">
            <Briefcase className="h-4 w-4" />Scripts Closers
          </TabsTrigger>
        </TabsList>

        {/* Coaches SDR Tab */}
        <TabsContent value="coaching_sdr" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => openNew("coaching")}>
              <Plus className="h-4 w-4 mr-2" />Novo Coach SDR
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !coachingSdrRobos.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mb-3" />
                <p className="font-medium">Nenhum Coach SDR cadastrado</p>
                <p className="text-sm">Crie um coach com instruções específicas para auxiliar SDRs durante ligações.</p>
                <Button className="mt-4" onClick={() => openNew("coaching")}><Plus className="h-4 w-4 mr-2" />Criar Coach SDR</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coachingSdrRobos.map((r) => (
                <Card key={r.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{r.nome}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={r.ativo ? "default" : "secondary"} className="text-[10px]">{r.ativo ? "Ativo" : "Inativo"}</Badge>
                        <Switch checked={r.ativo} onCheckedChange={(ativo) => updateRobo.mutate({ id: r.id, ativo })} className="scale-75" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {r.descricao && <p className="text-sm text-muted-foreground">{r.descricao}</p>}
                    <div className="bg-muted rounded-md p-3 max-h-32 overflow-auto">
                      <p className="text-xs whitespace-pre-wrap">{r.instrucoes.slice(0, 300)}{r.instrucoes.length > 300 ? "..." : ""}</p>
                    </div>
                    {r.instrucoes_detector && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>IA Detectora configurada</span>
                      </div>
                    )}
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRobo.mutate(r.id)}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Coaches Closer Tab */}
        <TabsContent value="coaching_closer" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => openNew("coaching_closer")}>
              <Plus className="h-4 w-4 mr-2" />Novo Coach Closer
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !coachingCloserRobos.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Briefcase className="h-12 w-12 mb-3" />
                <p className="font-medium">Nenhum Coach Closer cadastrado</p>
                <p className="text-sm">Crie um coach com instruções específicas para auxiliar Closers durante atendimentos.</p>
                <Button className="mt-4" onClick={() => openNew("coaching_closer")}><Plus className="h-4 w-4 mr-2" />Criar Coach Closer</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coachingCloserRobos.map((r) => (
                <Card key={r.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{r.nome}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={r.ativo ? "default" : "secondary"} className="text-[10px]">{r.ativo ? "Ativo" : "Inativo"}</Badge>
                        <Switch checked={r.ativo} onCheckedChange={(ativo) => updateRobo.mutate({ id: r.id, ativo })} className="scale-75" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {r.descricao && <p className="text-sm text-muted-foreground">{r.descricao}</p>}
                    <div className="bg-muted rounded-md p-3 max-h-32 overflow-auto">
                      <p className="text-xs whitespace-pre-wrap">{r.instrucoes.slice(0, 300)}{r.instrucoes.length > 300 ? "..." : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.instrucoes_detector && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>Detectora</span>
                        </div>
                      )}
                      {r.instrucoes_radar && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          <span>Radar</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRobo.mutate(r.id)}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openNew("feedback_sdr")}>
              <Plus className="h-4 w-4 mr-2" />Novo Coach Feedback
            </Button>
          </div>
          {!feedbackRobos.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium text-sm">Nenhum Coach Feedback SDR configurado</p>
                <Button className="mt-3" size="sm" onClick={() => openNew("feedback_sdr")}><Plus className="h-4 w-4 mr-2" />Criar Coach Feedback SDR</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {feedbackRobos.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-base">{r.nome}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={r.ativo ? "default" : "secondary"} className="text-[10px]">{r.ativo ? "Ativo" : "Inativo"}</Badge>
                        <Switch checked={r.ativo} onCheckedChange={(ativo) => updateRobo.mutate({ id: r.id, ativo })} className="scale-75" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {r.descricao && <p className="text-sm text-muted-foreground">{r.descricao}</p>}
                    <div className="bg-muted rounded-md p-3 max-h-32 overflow-auto">
                      <p className="text-xs whitespace-pre-wrap">{r.instrucoes.slice(0, 300)}{r.instrucoes.length > 300 ? "..." : ""}</p>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRobo.mutate(r.id)}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scripts SDR Tab */}
        <TabsContent value="scripts" className="mt-4">
          <ScriptsSdrTab />
        </TabsContent>

        {/* Scripts Closer Tab */}
        <TabsContent value="scripts_closer" className="mt-4">
          <ScriptsCloserTab />
        </TabsContent>
      </Tabs>

      {/* Shared form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição do objetivo" />
            </div>

            <Accordion type="multiple" defaultValue={["coach"]} className="w-full">
              <AccordionItem value="coach">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    Instruções da IA Coach *
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    Prompt usado pela IA que GERA sugestões de RECA, RALOCA, RADOVECA e objeções durante a ligação.
                  </p>
                  <Textarea
                    value={form.instrucoes}
                    onChange={(e) => setForm({ ...form, instrucoes: e.target.value })}
                    placeholder={form.tipo === "feedback_sdr" ? "Avalie o SDR considerando..." : "Você é um assistente de vendas..."}
                    rows={12}
                  />
                </AccordionContent>
              </AccordionItem>

              {isCoachingType && (
                <AccordionItem value="detector">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-500" />
                      Instruções da IA Detectora
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      Prompt usado pela IA que DETECTA quais itens (script + coaching) já foram ditos pelo SDR e os risca na tela. Roda em paralelo com a IA Coach, usando um modelo mais rápido e barato.
                    </p>
                    <Textarea
                      value={form.instrucoes_detector}
                      onChange={(e) => setForm({ ...form, instrucoes_detector: e.target.value })}
                      placeholder="Prompt da IA detectora..."
                      rows={12}
                    />
                    {!form.instrucoes_detector && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setForm({ ...form, instrucoes_detector: DEFAULT_DETECTOR_PROMPT })}
                      >
                        Usar prompt padrão
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {isCloserType && (
                <AccordionItem value="radar">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Instruções da IA Radar
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      Prompt usado pela IA Radar que analisa o contexto do lead e gera insights estratégicos para o Closer antes e durante o atendimento.
                    </p>
                    <Textarea
                      value={form.instrucoes_radar}
                      onChange={(e) => setForm({ ...form, instrucoes_radar: e.target.value })}
                      placeholder="Prompt da IA Radar..."
                      rows={12}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
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
