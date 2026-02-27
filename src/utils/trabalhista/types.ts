// ========================================
// Tipos do Motor de Cálculo Trabalhista v5.2
// ========================================

/** Metadados de um campo em dados_extras */
export interface DadosExtrasField {
  valor: string;
  origem: "extrator_automatico" | "preenchimento_manual" | "importado";
  confianca: "alta" | "media" | "baixa" | "interpretado";
  turno_extracao: number | null;
  data_ultima_atualizacao: string; // ISO timestamp
}

/** Formato do dados_extras: suporta string legada ou objeto com metadados */
export type DadosExtrasMap = Record<string, string | DadosExtrasField>;

/** Extrai valor e metadados de um campo, com retrocompatibilidade */
export function getFieldValue(
  dados: DadosExtrasMap | null | undefined,
  key: string
): { valor: string; meta: DadosExtrasField | null } {
  if (!dados || !dados[key]) return { valor: "", meta: null };
  const v = dados[key];
  if (typeof v === "string") return { valor: v, meta: null };
  return { valor: v.valor || "", meta: v };
}

/** Cria um DadosExtrasField completo */
export function createField(
  valor: string,
  origem: DadosExtrasField["origem"] = "preenchimento_manual",
  confianca: DadosExtrasField["confianca"] = "alta",
  turno: number | null = null
): DadosExtrasField {
  return {
    valor,
    origem,
    confianca,
    turno_extracao: turno,
    data_ultima_atualizacao: new Date().toISOString(),
  };
}

/** Verifica se um campo foi preenchido manualmente (prioridade sobre IA) */
export function isManualField(dados: DadosExtrasMap | null | undefined, key: string): boolean {
  if (!dados || !dados[key]) return false;
  const v = dados[key];
  if (typeof v === "string") return false;
  return v.origem === "preenchimento_manual";
}

// ========================================
// Tipos do Motor de Cálculo
// ========================================

export type TipoCampo = "texto" | "data" | "numero" | "sim_nao" | "selecao" | "valor" | "horario";

export interface RubricaResult {
  id: string;
  nome: string;
  categoria: string;
  valorNominal: number | null;
  valorAtualizado: number | null;
  calculavel: boolean;
  camposFaltantes: string[];
  modulado: boolean;
  dataInicioCalculo?: string;
  dataVencimentoRef?: string;
  mesesCalculados?: number;
  observacao?: string;
}

export interface CategoriaResult {
  nome: string;
  rubricas: RubricaResult[];
  totalNominal: number;
  totalAtualizado: number;
}

export interface CalculoCompleto {
  categorias: CategoriaResult[];
  subtotalIntegralNominal: number;
  subtotalIntegralAtualizado: number;
  subtotalModuladoNominal: number;
  subtotalModuladoAtualizado: number;
  totalGeralNominal: number;
  totalGeralAtualizado: number;
  pensaoVitalicia: number | null;
  totalComPensao: number | null;
  erro?: string;
  metadados?: {
    dataCalculo: string;
    mesesTrabalhados: number;
    remuneracaoBaseCorreta: number;
    baseComDSR: number;
    divisorUtilizado: number;
    regime: string;
    modulacaoSTF: PeriodoModulado;
    baseEstimativaEmpresa: number;
    aviso: string;
  };
}

export interface PeriodoModulado {
  meses_calculados: number;
  data_inicio_calculo: string;
  data_vencimento_ref: string;
  status: 'NAO_CALCULADO' | 'CALCULADO' | 'PARCIAL';
  motivo: string | null;
}
