import { useState, useMemo } from "react";
import { useCrmLeadCampos, type CrmLeadCampo } from "@/hooks/useCrmLeadCampos";
import { useCrmLeadSecoes } from "@/hooks/useCrmLeadSecoes";
import { useUpdateLead, type CrmLead, type LeadTelefone } from "@/hooks/useCrmOutbound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, X, Info, Phone } from "lucide-react";
import { toast } from "sonner";
import { formatCpf, normalizeCpf, isCpfKey } from "@/utils/cpfFormat";
import { formatDateValue } from "@/utils/dateFormat";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFieldValue, createField, type DadosExtrasMap } from "@/utils/trabalhista/types";

interface LeadDadosTabProps {
  lead: CrmLead;
  funilId: string;
  onLeadUpdate: (lead: CrmLead) => void;
}

export function LeadDadosTab({ lead, funilId, onLeadUpdate }: LeadDadosTabProps) {
  const { data: campos, isLoading } = useCrmLeadCampos();
  const { data: secoes } = useCrmLeadSecoes();
  const updateLead = useUpdateLead();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editTelefones, setEditTelefones] = useState<LeadTelefone[]>([]);

  const isPhoneFieldKey = (key: string) => /^telefone_\d+$/.test(key);
  const camposExtended = (campos as (CrmLeadCampo & { secao_id?: string | null })[]) || [];
  const dadosExtras = (lead.dados_extras as DadosExtrasMap) || {};

  // Merge legacy telefone_* from dados_extras into telefones array
  const telefones: LeadTelefone[] = useMemo(() => {
    const raw = lead.telefones as any;
    const arr: LeadTelefone[] = Array.isArray(raw) ? raw.filter((t: any) => t?.numero) : [];
    // If array is empty, try to recover from legacy dados_extras fields
    if (arr.length === 0) {
      for (let i = 1; i <= 4; i++) {
        const { valor } = getFieldValue(dadosExtras, `telefone_${i}`);
        if (valor.trim()) {
          arr.push({ numero: valor.trim(), tipo: "celular", observacao: "" });
        }
      }
    }
    return arr;
  }, [lead.telefones, dadosExtras]);

  const groupedCampos = useMemo(() => {
    // Filter out telefone_* fields — they are managed via the telefones array
    const filtered = camposExtended.filter((c) => !isPhoneFieldKey(c.key));
    const semSecao = filtered.filter((c) => !c.secao_id);
    const porSecao = (secoes || []).map((s) => ({
      secao: s,
      campos: filtered.filter((c) => c.secao_id === s.id),
    })).filter((g) => g.campos.length > 0);
    return { semSecao, porSecao };
  }, [camposExtended, secoes]);

  // Check if any section contains "contato" in name
  const contatoSecaoId = useMemo(() => {
    const match = (secoes || []).find((s) => s.nome.toLowerCase().includes("contato"));
    return match?.id || null;
  }, [secoes]);

  const nativeKeys = ["__nome__", "__endereco__"];

  const getNativeValue = (key: string) => {
    if (key === "__nome__") return lead.nome;
    if (key === "__endereco__") return lead.endereco || "";
    return "";
  };

  const hasValue = (campo: CrmLeadCampo) => {
    if (nativeKeys.includes(campo.key)) {
      const v = getNativeValue(campo.key);
      return v && String(v).trim() !== "";
    }
    const { valor } = getFieldValue(dadosExtras, campo.key);
    return valor.trim() !== "";
  };

  const startEditing = () => {
    const values: Record<string, string> = {};
    camposExtended.forEach((c) => {
      if (!isPhoneFieldKey(c.key)) {
        values[c.key] = getFieldValue(dadosExtras, c.key).valor;
      }
    });
    values.__nome__ = lead.nome;
    values.__endereco__ = lead.endereco || "";
    setEditValues(values);
    // Always provide 4 fixed slots for phones
    const slots: LeadTelefone[] = [];
    for (let i = 0; i < 4; i++) {
      slots.push({
        numero: telefones[i]?.numero || "",
        tipo: telefones[i]?.tipo || "celular",
        observacao: telefones[i]?.observacao || "",
      });
    }
    setEditTelefones(slots);
    setEditing(true);
  };

  const handleSave = () => {
    const newDadosExtras: DadosExtrasMap = {};
    for (const key of Object.keys(dadosExtras)) {
      if (!nativeKeys.includes(key)) {
        newDadosExtras[key] = dadosExtras[key];
      }
    }
    camposExtended.forEach((c) => {
      if (nativeKeys.includes(c.key)) return;
      let val = editValues[c.key]?.trim();
      if (val) {
        if (isCpfKey(c.key)) val = normalizeCpf(val);
        newDadosExtras[c.key] = createField(val, "preenchimento_manual");
      } else {
        delete newDadosExtras[c.key];
      }
    });
    nativeKeys.forEach((k) => delete newDadosExtras[k]);

    const nome = editValues.__nome__?.trim() || lead.nome;
    const endereco = editValues.__endereco__?.trim() || null;
    const newTelefones: LeadTelefone[] = editTelefones
      .filter((t) => t.numero.trim() !== "")
      .map((t) => ({ numero: t.numero, tipo: t.tipo, observacao: t.observacao }));

    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("crm_leads")
        .update({
          dados_extras: JSON.parse(JSON.stringify(newDadosExtras)),
          nome,
          endereco,
          telefones: JSON.parse(JSON.stringify(newTelefones)),
        })
        .eq("id", lead.id)
        .then(({ error }) => {
          if (error) {
            toast.error(error.message);
          } else {
            onLeadUpdate({ ...lead, nome, endereco, dados_extras: newDadosExtras, telefones: newTelefones });
            setEditing(false);
            toast.success("Dados atualizados!");
          }
        });
    });
  };

  const FieldLabel = ({ campo }: { campo: CrmLeadCampo }) => {
    const desc = (campo as any).descricao;
    if (desc && desc.trim()) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1 cursor-help">
                {campo.nome}
                <Info className="h-3 w-3 text-muted-foreground/60" />
              </label>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{desc}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <label className="text-xs font-medium text-muted-foreground">{campo.nome}</label>;
  };

  const renderFieldView = (campo: CrmLeadCampo) => {
    let val: string;
    let meta = null as ReturnType<typeof getFieldValue>["meta"];
    if (nativeKeys.includes(campo.key)) {
      val = getNativeValue(campo.key);
    } else {
      const result = getFieldValue(dadosExtras, campo.key);
      val = result.valor;
      meta = result.meta;
    }
    if (isCpfKey(campo.key)) val = formatCpf(val);
    if (campo.tipo === "data") val = formatDateValue(val);

    const isManual = meta?.origem === "preenchimento_manual";
    const confianca = meta?.confianca;

    return (
      <div key={campo.id}>
        <FieldLabel campo={campo} />
        <div className="flex items-center gap-1">
          <p className="text-sm">{val}</p>
          {isManual && <Pencil className="h-3 w-3 text-muted-foreground/50" />}
          {confianca && confianca !== "alta" && (
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                confianca === "media"
                  ? "bg-yellow-400"
                  : confianca === "baixa"
                  ? "bg-red-400"
                  : "bg-orange-400"
              }`}
              title={`Confiança: ${confianca}`}
            />
          )}
        </div>
      </div>
    );
  };

  const renderFieldEdit = (campo: CrmLeadCampo) => (
    <div key={campo.id}>
      <FieldLabel campo={campo} />
      <Input
        type={campo.tipo === "numero" ? "number" : "text"}
        value={editValues[campo.key] || ""}
        onChange={(e) => setEditValues({ ...editValues, [campo.key]: e.target.value })}
        placeholder="Não informado"
      />
    </div>
  );

  const updateTelefone = (index: number, field: keyof LeadTelefone, value: string) => {
    setEditTelefones((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };




  // Telefones UI blocks — unified format with 4 fixed slots
  const renderTelefonesView = () => {
    if (telefones.length === 0) return null;
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefones</label>
        <div className="space-y-1">
          {telefones.map((tel, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-xs text-muted-foreground">Telefone {i + 1}:</span>
              <span>{tel.numero}</span>
              {tel.observacao && <span className="text-xs text-muted-foreground">({tel.observacao})</span>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTelefonesEdit = () => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">Telefones</label>
      <div className="space-y-2">
        {editTelefones.map((tel, i) => (
          <div key={i} className="space-y-1">
            <label className="text-xs text-muted-foreground">Telefone {i + 1}</label>
            <div className="flex items-center gap-2">
              <Input
                value={tel.numero}
                onChange={(e) => updateTelefone(i, "numero", e.target.value)}
                placeholder="(00) 00000-0000"
                className="flex-1"
              />
              <Input
                value={tel.observacao || ""}
                onChange={(e) => updateTelefone(i, "observacao", e.target.value)}
                placeholder="Observação"
                className="w-40"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando campos...</div>;

  const filledSemSecao = groupedCampos.semSecao.filter(hasValue);
  const hasAnyFilled = filledSemSecao.length > 0 || telefones.length > 0 || lead.endereco || groupedCampos.porSecao.some((g) => g.campos.some(hasValue));

  // If no "contato" section exists, we'll show telefones as fallback at the end
  const hasContatoSection = contatoSecaoId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Dados do Lead</h3>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="h-3.5 w-3.5 mr-1" />Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5 mr-1" />Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1" />Salvar
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-5">
          {/* Campos sem seção */}
          {groupedCampos.semSecao.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedCampos.semSecao.map(renderFieldEdit)}
            </div>
          )}

          {/* Campos por seção */}
          {groupedCampos.porSecao.map(({ secao, campos: secaoCampos }) => {
            const isContatoSection = secao.id === contatoSecaoId;
            return (
              <div key={secao.id}>
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <div className="h-5 w-1 rounded-full bg-primary" />
                  <h4 className="text-sm font-semibold text-foreground">{secao.nome}</h4>
                </div>
                {/* Inject telefones inside contato section */}
                {isContatoSection && (
                  <div className="mb-4">
                    {renderTelefonesEdit()}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {secaoCampos.map(renderFieldEdit)}
                </div>
              </div>
            );
          })}

          {/* Fallback: telefones at end if no contato section */}
          {!hasContatoSection && renderTelefonesEdit()}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Campos sem seção - só com valor */}
          {filledSemSecao.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filledSemSecao.map(renderFieldView)}
            </div>
          )}

          {/* Campos por seção - só seções com dados */}
          {groupedCampos.porSecao.map(({ secao, campos: secaoCampos }) => {
            const filled = secaoCampos.filter(hasValue);
            const isContatoSection = secao.id === contatoSecaoId;
            // Show contato section if it has telefones OR filled fields
            if (filled.length === 0 && !(isContatoSection && telefones.length > 0)) return null;
            return (
              <div key={secao.id}>
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <div className="h-5 w-1 rounded-full bg-primary" />
                  <h4 className="text-sm font-semibold text-foreground">{secao.nome}</h4>
                </div>
                {/* Inject telefones inside contato section */}
                {isContatoSection && renderTelefonesView()}
                {filled.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {filled.map(renderFieldView)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Fallback: telefones at end if no contato section */}
          {!hasContatoSection && renderTelefonesView()}

          {/* Mensagem quando vazio */}
          {!hasAnyFilled && (
            <p className="text-xs text-muted-foreground italic">Nenhum dado adicional preenchido. Clique em Editar para preencher.</p>
          )}
        </div>
      )}
    </div>
  );
}
