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
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Bot, Loader2, ClipboardCheck, FileText, Heart, Brain, ShieldAlert, UserX } from "lucide-react";
import ScriptsSdrTab from "@/components/robos/ScriptsSdrTab";
import ScriptsCloserTab from "@/components/robos/ScriptsCloserTab";
import { Briefcase } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CoachForm {
  nome: string;
  descricao: string;
  instrucoes: string;
  instrucoes_reca: string;
  instrucoes_raloca: string;
  instrucoes_radoveca: string;
  instrucoes_noshow: string;
  tipo: string;
}

const emptyForm: CoachForm = { nome: "", descricao: "", instrucoes: "", instrucoes_reca: "", instrucoes_raloca: "", instrucoes_radoveca: "", instrucoes_noshow: "", tipo: "coaching" };

export default function RobosCoach() {
  const { data: robos, isLoading } = useRobosCoach();
  const createRobo = useCreateRoboCoach();
  const updateRobo = useUpdateRoboCoach();
  const deleteRobo = useDeleteRoboCoach();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoboCoach | null>(null);
  const [form, setForm] = useState<CoachForm>(emptyForm);

  const coachingRobos = robos?.filter((r) => r.tipo !== "feedback_sdr") || [];
  const feedbackRobos = robos?.filter((r) => r.tipo === "feedback_sdr") || [];

  const openNew = (tipo: string = "coaching") => {
    setEditing(null);
    setForm({
      ...emptyForm,
      tipo,
      nome: tipo === "feedback_sdr" ? "Coach Feedback SDR" : "",
      descricao: tipo === "feedback_sdr" ? "Instruções para análise automática de atendimento do SDR após cada ligação" : "",
    });
    setFormOpen(true);
  };

  const openEdit = (r: RoboCoach) => {
    setEditing(r);
    setForm({
      nome: r.nome,
      descricao: r.descricao || "",
      instrucoes: r.instrucoes,
      instrucoes_reca: r.instrucoes_reca || "",
      instrucoes_raloca: r.instrucoes_raloca || "",
      instrucoes_radoveca: r.instrucoes_radoveca || "",
      instrucoes_noshow: r.instrucoes_noshow || "",
      tipo: r.tipo || "coaching",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.nome) return;
    if (editing) {
      updateRobo.mutate(
        { id: editing.id, nome: form.nome, descricao: form.descricao, instrucoes: form.instrucoes, instrucoes_reca: form.instrucoes_reca, instrucoes_raloca: form.instrucoes_raloca, instrucoes_radoveca: form.instrucoes_radoveca, instrucoes_noshow: form.instrucoes_noshow },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createRobo.mutate(
        { nome: form.nome, descricao: form.descricao, instrucoes: form.instrucoes, tipo: form.tipo },
        { onSuccess: () => setFormOpen(false) }
      );
    }
  };

  const isCoachingType = form.tipo !== "feedback_sdr";

  const PromptPreview = ({ label, icon: Icon, color, text }: { label: string; icon: any; color: string; text: string }) => (
    text ? (
      <AccordionItem value={label} className="border-none">
        <AccordionTrigger className="py-1.5 hover:no-underline">
          <div className="flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${color}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-muted rounded-md p-2 max-h-28 overflow-auto">
            <p className="text-[11px] whitespace-pre-wrap">{text.slice(0, 300)}{text.length > 300 ? "..." : ""}</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    ) : null
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Robô Coach</h1>
        <p className="text-sm text-muted-foreground">Gerencie coaches de IA e scripts para SDRs.</p>
      </div>

      <Tabs defaultValue="coaching" className="w-full">
        <TabsList>
          <TabsTrigger value="coaching" className="gap-1.5"><Bot className="h-4 w-4" />Coaches Tempo Real</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5"><ClipboardCheck className="h-4 w-4" />Coaches Feedback</TabsTrigger>
          <TabsTrigger value="scripts" className="gap-1.5"><FileText className="h-4 w-4" />Scripts SDR</TabsTrigger>
          <TabsTrigger value="scripts_closer" className="gap-1.5"><Briefcase className="h-4 w-4" />Scripts Closers</TabsTrigger>
        </TabsList>

        <TabsContent value="coaching" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => openNew("coaching")}><Plus className="h-4 w-4 mr-2" />Novo Coach</Button>
          </div>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {coachingRobos.map((r) => (
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
                  <CardContent className="space-y-2">
                    {r.descricao && <p className="text-sm text-muted-foreground">{r.descricao}</p>}
                    <Accordion type="multiple" className="w-full">
                      <PromptPreview label="RECA — Âncoras Emocionais" icon={Heart} color="text-red-500" text={r.instrucoes_reca} />
                      <PromptPreview label="RALOCA — Âncoras Lógicas" icon={Brain} color="text-purple-500" text={r.instrucoes_raloca} />
                      <PromptPreview label="RADOVECA — Objeções" icon={ShieldAlert} color="text-amber-500" text={r.instrucoes_radoveca} />
                      <PromptPreview label="No-Show" icon={UserX} color="text-orange-500" text={r.instrucoes_noshow} />
                      {r.instrucoes && !r.instrucoes_reca && !r.instrucoes_raloca && !r.instrucoes_radoveca && (
                        <PromptPreview label="Instruções Gerais (legado)" icon={Bot} color="text-muted-foreground" text={r.instrucoes} />
                      )}
                    </Accordion>
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
            <Button size="sm" onClick={() => openNew("feedback_sdr")}><Plus className="h-4 w-4 mr-2" />Novo Coach Feedback</Button>
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

        <TabsContent value="scripts" className="mt-4"><ScriptsSdrTab /></TabsContent>
        <TabsContent value="scripts_closer" className="mt-4"><ScriptsCloserTab /></TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Novo"} {form.tipo === "feedback_sdr" ? "Coach Feedback SDR" : "Robô Coach"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-5 pb-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Coach Trabalhista" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição do objetivo" />
                </div>
              </div>

              {isCoachingType ? (
                <>
                  <Accordion type="multiple" defaultValue={["reca", "raloca", "radoveca"]} className="w-full">
                    <AccordionItem value="reca">
                      <AccordionTrigger className="py-2">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-semibold">RECA — Âncoras Emocionais</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          value={form.instrucoes_reca}
                          onChange={(e) => setForm({ ...form, instrucoes_reca: e.target.value })}
                          placeholder="Instruções para a IA que analisa razões emocionais do lead (gatilhos, âncoras emocionais, RECA)..."
                          rows={8}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="raloca">
                      <AccordionTrigger className="py-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-semibold">RALOCA — Âncoras Lógicas</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          value={form.instrucoes_raloca}
                          onChange={(e) => setForm({ ...form, instrucoes_raloca: e.target.value })}
                          placeholder="Instruções para a IA que analisa razões lógicas (argumentos racionais, dados, RALOCA)..."
                          rows={8}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="radoveca">
                      <AccordionTrigger className="py-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold">RADOVECA — Objeções</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          value={form.instrucoes_radoveca}
                          onChange={(e) => setForm({ ...form, instrucoes_radoveca: e.target.value })}
                          placeholder="Instruções para a IA que detecta e responde objeções do lead (RADOVECA, contorno de objeções)..."
                          rows={8}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="noshow">
                      <AccordionTrigger className="py-2">
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-semibold">No-Show</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          value={form.instrucoes_noshow}
                          onChange={(e) => setForm({ ...form, instrucoes_noshow: e.target.value })}
                          placeholder="Instruções para a IA que lida com situações de no-show do lead..."
                          rows={8}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div>
                    <Label className="text-muted-foreground">Instruções Gerais (legado)</Label>
                    <Textarea
                      value={form.instrucoes}
                      onChange={(e) => setForm({ ...form, instrucoes: e.target.value })}
                      placeholder="Instruções gerais (campo legado, use os campos acima preferencialmente)"
                      rows={4}
                      className="opacity-70"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label>Instruções da IA *</Label>
                  <Textarea
                    value={form.instrucoes}
                    onChange={(e) => setForm({ ...form, instrucoes: e.target.value })}
                    placeholder="Avalie o SDR considerando..."
                    rows={12}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || createRobo.isPending || updateRobo.isPending}>
              {(createRobo.isPending || updateRobo.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
