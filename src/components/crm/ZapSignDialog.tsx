import { useState, useMemo, useEffect } from "react";
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
import type { CrmLead, LeadTelefone } from "@/hooks/useCrmOutbound";
import { supabase } from "@/integrations/supabase/client";
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

  // Build grouped fields from "Dados Pessoais" and "Dados de Contato" sections
  const { groupedFields, initialFieldValues } = useMemo(() => {
    if (!campos || !secoes) return { groupedFields: [] as any[], initialFieldValues: {} as Record<string, string> };

    const dadosExtras = (lead.dados_extras as DadosExtrasMap) || {};
    const values: Record<string, string> = {};
    const groups: Array<{ secaoNome: string; fields: Array<{ key: string; nome: string }> }> = [];

    const secaoMap = new Map<string, { nome: string; ordem: number; fields: Array<{ key: string; nome: string }> }>();

    for (const secao of secoes) {
      const lower = secao.nome.toLowerCase();
      if (lower.includes("dados pessoais") || lower.includes("contato")) {
        secaoMap.set(secao.id, { nome: secao.nome, ordem: secao.ordem, fields: [] });
      }
    }

    for (const campo of (campos as any[])) {
      const secaoId = campo.secao_id;
      const secaoEntry = secaoId ? secaoMap.get(secaoId) : null;

      if (secaoEntry) {
        secaoEntry.fields.push({ key: campo.key, nome: campo.nome });
        const { valor } = getFieldValue(dadosExtras, campo.key);
        let finalValue = valor.trim();
        if (!finalValue && campo.key === "__nome__" && lead.nome) {
          finalValue = lead.nome;
        }
        if (finalValue) {
          values[campo.key] = finalValue;
        }
      }
    }

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
  // Editable variable name per field (what goes into the DOCX placeholder)
  const [fieldPlaceholders, setFieldPlaceholders] = useState<Record<string, string>>({});

  // Initialize field values when initialFieldValues change
  useMemo(() => {
    setFieldValues(initialFieldValues);
  }, [initialFieldValues]);

  // Initialize placeholders with campo.nome defaults
  useEffect(() => {
    if (!groupedFields.length) return;
    const defaults: Record<string, string> = {};
    for (const group of groupedFields) {
      for (const field of group.fields) {
        defaults[field.key] = field.nome;
      }
    }
    setFieldPlaceholders(defaults);
  }, [groupedFields]);

  // Load saved mappings when template is selected (step 2)
  useEffect(() => {
    if (step !== 2 || !selectedTemplate) return;

    const loadMappings = async () => {
      const { data } = await supabase
        .from("zapsign_template_mappings" as any)
        .select("campo_key, variavel_zapsign")
        .eq("template_id", selectedTemplate);

      if (data && (data as any[]).length > 0) {
        setFieldPlaceholders((prev) => {
          const updated = { ...prev };
          for (const row of data as any[]) {
            if (row.campo_key && row.variavel_zapsign) {
              updated[row.campo_key] = row.variavel_zapsign;
            }
          }
          return updated;
        });
      }
    };
    loadMappings();
  }, [step, selectedTemplate]);

  const updateField = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const updatePlaceholder = (key: string, value: string) => {
    setFieldPlaceholders((prev) => ({ ...prev, [key]: value }));
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

  const saveMappings = async () => {
    const rows = Object.entries(fieldPlaceholders)
      .filter(([_, v]) => v.trim())
      .map(([key, variavel]) => ({
        template_id: selectedTemplate,
        campo_key: key,
        variavel_zapsign: variavel.trim(),
      }));

    if (rows.length === 0) return;

    // Get user id for the rows
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    for (const row of rows) {
      await supabase
        .from("zapsign_template_mappings" as any)
        .upsert(
          { ...row, user_id: userData.user.id },
          { onConflict: "template_id,campo_key" }
        );
    }
  };

  const handleSend = async () => {
    // Build field_data using the editable placeholder names as keys
    const fieldData: Record<string, string> = {};
    for (const [key, val] of Object.entries(fieldValues)) {
      if (val.trim()) {
        const placeholder = fieldPlaceholders[key]?.trim();
        if (placeholder) {
          fieldData[placeholder] = val.trim();
        }
      }
    }

    const name = fieldValues["__nome__"] || lead.nome || "";
    const telefones = Array.isArray(lead.telefones) ? lead.telefones as LeadTelefone[] : [];

    try {
      const result = await createDoc.mutateAsync({
        template_id: selectedTemplate,
        template_nome: selectedTemplateName,
        signer_name: name,
        signer_email: lead.email || undefined,
        signer_phone: telefones[0]?.numero || undefined,
        lead_id: lead.id,
        field_data: fieldData,
      });
      setResultUrl(result.sign_url);
      toast.success("Documento enviado para assinatura!");

      // Save mappings in background
      saveMappings();
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
              Ajuste o nome da <strong>Variável</strong> para corresponder exatamente ao placeholder do template DOCX (ex: {"{{NOME COMPLETO}}"}).
              O mapeamento será salvo para uso futuro.
            </p>

            <ScrollArea className="h-[50vh] pr-3">
              <div className="space-y-4">
                {groupedFields.map((group) => (
                  <div key={group.secaoNome} className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.secaoNome}
                    </h4>
                    {group.fields.map((field: { key: string; nome: string }) => (
                      <div key={field.key} className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Variável</Label>
                          <Input
                            value={fieldPlaceholders[field.key] || ""}
                            onChange={(e) => updatePlaceholder(field.key, e.target.value)}
                            placeholder="Nome no template"
                            className="mt-0.5 text-xs"
                            style={{ fontFamily: 'system-ui, sans-serif' }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{field.nome}</Label>
                          <Input
                            value={fieldValues[field.key] || ""}
                            onChange={(e) => updateField(field.key, e.target.value)}
                            placeholder="Valor"
                            className="mt-0.5"
                          />
                        </div>
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
