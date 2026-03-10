import { useState, useMemo } from "react";
import { useCrmLeadCampos, type CrmLeadCampo } from "@/hooks/useCrmLeadCampos";
import { useCrmLeadSecoes } from "@/hooks/useCrmLeadSecoes";
import { useUpdateLead, type CrmLead } from "@/hooks/useCrmOutbound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X, Info, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCpf, normalizeCpf, isCpfKey } from "@/utils/cpfFormat";
import { formatDateValue } from "@/utils/dateFormat";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFieldValue, createField, type DadosExtrasMap } from "@/utils/trabalhista/types";

interface TelefoneEntry {
  numero: string;
  tipo: string;
  obs?: string;
}

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
  const [editTelefones, setEditTelefones] = useState<TelefoneEntry[]>([]);

  const camposExtended = (campos as (CrmLeadCampo & { secao_id?: string | null })[]) || [];
  const dadosExtras = (lead.dados_extras as DadosExtrasMap) || {};

  const telefones: TelefoneEntry[] = useMemo(() => {
    const raw = lead.telefones as any;
    if (Array.isArray(raw)) return raw.filter((t: any) => t?.numero);
    return [];
  }, [lead.telefones]);

  const groupedCampos = useMemo(() => {
    const semSecao = camposExtended.filter((c) => !c.secao_id);
    const porSecao = (secoes || []).map((s) => ({
      secao: s,
      campos: camposExtended.filter((c) => c.secao_id === s.id),
    })).filter((g) => g.campos.length > 0);
    return { semSecao, porSecao };
  }, [camposExtended, secoes]);

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
      values[c.key] = getFieldValue(dadosExtras, c.key).valor;
    });
    values.__nome__ = lead.nome;
    values.__endereco__ = lead.endereco || "";
    setEditValues(values);
    setEditTelefones(
      telefones.length > 0
        ? telefones.map((t) => ({ ...t }))
        : [{ numero: "", tipo: "celular", obs: "" }]
    );
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
    const newTelefones = editTelefones.filter((t) => t.numero.trim() !== "");

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

  const updateTelefone = (index: number, field: keyof TelefoneEntry, value: string) => {
    setEditTelefones((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTelefone = (index: number) => {
    setEditTelefones((prev) => prev.filter((_, i) => i !== index));
  };

  const addTelefone = () => {
    setEditTelefones((prev) => [...prev, { numero: "", tipo: "celular", obs: "" }]);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando campos...</div>;

  const filledSemSecao = groupedCampos.semSecao.filter(hasValue);
  const hasAnyFilled = filledSemSecao.length > 0 || telefones.length > 0 || lead.endereco || groupedCampos.porSecao.some((g) => g.campos.some(hasValue));

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
          {/* Telefones - edição */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Telefones</label>
            <div className="space-y-2">
              {editTelefones.map((tel, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={tel.numero}
                    onChange={(e) => updateTelefone(i, "numero", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="flex-1"
                  />
                  <Input
                    value={tel.tipo || ""}
                    onChange={(e) => updateTelefone(i, "tipo", e.target.value)}
                    placeholder="Tipo"
                    className="w-24"
                  />
                  <Input
                    value={tel.obs || ""}
                    onChange={(e) => updateTelefone(i, "obs", e.target.value)}
                    placeholder="Obs"
                    className="w-32"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeTelefone(i)} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addTelefone}>
                <Plus className="h-3.5 w-3.5 mr-1" />Adicionar Telefone
              </Button>
            </div>
          </div>

          {/* Campos sem seção */}
          {groupedCampos.semSecao.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedCampos.semSecao.map(renderFieldEdit)}
            </div>
          )}

          {/* Campos por seção */}
          {groupedCampos.porSecao.map(({ secao, campos: secaoCampos }) => (
            <div key={secao.id}>
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="h-5 w-1 rounded-full bg-primary" />
                <h4 className="text-sm font-semibold text-foreground">{secao.nome}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {secaoCampos.map(renderFieldEdit)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Telefones - visualização */}
          {telefones.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefones</label>
              <div className="space-y-1">
                {telefones.map((tel, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{tel.numero}</span>
                    {tel.tipo && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tel.tipo}</Badge>}
                    {tel.obs && <span className="text-xs text-muted-foreground">({tel.obs})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos sem seção - só com valor */}
          {filledSemSecao.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filledSemSecao.map(renderFieldView)}
            </div>
          )}

          {/* Campos por seção - só seções com dados */}
          {groupedCampos.porSecao.map(({ secao, campos: secaoCampos }) => {
            const filled = secaoCampos.filter(hasValue);
            if (filled.length === 0) return null;
            return (
              <div key={secao.id}>
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <div className="h-5 w-1 rounded-full bg-primary" />
                  <h4 className="text-sm font-semibold text-foreground">{secao.nome}</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filled.map(renderFieldView)}
                </div>
              </div>
            );
          })}

          {/* Mensagem quando vazio */}
          {!hasAnyFilled && (
            <p className="text-xs text-muted-foreground italic">Nenhum dado adicional preenchido. Clique em Editar para preencher.</p>
          )}
        </div>
      )}
    </div>
  );
}
