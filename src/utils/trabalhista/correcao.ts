// ========================================
// Correção Monetária e Juros Moratórios
// Modo Estimativa: IPCA-E médio 5% a.a. (constante)
// Preparado para receber índices mensais no modo liquidação
// ========================================

/** Taxa média anual do IPCA-E para modo estimativa */
const IPCA_E_ANUAL_MEDIO = 0.05;

/** Juros moratórios: 1% ao mês simples */
const JUROS_MORATORIOS_MENSAL = 0.01;

/**
 * Calcula o número de meses entre duas datas
 */
function mesesEntre(dataInicio: Date, dataFim: Date): number {
  const anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const meses = dataFim.getMonth() - dataInicio.getMonth();
  return Math.max(0, anos * 12 + meses);
}

/**
 * Correção monetária pelo IPCA-E (modo estimativa)
 * Usa taxa média anual de 5% proporcionalizada mensalmente
 *
 * @param valor - Valor nominal a corrigir
 * @param dataBase - Data de referência do valor (vencimento)
 * @param dataCalculo - Data do cálculo (default: hoje)
 * @returns Valor corrigido monetariamente
 */
export function corrigirIPCAE(
  valor: number,
  dataBase: Date,
  dataCalculo: Date = new Date()
): number {
  if (valor <= 0 || dataBase >= dataCalculo) return valor;

  const meses = mesesEntre(dataBase, dataCalculo);
  const taxaMensal = Math.pow(1 + IPCA_E_ANUAL_MEDIO, 1 / 12) - 1;
  const fatorCorrecao = Math.pow(1 + taxaMensal, meses);

  return valor * fatorCorrecao;
}

/**
 * Aplica juros moratórios simples de 1% ao mês
 *
 * @param valor - Valor já corrigido monetariamente
 * @param dataBase - Data de referência (vencimento)
 * @param dataCalculo - Data do cálculo (default: hoje)
 * @returns Valor com juros moratórios aplicados
 */
export function aplicarJurosMoratorios(
  valor: number,
  dataBase: Date,
  dataCalculo: Date = new Date()
): number {
  if (valor <= 0 || dataBase >= dataCalculo) return valor;

  const meses = mesesEntre(dataBase, dataCalculo);
  const juros = valor * JUROS_MORATORIOS_MENSAL * meses;

  return valor + juros;
}

/**
 * Aplica correção monetária + juros moratórios
 * Ordem: primeiro corrige pelo IPCA-E, depois aplica juros sobre o valor corrigido
 */
export function atualizarValor(
  valor: number,
  dataBase: Date,
  dataCalculo: Date = new Date()
): number {
  const corrigido = corrigirIPCAE(valor, dataBase, dataCalculo);
  return aplicarJurosMoratorios(corrigido, dataBase, dataCalculo);
}
