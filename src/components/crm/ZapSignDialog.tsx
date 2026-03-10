import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useZapSignTemplates, useCreateZapSignDoc } from "@/hooks/useZapSignDocumentos";
import { useCrmLeadCampos } from "@/hooks/useCrmLeadCampos";
import { useCrmLeadSecoes } from "@/hooks/useCrmLeadSecoes";
import { getFieldValue, type DadosExtrasMap } from "@/utils/trabalhista/types";
import type { CrmLead } from "@/hooks/useCrmOutbound";
import { toast } from "sonner";
import { Copy, Check, Loader2, FileSignature } from "lucide-react";

interface ZapSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CrmLead;
}

export function ZapSignDialog({ open, onOpenChange, lead }: ZapSignDialogProps) {
  const { data: templates, isLoading: loadingTemplates } = useZapSignTemplates();
  const { data: campos } = useCrmLeadCampos();
  const { data: secoes } = useCrmLeadSecoes();
  const createDoc = useCreateZapSignDoc();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Build grouped fields from all sections with pre-filled values
  const { groupedFields, initialFieldValues } = useMemo(() => {
    if (!campos || !secoes) return { groupedFields: [] as any[], initialFieldValues: {} as Record<string, string> };

    const dadosExtras = (lead.dados_extras as DadosExtrasMap) || {};
    const values: Record<string, string> = {};
    const groups: Array<{ secaoNome: string; fields: Array<{ key: string; nome: string }> }> = [];

    // Filter only "Dados Pessoais" section
    const secaoMap = new Map<string, { nome: string; ordem: number; fields: Array<{ key: string; nome: string }> }>();

    for (const secao of secoes) {
      if (secao.nome.toLowerCase().includes("dados pessoais")) {
        secaoMap.set(secao.id, { nome: secao.nome, ordem: secao.ordem, fields: [] });
      }
    }

    for (const campo of (campos as any[])) {
      const secaoId = campo.secao_id;
      const secaoEntry = secaoId ? secaoMap.get(secaoId) : null;

      if (secaoEntry) {
        secaoEntry.fields.push({ key: campo.key, nome: campo.nome });
        // Get value from dados_extras
        const { valor } = getFieldValue(dadosExtras, campo.key);
        if (valor.trim()) {
          values[campo.key] = valor;
        }
      }
    }

    // Sort sections by ordem and build groups
    const sorted = Array.from(secaoMap.values())
      .filter((s) => s.fields.length > 0)
      .sort((a, b) => a.ordem - b.ordem);

    for (const s of sorted) {
      groups.push({ secaoNome: s.nome, fields: s.fields });
    }

    return { groupedFields: groups, initialFieldValues: values };
  }, [campos, secoes, lead]);

  // Editable field values state
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Initialize field values when initialFieldValues change
  useMemo(() => {
    setFieldValues(initialFieldValues);
  }, [initialFieldValues]);

  const updateField = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const selectedTemplateName = useMemo(() => {
    if (!templates) return "";
    const t = templates.find((t) => String(t.token || t.id) === selectedTemplate);
    return t?.name || "";
  }, [templates, selectedTemplate]);

  const handleNext = () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }
    setStep(2);
  };

  const handleSend = async () => {
    const name = fieldValues["__nome__"]?.trim();
    if (!name) {
      toast.error("Nome do signatário é obrigatório");
      return;
    }

    // Build field_data: all non-empty fields (excluding internal keys)
    const fieldData: Record<string, string> = {};
    for (const [key, val] of Object.entries(fieldValues)) {
      if (val.trim()) {
        // Map internal keys to readable names for ZapSign
        if (key === "__nome__") fieldData["nome"] = val.trim();
        else if (key === "__telefone__") fieldData["telefone"] = val.trim();
        else if (key === "__endereco__") fieldData["endereco"] = val.trim();
        else fieldData[key] = val.trim();
      }
    }

    try {
      const result = await createDoc.mutateAsync({
        template_id: selectedTemplate,
        template_nome: selectedTemplateName,
        signer_name: name,
        signer_email: fieldData["email"] || undefined,
        signer_phone: fieldData["telefone"] || undefined,
        lead_id: lead.id,
        field_data: fieldData,
      });
      setResultUrl(result.sign_url);
      toast.success("Documento enviado para assinatura!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar documento");
    }
  };

  const handleCopy = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTemplate("");
    setResultUrl(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Enviar para Assinatura
          </DialogTitle>
        </DialogHeader>

        {resultUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Documento criado com sucesso! Copie o link abaixo e envie ao cliente:
            </p>
            <div className="flex items-center gap-2">
              <Input value={resultUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div>
              <Label>Template</Label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates...
                </div>
              ) : (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates || []).map((t) => (
                      <SelectItem key={t.token || t.id} value={String(t.token || t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button className="w-full" onClick={handleNext} disabled={!selectedTemplate}>
              Próximo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Revise os dados que serão inseridos no documento. As variáveis no template DOCX (ex: {"{{cpf}}"}) devem corresponder às chaves dos campos abaixo.
            </p>

            <ScrollArea className="h-[50vh] pr-3">
              <div className="space-y-4">
                {/* Native fields */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados Nativos</h4>
                  <div>
                    <Label className="text-xs">Nome *</Label>
                    <Input
                      value={fieldValues["__nome__"] || ""}
                      onChange={(e) => updateField("__nome__", e.target.value)}
                      className="mt-0.5"
                    />
                  </div>
                  {fieldValues["__endereco__"] !== undefined && (
                    <div>
                      <Label className="text-xs">Endereço</Label>
                      <Input
                        value={fieldValues["__endereco__"] || ""}
                        onChange={(e) => updateField("__endereco__", e.target.value)}
                        className="mt-0.5"
                      />
                    </div>
                  )}
                </div>

                {/* Dynamic fields grouped by section */}
                {groupedFields.map((group) => (
                  <div key={group.secaoNome} className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.secaoNome}
                    </h4>
                    {group.fields.map((field: { key: string; nome: string }) => (
                      <div key={field.key}>
                        <Label className="text-xs">{field.nome}</Label>
                        <Input
                          value={fieldValues[field.key] || ""}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          placeholder={`{{${field.key}}}`}
                          className="mt-0.5"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleSend} disabled={createDoc.isPending} className="flex-1">
                {createDoc.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Enviar para Assinatura
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
