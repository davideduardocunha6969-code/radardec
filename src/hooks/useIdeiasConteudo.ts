import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Setor, Formato, ConteudoMidiaInput } from "./useConteudosMidia";

export type SituacaoIdeia = "pendente" | "validado";

export interface IdeiaConteudo {
  id: string;
  user_id: string;
  setor: Setor;
  formato: Formato;
  titulo: string;
  gancho: string | null;
  orientacoes_filmagem: string | null;
  copy_completa: string | null;
  link_inspiracao: string | null;
  link_video_drive: string | null;
  semana_publicacao: number | null;
  validado: boolean;
  validado_por: string | null;
  validado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeiaConteudoInput {
  setor: Setor;
  formato: Formato;
  titulo: string;
  gancho?: string;
  orientacoes_filmagem?: string;
  copy_completa?: string;
  link_inspiracao?: string;
  link_video_drive?: string;
  semana_publicacao?: number | null;
}

export const SITUACAO_LABELS: Record<SituacaoIdeia, string> = {
  pendente: "Pendente",
  validado: "Validado",
};

export const SITUACAO_COLORS: Record<SituacaoIdeia, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  validado: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function useIdeiasConteudo() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: ideias = [], isLoading, error } = useQuery({
    queryKey: ["ideias-conteudo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias_conteudo")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IdeiaConteudo[];
    },
    enabled: !!user,
  });

  const createIdeia = useMutation({
    mutationFn: async (input: IdeiaConteudoInput) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("ideias_conteudo")
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
      queryClient.invalidateQueries({ queryKey: ["ideias-conteudo"] });
      toast.success("Ideia criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar ideia:", error);
      toast.error("Erro ao criar ideia");
    },
  });

  const updateIdeia = useMutation({
    mutationFn: async ({ id, ...input }: Partial<IdeiaConteudoInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("ideias_conteudo")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideias-conteudo"] });
      toast.success("Ideia atualizada!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar ideia:", error);
      toast.error("Erro ao atualizar ideia");
    },
  });

  const deleteIdeia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ideias_conteudo")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideias-conteudo"] });
      toast.success("Ideia excluída!");
    },
    onError: (error) => {
      console.error("Erro ao excluir ideia:", error);
      toast.error("Erro ao excluir ideia");
    },
  });

  const validarIdeia = useMutation({
    mutationFn: async (ideia: IdeiaConteudo) => {
      if (!user) throw new Error("Usuário não autenticado");

      // First, create the content in conteudos_midia
      const conteudoInput: ConteudoMidiaInput = {
        setor: ideia.setor,
        formato: ideia.formato,
        titulo: ideia.titulo,
        gancho: ideia.gancho || undefined,
        orientacoes_filmagem: ideia.orientacoes_filmagem || undefined,
        copy_completa: ideia.copy_completa || undefined,
        link_inspiracao: ideia.link_inspiracao || undefined,
        link_video_drive: ideia.link_video_drive || undefined,
        semana_publicacao: ideia.semana_publicacao,
        status: "a_gravar",
      };

      const { error: insertError } = await supabase
        .from("conteudos_midia")
        .insert({
          ...conteudoInput,
          user_id: user.id,
        });

      if (insertError) throw insertError;

      // Then, update the ideia as validated
      const { data, error: updateError } = await supabase
        .from("ideias_conteudo")
        .update({
          validado: true,
          validado_por: user.id,
          validado_em: new Date().toISOString(),
        })
        .eq("id", ideia.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideias-conteudo"] });
      queryClient.invalidateQueries({ queryKey: ["conteudos-midia"] });
      toast.success("Ideia validada e enviada para o Calendário de Conteúdo!");
    },
    onError: (error) => {
      console.error("Erro ao validar ideia:", error);
      toast.error("Erro ao validar ideia");
    },
  });

  return {
    ideias,
    isLoading,
    error,
    createIdeia,
    updateIdeia,
    deleteIdeia,
    validarIdeia,
  };
}
