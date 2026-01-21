import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TipoProduto } from "./useTiposProdutos";

export interface AnaliseVisualDetalhada {
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
  // Extended fields from Instagram analysis
  transcricao_audio?: string | null;
  analise_visual_detalhada?: AnaliseVisualDetalhada | null;
}

export interface ScrapedPreview {
  title: string | null;
  description: string | null;
  author: string | null;
  markdown: string | null;
  hasScreenshot: boolean;
  screenshot: string | null;
  video_url?: string | null;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
}

export interface ModelagemState {
  isAnalyzing: boolean;
  isScraping: boolean;
  scrapedPreview: ScrapedPreview | null;
  result: ModelagemResult | null;
  error: string | null;
}

// Check if URL is an Instagram URL
function isInstagramUrl(url: string): boolean {
  return url.includes("instagram.com") || url.includes("instagr.am");
}

export function useModelagemConteudo() {
  const [state, setState] = useState<ModelagemState>({
    isAnalyzing: false,
    isScraping: false,
    scrapedPreview: null,
    result: null,
    error: null,
  });

  const scrapePreview = async (link: string): Promise<ScrapedPreview | null> => {
    setState((prev) => ({ ...prev, isScraping: true, scrapedPreview: null, error: null }));

    try {
      // Use Instagram-specific function for Instagram URLs
      if (isInstagramUrl(link)) {
        const response = await supabase.functions.invoke("analyze-instagram-video", {
          body: {
            action: "extract",
            link,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Erro ao extrair conteúdo do Instagram");
        }

        if (!response.data.success) {
          throw new Error(response.data.error || "Não foi possível extrair o conteúdo");
        }

        const preview = response.data.data as ScrapedPreview;
        setState((prev) => ({ ...prev, isScraping: false, scrapedPreview: preview }));
        return preview;
      }

      // Fallback to original function for other URLs
      const response = await supabase.functions.invoke("analyze-content", {
        body: {
          action: "scrape",
          link,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao extrair conteúdo");
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Não foi possível extrair o conteúdo");
      }

      const preview = response.data.data as ScrapedPreview;
      setState((prev) => ({ ...prev, isScraping: false, scrapedPreview: preview }));
      return preview;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setState((prev) => ({ ...prev, isScraping: false, error: message }));
      toast.error("Erro ao extrair conteúdo: " + message);
      return null;
    }
  };

  const analyzeContent = async (
    link: string,
    tipo: "video" | "blog_post" | "publicacao",
    produtos: TipoProduto[],
    manualCaption?: string
  ): Promise<ModelagemResult | null> => {
    setState((prev) => ({ ...prev, isAnalyzing: true, result: null, error: null }));

    try {
      const produtosInfo = produtos
        .map(
          (p) =>
            `- ${p.nome} (Setor: ${p.setor})\n  Descrição: ${p.descricao || "N/A"}\n  Características: ${p.caracteristicas || "N/A"}\n  Perfil do Cliente Ideal: ${p.perfil_cliente_ideal || "N/A"}`
        )
        .join("\n\n");

      // Use Instagram-specific function for Instagram URLs (and no manual caption)
      if (isInstagramUrl(link) && !manualCaption) {
        const response = await supabase.functions.invoke("analyze-instagram-video", {
          body: {
            link,
            tipo,
            produtos: produtosInfo,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Erro ao analisar conteúdo");
        }

        // Check if there's an error in the response body
        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        const result = response.data as ModelagemResult;
        setState((prev) => ({ ...prev, isAnalyzing: false, result }));
        return result;
      }

      // Fallback to original function
      const response = await supabase.functions.invoke("analyze-content", {
        body: {
          link,
          tipo,
          produtos: produtosInfo,
          manualCaption,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao analisar conteúdo");
      }

      const result = response.data as ModelagemResult;
      setState((prev) => ({ ...prev, isAnalyzing: false, result }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setState((prev) => ({ ...prev, isAnalyzing: false, error: message }));
      toast.error("Erro ao analisar conteúdo: " + message);
      return null;
    }
  };

  const resetState = () => {
    setState({
      isAnalyzing: false,
      isScraping: false,
      scrapedPreview: null,
      result: null,
      error: null,
    });
  };

  return {
    ...state,
    scrapePreview,
    analyzeContent,
    resetState,
  };
}
