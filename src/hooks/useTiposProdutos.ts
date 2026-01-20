import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Setor = "trabalhista" | "previdenciario" | "civel" | "bancario";

export interface TipoProduto {
  id: string;
  nome: string;
  descricao: string | null;
  setor: Setor;
  caracteristicas: string | null;
  perfil_cliente_ideal: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TipoProdutoInput {
  nome: string;
  descricao?: string;
  setor: Setor;
  caracteristicas?: string;
  perfil_cliente_ideal?: string;
}

export const SETOR_LABELS: Record<Setor, string> = {
  trabalhista: "Trabalhista",
  previdenciario: "Previdenciário",
  civel: "Cível",
  bancario: "Bancário",
};

export const SETOR_COLORS: Record<Setor, string> = {
  trabalhista: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  previdenciario: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  civel: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  bancario: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export function useTiposProdutos() {
  const queryClient = useQueryClient();

  const {
    data: produtos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tipos_produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_produtos")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as TipoProduto[];
    },
  });

  const createProduto = useMutation({
    mutationFn: async (input: TipoProdutoInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("tipos_produtos")
        .insert({
          ...input,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_produtos"] });
      toast.success("Tipo de produto criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar tipo de produto: " + error.message);
    },
  });

  const updateProduto = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: TipoProdutoInput & { id: string }) => {
      const { data, error } = await supabase
        .from("tipos_produtos")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_produtos"] });
      toast.success("Tipo de produto atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tipo de produto: " + error.message);
    },
  });

  const deleteProduto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_produtos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_produtos"] });
      toast.success("Tipo de produto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir tipo de produto: " + error.message);
    },
  });

  return {
    produtos,
    isLoading,
    error,
    createProduto,
    updateProduto,
    deleteProduto,
  };
}
