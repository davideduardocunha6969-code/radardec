import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AiPrompt {
  id: string;
  nome: string;
  prompt: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function useAiPrompts() {
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .order("nome");

      if (error) throw error;
      setPrompts(data || []);
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
  }, [toast]);

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
    [toast, fetchPrompts]
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
    updatePrompt,
    deletePrompt,
  };
}
