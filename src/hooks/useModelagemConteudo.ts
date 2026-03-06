import { useState } from "react";
import { toast } from "sonner";
import { TipoProduto } from "./useTiposProdutos";
import { Formato } from "./useConteudosMidia";

export interface AnaliseVisualDetalhada {
  textos_na_tela?: string;
  cenario: string;
  transicoes: string;
  enquadramento: string;
  postura_apresentador: string;
  elementos_visuais: string;
  ritmo_edicao: string;
}

export interface ModelagemResult {
  gancho_original: string;
  analise_estrategia: string;
  analise_performance: string;
  legenda_original: string;
  analise_filmagem: string;
  titulo_sugerido: string;
  copy_completa: string;
  orientacoes_filmagem: string;
  formato_sugerido: string;
  // Extended fields from video analysis
  transcricao_audio?: string | null;
  analise_visual_detalhada?: AnaliseVisualDetalhada | null;
}

export interface MultiFormatoResponse {
  formatos: Record<string, ModelagemResult>;
  transcricao: string | null;
  analise_visual: AnaliseVisualDetalhada | null;
}

export interface ModelagemState {
  isAnalyzing: boolean;
  results: Record<string, ModelagemResult>;
  transcricao: string | null;
  analiseVisual: AnaliseVisualDetalhada | null;
  error: string | null;
}

export function useModelagemConteudo() {
  const [state, setState] = useState<ModelagemState>({
    isAnalyzing: false,
    results: {},
    transcricao: null,
    analiseVisual: null,
    error: null,
  });

  const analyzeVideoUploadMultiFormato = async (
    videoFile: File,
    caption: string,
    produtos: TipoProduto[],
    formatos: Formato[],
    formatoOrigem?: string
  ): Promise<MultiFormatoResponse | null> => {
    setState((prev) => ({ ...prev, isAnalyzing: true, results: {}, error: null }));

    try {
      const produtosInfo = produtos
        .map(
          (p) =>
            `- ${p.nome} (Setor: ${p.setor})\n  Descrição: ${p.descricao || "N/A"}\n  Características: ${p.caracteristicas || "N/A"}\n  Perfil do Cliente Ideal: ${p.perfil_cliente_ideal || "N/A"}`
        )
        .join("\n\n");

      // Create FormData for video upload
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("caption", caption);
      formData.append("produtos", produtosInfo);
      formData.append("formatos", JSON.stringify(formatos));
      if (formatoOrigem) {
        formData.append("formato_origem", formatoOrigem);
      }

      // Get the Supabase URL and key for the edge function call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-video-upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao analisar vídeo");
      }

      const result = await response.json() as MultiFormatoResponse;
      
      setState((prev) => ({ 
        ...prev, 
        isAnalyzing: false, 
        results: result.formatos,
        transcricao: result.transcricao,
        analiseVisual: result.analise_visual,
      }));
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setState((prev) => ({ ...prev, isAnalyzing: false, error: message }));
      toast.error("Erro ao analisar vídeo: " + message);
      return null;
    }
  };

  // Legacy function for backward compatibility
  const analyzeVideoUpload = async (
    videoFile: File,
    caption: string,
    produtos: TipoProduto[]
  ): Promise<ModelagemResult | null> => {
    const result = await analyzeVideoUploadMultiFormato(videoFile, caption, produtos, ["video"]);
    return result?.formatos?.video || null;
  };

  const resetState = () => {
    setState({
      isAnalyzing: false,
      results: {},
      transcricao: null,
      analiseVisual: null,
      error: null,
    });
  };

  return {
    ...state,
    analyzeVideoUpload,
    analyzeVideoUploadMultiFormato,
    resetState,
  };
}
