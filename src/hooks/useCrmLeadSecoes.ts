import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CrmLeadSecao {
  id: string;
  nome: string;
  ordem: number;
  created_at: string;
}

export function useCrmLeadSecoes() {
  return useQuery({
    queryKey: ["crm_lead_secoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_lead_secoes" as any)
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as unknown as CrmLeadSecao[];
    },
    refetchOnWindowFocus: false,
  });
}

export function useCreateCrmLeadSecao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; ordem?: number }) => {
      const { error } = await supabase
        .from("crm_lead_secoes" as any)
        .insert({ nome: data.nome, ordem: data.ordem ?? 99 } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_secoes"] });
      toast.success("Seção criada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCrmLeadSecao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome?: string; ordem?: number }) => {
      const { error } = await supabase
        .from("crm_lead_secoes" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_secoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCrmLeadSecao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_lead_secoes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_secoes"] });
      toast.success("Seção excluída!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCampoSecao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campoId, secaoId }: { campoId: string; secaoId: string | null }) => {
      const { error } = await supabase
        .from("crm_lead_campos" as any)
        .update({ secao_id: secaoId } as any)
        .eq("id", campoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_campos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
