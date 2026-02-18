import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface HorarioTrabalho {
  id: string;
  user_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

interface Indisponibilidade {
  id: string;
  user_id: string;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  dia_inteiro: boolean;
  motivo: string | null;
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function useHorarioTrabalho() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["horario_trabalho", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_horario_trabalho")
        .select("*")
        .eq("user_id", user!.id)
        .order("dia_semana");
      if (error) throw error;
      return data as HorarioTrabalho[];
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (items: Partial<HorarioTrabalho>[]) => {
      const rows = items.map(item => ({
        ...item,
        user_id: user!.id,
      }));
      const { error } = await supabase
        .from("user_horario_trabalho")
        .upsert(rows as any, { onConflict: "user_id,dia_semana" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horario_trabalho"] });
      toast.success("Horário de trabalho salvo!");
    },
    onError: () => toast.error("Erro ao salvar horário"),
  });

  return { ...query, upsert };
}

export function useIndisponibilidades() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["indisponibilidades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_indisponibilidades")
        .select("*")
        .eq("user_id", user!.id)
        .order("data", { ascending: true });
      if (error) throw error;
      return data as Indisponibilidade[];
    },
    enabled: !!user,
  });

  const addBatch = useMutation({
    mutationFn: async (items: Omit<Indisponibilidade, "id" | "user_id">[]) => {
      const rows = items.map(item => ({
        ...item,
        user_id: user!.id,
      }));
      const { error } = await supabase
        .from("user_indisponibilidades")
        .insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indisponibilidades"] });
      toast.success("Indisponibilidades adicionadas!");
    },
    onError: () => toast.error("Erro ao adicionar indisponibilidades"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_indisponibilidades")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indisponibilidades"] });
      toast.success("Indisponibilidade removida!");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_indisponibilidades")
        .delete()
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indisponibilidades"] });
      toast.success("Todas as indisponibilidades removidas!");
    },
    onError: () => toast.error("Erro ao limpar"),
  });

  return { ...query, addBatch, remove, clearAll };
}

export { DIAS_SEMANA };
export type { HorarioTrabalho, Indisponibilidade };
