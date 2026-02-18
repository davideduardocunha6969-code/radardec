import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface AgendaEvento {
  id: string;
  user_id: string;
  tipo_evento_id: string | null;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  dia_inteiro: boolean;
  created_at: string;
  updated_at: string;
  agenda_tipos_evento?: {
    id: string;
    nome: string;
    cor: string;
    icone: string;
  } | null;
}

export function useAgendaEventos(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["agenda_eventos", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("agenda_eventos")
        .select("*, agenda_tipos_evento(id, nome, cor, icone)")
        .order("data_inicio");

      if (startDate) query = query.gte("data_inicio", startDate);
      if (endDate) query = query.lte("data_inicio", endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AgendaEvento[];
    },
  });
}

export function useCreateAgendaEvento() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (values: {
      titulo: string;
      descricao?: string;
      tipo_evento_id?: string;
      data_inicio: string;
      data_fim: string;
      dia_inteiro?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("agenda_eventos")
        .insert({ ...values, user_id: user!.id } as any)
        .select("*, agenda_tipos_evento(id, nome, cor, icone)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_eventos"] });
      toast.success("Evento criado!");
    },
    onError: (e: any) => toast.error("Erro ao criar evento: " + e.message),
  });
}

export function useUpdateAgendaEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: {
      id: string;
      titulo?: string;
      descricao?: string;
      tipo_evento_id?: string;
      data_inicio?: string;
      data_fim?: string;
      dia_inteiro?: boolean;
    }) => {
      const { error } = await supabase
        .from("agenda_eventos")
        .update(values as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_eventos"] });
      toast.success("Evento atualizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteAgendaEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agenda_eventos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_eventos"] });
      toast.success("Evento removido!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
