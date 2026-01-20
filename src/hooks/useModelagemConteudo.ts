import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TipoProduto } from "./useTiposProdutos";

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
}

export interface ModelagemState {
  isAnalyzing: boolean;
  result: ModelagemResult | null;
  error: string | null;
}

export function useModelagemConteudo() {
  const [state, setState] = useState<ModelagemState>({
    isAnalyzing: false,
    result: null,
    error: null,
  });

  const analyzeContent = async (
    link: string,
    tipo: "video" | "blog_post" | "publicacao",
    produtos: TipoProduto[]
  ): Promise<ModelagemResult | null> => {
    setState({ isAnalyzing: true, result: null, error: null });

    try {
      const produtosInfo = produtos
        .map(
          (p) =>
            `- ${p.nome} (Setor: ${p.setor})\n  Descrição: ${p.descricao || "N/A"}\n  Características: ${p.caracteristicas || "N/A"}\n  Perfil do Cliente Ideal: ${p.perfil_cliente_ideal || "N/A"}`
        )
        .join("\n\n");

      const response = await supabase.functions.invoke("analyze-content", {
        body: {
          link,
          tipo,
          produtos: produtosInfo,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao analisar conteúdo");
      }

      const result = response.data as ModelagemResult;
      setState({ isAnalyzing: false, result, error: null });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setState({ isAnalyzing: false, result: null, error: message });
      toast.error("Erro ao analisar conteúdo: " + message);
      return null;
    }
  };

  const resetState = () => {
    setState({ isAnalyzing: false, result: null, error: null });
  };

  return {
    ...state,
    analyzeContent,
    resetState,
  };
}
