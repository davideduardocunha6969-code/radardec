// ========================================
// Motor de Cálculo Trabalhista — Esqueleto
// Lógica de cálculo será preenchida com motor v5.2
// ========================================

import type { DadosExtrasMap, CalculoCompleto, PeriodoModulado } from "./types";

/**
 * Calcula todas as rubricas com base nos dados do lead
 * Placeholder — será preenchido com motor v5.2
 */
export function calcularTudo(dados: DadosExtrasMap): CalculoCompleto {
  return {
    categorias: [],
    subtotalIntegralNominal: 0,
    subtotalIntegralAtualizado: 0,
    subtotalModuladoNominal: 0,
    subtotalModuladoAtualizado: 0,
    totalGeralNominal: 0,
    totalGeralAtualizado: 0,
    pensaoVitalicia: null,
    totalComPensao: null,
  };
}

/**
 * Estima o impacto financeiro de preencher um determinado campo
 * Usado pelo Painel 2 (Lacunas) para ordenação por impacto
 * A IA do analyze-gaps recebe esse número pronto — não estima o valor
 *
 * @param campo - Key do campo em dados_extras
 * @param dadosAtuais - Estado atual dos dados do lead
 * @returns Valor estimado da rubrica que seria desbloqueada
 */
export function estimarImpactoCampo(
  campo: string,
  dadosAtuais: DadosExtrasMap
): number {
  // Placeholder — retorna 0 até motor v5.2
  return 0;
}

/**
 * Calcula o período modulado para uma rubrica afetada pela ADI 5322
 * Retorna meses calculados, data de início e data de vencimento de referência
 * NÃO é binário — calcula os períodos proporcionais
 *
 * Placeholder — será preenchido com motor v5.2
 */
export function calcular_periodo_modulado(
  dataBase: Date,
  rubricaId: string
): PeriodoModulado {
  // Placeholder — retorna período zero até motor v5.2
  return {
    meses_calculados: 0,
    data_inicio_calculo: dataBase,
    data_vencimento_ref: dataBase,
  };
}
