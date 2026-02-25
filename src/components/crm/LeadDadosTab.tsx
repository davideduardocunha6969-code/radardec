import { useState } from "react";
import { useCrmLeadCampos, type CrmLeadCampo } from "@/hooks/useCrmLeadCampos";
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
  const updateLead = useUpdateLead();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const startEditing = () => {
    const values: Record<string, string> = {};
    campos?.forEach((c) => {
      values[c.key] = String((lead.dados_extras as Record<string, unknown>)?.[c.key] || "");
    });
    values.__nome__ = lead.nome;
    values.__endereco__ = lead.endereco || "";
    setEditValues(values);
    setEditing(true);
  };

  const handleSave = () => {
    const dados_extras: Record<string, string> = { ...(lead.dados_extras as Record<string, string> || {}) };
    campos?.forEach((c) => {
      const val = editValues[c.key]?.trim();
      if (val) {
        dados_extras[c.key] = val;
      } else {
        delete dados_extras[c.key];
      }
    });

    const updateData: any = {
      id: lead.id,
      funilId,
      nome: editValues.__nome__?.trim() || lead.nome,
      endereco: editValues.__endereco__?.trim() || undefined,
    };

    // Update dados_extras via supabase directly since useUpdateLead doesn't support it
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("crm_leads")
        .update({ dados_extras: JSON.parse(JSON.stringify(dados_extras)), nome: updateData.nome, endereco: updateData.endereco || null })
        .eq("id", lead.id)
        .then(({ error }) => {
          if (error) {
            toast.error(error.message);
          } else {
            onLeadUpdate({
              ...lead,
              nome: updateData.nome,
              endereco: updateData.endereco || null,
              dados_extras,
            });
            setEditing(false);
            toast.success("Dados atualizados!");
          }
        });
    });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando campos...</div>;

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <Input
              value={editValues.__nome__ || ""}
              onChange={(e) => setEditValues({ ...editValues, __nome__: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Endereço</label>
            <Input
              value={editValues.__endereco__ || ""}
              onChange={(e) => setEditValues({ ...editValues, __endereco__: e.target.value })}
            />
          </div>
          {campos?.map((campo) => (
            <div key={campo.id}>
              <label className="text-xs font-medium text-muted-foreground">{campo.nome}</label>
              <Input
                type={campo.tipo === "data" ? "text" : campo.tipo === "numero" ? "number" : "text"}
                value={editValues[campo.key] || ""}
                onChange={(e) => setEditValues({ ...editValues, [campo.key]: e.target.value })}
                placeholder="Não informado"
              />
            </div>
          ))}
        </div>
      ) : (
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
          {campos?.filter((campo) => {
            const value = (lead.dados_extras as Record<string, unknown>)?.[campo.key];
            return value && String(value).trim() !== "";
          }).map((campo) => (
            <div key={campo.id}>
              <label className="text-xs font-medium text-muted-foreground">{campo.nome}</label>
              <p className="text-sm">{String((lead.dados_extras as Record<string, unknown>)?.[campo.key])}</p>
            </div>
          ))}
          {!lead.endereco && !campos?.some((c) => {
            const v = (lead.dados_extras as Record<string, unknown>)?.[c.key];
            return v && String(v).trim() !== "";
          }) && (
            <p className="text-xs text-muted-foreground italic col-span-full">Nenhum dado adicional preenchido. Clique em Editar para preencher.</p>
          )}
        </div>
      )}
    </div>
  );
}
