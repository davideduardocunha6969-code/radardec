import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IaProfile {
  id: string;
  nome: string;
  descricao: string | null;
  persona: string;
  forma_pensar: string;
  formato_resposta: string;
  regras: string;
  postura: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useIaProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["ia-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ia_profile")
        .select("*")
        .eq("ativo", true)
        .single();

      if (error) throw error;
      return data as IaProfile;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<IaProfile> & { id: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from("ia_profile")
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ia-profile"] });
      toast({
        title: "Perfil atualizado",
        description: "As configurações da IA foram salvas com sucesso.",
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

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}
