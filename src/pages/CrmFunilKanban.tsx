import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCrmColunas, useCrmLeads, useCrmFunis, useCreateColuna, useUpdateColuna, useDeleteColuna, useCreateLead, useUpdateLead, useDeleteLead, useBulkCreateLeads, useReorderColunas, type CrmLead, type LeadTelefone } from "@/hooks/useCrmOutbound";
import { LeadDadosTab } from "@/components/crm/LeadDadosTab";
import { ImportMappingDialog } from "@/components/crm/ImportMappingDialog";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WhatsAppAICallButton } from "@/components/crm/WhatsAppAICallButton";
import { LeadContatosTab } from "@/components/crm/LeadContatosTab";
import { AgendaClosersTab } from "@/components/crm/AgendaClosersTab";
import { useRobosCoachAtivos, type RoboCoach } from "@/hooks/useRobosCoach";
import { useScriptsSdr } from "@/hooks/useScriptsSdr";
import { useScriptsCloser } from "@/hooks/useScriptsCloser";
import { useCleanupOrphanedChamadas } from "@/hooks/useCrmChamadas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Phone, Upload, Loader2, GripVertical, User, Pencil, CalendarDays, Sparkles, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import type { CrmColuna } from "@/hooks/useCrmOutbound";

function SortableColumn({ col, funilId, leadsByColuna, setLeadForm, setEditingColuna, deleteColuna, setDetailLead }: {
  col: CrmColuna;
  funilId: string;
  leadsByColuna: (colunaId: string) => CrmLead[];
  setLeadForm: (colId: string) => void;
  setEditingColuna: (c: CrmColuna) => void;
  deleteColuna: (id: string) => void;
  setDetailLead: (lead: CrmLead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex-shrink-0 w-72">
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-3 border-b" style={{ borderTopColor: col.cor || "#6366f1", borderTopWidth: 3 }}>
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
              <GripVertical className="h-4 w-4" />
            </button>
            <h3 className="font-semibold text-sm">{col.nome}</h3>
            <Badge variant="secondary" className="text-xs">{leadsByColuna(col.id).length}</Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLeadForm(col.id)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingColuna(col)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteColuna(col.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-2 space-y-2">
            {leadsByColuna(col.id).map((lead) => (
              <Card key={lead.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setDetailLead(lead)}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{lead.nome}</span>
                    </div>
                  </div>
                  {(lead.telefones as any[])?.[0] && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{(lead.telefones as any[])[0].numero}</span>
                    </div>
                  )}
                  {lead.resumo_caso && <p className="text-xs text-muted-foreground line-clamp-2">{lead.resumo_caso}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default function CrmFunilKanban() {
  const { funilId } = useParams<{ funilId: string }>();
  const navigate = useNavigate();
  const { data: funis } = useCrmFunis();
  const funil = funis?.find((f) => f.id === funilId);
  const { data: colunas, isLoading: colunasLoading } = useCrmColunas(funilId);
  const { data: leads, isLoading: leadsLoading } = useCrmLeads(funilId);
  const { data: robosCoach } = useRobosCoachAtivos();
  const { data: scriptsSdr } = useScriptsSdr();
  const { data: scriptsCloser } = useScriptsCloser();
  useCleanupOrphanedChamadas();
  const createColuna = useCreateColuna();
  const updateColuna = useUpdateColuna();
  const deleteColuna = useDeleteColuna();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const bulkCreate = useBulkCreateLeads();
  const reorderColunas = useReorderColunas();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !colunas || !funilId) return;
    const oldIndex = colunas.findIndex((c) => c.id === active.id);
    const newIndex = colunas.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...colunas];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    const ordens = reordered.map((c, i) => ({ id: c.id, ordem: i }));
    reorderColunas.mutate({ funilId, ordens });
  };

  const [newColunaDialog, setNewColunaDialog] = useState(false);
  const [newColunaName, setNewColunaName] = useState("");
  const [newColunaColor, setNewColunaColor] = useState("#6366f1");
  const [newColunaCoachId, setNewColunaCoachId] = useState("");
  const [newColunaFeedbackId, setNewColunaFeedbackId] = useState("");
  const [newColunaScriptSdrId, setNewColunaScriptSdrId] = useState("");
  const [newColunaCoachCloserId, setNewColunaCoachCloserId] = useState("");
  const [newColunaFeedbackCloserId, setNewColunaFeedbackCloserId] = useState("");
  const [newColunaScriptCloserId, setNewColunaScriptCloserId] = useState("");
  const [editColunaDialog, setEditColunaDialog] = useState(false);
  const [editingColuna, setEditingColuna] = useState<{ id: string; nome: string; cor: string; robo_coach_id: string; robo_feedback_id: string; script_sdr_id: string; robo_coach_closer_id: string; robo_feedback_closer_id: string; script_closer_id: string } | null>(null);
  const [leadDialog, setLeadDialog] = useState(false);
  const [leadForm, setLeadForm] = useState({ nome: "", endereco: "", telefones: [{ numero: "", tipo: "celular" }] as LeadTelefone[], coluna_id: "" });

  const [detailLead, setDetailLead] = useState<CrmLead | null>(null);
  const [editingLeadData, setEditingLeadData] = useState(false);
  const [editLeadForm, setEditLeadForm] = useState<{ nome: string; endereco: string; telefones: LeadTelefone[] }>({ nome: "", endereco: "", telefones: [] });


  const [uploadDialog, setUploadDialog] = useState(false);

  const leadsByColuna = useCallback((colunaId: string) => {
    return (leads || []).filter((l) => l.coluna_id === colunaId);
  }, [leads]);

  const handleCreateColuna = () => {
    if (!newColunaName || !funilId) return;
    createColuna.mutate({
      funil_id: funilId, nome: newColunaName, cor: newColunaColor, ordem: (colunas?.length || 0),
      robo_coach_id: newColunaCoachId || null, robo_feedback_id: newColunaFeedbackId || null,
      script_sdr_id: newColunaScriptSdrId || null,
      robo_coach_closer_id: newColunaCoachCloserId || null, robo_feedback_closer_id: newColunaFeedbackCloserId || null,
      script_closer_id: newColunaScriptCloserId || null,
    } as any, {
      onSuccess: () => {
        setNewColunaDialog(false); setNewColunaName(""); setNewColunaCoachId(""); setNewColunaFeedbackId("");
        setNewColunaScriptSdrId(""); setNewColunaCoachCloserId(""); setNewColunaFeedbackCloserId(""); setNewColunaScriptCloserId("");
      },
    });
  };

  const handleCreateLead = () => {
    if (!leadForm.nome || !leadForm.coluna_id || !funilId) return;
    const validPhones = leadForm.telefones.filter((t) => t.numero.trim());
    createLead.mutate({ funil_id: funilId, coluna_id: leadForm.coluna_id, nome: leadForm.nome, endereco: leadForm.endereco || undefined, telefones: validPhones }, {
      onSuccess: () => { setLeadDialog(false); setLeadForm({ nome: "", endereco: "", telefones: [{ numero: "", tipo: "celular" }], coluna_id: "" }); },
    });
  };



  const handleMoveLead = (lead: CrmLead, newColunaId: string) => {
    if (lead.coluna_id === newColunaId) return;
    updateLead.mutate({ id: lead.id, funilId: funilId!, coluna_id: newColunaId });
  };

  const addPhoneField = () => setLeadForm({ ...leadForm, telefones: [...leadForm.telefones, { numero: "", tipo: "celular" }] });

  if (!funil) return <div className="p-6"><Button variant="ghost" onClick={() => navigate("/crm-outbound")}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button><p className="mt-4 text-muted-foreground">Funil não encontrado</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm-outbound")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-xl font-bold">{funil.nome}</h1>
            <p className="text-sm text-muted-foreground">{funil.area_atuacao} {funil.tipo_acao ? `• ${funil.tipo_acao}` : ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadDialog(true)}><Upload className="h-4 w-4 mr-2" />Importar Lista</Button>
          <Button onClick={() => setNewColunaDialog(true)}><Plus className="h-4 w-4 mr-2" />Nova Coluna</Button>
        </div>
      </div>

      {colunasLoading || leadsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !colunas?.length ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>Nenhuma coluna criada</p>
          <Button className="mt-4" onClick={() => setNewColunaDialog(true)}><Plus className="h-4 w-4 mr-2" />Criar Coluna</Button>
        </CardContent></Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
          <SortableContext items={colunas.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {colunas.map((col) => (
                <SortableColumn key={col.id} col={col} funilId={funilId!} leadsByColuna={leadsByColuna} setLeadForm={(colId: string) => { setLeadForm({ ...leadForm, coluna_id: colId }); setLeadDialog(true); }} setEditingColuna={(c: typeof col) => { setEditingColuna({ id: c.id, nome: c.nome, cor: c.cor || "#6366f1", robo_coach_id: c.robo_coach_id || "", robo_feedback_id: c.robo_feedback_id || "", script_sdr_id: c.script_sdr_id || "", robo_coach_closer_id: c.robo_coach_closer_id || "", robo_feedback_closer_id: c.robo_feedback_closer_id || "", script_closer_id: c.script_closer_id || "" }); setEditColunaDialog(true); }} deleteColuna={(id: string) => deleteColuna.mutate({ id, funilId: funilId! })} setDetailLead={setDetailLead} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Dialog Nova Coluna */}
      <Dialog open={newColunaDialog} onOpenChange={setNewColunaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Coluna</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div><label className="text-sm font-medium">Nome</label><Input value={newColunaName} onChange={(e) => setNewColunaName(e.target.value)} placeholder="Ex: Primeiro Contato" /></div>
            <div><label className="text-sm font-medium">Cor</label><Input type="color" value={newColunaColor} onChange={(e) => setNewColunaColor(e.target.value)} className="h-10 w-20" /></div>
            
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">SDR</p>
            <div>
              <label className="text-sm font-medium">Coach Tempo Real SDR</label>
              <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={newColunaCoachId} onChange={(e) => setNewColunaCoachId(e.target.value)}>
                <option value="">Nenhum</option>
                {robosCoach?.filter(r => r.tipo !== "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Feedback SDR</label>
              <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={newColunaFeedbackId} onChange={(e) => setNewColunaFeedbackId(e.target.value)}>
                <option value="">Nenhum</option>
                {robosCoach?.filter(r => r.tipo === "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Script SDR</label>
              <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={newColunaScriptSdrId} onChange={(e) => setNewColunaScriptSdrId(e.target.value)}>
                <option value="">Nenhum</option>
                {scriptsSdr?.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1 mt-2">Closer</p>
            <div>
              <label className="text-sm font-medium">Coach Tempo Real Closer</label>
              <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={newColunaCoachCloserId} onChange={(e) => setNewColunaCoachCloserId(e.target.value)}>
                <option value="">Nenhum</option>
                {robosCoach?.filter(r => r.tipo !== "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Feedback Closer</label>
              <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={newColunaFeedbackCloserId} onChange={(e) => setNewColunaFeedbackCloserId(e.target.value)}>
                <option value="">Nenhum</option>
                {robosCoach?.filter(r => r.tipo === "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Script Closer</label>
              <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={newColunaScriptCloserId} onChange={(e) => setNewColunaScriptCloserId(e.target.value)}>
                <option value="">Nenhum</option>
                {scriptsCloser?.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewColunaDialog(false)}>Cancelar</Button><Button onClick={handleCreateColuna} disabled={!newColunaName}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Coluna */}
      <Dialog open={editColunaDialog} onOpenChange={setEditColunaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Coluna</DialogTitle></DialogHeader>
          {editingColuna && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div><label className="text-sm font-medium">Nome</label><Input value={editingColuna.nome} onChange={(e) => setEditingColuna({ ...editingColuna, nome: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Cor</label><Input type="color" value={editingColuna.cor} onChange={(e) => setEditingColuna({ ...editingColuna, cor: e.target.value })} className="h-10 w-20" /></div>
              
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">SDR</p>
              <div>
                <label className="text-sm font-medium">Coach Tempo Real SDR</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={editingColuna.robo_coach_id} onChange={(e) => setEditingColuna({ ...editingColuna, robo_coach_id: e.target.value })}>
                  <option value="">Nenhum</option>
                  {robosCoach?.filter(r => r.tipo !== "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Feedback SDR</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={editingColuna.robo_feedback_id} onChange={(e) => setEditingColuna({ ...editingColuna, robo_feedback_id: e.target.value })}>
                  <option value="">Nenhum</option>
                  {robosCoach?.filter(r => r.tipo === "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Script SDR</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={editingColuna.script_sdr_id} onChange={(e) => setEditingColuna({ ...editingColuna, script_sdr_id: e.target.value })}>
                  <option value="">Nenhum</option>
                  {scriptsSdr?.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1 mt-2">Closer</p>
              <div>
                <label className="text-sm font-medium">Coach Tempo Real Closer</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={editingColuna.robo_coach_closer_id} onChange={(e) => setEditingColuna({ ...editingColuna, robo_coach_closer_id: e.target.value })}>
                  <option value="">Nenhum</option>
                  {robosCoach?.filter(r => r.tipo !== "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Feedback Closer</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={editingColuna.robo_feedback_closer_id} onChange={(e) => setEditingColuna({ ...editingColuna, robo_feedback_closer_id: e.target.value })}>
                  <option value="">Nenhum</option>
                  {robosCoach?.filter(r => r.tipo === "feedback_sdr").map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Script Closer</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={editingColuna.script_closer_id} onChange={(e) => setEditingColuna({ ...editingColuna, script_closer_id: e.target.value })}>
                  <option value="">Nenhum</option>
                  {scriptsCloser?.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColunaDialog(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!editingColuna || !funilId) return;
              updateColuna.mutate({
                id: editingColuna.id, funilId,
                nome: editingColuna.nome, cor: editingColuna.cor,
                robo_coach_id: editingColuna.robo_coach_id || null,
                robo_feedback_id: editingColuna.robo_feedback_id || null,
                script_sdr_id: editingColuna.script_sdr_id || null,
                robo_coach_closer_id: editingColuna.robo_coach_closer_id || null,
                robo_feedback_closer_id: editingColuna.robo_feedback_closer_id || null,
                script_closer_id: editingColuna.script_closer_id || null,
              }, {
                onSuccess: () => setEditColunaDialog(false),
              });
            }} disabled={!editingColuna?.nome}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Lead */}
      <Dialog open={leadDialog} onOpenChange={setLeadDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Nome *</label><Input value={leadForm.nome} onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Endereço</label><Input value={leadForm.endereco} onChange={(e) => setLeadForm({ ...leadForm, endereco: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium">Telefones</label>
              {leadForm.telefones.map((t, i) => (
                <div key={i} className="flex gap-2 mt-1">
                  <Input value={t.numero} onChange={(e) => { const tels = [...leadForm.telefones]; tels[i].numero = e.target.value; setLeadForm({ ...leadForm, telefones: tels }); }} placeholder="(99) 99999-9999" />
                  <Input value={t.tipo} onChange={(e) => { const tels = [...leadForm.telefones]; tels[i].tipo = e.target.value; setLeadForm({ ...leadForm, telefones: tels }); }} placeholder="celular" className="w-28" />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="mt-1" onClick={addPhoneField}><Plus className="h-3 w-3 mr-1" />Telefone</Button>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLeadDialog(false)}>Cancelar</Button><Button onClick={handleCreateLead} disabled={!leadForm.nome}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Importação com Mapeamento */}
      <ImportMappingDialog
        open={uploadDialog}
        onOpenChange={setUploadDialog}
        funilId={funilId!}
        colunas={colunas || []}
      />

      {/* Dialog Detalhe Lead */}
      <Dialog open={!!detailLead} onOpenChange={(o) => { if (!o) { setDetailLead(null); setEditingLeadData(false); } }}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none border-0 overflow-y-auto overflow-x-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-4 pb-2 shrink-0 border-b">
            <DialogTitle>{detailLead?.nome}</DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <Tabs defaultValue="lead-dados" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="w-full shrink-0 mx-6" style={{ width: "calc(100% - 3rem)" }}>
                  <TabsTrigger value="lead-dados" className="flex-1">Dados</TabsTrigger>
                  <TabsTrigger value="dados" className="flex-1">Atendimento SDR</TabsTrigger>
                  <TabsTrigger value="atendimento-closer" className="flex-1">
                    <Phone className="h-3.5 w-3.5 mr-1" />Atendimento Closer
                  </TabsTrigger>
                  <TabsTrigger value="agenda-closers" className="flex-1">
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />Agenda Closers
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="lead-dados" className="flex-1 overflow-auto px-6 pb-6 min-h-0">
                  <LeadDadosTab lead={detailLead} funilId={funilId!} onLeadUpdate={(updated) => setDetailLead(updated)} />
                </TabsContent>
                <TabsContent value="dados" className="flex-1 overflow-auto px-6 pb-6 min-h-0">
                  <div className="space-y-4">
                    {detailLead.dados_extras && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(detailLead.dados_extras as Record<string, string>).empresa && <div><label className="text-xs font-medium text-muted-foreground">Empresa</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).empresa}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).cargo && <div><label className="text-xs font-medium text-muted-foreground">Cargo</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).cargo}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).data_admissao && <div><label className="text-xs font-medium text-muted-foreground">Admissão</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).data_admissao}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).data_demissao && <div><label className="text-xs font-medium text-muted-foreground">Demissão</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).data_demissao}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).motivo_demissao && <div><label className="text-xs font-medium text-muted-foreground">Motivo</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).motivo_demissao}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).cpf && <div><label className="text-xs font-medium text-muted-foreground">CPF</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).cpf}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).municipio && <div><label className="text-xs font-medium text-muted-foreground">Município/UF</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).municipio}/{(detailLead.dados_extras as Record<string, string>).uf}</p></div>}
                      </div>
                    )}
                    {detailLead.endereco && <div><label className="text-sm font-medium text-muted-foreground">Endereço</label><p className="text-sm">{detailLead.endereco}</p></div>}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-muted-foreground">Telefones</label>
                        {!editingLeadData && (
                          <Button variant="outline" size="sm" onClick={() => { setEditLeadForm({ nome: detailLead.nome, endereco: detailLead.endereco || "", telefones: [...detailLead.telefones] }); setEditingLeadData(true); }}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />Editar Dados
                          </Button>
                        )}
                      </div>
                      {editingLeadData ? (
                        <div className="space-y-3 rounded-lg border p-4">
                          <div><label className="text-xs font-medium text-muted-foreground">Nome</label><Input value={editLeadForm.nome} onChange={(e) => setEditLeadForm({ ...editLeadForm, nome: e.target.value })} /></div>
                          <div><label className="text-xs font-medium text-muted-foreground">Endereço</label><Input value={editLeadForm.endereco} onChange={(e) => setEditLeadForm({ ...editLeadForm, endereco: e.target.value })} /></div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Telefones</label>
                            {editLeadForm.telefones.map((t, i) => (
                              <div key={i} className="space-y-1 mt-2 p-2 border rounded-md">
                                <div className="flex gap-2 items-center">
                                  <Input value={t.numero} onChange={(e) => { const tels = [...editLeadForm.telefones]; tels[i] = { ...tels[i], numero: e.target.value }; setEditLeadForm({ ...editLeadForm, telefones: tels }); }} placeholder="(99) 99999-9999" className="flex-1" />
                                  <Input value={t.tipo} onChange={(e) => { const tels = [...editLeadForm.telefones]; tels[i] = { ...tels[i], tipo: e.target.value }; setEditLeadForm({ ...editLeadForm, telefones: tels }); }} placeholder="celular" className="w-28" />
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { const tels = editLeadForm.telefones.filter((_, j) => j !== i); setEditLeadForm({ ...editLeadForm, telefones: tels }); }}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                                <Input value={t.observacao || ""} onChange={(e) => { const tels = [...editLeadForm.telefones]; tels[i] = { ...tels[i], observacao: e.target.value }; setEditLeadForm({ ...editLeadForm, telefones: tels }); }} placeholder="Observação: ex. ligar após 18h, contato da esposa..." className="text-xs" />
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditLeadForm({ ...editLeadForm, telefones: [...editLeadForm.telefones, { numero: "", tipo: "celular", observacao: "" }] })}>
                              <Plus className="h-3.5 w-3.5 mr-1" />Adicionar Telefone
                            </Button>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditingLeadData(false)}>Cancelar</Button>
                            <Button size="sm" onClick={() => {
                              const validPhones = editLeadForm.telefones.filter(t => t.numero.trim());
                              updateLead.mutate({ id: detailLead.id, funilId: funilId!, nome: editLeadForm.nome, endereco: editLeadForm.endereco || undefined, telefones: validPhones }, {
                                onSuccess: () => {
                                  setDetailLead({ ...detailLead, nome: editLeadForm.nome, endereco: editLeadForm.endereco || null, telefones: validPhones });
                                  setEditingLeadData(false);
                                  toast.success("Dados atualizados!");
                                },
                              });
                            }}>Salvar</Button>
                          </div>
                        </div>
                      ) : (
                        detailLead.telefones.map((t, i) => (
                          <div key={i} className="mt-1">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{t.numero}</span>
                              <Badge variant="outline" className="text-xs">{t.tipo}</Badge>
                              <div className="flex items-center gap-1 ml-auto">
                                <WhatsAppAICallButton leadId={detailLead.id} leadNome={detailLead.nome} numero={t.numero} />
                                <Button
                                  size="sm"
                                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white h-8 px-2 text-xs"
                                  onClick={() => {
                                    window.open(
                                      `/atendimento?leadId=${detailLead.id}&numero=${encodeURIComponent(t.numero)}&tipo=whatsapp&funilId=${funilId}`,
                                      `atendimento_${detailLead.id}`,
                                      "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no"
                                    );
                                  }}
                                  disabled={!t.numero}
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  WhatsApp
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1.5 h-8 px-2 text-xs"
                                  onClick={() => {
                                    window.open(
                                      `/atendimento?leadId=${detailLead.id}&numero=${encodeURIComponent(t.numero)}&tipo=voip&funilId=${funilId}`,
                                      `atendimento_${detailLead.id}`,
                                      "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no"
                                    );
                                  }}
                                  disabled={!t.numero}
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  Ligar
                                </Button>
                              </div>
                            </div>
                            {t.observacao && <p className="text-xs text-muted-foreground ml-6 mt-0.5 italic">{t.observacao}</p>}
                          </div>
                        ))
                      )}
                    </div>


                    {detailLead.resumo_caso && <div><label className="text-sm font-medium text-muted-foreground">Resumo do Caso (IA)</label><p className="text-sm bg-muted p-3 rounded-md">{detailLead.resumo_caso}</p></div>}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground">Mover para coluna</label>
                        <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={detailLead.coluna_id} onChange={(e) => { handleMoveLead(detailLead, e.target.value); setDetailLead({ ...detailLead, coluna_id: e.target.value }); }}>
                          {colunas?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <Button variant="destructive" size="sm" className="mt-5" onClick={() => { deleteLead.mutate({ id: detailLead.id, funilId: funilId! }); setDetailLead(null); }}>
                        <Trash2 className="h-4 w-4 mr-2" />Excluir Lead
                      </Button>
                  </div>
                    <Separator className="my-6" />
                    <LeadContatosTab leadId={detailLead.id} />
                  </div>
                </TabsContent>
                <TabsContent value="atendimento-closer" className="flex-1 overflow-auto px-6 pb-6">
                  <div className="space-y-4">
                    {/* Dados do Lead */}
                    {detailLead.dados_extras && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(detailLead.dados_extras as Record<string, string>).empresa && <div><label className="text-xs font-medium text-muted-foreground">Empresa</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).empresa}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).cargo && <div><label className="text-xs font-medium text-muted-foreground">Cargo</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).cargo}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).data_admissao && <div><label className="text-xs font-medium text-muted-foreground">Admissão</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).data_admissao}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).data_demissao && <div><label className="text-xs font-medium text-muted-foreground">Demissão</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).data_demissao}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).motivo_demissao && <div><label className="text-xs font-medium text-muted-foreground">Motivo</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).motivo_demissao}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).cpf && <div><label className="text-xs font-medium text-muted-foreground">CPF</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).cpf}</p></div>}
                        {(detailLead.dados_extras as Record<string, string>).municipio && <div><label className="text-xs font-medium text-muted-foreground">Município/UF</label><p className="text-sm">{(detailLead.dados_extras as Record<string, string>).municipio}/{(detailLead.dados_extras as Record<string, string>).uf}</p></div>}
                      </div>
                    )}
                    {detailLead.endereco && <div><label className="text-sm font-medium text-muted-foreground">Endereço</label><p className="text-sm">{detailLead.endereco}</p></div>}

                    {/* Telefones com botões de ligação */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefones — Ligar como Closer</label>
                      {detailLead.telefones.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{t.numero}</span>
                          <Badge variant="outline" className="text-xs">{t.tipo}</Badge>
                          <div className="flex items-center gap-1 ml-auto">
                            <WhatsAppAICallButton leadId={detailLead.id} leadNome={detailLead.nome} numero={t.numero} />
                            <Button
                              size="sm"
                              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white h-8 px-2 text-xs"
                              onClick={() => {
                                window.open(
                                  `/atendimento?leadId=${detailLead.id}&numero=${encodeURIComponent(t.numero)}&tipo=whatsapp&funilId=${funilId}`,
                                  `atendimento_${detailLead.id}`,
                                  "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no"
                                );
                              }}
                              disabled={!t.numero}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1.5 h-8 px-2 text-xs"
                              onClick={() => {
                                window.open(
                                  `/atendimento?leadId=${detailLead.id}&numero=${encodeURIComponent(t.numero)}&tipo=voip&funilId=${funilId}`,
                                  `atendimento_${detailLead.id}`,
                                  "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no"
                                );
                              }}
                              disabled={!t.numero}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Ligar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>


                    {/* Resumo IA dos Contatos SDR */}
                    {detailLead.resumo_ia_contatos ? (
                      <Collapsible defaultOpen={false} className="border rounded-lg bg-muted/30">
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/50 transition-colors rounded-lg group">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">Resumo SDR</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 py-3 border-t border-border/50">
                            <div className="text-sm leading-relaxed space-y-1">
                              {(detailLead.resumo_ia_contatos as string).split('\n').map((line: string, i: number) => {
                                const trimmed = line.trim();
                                if (!trimmed) return <div key={i} className="h-1.5" />;
                                if (/^#{1,3}\s/.test(trimmed)) return <p key={i} className="font-semibold text-foreground mt-2 mb-0.5">{trimmed.replace(/^#{1,3}\s+/, '')}</p>;
                                if (/^[-•]\s/.test(trimmed)) {
                                  const text = trimmed.replace(/^[-•]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                  return <div key={i} className="flex items-start gap-2 ml-2"><span className="text-muted-foreground mt-0.5 shrink-0">•</span><span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: text }} /></div>;
                                }
                                const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                return <p key={i} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />;
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <div className="border rounded-lg bg-muted/30 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Nenhum resumo SDR disponível. Gere na aba "Contatos SDR".
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="agenda-closers" className="flex-1 overflow-auto px-6 pb-6">
                  <AgendaClosersTab leadId={detailLead.id} leadNome={detailLead.nome} funilId={funilId} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}