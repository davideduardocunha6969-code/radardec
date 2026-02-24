import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RoboCoach {
  id: string;
  nome: string;
  descricao: string | null;
  instrucoes: string;
  instrucoes_reca: string;
  instrucoes_raloca: string;
  instrucoes_radoveca: string;
  instrucoes_noshow: string;
  ativo: boolean;
  tipo: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useRobosCoach() {
  return useQuery({
    queryKey: ["robos_coach"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("robos_coach" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as RoboCoach[];
    },
  });
}

export function useRobosCoachAtivos() {
  return useQuery({
    queryKey: ["robos_coach", "ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("robos_coach" as any)
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as unknown as RoboCoach[];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRoboCoach() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; instrucoes: string; tipo?: string }) => {
      const { data: result, error } = await supabase
        .from("robos_coach" as any)
        .insert({ ...data, tipo: data.tipo || "coaching", user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return result as unknown as RoboCoach;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["robos_coach"] });
      toast.success("Robô Coach criado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateRoboCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; nome?: string; descricao?: string; instrucoes?: string; instrucoes_reca?: string; instrucoes_raloca?: string; instrucoes_radoveca?: string; instrucoes_noshow?: string; ativo?: boolean }) => {
      const { id, ...rest } = data;
      const { error } = await supabase
        .from("robos_coach" as any)
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["robos_coach"] });
      toast.success("Robô Coach atualizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteRoboCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("robos_coach" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["robos_coach"] });
      toast.success("Robô Coach excluído!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
