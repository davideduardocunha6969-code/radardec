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
  pergunta_sugerida?: string;
}

export interface DynamicItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  pergunta_sugerida?: string;
}

export interface CoachingAnalysis {
  apresentacao_done: string[];
  qualification_done: string[];
  show_rate_done: string[];
  objections: Objection[];
  reca_items: DynamicItem[];
  raloca_items: DynamicItem[];
}

// --- Persistent coaching state types ---

export type SugestaoClassificacao = "RECA" | "RALOCA" | "RAPOVECA" | "RADOVECA";
export type SugestaoStatusAtiva = "aguardando";
export type SugestaoStatusEncerrada = "DITO" | "TIMING_PASSOU" | "DESCARTADO";

export interface CoachingSugestaoAtiva {
  id: string;
  gatilho: string;
  classificacao: SugestaoClassificacao;
  resposta_sugerida: string;
  status: SugestaoStatusAtiva;
}

export interface CoachingSugestaoEncerrada {
  id: string;
  gatilho: string;
  classificacao: SugestaoClassificacao;
  status: SugestaoStatusEncerrada;
}

export interface CoachingState {
  sugestoes_ativas: CoachingSugestaoAtiva[];
  sugestoes_encerradas: CoachingSugestaoEncerrada[];
}

export interface CoachingUpdate {
  id: string;
  new_status: "DITO" | "TIMING_PASSOU" | "MANTER";
}

export interface CoachingNewItems {
  objections: Objection[];
  reca_items: DynamicItem[];
  raloca_items: DynamicItem[];
}

export interface CoachingStateUpdates {
  novas_ancoras?: string[];
  fases_cumpridas?: string[];
}

export interface CoachingRealtimeResponse {
  updates: CoachingUpdate[];
  new_items: CoachingNewItems;
  state_updates?: CoachingStateUpdates;
}

// --- Closer-specific types ---

export interface CoachingSugestaoAtivaCloser extends CoachingSugestaoAtiva {
  turno_gerado: number;
  pergunta_sugerida?: string;
}

export interface CoachingSugestaoEncerradaCloser extends CoachingSugestaoEncerrada {
  turno_gerado: number;
  turno_encerrado: number;
}

export interface CoachingStateCloser {
  sugestoes_ativas: CoachingSugestaoAtivaCloser[];
  sugestoes_encerradas: CoachingSugestaoEncerradaCloser[];
  fases_cumpridas: string[];
  ancoras_registradas: string[];
}

// --- Radar types ---

export interface RadarIndicador {
  valor: number;
  justificativa: string;
}

export interface RadarValues {
  prova_tecnica: RadarIndicador;
  confianca: RadarIndicador;
  conviccao: RadarIndicador;
  resistencia: RadarIndicador;
  prob_fechamento: RadarIndicador;
}

// --- SDR script ---

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
