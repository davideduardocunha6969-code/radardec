import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CrmFunil {
  id: string;
  nome: string;
  area_atuacao: string;
  tipo_acao: string | null;
  descricao: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  script_sdr_id: string | null;
  robo_coach_sdr_id: string | null;
  robo_feedback_sdr_id: string | null;
  script_closer_id: string | null;
  robo_coach_closer_id: string | null;
  robo_feedback_closer_id: string | null;
}

export interface CrmColuna {
  id: string;
  funil_id: string;
  nome: string;
  cor: string | null;
  ordem: number;
  robo_coach_id: string | null;
  robo_feedback_id: string | null;
  script_sdr_id: string | null;
  robo_coach_closer_id: string | null;
  robo_feedback_closer_id: string | null;
  script_closer_id: string | null;
  created_at: string;
}

export interface LeadTelefone {
  numero: string;
  tipo: string;
  observacao?: string;
}

export interface CrmLead {
  id: string;
  funil_id: string;
  coluna_id: string;
  nome: string;
  endereco: string | null;
  telefones: LeadTelefone[];
  resumo_caso: string | null;
  resumo_ia_contatos: string | null;
  etapa_desde: string | null;
  ultimo_contato_em: string | null;
  dados_extras: Record<string, unknown>;
  ordem: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useCrmFunis() {
  return useQuery({
    queryKey: ["crm_funis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_funis")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CrmFunil[];
    },
    refetchOnWindowFocus: false,
  });
}

export function useCrmColunas(funilId: string | undefined) {
  return useQuery({
    queryKey: ["crm_colunas", funilId],
    queryFn: async () => {
      if (!funilId) return [];
      const { data, error } = await supabase
        .from("crm_colunas")
        .select("*")
        .eq("funil_id", funilId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as CrmColuna[];
    },
    enabled: !!funilId,
    refetchOnWindowFocus: false,
  });
}

export function useCrmLeads(funilId: string | undefined) {
  return useQuery({
    queryKey: ["crm_leads", funilId],
    queryFn: async () => {
      if (!funilId) return [];
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("funil_id", funilId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data as unknown as CrmLead[]).map((lead) => ({
        ...lead,
        telefones: Array.isArray(lead.telefones) ? lead.telefones : [],
        dados_extras: lead.dados_extras || {},
      }));
    },
    enabled: !!funilId,
    refetchOnWindowFocus: false,
  });
}

export function useCreateFunil() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: { nome: string; area_atuacao: string; tipo_acao?: string; descricao?: string }) => {
      const { error } = await supabase.from("crm_funis").insert({
        ...data,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_funis"] });
      toast.success("Funil criado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; script_sdr_id?: string | null; robo_coach_sdr_id?: string | null; robo_feedback_sdr_id?: string | null; script_closer_id?: string | null; robo_coach_closer_id?: string | null; robo_feedback_closer_id?: string | null }) => {
      const { error } = await supabase.from("crm_funis").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_funis"] });
      toast.success("Configurações do funil salvas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_funis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_funis"] });
      toast.success("Funil excluído!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateColuna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { funil_id: string; nome: string; cor?: string; ordem: number }) => {
      const { error } = await supabase.from("crm_colunas").insert(data);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["crm_colunas", vars.funil_id] });
      toast.success("Coluna criada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateColuna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, funilId, ...data }: { id: string; funilId: string; nome?: string; cor?: string; robo_coach_id?: string | null; robo_feedback_id?: string | null; script_sdr_id?: string | null; robo_coach_closer_id?: string | null; robo_feedback_closer_id?: string | null; script_closer_id?: string | null }) => {
      const { error } = await supabase.from("crm_colunas").update(data).eq("id", id);
      if (error) throw error;
      return funilId;
    },
    onSuccess: (funilId) => {
      queryClient.invalidateQueries({ queryKey: ["crm_colunas", funilId] });
      toast.success("Coluna atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReorderColunas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ funilId, ordens }: { funilId: string; ordens: { id: string; ordem: number }[] }) => {
      const promises = ordens.map(({ id, ordem }) =>
        supabase.from("crm_colunas").update({ ordem }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
      return funilId;
    },
    onSuccess: (funilId) => {
      queryClient.invalidateQueries({ queryKey: ["crm_colunas", funilId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteColuna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, funilId }: { id: string; funilId: string }) => {
      const { error } = await supabase.from("crm_colunas").delete().eq("id", id);
      if (error) throw error;
      return funilId;
    },
    onSuccess: (funilId) => {
      queryClient.invalidateQueries({ queryKey: ["crm_colunas", funilId] });
      toast.success("Coluna excluída!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async (data: { funil_id: string; coluna_id: string; nome: string; endereco?: string; telefones: LeadTelefone[]; dados_extras?: Record<string, unknown> }) => {
      const { error } = await supabase.from("crm_leads").insert({
        funil_id: data.funil_id,
        coluna_id: data.coluna_id,
        nome: data.nome,
        endereco: data.endereco || null,
        telefones: JSON.parse(JSON.stringify(data.telefones)),
        dados_extras: JSON.parse(JSON.stringify(data.dados_extras || {})),
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads", vars.funil_id] });
      toast.success("Lead adicionado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
  mutationFn: async ({ id, funilId, ...data }: { id: string; funilId: string; coluna_id?: string; ordem?: number; resumo_caso?: string; nome?: string; endereco?: string; telefones?: LeadTelefone[] }) => {
      const updateData: Record<string, unknown> = { ...data };
      delete updateData.funilId;
      if (data.coluna_id) {
        updateData.etapa_desde = new Date().toISOString();
      }
      if (data.telefones) {
        updateData.telefones = data.telefones as unknown as Record<string, unknown>[];
      }
      const { error } = await supabase.from("crm_leads").update(updateData).eq("id", id);
      if (error) throw error;
      return funilId;
    },
    onSuccess: (funilId) => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads", funilId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, funilId }: { id: string; funilId: string }) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
      return funilId;
    },
    onSuccess: (funilId) => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads", funilId] });
      toast.success("Lead excluído!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkCreateLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ funilId, colunaId, leads }: { funilId: string; colunaId: string; leads: { nome: string; endereco?: string; telefones: LeadTelefone[]; dados_extras?: Record<string, string> }[] }) => {
      const leadsData = leads.map((l, i) => ({
        funil_id: funilId,
        coluna_id: colunaId,
        nome: l.nome,
        endereco: l.endereco || null,
        telefones: l.telefones,
        dados_extras: l.dados_extras || {},
        ordem: i,
      }));
      const { data, error } = await supabase.rpc("bulk_insert_leads", {
        leads_data: JSON.parse(JSON.stringify(leadsData)),
      });
      if (error) throw error;
      return { funilId, count: data as number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads", result.funilId] });
      toast.success(`${result.count} leads importados com sucesso!`);
    },
    onError: (e: Error) => {
      toast.error("Nenhum lead foi importado. Corrija o problema e tente novamente.");
      console.error("Bulk insert error:", e.message);
    },
  });
}
