import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IaEscritorio {
  id: string;
  sobre: string | null;
  areas_atuacao: string | null;
  diferenciais: string | null;
  metas_ano: string | null;
  valores: string | null;
  historico: string | null;
  created_at: string;
  updated_at: string;
}

export function useIaEscritorio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: escritorio, isLoading, error } = useQuery({
    queryKey: ["ia-escritorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ia_escritorio")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as IaEscritorio;
    },
  });

  const updateEscritorio = useMutation({
    mutationFn: async (updates: Partial<Omit<IaEscritorio, "id" | "created_at" | "updated_at">>) => {
      if (!escritorio?.id) throw new Error("Escritório não encontrado");
      
      const { data, error } = await supabase
        .from("ia_escritorio")
        .update(updates)
        .eq("id", escritorio.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ia-escritorio"] });
      toast({
        title: "Informações salvas",
        description: "Os dados do escritório foram atualizados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    escritorio,
    isLoading,
    error,
    updateEscritorio,
  };
}
