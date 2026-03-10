import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useZapSignTemplates, useCreateZapSignDoc } from "@/hooks/useZapSignDocumentos";
import { useCrmLeadCampos } from "@/hooks/useCrmLeadCampos";
import { useCrmLeadSecoes } from "@/hooks/useCrmLeadSecoes";
import { getFieldValue, type DadosExtrasMap } from "@/utils/trabalhista/types";
import type { CrmLead, LeadTelefone } from "@/hooks/useCrmOutbound";
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
  const [signerName, setSignerName] = useState(lead.nome || "");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerPhone, setSignerPhone] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Pre-fill from "Dados de Contato" section
  useMemo(() => {
    if (!campos || !secoes) return;

    const contatoSecao = secoes.find((s) => s.nome.toLowerCase().includes("contato"));
    if (!contatoSecao) return;

    const contatoCampos = (campos as any[]).filter((c: any) => c.secao_id === contatoSecao.id);
    const dadosExtras = (lead.dados_extras as DadosExtrasMap) || {};

    for (const campo of contatoCampos) {
      const { valor } = getFieldValue(dadosExtras, campo.key);
      if (!valor.trim()) continue;
      const keyLower = campo.key.toLowerCase();
      if (keyLower.includes("email") && !signerEmail) {
        setSignerEmail(valor);
      }
    }

    // Phone from telefones array
    const raw = lead.telefones as any;
    const telefones: LeadTelefone[] = Array.isArray(raw) ? raw.filter((t: any) => t?.numero) : [];
    if (telefones.length > 0 && !signerPhone) {
      setSignerPhone(telefones[0].numero);
    }
  }, [campos, secoes, lead]);

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
    if (!signerName.trim()) {
      toast.error("Nome do signatário é obrigatório");
      return;
    }
    try {
      const result = await createDoc.mutateAsync({
        template_id: selectedTemplate,
        template_nome: selectedTemplateName,
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim() || undefined,
        signer_phone: signerPhone.trim() || undefined,
        lead_id: lead.id,
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
      <DialogContent className="sm:max-w-md">
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
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Template</label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates...
                </div>
              ) : (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
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
              Dados do signatário (pré-preenchidos da seção "Dados de Contato"):
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">E-mail</label>
              <Input value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Telefone</label>
              <Input value={signerPhone} onChange={(e) => setSignerPhone(e.target.value)} />
            </div>
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
