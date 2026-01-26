import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IaOrganograma {
  id: string;
  nome: string;
  cargo: string;
  setor: string | null;
  funcao: string | null;
  subordinado_a: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useIaOrganograma() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membros, isLoading, error } = useQuery({
    queryKey: ["ia-organograma"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ia_organograma")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as IaOrganograma[];
    },
  });

  const createMembro = useMutation({
    mutationFn: async (membro: Omit<IaOrganograma, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ia_organograma")
        .insert(membro)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ia-organograma"] });
      toast({
        title: "Membro adicionado",
        description: "O membro foi adicionado ao organograma.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMembro = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IaOrganograma> & { id: string }) => {
      const { data, error } = await supabase
        .from("ia_organograma")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ia-organograma"] });
      toast({
        title: "Membro atualizado",
        description: "As informações foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMembro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ia_organograma")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ia-organograma"] });
      toast({
        title: "Membro removido",
        description: "O membro foi removido do organograma.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    membros,
    isLoading,
    error,
    createMembro,
    updateMembro,
    deleteMembro,
  };
}
