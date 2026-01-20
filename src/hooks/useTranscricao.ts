import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Segmento {
  falante: string;
  texto: string;
  inicio: number;
  fim: number;
}

export interface Transcricao {
  id: string;
  user_id: string;
  titulo: string;
  arquivo_nome: string;
  duracao_segundos: number | null;
  texto_completo: string | null;
  segmentos: Segmento[];
  status: "pendente" | "processando" | "concluido" | "erro";
  erro_mensagem: string | null;
  created_at: string;
  updated_at: string;
}

export function useTranscricao() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcricoes, setTranscricoes] = useState<Transcricao[]>([]);

  const fetchTranscricoes = useCallback(async () => {
    const { data, error } = await supabase
      .from("transcricoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar transcrições",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Parse segmentos from JSON
    const parsed = (data || []).map((t) => ({
      ...t,
      segmentos: (t.segmentos as unknown as Segmento[]) || [],
      status: t.status as Transcricao["status"],
    }));

    setTranscricoes(parsed);
  }, [toast]);

  const createTranscricao = useCallback(
    async (titulo: string, arquivoNome: string): Promise<string | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from("transcricoes")
        .insert({
          user_id: user.id,
          titulo,
          arquivo_nome: arquivoNome,
          status: "pendente",
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar transcrição",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      return data.id;
    },
    [toast]
  );

  const transcreverAudio = useCallback(
    async (
      audioBlob: Blob,
      titulo: string,
      arquivoNome: string
    ): Promise<Transcricao | null> => {
      setIsLoading(true);
      setProgress(10);

      try {
        // Create transcription record first
        const transcricaoId = await createTranscricao(titulo, arquivoNome);
        if (!transcricaoId) {
          throw new Error("Erro ao criar registro de transcrição");
        }

        setProgress(20);

        // Get auth token
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Usuário não autenticado");
        }

        setProgress(30);

        // Prepare form data
        const formData = new FormData();
        formData.append("audio", audioBlob, arquivoNome);
        formData.append("titulo", titulo);
        formData.append("transcricao_id", transcricaoId);

        setProgress(40);

        // Call edge function
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

        setProgress(80);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao transcrever áudio");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erro ao transcrever áudio");
        }

        setProgress(100);

        // Fetch updated transcription
        const { data: transcricao, error } = await supabase
          .from("transcricoes")
          .select("*")
          .eq("id", transcricaoId)
          .single();

        if (error) {
          throw new Error("Erro ao buscar transcrição atualizada");
        }

        toast({
          title: "Transcrição concluída!",
          description: "O áudio foi transcrito com sucesso.",
        });

        return {
          ...transcricao,
          segmentos: (transcricao.segmentos as unknown as Segmento[]) || [],
          status: transcricao.status as Transcricao["status"],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        toast({
          title: "Erro na transcrição",
          description: message,
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
        setProgress(0);
      }
    },
    [createTranscricao, toast]
  );

  const deleteTranscricao = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("transcricoes")
        .delete()
        .eq("id", id);

      if (error) {
        toast({
          title: "Erro ao deletar",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Transcrição deletada",
        description: "A transcrição foi removida com sucesso.",
      });

      await fetchTranscricoes();
      return true;
    },
    [toast, fetchTranscricoes]
  );

  return {
    transcricoes,
    isLoading,
    progress,
    fetchTranscricoes,
    transcreverAudio,
    deleteTranscricao,
  };
}
