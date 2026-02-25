import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmLeadCampos, useCreateCrmLeadCampo, normalizeKey, autoSuggestMapping, type CrmLeadCampo } from "@/hooks/useCrmLeadCampos";
import { useBulkCreateLeads, type LeadTelefone } from "@/hooks/useCrmOutbound";
import { FileSpreadsheet, Loader2, Plus, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funilId: string;
  colunas: { id: string; nome: string }[];
}

type ImportStep = "upload" | "mapping" | "preview";

export function ImportMappingDialog({ open, onOpenChange, funilId, colunas }: ImportMappingDialogProps) {
  const { data: campos } = useCrmLeadCampos();
  const createCampo = useCreateCrmLeadCampo();
  const bulkCreate = useBulkCreateLeads();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [uploadColunaId, setUploadColunaId] = useState(colunas[0]?.id || "");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [newFieldName, setNewFieldName] = useState("");
  const [creatingFieldForIdx, setCreatingFieldForIdx] = useState<number | null>(null);

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setNewFieldName("");
    setCreatingFieldForIdx(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const excelDateToString = (value: string): string => {
    const num = Number(value);
    if (!isNaN(num) && num > 1000 && num < 100000) {
      const date = XLSX.SSF.parse_date_code(num);
      if (date) {
        const dd = String(date.d).padStart(2, "0");
        const mm = String(date.m).padStart(2, "0");
        return `${dd}/${mm}/${date.y}`;
      }
    }
    return value;
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
        const allRows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (!allRows.length) { toast.error("Planilha vazia"); return; }

        const hdrs = allRows[0].map((c) => String(c).trim());
        const dataRows = allRows.slice(1).map((r) => r.map((c) => String(c)));

        setHeaders(hdrs);
        setRows(dataRows);

        // Auto suggest mapping
        if (campos) {
          const suggested = autoSuggestMapping(hdrs, campos);
          setMapping(suggested);
        }

        setStep("mapping");
        toast.success(`${dataRows.length} linhas encontradas`);
      } catch {
        toast.error("Erro ao ler a planilha.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateField = async (idx: number) => {
    if (!newFieldName.trim()) return;
    const key = normalizeKey(newFieldName);
    if (campos?.find((c) => c.key === key)) {
      toast.error("Já existe um campo com essa chave");
      return;
    }
    await createCampo.mutateAsync({ nome: newFieldName.trim(), key, ordem: (campos?.length || 0) + 1 });
    setMapping({ ...mapping, [idx]: `campo:${key}` });
    setNewFieldName("");
    setCreatingFieldForIdx(null);
  };

  const buildLeads = () => {
    const leads: { nome: string; endereco?: string; telefones: LeadTelefone[]; dados_extras?: Record<string, string> }[] = [];

    for (const row of rows) {
      let nome = "";
      const telefones: LeadTelefone[] = [];
      const dados_extras: Record<string, string> = {};

      for (const [idxStr, target] of Object.entries(mapping)) {
        const idx = Number(idxStr);
        const val = row[idx]?.trim();
        if (!val) continue;

        if (target === "__nome__") {
          nome = val;
        } else if (target === "__telefone__") {
          telefones.push({ numero: val, tipo: "celular" });
        } else if (target.startsWith("campo:")) {
          const key = target.replace("campo:", "");
          // Auto-convert excel dates for date fields
          const campo = campos?.find((c) => c.key === key);
          dados_extras[key] = campo?.tipo === "data" ? excelDateToString(val) : val;
        }
      }

      // Also check for additional phone columns mapped to telefone
      if (!nome) continue;
      leads.push({ nome, telefones, dados_extras: Object.keys(dados_extras).length ? dados_extras : undefined });
    }

    return leads;
  };

  const parsedLeads = step === "preview" ? buildLeads() : [];

  const handleImport = () => {
    const leads = buildLeads();
    if (!leads.length) { toast.error("Nenhum lead encontrado"); return; }
    bulkCreate.mutate({ funilId, colunaId: uploadColunaId, leads }, {
      onSuccess: () => { handleClose(false); },
    });
  };

  const hasMappedNome = Object.values(mapping).includes("__nome__");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Importar Lista de Leads"}
            {step === "mapping" && "Mapear Colunas"}
            {step === "preview" && "Preview da Importação"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Envie uma planilha Excel ou CSV."}
            {step === "mapping" && "Defina para qual campo cada coluna da planilha será importada."}
            {step === "preview" && `${parsedLeads.length} leads prontos para importar.`}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            {colunas.length > 0 && (
              <div>
                <label className="text-sm font-medium">Coluna de destino</label>
                <select className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-sm" value={uploadColunaId} onChange={(e) => setUploadColunaId(e.target.value)}>
                  {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Clique para selecionar a planilha</p>
              <p className="text-xs text-muted-foreground">.xlsx, .xls, .csv</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">A primeira linha da planilha foi usada como cabeçalho. Defina o destino de cada coluna:</p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                  <Badge variant="secondary" className="shrink-0 min-w-[120px] justify-center text-xs">{header || `Col ${idx + 1}`}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <Select value={mapping[idx] || "__ignorar__"} onValueChange={(val) => setMapping({ ...mapping, [idx]: val })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ignorar__">Ignorar</SelectItem>
                        <SelectItem value="__nome__">Nome do Lead</SelectItem>
                        <SelectItem value="__telefone__">Telefone</SelectItem>
                        {campos?.map((c) => (
                          <SelectItem key={c.id} value={`campo:${c.key}`}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(mapping[idx] === "__ignorar__" || !mapping[idx]) && (
                    <Button variant="ghost" size="sm" className="shrink-0 text-xs h-8" onClick={() => setCreatingFieldForIdx(idx)}>
                      <Plus className="h-3 w-3 mr-1" />Criar campo
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {creatingFieldForIdx !== null && (
              <div className="flex items-center gap-2 p-3 rounded border border-primary/30 bg-primary/5">
                <Input
                  className="h-8 text-sm"
                  placeholder="Nome do novo campo (ex: Bairro)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateField(creatingFieldForIdx)}
                  autoFocus
                />
                <Button size="sm" className="h-8" onClick={() => handleCreateField(creatingFieldForIdx)} disabled={createCampo.isPending}>
                  {createCampo.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Criar"}
                </Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => { setCreatingFieldForIdx(null); setNewFieldName(""); }}>Cancelar</Button>
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="max-h-[50vh] overflow-y-auto space-y-1">
              {parsedLeads.slice(0, 10).map((l, i) => (
                <div key={i} className="text-xs p-2 rounded border bg-muted/30 space-y-0.5">
                  <span className="font-medium">{l.nome}</span>
                  {l.telefones.length > 0 && l.telefones.map((t, j) => (
                    <Badge key={j} variant="secondary" className="text-xs ml-1">{t.numero}</Badge>
                  ))}
                  {l.dados_extras && Object.entries(l.dados_extras).map(([k, v]) => (
                    <span key={k} className="text-muted-foreground ml-2">• {k}: {v}</span>
                  ))}
                </div>
              ))}
              {parsedLeads.length > 10 && <p className="text-xs text-muted-foreground">... e mais {parsedLeads.length - 10} leads</p>}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          {step === "mapping" && (
            <Button onClick={() => setStep("preview")} disabled={!hasMappedNome}>
              <ArrowRight className="h-4 w-4 mr-1" />Preview
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>Voltar</Button>
              <Button onClick={handleImport} disabled={bulkCreate.isPending || !parsedLeads.length}>
                {bulkCreate.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                <Upload className="h-4 w-4 mr-1" />Importar {parsedLeads.length} leads
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
