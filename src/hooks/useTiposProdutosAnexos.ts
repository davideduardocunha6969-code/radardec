import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TipoProdutoAnexo {
  id: string;
  tipo_produto_id: string;
  user_id: string;
  nome_arquivo: string;
  url: string;
  tipo_arquivo: string | null;
  tamanho_bytes: number | null;
  created_at: string;
}

export function useTiposProdutosAnexos(tipoProdutoId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: anexos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tipos_produtos_anexos", tipoProdutoId],
    queryFn: async () => {
      if (!tipoProdutoId) return [];
      
      const { data, error } = await supabase
        .from("tipos_produtos_anexos")
        .select("*")
        .eq("tipo_produto_id", tipoProdutoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TipoProdutoAnexo[];
    },
    enabled: !!tipoProdutoId,
  });

  const uploadAnexo = useMutation({
    mutationFn: async ({
      tipoProdutoId,
      file,
    }: {
      tipoProdutoId: string;
      file: File;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${tipoProdutoId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("tipos-produtos-anexos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("tipos-produtos-anexos")
        .getPublicUrl(fileName);

      // Save record to database
      const { data, error } = await supabase
        .from("tipos_produtos_anexos")
        .insert({
          tipo_produto_id: tipoProdutoId,
          user_id: userData.user.id,
          nome_arquivo: file.name,
          url: urlData.publicUrl,
          tipo_arquivo: file.type,
          tamanho_bytes: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_produtos_anexos", tipoProdutoId] });
      toast.success("Arquivo anexado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao anexar arquivo: " + error.message);
    },
  });

  const deleteAnexo = useMutation({
    mutationFn: async (anexo: TipoProdutoAnexo) => {
      // Extract path from URL
      const urlParts = anexo.url.split("/tipos-produtos-anexos/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from("tipos-produtos-anexos")
          .remove([filePath]);
      }

      const { error } = await supabase
        .from("tipos_produtos_anexos")
        .delete()
        .eq("id", anexo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_produtos_anexos", tipoProdutoId] });
      toast.success("Arquivo removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover arquivo: " + error.message);
    },
  });

  return {
    anexos,
    isLoading,
    error,
    uploadAnexo,
    deleteAnexo,
  };
}
