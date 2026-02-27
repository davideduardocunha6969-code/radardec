// ========================================
// Definição de Categorias e Rubricas
// Estrutura apenas — lógica será preenchida com motor v5.2
// ========================================

export interface RubricaDef {
  id: string;
  nome: string;
  categoria: string;
  camposNecessarios: string[];
  modulavel: boolean;
}

export const CATEGORIAS: Array<{ id: string; nome: string }> = [
  { id: "horas_extras", nome: "Horas Extras" },
  { id: "intervalo_intrajornada", nome: "Intervalo Intrajornada" },
  { id: "interjornada", nome: "Interjornada" },
  { id: "adicional_noturno", nome: "Adicional Noturno" },
  { id: "tempo_espera", nome: "Tempo de Espera" },
  { id: "periculosidade_insalubridade", nome: "Periculosidade / Insalubridade" },
  { id: "diarias_ajuda_custo", nome: "Diárias / Ajuda de Custo" },
  { id: "equiparacao_salarial", nome: "Equiparação Salarial" },
  { id: "ferias", nome: "Férias" },
  { id: "decimo_terceiro", nome: "13º Salário" },
  { id: "fgts", nome: "FGTS" },
  { id: "verbas_rescisorias", nome: "Verbas Rescisórias" },
  { id: "danos_morais", nome: "Danos Morais" },
  { id: "acidente_doenca", nome: "Acidente / Doença Ocupacional" },
  { id: "descontos_indevidos", nome: "Descontos Indevidos" },
  { id: "desvio_funcao", nome: "Desvio de Função" },
  { id: "acumulo_funcao", nome: "Acúmulo de Função" },
  { id: "salario_familia", nome: "Salário-Família" },
  { id: "vale_transporte", nome: "Vale-Transporte" },
  { id: "seguro_desemprego", nome: "Seguro-Desemprego" },
  { id: "multa_477", nome: "Multa Art. 477 CLT" },
  { id: "multa_467", nome: "Multa Art. 467 CLT" },
  { id: "honorarios", nome: "Honorários Advocatícios" },
  { id: "contribuicao_previdenciaria", nome: "Contribuição Previdenciária" },
  { id: "pensao_vitalicia", nome: "Pensão Vitalícia" },
  { id: "danos_materiais", nome: "Danos Materiais" },
  { id: "estabilidade", nome: "Estabilidade Provisória" },
];

/**
 * Lista de rubricas — será preenchida com motor v5.2
 * Cada rubrica define quais campos são necessários para o cálculo
 */
export const RUBRICAS: RubricaDef[] = [
  // Placeholder — aguardando motor v5.2
];
