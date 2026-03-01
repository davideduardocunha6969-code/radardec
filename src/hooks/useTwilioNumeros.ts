import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TwilioNumero {
  id: string;
  numero: string;
  ddd: string;
  regiao: string | null;
  ativo: boolean;
  created_at: string;
}

export function useTwilioNumeros() {
  return useQuery({
    queryKey: ["twilio_numeros"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("twilio_numeros" as any)
        .select("*")
        .order("ddd", { ascending: true }) as any);
      if (error) throw error;
      return data as TwilioNumero[];
    },
  });
}

export function useCreateTwilioNumero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { numero: string; ddd: string; regiao?: string }) => {
      const { error } = await (supabase
        .from("twilio_numeros" as any)
        .insert(data) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["twilio_numeros"] });
      toast.success("Número cadastrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleTwilioNumero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await (supabase
        .from("twilio_numeros" as any)
        .update({ ativo })
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["twilio_numeros"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTwilioNumero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("twilio_numeros" as any)
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["twilio_numeros"] });
      toast.success("Número removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
