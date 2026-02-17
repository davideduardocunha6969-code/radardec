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
}

export interface CoachingAnalysis {
  qualification_done: string[];
  objections: Objection[];
  reca_done: string[];
  raloca_done: string[];
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

export const RECA_ITEMS: ChecklistItem[] = [
  { id: "justica", label: "Justiça", description: "Você sente que foi tratado de forma justa pela empresa?" },
  { id: "encerramento", label: "Encerramento", description: "Seria bom resolver essa pendência de uma vez?" },
  { id: "seguranca", label: "Segurança financeira", description: "Ter certeza de que recebeu tudo certo te traria mais tranquilidade?" },
  { id: "alivio", label: "Alívio emocional", description: "Imagino que tirar essa dúvida das costas seria um alívio." },
  { id: "prejuizo", label: "Evitar prejuízo", description: "Muitos motoristas deixam de receber valores por não conferir." },
];

export const RALOCA_ITEMS: ChecklistItem[] = [
  { id: "metodo", label: "Rotina → Cálculo", description: "Vamos transformar sua rotina em cálculo pra ver se tem diferença." },
  { id: "analise", label: "Necessidade de análise", description: "Só analisando seus números pra saber se ficou algo." },
  { id: "sem_compromisso", label: "Gratuito e sem compromisso", description: "A análise é gratuita e sem compromisso." },
  { id: "decisao_cliente", label: "Decisão do cliente", description: "Você analisa e decide com calma, sem pressão." },
  { id: "revisao_calculo", label: "Pode revisar após assinar", description: "Ter assinado a rescisão não impede de revisar os cálculos." },
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

## Perguntas de Qualificação (Microdiagnóstico)
1. Jornada diária de trabalho
2. Descanso de 11 horas entre jornadas
3. Tempo de espera para carga/descarga
4. Diárias ou ajuda de custo
5. Holerite detalhado
6. Controle de jornada (tacógrafo, planilha)
7. Tempo na empresa
8. Tipo de demissão
9. Rotina na estrada (pernoites, refeições)

## RECA — Razões Emocionais para Contratar
- **Justiça:** Explorar senso de justiça
- **Encerramento:** Resolver pendência
- **Segurança:** Certeza de ter recebido corretamente
- **Alívio:** Tirar dúvida/peso
- **Prejuízo:** Alertar sobre valores não conferidos

## RALOCA — Razões Lógicas para Contratar
- **Método:** Transformar rotina em cálculo
- **Análise:** Só analisando pra saber
- **Sem compromisso:** Gratuito
- **Decisão do cliente:** Sem pressão
- **Revisão:** Assinar não impede revisar

## RAPOVECA — Tratamento de Objeções
1. Validar a objeção
2. Normalizar ("muita gente sente isso")
3. Reposicionar (análise ≠ ação judicial)
4. Avançar para o agendamento
`;
