import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCrmColunas, useCrmLeads, useCrmFunis, useCreateColuna, useDeleteColuna, useCreateLead, useUpdateLead, useDeleteLead, useBulkCreateLeads, type CrmLead, type LeadTelefone } from "@/hooks/useCrmOutbound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Phone, Upload, Loader2, GripVertical, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function CrmFunilKanban() {
  const { funilId } = useParams<{ funilId: string }>();
  const navigate = useNavigate();
  const { data: funis } = useCrmFunis();
  const funil = funis?.find((f) => f.id === funilId);
  const { data: colunas, isLoading: colunasLoading } = useCrmColunas(funilId);
  const { data: leads, isLoading: leadsLoading } = useCrmLeads(funilId);
  const createColuna = useCreateColuna();
  const deleteColuna = useDeleteColuna();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const bulkCreate = useBulkCreateLeads();

  const [newColunaDialog, setNewColunaDialog] = useState(false);
  const [newColunaName, setNewColunaName] = useState("");
  const [newColunaColor, setNewColunaColor] = useState("#6366f1");

  const [leadDialog, setLeadDialog] = useState(false);
  const [leadForm, setLeadForm] = useState({ nome: "", endereco: "", telefones: [{ numero: "", tipo: "celular" }] as LeadTelefone[], coluna_id: "" });

  const [detailLead, setDetailLead] = useState<CrmLead | null>(null);

  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadColunaId, setUploadColunaId] = useState("");
  const [csvText, setCsvText] = useState("");

  const leadsByColuna = useCallback((colunaId: string) => {
    return (leads || []).filter((l) => l.coluna_id === colunaId);
  }, [leads]);

  const handleCreateColuna = () => {
    if (!newColunaName || !funilId) return;
    createColuna.mutate({ funil_id: funilId, nome: newColunaName, cor: newColunaColor, ordem: (colunas?.length || 0) }, {
      onSuccess: () => { setNewColunaDialog(false); setNewColunaName(""); },
    });
  };

  const handleCreateLead = () => {
    if (!leadForm.nome || !leadForm.coluna_id || !funilId) return;
    const validPhones = leadForm.telefones.filter((t) => t.numero.trim());
    createLead.mutate({ funil_id: funilId, coluna_id: leadForm.coluna_id, nome: leadForm.nome, endereco: leadForm.endereco || undefined, telefones: validPhones }, {
      onSuccess: () => { setLeadDialog(false); setLeadForm({ nome: "", endereco: "", telefones: [{ numero: "", tipo: "celular" }], coluna_id: "" }); },
    });
  };

  const handleCsvImport = () => {
    if (!csvText.trim() || !uploadColunaId || !funilId) return;
    const lines = csvText.trim().split("\n");
    const parsedLeads: { nome: string; endereco?: string; telefones: LeadTelefone[] }[] = [];
    
    for (const line of lines) {
      const parts = line.split(";").map((s) => s.trim());
      if (!parts[0]) continue;
      const telefones: LeadTelefone[] = [];
      // parts[0] = nome, parts[1] = endereco, parts[2..] = telefones
      for (let i = 2; i < parts.length; i++) {
        if (parts[i]) telefones.push({ numero: parts[i], tipo: "celular" });
      }
      parsedLeads.push({ nome: parts[0], endereco: parts[1] || undefined, telefones });
    }

    if (!parsedLeads.length) { toast.error("Nenhum lead encontrado no CSV"); return; }
    bulkCreate.mutate({ funilId, colunaId: uploadColunaId, leads: parsedLeads }, {
      onSuccess: () => { setUploadDialog(false); setCsvText(""); },
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
          <Button variant="outline" onClick={() => { setUploadColunaId(colunas?.[0]?.id || ""); setUploadDialog(true); }}><Upload className="h-4 w-4 mr-2" />Importar Lista</Button>
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {colunas.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-72">
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between p-3 border-b" style={{ borderTopColor: col.cor || "#6366f1", borderTopWidth: 3 }}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{col.nome}</h3>
                    <Badge variant="secondary" className="text-xs">{leadsByColuna(col.id).length}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLeadForm({ ...leadForm, coluna_id: col.id }); setLeadDialog(true); }}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteColuna.mutate({ id: col.id, funilId: funilId! })}>
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
                          {lead.telefones[0] && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{lead.telefones[0].numero}</span>
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
          ))}
        </div>
      )}

      {/* Dialog Nova Coluna */}
      <Dialog open={newColunaDialog} onOpenChange={setNewColunaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Coluna</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Nome</label><Input value={newColunaName} onChange={(e) => setNewColunaName(e.target.value)} placeholder="Ex: Primeiro Contato" /></div>
            <div><label className="text-sm font-medium">Cor</label><Input type="color" value={newColunaColor} onChange={(e) => setNewColunaColor(e.target.value)} className="h-10 w-20" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewColunaDialog(false)}>Cancelar</Button><Button onClick={handleCreateColuna} disabled={!newColunaName}>Criar</Button></DialogFooter>
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

      {/* Dialog Upload CSV */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Importar Lista de Leads</DialogTitle><DialogDescription>Cole os dados no formato: Nome;Endereço;Telefone1;Telefone2;...</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {colunas && colunas.length > 0 && (
              <div>
                <label className="text-sm font-medium">Coluna de destino</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={uploadColunaId} onChange={(e) => setUploadColunaId(e.target.value)}>
                  {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
            <Textarea rows={10} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={"João Silva;Rua A, 123;(11)99999-0001\nMaria Santos;Rua B, 456;(11)99999-0002;(11)99999-0003"} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setUploadDialog(false)}>Cancelar</Button><Button onClick={handleCsvImport} disabled={bulkCreate.isPending || !csvText.trim()}>
            {bulkCreate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Importar
          </Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhe Lead */}
      <Dialog open={!!detailLead} onOpenChange={(o) => !o && setDetailLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detailLead?.nome}</DialogTitle></DialogHeader>
          {detailLead && (
            <div className="space-y-4">
              {detailLead.endereco && <div><label className="text-sm font-medium text-muted-foreground">Endereço</label><p className="text-sm">{detailLead.endereco}</p></div>}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefones</label>
                {detailLead.telefones.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t.numero}</span>
                    <Badge variant="outline" className="text-xs">{t.tipo}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-primary"><Phone className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              {detailLead.resumo_caso && <div><label className="text-sm font-medium text-muted-foreground">Resumo do Caso (IA)</label><p className="text-sm bg-muted p-3 rounded-md">{detailLead.resumo_caso}</p></div>}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mover para coluna</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={detailLead.coluna_id} onChange={(e) => { handleMoveLead(detailLead, e.target.value); setDetailLead({ ...detailLead, coluna_id: e.target.value }); }}>
                  {colunas?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => { deleteLead.mutate({ id: detailLead.id, funilId: funilId! }); setDetailLead(null); }}>
                  <Trash2 className="h-4 w-4 mr-2" />Excluir Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
