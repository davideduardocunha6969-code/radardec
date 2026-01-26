import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ColunaDescricao {
  letra: string;
  nome: string;
  descricao: string;
}

export interface IaDataContext {
  id: string;
  tipo: "planilha" | "aba";
  planilha_key: string;
  gid: string | null;
  nome: string;
  descricao: string | null;
  colunas: ColunaDescricao[];
  created_at: string;
  updated_at: string;
}

export function useIaDataContext() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contexts, isLoading, error } = useQuery({
    queryKey: ["ia-data-context"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ia_data_context")
        .select("*")
        .order("planilha_key", { ascending: true })
        .order("gid", { ascending: true, nullsFirst: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        ...item,
        tipo: item.tipo as "planilha" | "aba",
        colunas: (Array.isArray(item.colunas) ? item.colunas : []) as unknown as ColunaDescricao[],
      })) as IaDataContext[];
    },
  });

  const upsertContext = useMutation({
    mutationFn: async (context: Omit<IaDataContext, "id" | "created_at" | "updated_at">) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        tipo: context.tipo,
        planilha_key: context.planilha_key,
        gid: context.gid,
        nome: context.nome,
        descricao: context.descricao,
        colunas: context.colunas,
      };
      
      const { data, error } = await supabase
        .from("ia_data_context")
        .upsert(payload, { onConflict: "planilha_key,gid" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ia-data-context"] });
      toast({
        title: "Contexto salvo",
        description: "As informações foram salvas com sucesso.",
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

  const deleteContext = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ia_data_context")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ia-data-context"] });
      toast({
        title: "Contexto removido",
        description: "O contexto foi removido com sucesso.",
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
    contexts,
    isLoading,
    error,
    upsertContext,
    deleteContext,
  };
}
