import { Formato } from "@/hooks/useConteudosMidia";

// Define which fields are visible based on content format
export function isFieldVisibleForFormato(field: string, formato: Formato): boolean {
  // Fields that are always visible
  const alwaysVisible = [
    "setor",
    "formato",
    "titulo",
    "gancho",
    "copy_completa",
    "link_inspiracao",
    "link_video_drive", // now "link_conteudo_drive"
    "semana_publicacao",
    "prioridade",
    "status",
  ];

  // Fields that are only visible for video formats
  const videoOnlyFields = ["orientacoes_filmagem"];

  if (alwaysVisible.includes(field)) {
    return true;
  }

  if (videoOnlyFields.includes(field)) {
    return formato === "video" || formato === "video_longo";
  }

  return false;
}

// Get the label for the link field based on format
export function getLinkLabel(formato?: Formato): string {
  return "Link do Conteúdo (Drive)";
}

// Get placeholder for the link field
export function getLinkPlaceholder(formato?: Formato): string {
  return "https://drive.google.com/...";
}

// Labels for format-specific instructions
export const FORMATO_INSTRUCTIONS: Record<Formato, { orientacoesLabel: string; orientacoesPlaceholder: string }> = {
  video: {
    orientacoesLabel: "Orientações para Filmagem",
    orientacoesPlaceholder: "Instruções detalhadas para gravação do vídeo curto...",
  },
  video_longo: {
    orientacoesLabel: "Orientações para Filmagem",
    orientacoesPlaceholder: "Instruções detalhadas para gravação do vídeo longo...",
  },
  carrossel: {
    orientacoesLabel: "Orientações de Design",
    orientacoesPlaceholder: "Instruções para criação dos slides do carrossel...",
  },
  estatico: {
    orientacoesLabel: "Orientações de Design",
    orientacoesPlaceholder: "Instruções para criação da arte estática...",
  },
};
