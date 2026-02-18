import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AgendaTipoEvento {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useAgendaTiposEvento() {
  return useQuery({
    queryKey: ["agenda_tipos_evento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_tipos_evento" as any)
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data as unknown as AgendaTipoEvento[];
    },
  });
}

export function useCreateAgendaTipoEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; cor: string; icone: string }) => {
      const { data, error } = await supabase
        .from("agenda_tipos_evento" as any)
        .insert(values as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_tipos_evento"] });
      toast.success("Tipo de evento criado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateAgendaTipoEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; nome?: string; cor?: string; icone?: string; ativo?: boolean; ordem?: number }) => {
      const { error } = await supabase
        .from("agenda_tipos_evento" as any)
        .update(values as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_tipos_evento"] });
      toast.success("Tipo atualizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteAgendaTipoEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agenda_tipos_evento" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda_tipos_evento"] });
      toast.success("Tipo removido!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
