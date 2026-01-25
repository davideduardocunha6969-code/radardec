import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Segmento {
  falante: string;
  texto: string;
  inicio: number;
  fim: number;
}

export interface AnaliseIA {
  id: string;
  prompt_nome: string;
  resposta: string;
  created_at: string;
}

export interface Atendimento {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  data_atendimento: string;
  duracao_segundos: number | null;
  audio_url: string | null;
  transcricao_texto: string | null;
  segmentos: Segmento[];
  status: "pendente" | "gravando" | "processando" | "concluido" | "erro";
  erro_mensagem: string | null;
  dados_cliente: Record<string, unknown>;
  dados_atendimento: Record<string, unknown>;
  analises_ia: AnaliseIA[];
}

export function useAtendimentosClosers() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  const fetchAtendimentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("atendimentos_closers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map((a) => ({
        ...a,
        segmentos: (a.segmentos as unknown as Segmento[]) || [],
        analises_ia: (a.analises_ia as unknown as AnaliseIA[]) || [],
        dados_cliente: (a.dados_cliente as Record<string, unknown>) || {},
        dados_atendimento: (a.dados_atendimento as Record<string, unknown>) || {},
        status: a.status as Atendimento["status"],
      }));

      setAtendimentos(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar atendimentos";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createAtendimento = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from("atendimentos_closers")
        .insert({
          user_id: user.id,
          status: "pendente",
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar atendimento";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateAtendimento = useCallback(async (
    id: string, 
    updates: {
      data_atendimento?: string;
      duracao_segundos?: number | null;
      audio_url?: string | null;
      transcricao_texto?: string | null;
      segmentos?: Segmento[];
      status?: "pendente" | "gravando" | "processando" | "concluido" | "erro";
      erro_mensagem?: string | null;
      dados_cliente?: Record<string, unknown>;
      dados_atendimento?: Record<string, unknown>;
    }
  ): Promise<boolean> => {
    try {
      // Convert updates to database-compatible format
      const dbUpdates: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("atendimentos_closers")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar atendimento";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const uploadAudio = useCallback(async (
    atendimentoId: string, 
    audioBlob: Blob
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileName = `${user.id}/${atendimentoId}_${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from("atendimentos-audio")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("atendimentos-audio")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao fazer upload do áudio";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const transcribeAudio = useCallback(async (
    atendimentoId: string, 
    audioBlob: Blob
  ): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      // Update status to processing
      await updateAtendimento(atendimentoId, { status: "processando" as const });

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("titulo", "Atendimento Closer");
      formData.append("transcricao_id", atendimentoId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao transcrever áudio");
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Erro ao transcrever áudio");
      }

      // Update atendimento with transcription
      await updateAtendimento(atendimentoId, {
        transcricao_texto: result.texto_completo,
        segmentos: result.segmentos,
        duracao_segundos: result.duracao_segundos,
        status: "concluido" as const,
      });

      toast({
        title: "Transcrição concluída!",
        description: "A chamada foi transcrita com sucesso.",
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao transcrever";
      await updateAtendimento(atendimentoId, { 
        status: "erro" as const, 
        erro_mensagem: message 
      });
      toast({
        title: "Erro na transcrição",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, updateAtendimento]);

  const deleteAtendimento = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("atendimentos_closers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Atendimento excluído",
        description: "O atendimento foi removido com sucesso.",
      });

      await fetchAtendimentos();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchAtendimentos]);

  return {
    atendimentos,
    isLoading,
    fetchAtendimentos,
    createAtendimento,
    updateAtendimento,
    uploadAudio,
    transcribeAudio,
    deleteAtendimento,
  };
}
