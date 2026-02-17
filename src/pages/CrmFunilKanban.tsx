import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCrmColunas, useCrmLeads, useCrmFunis, useCreateColuna, useDeleteColuna, useCreateLead, useUpdateLead, useDeleteLead, useBulkCreateLeads, type CrmLead, type LeadTelefone } from "@/hooks/useCrmOutbound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Phone, Upload, Loader2, GripVertical, User, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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
  const [uploadMode, setUploadMode] = useState<"text" | "file">("file");
  const [parsedPreview, setParsedPreview] = useState<{ nome: string; endereco?: string; telefones: LeadTelefone[]; dados_extras?: Record<string, string> }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const excelDateToString = (value: string): string => {
    const num = Number(value);
    if (!isNaN(num) && num > 1000 && num < 100000) {
      const date = XLSX.SSF.parse_date_code(num);
      if (date) {
        const dd = String(date.d).padStart(2, "0");
        const mm = String(date.m).padStart(2, "0");
        const yyyy = date.y;
        return `${dd}/${mm}/${yyyy}`;
      }
    }
    return value;
  };

  const parseLeadsFromRows = (rows: string[][]): { nome: string; endereco?: string; telefones: LeadTelefone[]; dados_extras?: Record<string, string> }[] => {
    const parsed: { nome: string; endereco?: string; telefones: LeadTelefone[]; dados_extras?: Record<string, string> }[] = [];
    for (const parts of rows) {
      if (!parts[0]?.trim()) continue;
      const telefones: LeadTelefone[] = [];
      for (let i = 10; i <= 14; i++) {
        if (parts[i]?.trim()) telefones.push({ numero: parts[i].trim(), tipo: "celular" });
      }
      const dados_extras: Record<string, string> = {};
      if (parts[1]?.trim()) dados_extras.empresa = parts[1].trim();
      if (parts[2]?.trim()) dados_extras.data_admissao = excelDateToString(parts[2].trim());
      if (parts[3]?.trim()) dados_extras.data_demissao = excelDateToString(parts[3].trim());
      if (parts[4]?.trim()) dados_extras.motivo_demissao = parts[4].trim();
      if (parts[5]?.trim()) dados_extras.cargo = parts[5].trim();
      if (parts[7]?.trim()) dados_extras.municipio = parts[7].trim();
      if (parts[8]?.trim()) dados_extras.uf = parts[8].trim();
      if (parts[9]?.trim()) dados_extras.cpf = parts[9].trim();
      const municipioUf = [dados_extras.municipio, dados_extras.uf].filter(Boolean).join(" - ");
      parsed.push({ nome: parts[0].trim(), endereco: municipioUf || undefined, telefones, dados_extras: Object.keys(dados_extras).length ? dados_extras : undefined });
    }
    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        // Skip header row if first cell matches expected header
        const startIdx = rows[0]?.[0]?.toString().toLowerCase().includes("nome") ? 1 : 0;
        const dataRows = rows.slice(startIdx).map(r => r.map(c => String(c)));
        const leads = parseLeadsFromRows(dataRows);
        setParsedPreview(leads);
        if (!leads.length) toast.error("Nenhum lead encontrado na planilha");
        else toast.success(`${leads.length} leads encontrados na planilha`);
      } catch {
        toast.error("Erro ao ler a planilha. Verifique o formato.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCsvImport = () => {
    if (!uploadColunaId || !funilId) return;
    let leadsToImport = parsedPreview;
    if (uploadMode === "text") {
      if (!csvText.trim()) return;
      const lines = csvText.trim().split("\n");
      const rows = lines.map(l => l.split(";").map(s => s.trim()));
      leadsToImport = parseLeadsFromRows(rows);
    }
    if (!leadsToImport.length) { toast.error("Nenhum lead encontrado"); return; }
    bulkCreate.mutate({ funilId, colunaId: uploadColunaId, leads: leadsToImport.map(l => ({ nome: l.nome, endereco: l.endereco, telefones: l.telefones, dados_extras: l.dados_extras })) }, {
      onSuccess: () => { setUploadDialog(false); setCsvText(""); setParsedPreview([]); },
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
      <Dialog open={uploadDialog} onOpenChange={(o) => { setUploadDialog(o); if (!o) { setCsvText(""); setParsedPreview([]); setUploadMode("file"); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Lista de Leads</DialogTitle>
            <DialogDescription>Envie uma planilha Excel ou cole os dados manualmente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Instruções de formato */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-primary">
                <AlertCircle className="h-4 w-4" />
                Formato obrigatório das colunas (nesta ordem):
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <Badge variant="outline" className="justify-center">A</Badge><span>Nome do lead <span className="text-destructive">*</span></span>
                <Badge variant="outline" className="justify-center">B</Badge><span>Empresa que trabalhou</span>
                <Badge variant="outline" className="justify-center">C</Badge><span>Data de admissão</span>
                <Badge variant="outline" className="justify-center">D</Badge><span>Data de demissão</span>
                <Badge variant="outline" className="justify-center">E</Badge><span>Motivo da demissão</span>
                <Badge variant="outline" className="justify-center">F</Badge><span>Cargo na última empresa</span>
                <Badge variant="outline" className="justify-center">G</Badge><span className="text-muted-foreground italic">Reservado</span>
                <Badge variant="outline" className="justify-center">H</Badge><span>Município</span>
                <Badge variant="outline" className="justify-center">I</Badge><span>UF</span>
                <Badge variant="outline" className="justify-center">J</Badge><span>CPF</span>
                <Badge variant="outline" className="justify-center">K</Badge><span>Telefone 1</span>
                <Badge variant="outline" className="justify-center">L</Badge><span>Telefone 2</span>
                <Badge variant="outline" className="justify-center">M</Badge><span>Telefone 3</span>
                <Badge variant="outline" className="justify-center">N</Badge><span>Telefone 4</span>
                <Badge variant="outline" className="justify-center">O</Badge><span>Telefone 5</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">A primeira linha pode ser o cabeçalho (será ignorada automaticamente se começar com "Nome").</p>
            </div>

            {colunas && colunas.length > 0 && (
              <div>
                <label className="text-sm font-medium">Coluna de destino</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={uploadColunaId} onChange={(e) => setUploadColunaId(e.target.value)}>
                  {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}

            {/* Tabs: File vs Text */}
            <div className="flex gap-2">
              <Button variant={uploadMode === "file" ? "default" : "outline"} size="sm" onClick={() => setUploadMode("file")}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />Planilha Excel
              </Button>
              <Button variant={uploadMode === "text" ? "default" : "outline"} size="sm" onClick={() => setUploadMode("text")}>
                <Upload className="h-4 w-4 mr-1" />Colar Texto
              </Button>
            </div>

            {uploadMode === "file" ? (
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Clique para selecionar a planilha</p>
                  <p className="text-xs text-muted-foreground">.xlsx, .xls, .csv</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
                {parsedPreview.length > 0 && (
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-sm font-medium text-primary">{parsedPreview.length} leads encontrados</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {parsedPreview.slice(0, 5).map((l, i) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <div className="flex gap-2 flex-wrap">
                            <span className="font-medium">{l.nome}</span>
                            {l.dados_extras?.empresa && <span className="text-muted-foreground">• {l.dados_extras.empresa}</span>}
                            {l.dados_extras?.municipio && <span className="text-muted-foreground">• {l.dados_extras.municipio}/{l.dados_extras?.uf}</span>}
                            {l.telefones.map((t, j) => <Badge key={j} variant="secondary" className="text-xs">{t.numero}</Badge>)}
                          </div>
                        </div>
                      ))}
                      {parsedPreview.length > 5 && <p className="text-xs text-muted-foreground">... e mais {parsedPreview.length - 5} leads</p>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Textarea rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={"João Silva;Empresa X;01/01/2020;31/12/2023;Pedido de demissão;;;São Paulo;SP;123.456.789-00;(11)99999-0001\nMaria Santos;Empresa Y;15/03/2019;20/06/2024;Sem justa causa;;;Campinas;SP;987.654.321-00;(11)99999-0002;(11)99999-0003"} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancelar</Button>
            <Button onClick={handleCsvImport} disabled={bulkCreate.isPending || (uploadMode === "file" ? !parsedPreview.length : !csvText.trim())}>
              {bulkCreate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhe Lead */}
      <Dialog open={!!detailLead} onOpenChange={(o) => !o && setDetailLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detailLead?.nome}</DialogTitle></DialogHeader>
          {detailLead && (
            <div className="space-y-4">
              {detailLead.dados_extras && (
                <div className="grid grid-cols-2 gap-3">
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
