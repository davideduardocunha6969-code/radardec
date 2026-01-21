import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PromptTipo = "transcricao" | "modelador";

export interface AiPrompt {
  id: string;
  nome: string;
  prompt: string;
  descricao: string | null;
  tipo: PromptTipo;
  formato_origem: string | null;
  formato_saida: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreatePromptParams {
  nome: string;
  prompt: string;
  descricao?: string;
  formato_origem?: string;
  formato_saida?: string;
}

export interface UpdatePromptParams {
  id: string;
  nome: string;
  prompt: string;
  descricao?: string;
  formato_origem?: string;
  formato_saida?: string;
}

export function useAiPrompts(tipo: PromptTipo = "transcricao") {
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("tipo", tipo)
        .order("nome");

      if (error) throw error;
      setPrompts((data as AiPrompt[]) || []);
    } catch (error: any) {
      console.error("Error fetching prompts:", error);
      toast({
        title: "Erro ao carregar prompts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, tipo]);

  const createPrompt = useCallback(
    async (nome: string, prompt: string, descricao?: string) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Usuário não autenticado");

        const { data, error } = await supabase
          .from("ai_prompts")
          .insert({
            nome,
            prompt,
            descricao: descricao || null,
            tipo,
            user_id: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Prompt criado",
          description: `O prompt "${nome}" foi criado com sucesso.`,
        });

        await fetchPrompts();
        return data;
      } catch (error: any) {
        console.error("Error creating prompt:", error);
        toast({
          title: "Erro ao criar prompt",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast, fetchPrompts, tipo]
  );

  // New method for creating prompts with format combinations
  const createPromptWithFormats = useCallback(
    async (params: CreatePromptParams) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Usuário não autenticado");

        const { data, error } = await supabase
          .from("ai_prompts")
          .insert({
            nome: params.nome,
            prompt: params.prompt,
            descricao: params.descricao || null,
            formato_origem: params.formato_origem || null,
            formato_saida: params.formato_saida || null,
            tipo,
            user_id: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Prompt criado",
          description: `O prompt "${params.nome}" foi criado com sucesso.`,
        });

        await fetchPrompts();
        return data;
      } catch (error: any) {
        console.error("Error creating prompt:", error);
        toast({
          title: "Erro ao criar prompt",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast, fetchPrompts, tipo]
  );

  const updatePrompt = useCallback(
    async (id: string, nome: string, prompt: string, descricao?: string) => {
      try {
        const { error } = await supabase
          .from("ai_prompts")
          .update({
            nome,
            prompt,
            descricao: descricao || null,
          })
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Prompt atualizado",
          description: `O prompt "${nome}" foi atualizado.`,
        });

        await fetchPrompts();
        return true;
      } catch (error: any) {
        console.error("Error updating prompt:", error);
        toast({
          title: "Erro ao atualizar prompt",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchPrompts]
  );

  // New method for updating prompts with format combinations
  const updatePromptWithFormats = useCallback(
    async (params: UpdatePromptParams) => {
      try {
        const { error } = await supabase
          .from("ai_prompts")
          .update({
            nome: params.nome,
            prompt: params.prompt,
            descricao: params.descricao || null,
            formato_origem: params.formato_origem || null,
            formato_saida: params.formato_saida || null,
          })
          .eq("id", params.id);

        if (error) throw error;

        toast({
          title: "Prompt atualizado",
          description: `O prompt "${params.nome}" foi atualizado.`,
        });

        await fetchPrompts();
        return true;
      } catch (error: any) {
        console.error("Error updating prompt:", error);
        toast({
          title: "Erro ao atualizar prompt",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchPrompts]
  );

  // Find prompt by format combination
  const findPromptByFormats = useCallback(
    (formatoOrigem: string, formatoSaida: string): AiPrompt | null => {
      return prompts.find(
        (p) => p.formato_origem === formatoOrigem && p.formato_saida === formatoSaida
      ) || null;
    },
    [prompts]
  );

  const deletePrompt = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("ai_prompts").delete().eq("id", id);

        if (error) throw error;

        toast({
          title: "Prompt excluído",
          description: "O prompt foi excluído com sucesso.",
        });

        await fetchPrompts();
        return true;
      } catch (error: any) {
        console.error("Error deleting prompt:", error);
        toast({
          title: "Erro ao excluir prompt",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchPrompts]
  );

  return {
    prompts,
    isLoading,
    fetchPrompts,
    createPrompt,
    createPromptWithFormats,
    updatePrompt,
    updatePromptWithFormats,
    findPromptByFormats,
    deletePrompt,
  };
}
