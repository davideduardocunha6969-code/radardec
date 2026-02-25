import { useState, useMemo } from "react";
import { useCrmLeadCampos, type CrmLeadCampo } from "@/hooks/useCrmLeadCampos";
import { useCrmLeadSecoes } from "@/hooks/useCrmLeadSecoes";
import { useUpdateLead, type CrmLead } from "@/hooks/useCrmOutbound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

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

  const camposExtended = (campos as (CrmLeadCampo & { secao_id?: string | null })[]) || [];
  const dadosExtras = (lead.dados_extras as Record<string, unknown>) || {};

  // Group campos by secao for display
  const groupedCampos = useMemo(() => {
    const semSecao = camposExtended.filter((c) => !c.secao_id);
    const porSecao = (secoes || []).map((s) => ({
      secao: s,
      campos: camposExtended.filter((c) => c.secao_id === s.id),
    })).filter((g) => g.campos.length > 0);
    return { semSecao, porSecao };
  }, [camposExtended, secoes]);

  const hasValue = (campo: CrmLeadCampo) => {
    const v = dadosExtras[campo.key];
    return v && String(v).trim() !== "";
  };

  const startEditing = () => {
    const values: Record<string, string> = {};
    camposExtended.forEach((c) => {
      values[c.key] = String(dadosExtras[c.key] || "");
    });
    values.__nome__ = lead.nome;
    values.__endereco__ = lead.endereco || "";
    setEditValues(values);
    setEditing(true);
  };

  const handleSave = () => {
    const newDadosExtras: Record<string, string> = { ...(dadosExtras as Record<string, string>) };
    camposExtended.forEach((c) => {
      const val = editValues[c.key]?.trim();
      if (val) {
        newDadosExtras[c.key] = val;
      } else {
        delete newDadosExtras[c.key];
      }
    });

    const nome = editValues.__nome__?.trim() || lead.nome;
    const endereco = editValues.__endereco__?.trim() || null;

    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("crm_leads")
        .update({ dados_extras: JSON.parse(JSON.stringify(newDadosExtras)), nome, endereco })
        .eq("id", lead.id)
        .then(({ error }) => {
          if (error) {
            toast.error(error.message);
          } else {
            onLeadUpdate({ ...lead, nome, endereco, dados_extras: newDadosExtras });
            setEditing(false);
            toast.success("Dados atualizados!");
          }
        });
    });
  };

  const renderFieldView = (campo: CrmLeadCampo) => (
    <div key={campo.id}>
      <label className="text-xs font-medium text-muted-foreground">{campo.nome}</label>
      <p className="text-sm">{String(dadosExtras[campo.key])}</p>
    </div>
  );

  const renderFieldEdit = (campo: CrmLeadCampo) => (
    <div key={campo.id}>
      <label className="text-xs font-medium text-muted-foreground">{campo.nome}</label>
      <Input
        type={campo.tipo === "numero" ? "number" : "text"}
        value={editValues[campo.key] || ""}
        onChange={(e) => setEditValues({ ...editValues, [campo.key]: e.target.value })}
        placeholder="Não informado"
      />
    </div>
  );

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando campos...</div>;

  const filledSemSecao = groupedCampos.semSecao.filter(hasValue);
  const hasAnyFilled = filledSemSecao.length > 0 || lead.endereco || groupedCampos.porSecao.some((g) => g.campos.some(hasValue));

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
          {/* Campos base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <Input value={editValues.__nome__ || ""} onChange={(e) => setEditValues({ ...editValues, __nome__: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Endereço</label>
              <Input value={editValues.__endereco__ || ""} onChange={(e) => setEditValues({ ...editValues, __endereco__: e.target.value })} />
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
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">{secao.nome}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {secaoCampos.map(renderFieldEdit)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Nome sempre visível */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <p className="text-sm">{lead.nome}</p>
            </div>
            {lead.endereco && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Endereço</label>
                <p className="text-sm">{lead.endereco}</p>
              </div>
            )}
          </div>

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
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">{secao.nome}</h4>
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
