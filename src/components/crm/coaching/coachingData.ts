export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
}

export interface Objection {
  id: string;
  objection: string;
  suggested_response: string;
  addressed: boolean;
  intensity?: "alta" | "media" | "baixa";
}

export interface DynamicItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  lead_phrase?: string;
}

export interface ShowRateAnalysis {
  score: number;
  classification: "alta" | "media" | "baixa" | "critica";
  dominant_risk: string;
  suggested_phrase: string;
  confirmation_question: string;
  items: DynamicItem[];
}

export interface CoachingAnalysis {
  apresentacao_done: string[];
  qualification_done: string[];
  objections: Objection[];
  reca_items: DynamicItem[];
  raloca_items: DynamicItem[];
}

export const QUALIFICATION_QUESTIONS: ChecklistItem[] = [
  { id: "jornada", label: "Jornada diária", description: "Qual era sua jornada diária de trabalho?" },
  { id: "descanso_11h", label: "Descanso 11h", description: "Tinha o descanso de 11 horas entre jornadas?" },
  { id: "tempo_espera", label: "Tempo de espera", description: "Tinha tempo de espera para carga/descarga?" },
  { id: "diarias", label: "Diárias / ajuda de custo", description: "Recebia diárias ou ajuda de custo?" },
  { id: "holerite", label: "Holerite detalhado", description: "Recebia holerite detalhado?" },
  { id: "controle_jornada", label: "Controle de jornada", description: "Como era o controle de jornada (tacógrafo, planilha)?" },
  { id: "tempo_empresa", label: "Tempo na empresa", description: "Quanto tempo trabalhou na empresa?" },
  { id: "tipo_demissao", label: "Tipo de demissão", description: "Como foi a demissão? (sem justa causa, pediu conta, acordo)" },
  { id: "rotina_estrada", label: "Rotina na estrada", description: "Como era a rotina na estrada? (pernoites, refeições)" },
];

export const INSTRUCTIONS_TEXT = `# Instruções de Qualificação — Motorista de Caminhão

## Perfil do Lead
- **Perfil:** Motorista de caminhão demitido
- **Origem:** Dados públicos
- **Canal:** Ligação de celular
- **Objetivo:** Agendar análise gratuita por vídeo (checagem de rescisão e análise de cálculos)

## Regras Gerais
- NÃO vender ação judicial
- NÃO prometer valores
- NÃO falar "processar" como primeira abordagem
`;
