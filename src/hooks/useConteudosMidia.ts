import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Setor = "trabalhista" | "previdenciario" | "civel" | "bancario";
export type Formato = "video" | "video_longo" | "carrossel" | "estatico";
export type Status = "a_gravar" | "gravado" | "em_edicao" | "editado" | "postado";

export interface ConteudoMidia {
  id: string;
  user_id: string;
  setor: Setor;
  formato: Formato;
  titulo: string;
  gancho: string | null;
  orientacoes_filmagem: string | null;
  copy_completa: string | null;
  link_inspiracao: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface ConteudoMidiaInput {
  setor: Setor;
  formato: Formato;
  titulo: string;
  gancho?: string;
  orientacoes_filmagem?: string;
  copy_completa?: string;
  link_inspiracao?: string;
  status?: Status;
}

export const SETOR_LABELS: Record<Setor, string> = {
  trabalhista: "Trabalhista",
  previdenciario: "Previdenciário",
  civel: "Cível",
  bancario: "Bancário",
};

export const FORMATO_LABELS: Record<Formato, string> = {
  video: "Vídeo",
  video_longo: "Vídeo Longo",
  carrossel: "Carrossel",
  estatico: "Estático",
};

export const STATUS_LABELS: Record<Status, string> = {
  a_gravar: "A Gravar",
  gravado: "Gravado",
  em_edicao: "Em Edição",
  editado: "Editado",
  postado: "Postado",
};

export const STATUS_COLORS: Record<Status, string> = {
  a_gravar: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  gravado: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  em_edicao: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  editado: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  postado: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function useConteudosMidia() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: conteudos = [], isLoading, error } = useQuery({
    queryKey: ["conteudos-midia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conteudos_midia")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ConteudoMidia[];
    },
    enabled: !!user,
  });

  const createConteudo = useMutation({
    mutationFn: async (input: ConteudoMidiaInput) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("conteudos_midia")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudos-midia"] });
      toast.success("Conteúdo criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar conteúdo:", error);
      toast.error("Erro ao criar conteúdo");
    },
  });

  const updateConteudo = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ConteudoMidiaInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("conteudos_midia")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudos-midia"] });
      toast.success("Conteúdo atualizado!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar conteúdo:", error);
      toast.error("Erro ao atualizar conteúdo");
    },
  });

  const deleteConteudo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("conteudos_midia")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudos-midia"] });
      toast.success("Conteúdo excluído!");
    },
    onError: (error) => {
      console.error("Erro ao excluir conteúdo:", error);
      toast.error("Erro ao excluir conteúdo");
    },
  });

  return {
    conteudos,
    isLoading,
    error,
    createConteudo,
    updateConteudo,
    deleteConteudo,
  };
}
