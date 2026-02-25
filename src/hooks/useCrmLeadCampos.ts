import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CrmLeadCampo {
  id: string;
  nome: string;
  key: string;
  tipo: string;
  ordem: number;
  obrigatorio: boolean;
  created_at: string;
}

export function useCrmLeadCampos() {
  return useQuery({
    queryKey: ["crm_lead_campos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_lead_campos" as any)
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as unknown as CrmLeadCampo[];
    },
    refetchOnWindowFocus: false,
  });
}

export function useCreateCrmLeadCampo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; key: string; tipo?: string; ordem?: number }) => {
      const { error } = await supabase
        .from("crm_lead_campos" as any)
        .insert({
          nome: data.nome,
          key: data.key,
          tipo: data.tipo || "texto",
          ordem: data.ordem ?? 99,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_campos"] });
      toast.success("Campo criado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function autoSuggestMapping(
  headers: string[],
  campos: CrmLeadCampo[]
): Record<number, string> {
  const mapping: Record<number, string> = {};
  
  headers.forEach((header, idx) => {
    const normalized = normalizeKey(header);
    if (!normalized) return;
    
    // Check exact key match
    const exactMatch = campos.find((c) => c.key === normalized);
    if (exactMatch) {
      mapping[idx] = `campo:${exactMatch.key}`;
      return;
    }
    
    // Check name/telefone
    if (["nome", "name", "nome_completo", "nome_lead"].includes(normalized)) {
      mapping[idx] = "__nome__";
      return;
    }
    if (["telefone", "tel", "tel1", "telefone1", "celular", "phone", "fone"].includes(normalized)) {
      mapping[idx] = "__telefone__";
      return;
    }
    
    // Partial match on campo names
    for (const campo of campos) {
      const campoNorm = normalizeKey(campo.nome);
      if (campoNorm === normalized || normalized.includes(campoNorm) || campoNorm.includes(normalized)) {
        mapping[idx] = `campo:${campo.key}`;
        return;
      }
    }
  });
  
  return mapping;
}
