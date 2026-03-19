import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type Prioridade = "emergencia" | "urgente" | "importante" | "util";

export const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  emergencia: "Emergência",
  urgente: "Urgente",
  importante: "Importante",
  util: "Útil",
};

export const PRIORIDADE_COLORS: Record<Prioridade, string> = {
  emergencia: "bg-red-500 text-white",
  urgente: "bg-orange-500 text-white",
  importante: "bg-yellow-500 text-black",
  util: "bg-blue-500 text-white",
};

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
}

export interface Coluna {
  id: string;
  nome: string;
  ordem: number;
  cor: string | null;
}

export interface Comentario {
  id: string;
  atividade_id: string;
  user_id: string;
  texto: string;
  created_at: string;
}

export interface Anexo {
  id: string;
  atividade_id: string;
  user_id: string;
  nome_arquivo: string;
  url: string;
  created_at: string;
}

export interface Atividade {
  id: string;
  user_id: string;
  responsavel_id: string | null;
  coluna_id: string | null;
  atividade: string;
  prazo_fatal: string | null;
  prioridade: Prioridade;
  ordem: number;
  created_at: string;
  updated_at: string;
  responsavel?: Profile | null;
  comentarios?: Comentario[];
  anexos?: Anexo[];
}

export interface AtividadeInsert {
  responsavel_id?: string | null;
  coluna_id: string;
  atividade: string;
  prazo_fatal?: string | null;
  prioridade: Prioridade;
}

export function useAtividadesMarketing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch profiles (users) as responsaveis
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name")
        .order("display_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch colunas
  const { data: colunas = [], isLoading: loadingColunas } = useQuery({
    queryKey: ["atividades-colunas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades_colunas")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data as Coluna[];
    },
  });

  // Fetch atividades with relations
  const { data: atividades = [], isLoading: loadingAtividades } = useQuery({
    queryKey: ["atividades-marketing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades_marketing")
        .select(`
          *,
          responsavel:profiles!atividades_marketing_responsavel_id_fkey(id, user_id, display_name)
        `)
        .order("ordem");
      if (error) throw error;
      return data as Atividade[];
    },
  });

  // Create atividade
  const createAtividade = useMutation({
    mutationFn: async (input: AtividadeInsert) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("atividades_marketing")
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
      queryClient.invalidateQueries({ queryKey: ["atividades-marketing"] });
      toast.success("Atividade criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar atividade: " + error.message);
    },
  });

  // Update atividade
  const updateAtividade = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Atividade> & { id: string }) => {
      // Remove the nested responsavel object before updating
      const { responsavel, comentarios, anexos, ...cleanUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from("atividades_marketing")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-marketing"] });
      toast.success("Atividade atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar atividade: " + error.message);
    },
  });

  // Delete atividade
  const deleteAtividade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("atividades_marketing")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-marketing"] });
      toast.success("Atividade excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir atividade: " + error.message);
    },
  });

  // Move atividade to different column
  const moveAtividade = useMutation({
    mutationFn: async ({ id, coluna_id }: { id: string; coluna_id: string }) => {
      const { error } = await supabase
        .from("atividades_marketing")
        .update({ coluna_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-marketing"] });
    },
    onError: (error) => {
      toast.error("Erro ao mover atividade: " + error.message);
    },
  });

  // Add coluna
  const addColuna = useMutation({
    mutationFn: async (nome: string) => {
      const maxOrdem = Math.max(...colunas.map((c) => c.ordem), -1);
      const { data, error } = await supabase
        .from("atividades_colunas")
        .insert({ nome, ordem: maxOrdem + 1 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-colunas"] });
      toast.success("Coluna adicionada!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar coluna: " + error.message);
    },
  });

  // Update coluna name
  const updateColuna = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("atividades_colunas")
        .update({ nome })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-colunas"] });
      toast.success("Coluna renomeada!");
    },
    onError: (error) => {
      toast.error("Erro ao renomear coluna: " + error.message);
    },
  });

  // Delete coluna
  const deleteColuna = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("atividades_colunas")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-colunas"] });
      queryClient.invalidateQueries({ queryKey: ["atividades-marketing"] });
      toast.success("Coluna excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir coluna: " + error.message);
    },
  });

  // Add comentario
  const addComentario = useMutation({
    mutationFn: async ({ atividade_id, texto }: { atividade_id: string; texto: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("atividades_comentarios")
        .insert({ atividade_id, texto, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividade-comentarios"] });
      toast.success("Comentário adicionado!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar comentário: " + error.message);
    },
  });

  // Fetch comentarios for an atividade
  const fetchComentarios = async (atividade_id: string) => {
    const { data, error } = await supabase
      .from("atividades_comentarios")
      .select("*")
      .eq("atividade_id", atividade_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Comentario[];
  };

  // Add anexo
  const addAnexo = useMutation({
    mutationFn: async ({ atividade_id, file }: { atividade_id: string; file: File }) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const filePath = `${atividade_id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("atividades-anexos")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("atividades-anexos")
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from("atividades_anexos")
        .insert({
          atividade_id,
          user_id: user.id,
          nome_arquivo: file.name,
          url: urlData.publicUrl,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividade-anexos"] });
      toast.success("Anexo adicionado!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar anexo: " + error.message);
    },
  });

  // Fetch anexos for an atividade
  const fetchAnexos = async (atividade_id: string) => {
    const { data, error } = await supabase
      .from("atividades_anexos")
      .select("*")
      .eq("atividade_id", atividade_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Anexo[];
  };

  // Delete anexo
  const deleteAnexo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("atividades_anexos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividade-anexos"] });
      toast.success("Anexo removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover anexo: " + error.message);
    },
  });

  return {
    profiles,
    colunas,
    atividades,
    isLoading: loadingProfiles || loadingColunas || loadingAtividades,
    createAtividade,
    updateAtividade,
    deleteAtividade,
    moveAtividade,
    addColuna,
    deleteColuna,
    addComentario,
    fetchComentarios,
    addAnexo,
    fetchAnexos,
    deleteAnexo,
  };
}
