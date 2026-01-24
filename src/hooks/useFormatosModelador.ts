import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FormatoOrigem {
  id: string;
  key: string;
  nome: string;
  descricao: string | null;
  icone: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormatoSaida {
  id: string;
  key: string;
  nome: string;
  descricao: string | null;
  icone: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFormatoParams {
  key: string;
  nome: string;
  descricao?: string;
  icone: string;
  cor: string;
  ordem?: number;
}

export interface UpdateFormatoParams {
  id: string;
  key?: string;
  nome?: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  ordem?: number;
  ativo?: boolean;
}

export function useFormatosModelador() {
  const [formatosOrigem, setFormatosOrigem] = useState<FormatoOrigem[]>([]);
  const [formatosSaida, setFormatosSaida] = useState<FormatoSaida[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFormatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [origemRes, saidaRes] = await Promise.all([
        supabase
          .from("formatos_origem")
          .select("*")
          .eq("ativo", true)
          .order("ordem"),
        supabase
          .from("formatos_saida")
          .select("*")
          .eq("ativo", true)
          .order("ordem"),
      ]);

      if (origemRes.error) throw origemRes.error;
      if (saidaRes.error) throw saidaRes.error;

      setFormatosOrigem(origemRes.data || []);
      setFormatosSaida(saidaRes.data || []);
    } catch (error: any) {
      console.error("Error fetching formatos:", error);
      toast({
        title: "Erro ao carregar formatos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch all formatos including inactive ones (for admin)
  const fetchAllFormatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [origemRes, saidaRes] = await Promise.all([
        supabase
          .from("formatos_origem")
          .select("*")
          .order("ordem"),
        supabase
          .from("formatos_saida")
          .select("*")
          .order("ordem"),
      ]);

      if (origemRes.error) throw origemRes.error;
      if (saidaRes.error) throw saidaRes.error;

      setFormatosOrigem(origemRes.data || []);
      setFormatosSaida(saidaRes.data || []);
    } catch (error: any) {
      console.error("Error fetching formatos:", error);
      toast({
        title: "Erro ao carregar formatos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createFormatoOrigem = useCallback(
    async (params: CreateFormatoParams) => {
      try {
        const { data, error } = await supabase
          .from("formatos_origem")
          .insert({
            key: params.key,
            nome: params.nome,
            descricao: params.descricao || null,
            icone: params.icone,
            cor: params.cor,
            ordem: params.ordem ?? 0,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Formato de origem criado",
          description: `O formato "${params.nome}" foi criado com sucesso.`,
        });

        await fetchFormatos();
        return data;
      } catch (error: any) {
        console.error("Error creating formato origem:", error);
        toast({
          title: "Erro ao criar formato",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast, fetchFormatos]
  );

  const createFormatoSaida = useCallback(
    async (params: CreateFormatoParams) => {
      try {
        const { data, error } = await supabase
          .from("formatos_saida")
          .insert({
            key: params.key,
            nome: params.nome,
            descricao: params.descricao || null,
            icone: params.icone,
            cor: params.cor,
            ordem: params.ordem ?? 0,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Formato de saída criado",
          description: `O formato "${params.nome}" foi criado com sucesso.`,
        });

        await fetchFormatos();
        return data;
      } catch (error: any) {
        console.error("Error creating formato saida:", error);
        toast({
          title: "Erro ao criar formato",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast, fetchFormatos]
  );

  const updateFormatoOrigem = useCallback(
    async (params: UpdateFormatoParams) => {
      try {
        const { id, ...updates } = params;
        const { error } = await supabase
          .from("formatos_origem")
          .update(updates)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Formato atualizado",
          description: "O formato foi atualizado com sucesso.",
        });

        await fetchFormatos();
        return true;
      } catch (error: any) {
        console.error("Error updating formato origem:", error);
        toast({
          title: "Erro ao atualizar formato",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchFormatos]
  );

  const updateFormatoSaida = useCallback(
    async (params: UpdateFormatoParams) => {
      try {
        const { id, ...updates } = params;
        const { error } = await supabase
          .from("formatos_saida")
          .update(updates)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Formato atualizado",
          description: "O formato foi atualizado com sucesso.",
        });

        await fetchFormatos();
        return true;
      } catch (error: any) {
        console.error("Error updating formato saida:", error);
        toast({
          title: "Erro ao atualizar formato",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchFormatos]
  );

  const deleteFormatoOrigem = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("formatos_origem")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Formato excluído",
          description: "O formato foi excluído com sucesso.",
        });

        await fetchFormatos();
        return true;
      } catch (error: any) {
        console.error("Error deleting formato origem:", error);
        toast({
          title: "Erro ao excluir formato",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchFormatos]
  );

  const deleteFormatoSaida = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("formatos_saida")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Formato excluído",
          description: "O formato foi excluído com sucesso.",
        });

        await fetchFormatos();
        return true;
      } catch (error: any) {
        console.error("Error deleting formato saida:", error);
        toast({
          title: "Erro ao excluir formato",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchFormatos]
  );

  useEffect(() => {
    fetchFormatos();
  }, [fetchFormatos]);

  return {
    formatosOrigem,
    formatosSaida,
    isLoading,
    fetchFormatos,
    fetchAllFormatos,
    createFormatoOrigem,
    createFormatoSaida,
    updateFormatoOrigem,
    updateFormatoSaida,
    deleteFormatoOrigem,
    deleteFormatoSaida,
  };
}
