// =============================================================================
// MOTOR DE CÁLCULO TRABALHISTA v5.2
// Dr. David Cunha Advogados — Especialistas em Motoristas de Caminhão
//
// IMPORTANTE: Este motor é 100% determinístico.
// Dado o mesmo input, o output é sempre idêntico.
// Nunca usar IA para calcular — apenas para extrair dados.
// =============================================================================

import type { DadosExtrasMap, CalculoCompleto, RubricaResult, CategoriaResult, PeriodoModulado } from './types';
import { atualizarValor } from './correcao';

// =============================================================================
// CONSTANTES DO SISTEMA
// =============================================================================

const DATA_MODULACAO_STF = new Date('2023-07-12'); // ADI 5322 — efeito ex nunc
const DATA_REFORMA_TRABALHISTA = new Date('2017-11-11');
const DATA_CALCULO = new Date();
const SALARIO_MINIMO = 1412.00;

const DIVISORES: Record<string, number> = {
  '5': 220,
  '6': 240,
  '7': 260,
};

// =============================================================================
// HELPERS DE LEITURA DE CAMPOS
// =============================================================================

function get(dados: DadosExtrasMap, key: string): string | null {
  const field = dados[key];
  if (!field) return null;
  if (typeof field === 'string') return field || null;
  return field.valor || null;
}

function getNum(dados: DadosExtrasMap, key: string): number | null {
  const v = get(dados, key);
  if (v === null) return null;
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? null : n;
}

function getBool(dados: DadosExtrasMap, key: string): boolean | null {
  const v = get(dados, key);
  if (v === null) return null;
  return v.toLowerCase() === 'sim' || v.toLowerCase() === 'true' || v === '1';
}

function getDate(dados: DadosExtrasMap, key: string): Date | null {
  const v = get(dados, key);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// =============================================================================
// FUNÇÕES AUXILIARES DE DATA
// =============================================================================

function mesesEntreDatas(inicio: Date, fim: Date): number {
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  const dias = fim.getDate() - inicio.getDate();
  let total = anos * 12 + meses;
  if (dias < 0) total -= 1;
  return Math.max(0, total);
}

function adicionarMeses(data: Date, meses: number): Date {
  const d = new Date(data);
  d.setMonth(d.getMonth() + meses);
  return d;
}

function dataMedia(inicio: Date, fim: Date): Date {
  const meses = mesesEntreDatas(inicio, fim);
  return adicionarMeses(inicio, Math.floor(meses / 2));
}

function anosCompletos(inicio: Date, fim: Date): number {
  return Math.floor(mesesEntreDatas(inicio, fim) / 12);
}

// =============================================================================
// FUNÇÃO CENTRAL: calcular_periodo_modulado
// ADI 5322 — efeito ex nunc a partir de 12/07/2023
// =============================================================================

export function calcular_periodo_modulado(
  dataAdmissao: Date,
  dataDemissao: Date
): PeriodoModulado {
  if (dataDemissao <= DATA_MODULACAO_STF) {
    return {
      meses_calculados: 0,
      data_inicio_calculo: DATA_MODULACAO_STF.toISOString(),
      data_vencimento_ref: DATA_MODULACAO_STF.toISOString(),
      status: 'NAO_CALCULADO',
      motivo: 'Contrato encerrado antes da modulação STF (12/07/2023).',
    };
  }

  if (dataAdmissao >= DATA_MODULACAO_STF) {
    const meses = mesesEntreDatas(dataAdmissao, dataDemissao);
    return {
      meses_calculados: meses,
      data_inicio_calculo: dataAdmissao.toISOString(),
      data_vencimento_ref: dataMedia(dataAdmissao, dataDemissao).toISOString(),
      status: 'CALCULADO',
      motivo: null,
    };
  }

  const meses = mesesEntreDatas(DATA_MODULACAO_STF, dataDemissao);
  return {
    meses_calculados: meses,
    data_inicio_calculo: DATA_MODULACAO_STF.toISOString(),
    data_vencimento_ref: dataMedia(DATA_MODULACAO_STF, dataDemissao).toISOString(),
    status: 'PARCIAL',
    motivo: 'Modulação STF ADI 5322 — efeito ex nunc a partir de 12/07/2023.',
  };
}

// =============================================================================
// FUNÇÃO AUXILIAR: rubrica vazia (não calculável)
// =============================================================================

function rubricaVazia(
  id: string, nome: string, categoria: string,
  camposFaltantes: string[], modulado = false
): RubricaResult {
  return {
    id, nome, categoria,
    valorNominal: null, valorAtualizado: null,
    calculavel: false, camposFaltantes, modulado,
  };
}

function rubricaZero(
  id: string, nome: string, categoria: string,
  motivo: string, modulado = false
): RubricaResult {
  return {
    id, nome, categoria,
    valorNominal: 0, valorAtualizado: 0,
    calculavel: true, camposFaltantes: [], modulado,
    observacao: motivo,
  };
}

// =============================================================================
// FASE 1 — PARÂMETROS BASE
// =============================================================================

interface ParametrosBase {
  dataAdmissao: Date;
  dataDemissao: Date;
  mesesTrabalhados: number;
  anosCompletos: number;
  divisor: number;
  diasTrabalhadosMes: number;
  dataMediaContrato: Date;
  regime: 'pre_reforma' | 'pos_reforma' | 'misto';
  mesesPreReforma: number;
  mesesPosReforma: number;
}

function calcularParametrosBase(dados: DadosExtrasMap): ParametrosBase | null {
  const dataAdmissao = getDate(dados, 'data_admissao');
  const contratoAtivo = getBool(dados, 'contrato_ativo');
  let dataDemissao = getDate(dados, 'data_demissao');

  if (!dataAdmissao) return null;
  if (contratoAtivo || !dataDemissao) dataDemissao = DATA_CALCULO;

  const meses = mesesEntreDatas(dataAdmissao, dataDemissao);
  const anos = anosCompletos(dataAdmissao, dataDemissao);
  const regimeSemanal = get(dados, 'regime_semanal_contratual') || '6';
  const diasSemana = parseInt(regimeSemanal.replace(' dias', '')) || 6;
  const divisor = DIVISORES[String(diasSemana)] || 220;
  const diasMes = diasSemana * 4.5;

  let regime: 'pre_reforma' | 'pos_reforma' | 'misto';
  let mesesPre = 0;
  let mesesPos = 0;

  if (dataDemissao <= DATA_REFORMA_TRABALHISTA) {
    regime = 'pre_reforma';
    mesesPre = meses;
  } else if (dataAdmissao >= DATA_REFORMA_TRABALHISTA) {
    regime = 'pos_reforma';
    mesesPos = meses;
  } else {
    regime = 'misto';
    mesesPre = mesesEntreDatas(dataAdmissao, DATA_REFORMA_TRABALHISTA);
    mesesPos = mesesEntreDatas(DATA_REFORMA_TRABALHISTA, dataDemissao);
  }

  return {
    dataAdmissao, dataDemissao,
    mesesTrabalhados: meses, anosCompletos: anos,
    divisor, diasTrabalhadosMes: diasMes,
    dataMediaContrato: dataMedia(dataAdmissao, dataDemissao),
    regime, mesesPreReforma: mesesPre, mesesPosReforma: mesesPos,
  };
}

// =============================================================================
// FASE 2 — REMUNERAÇÃO BASE CORRETA
// =============================================================================

interface RemuneracaoBase {
  salarioCtps: number;
  remuneracaoBaseCorreta: number;
  horaNormalBase: number;
  adicionalAcumulo: number;
  diferencaEquiparacao: number;
  diferencaGratificacao: number;
  mesesGratificacaoSuprimida: number;
}

function calcularRemuneracaoBase(
  dados: DadosExtrasMap, params: ParametrosBase
): RemuneracaoBase | null {
  const salarioCtps = getNum(dados, 'salario_ctps_mensal');
  if (!salarioCtps) return null;

  let base = salarioCtps;
  const comissao = getNum(dados, 'media_comissao_mensal') || 0;
  const premio = getNum(dados, 'media_premio_mensal') || 0;
  const gratif = getNum(dados, 'media_gratificacao_mensal') || 0;
  const diarias = getNum(dados, 'media_diarias_mensal') || 0;
  const porFora = getNum(dados, 'valor_por_fora_mensal_medio') || 0;
  const ajudaCusto = getNum(dados, 'media_ajuda_custo_mensal') || 0;
  base += comissao + premio + gratif + diarias + porFora + ajudaCusto;

  let adicionalAcumulo = 0;
  if (getBool(dados, 'existe_acumulo')) {
    adicionalAcumulo = salarioCtps * 0.20;
    base += adicionalAcumulo;
  }

  let diferencaEquiparacao = 0;
  if (getBool(dados, 'existe_equiparacao')) {
    const salarioParadigma = getNum(dados, 'salario_paradigma') || 0;
    const tempoParadigma = getNum(dados, 'tempo_paradigma_na_funcao_anos') || 0;
    const tempoReclamante = getNum(dados, 'tempo_reclamante_na_funcao_anos') || 0;
    if (salarioParadigma > salarioCtps && (tempoParadigma - tempoReclamante) <= 2) {
      diferencaEquiparacao = salarioParadigma - salarioCtps;
      base += diferencaEquiparacao;
    }
  }

  let diferencaGratificacao = 0;
  let mesesGratificacaoSuprimida = 0;
  if (getBool(dados, 'recebia_gratificacao_funcao') &&
      getBool(dados, 'gratificacao_foi_suprimida')) {
    const anosGratif = getNum(dados, 'tempo_recebendo_gratificacao_anos') || 0;
    const valorGratif = getNum(dados, 'valor_gratificacao_suprimida') || 0;
    const dataSupressao = getDate(dados, 'data_supressao_gratificacao');
    if (anosGratif >= 10 && valorGratif > 0 && dataSupressao) {
      base += valorGratif;
      diferencaGratificacao = valorGratif;
      mesesGratificacaoSuprimida = mesesEntreDatas(dataSupressao, params.dataDemissao);
    }
  }

  return {
    salarioCtps,
    remuneracaoBaseCorreta: base,
    horaNormalBase: base / params.divisor,
    adicionalAcumulo, diferencaEquiparacao,
    diferencaGratificacao, mesesGratificacaoSuprimida,
  };
}

// =============================================================================
// FASE 3 — ADICIONAIS (Periculosidade e Insalubridade)
// =============================================================================

interface Adicionais {
  diferencaPericulosidadeMensal: number;
  diferencaInsalubridade: number;
  periculosidadeDevida: boolean;
  insalubridadeDevida: boolean;
}

function calcularAdicionais(dados: DadosExtrasMap, rem: RemuneracaoBase): Adicionais {
  let diferencaPericulosidade = 0;
  let periculosidadeDevida = false;

  if (getBool(dados, 'periculosidade_devida') ||
      getBool(dados, 'transportava_carga_perigosa') ||
      getBool(dados, 'fazia_abastecimento_frequente')) {
    periculosidadeDevida = true;
    const devido = rem.remuneracaoBaseCorreta * 0.30;
    const pago = getBool(dados, 'periculosidade_paga')
      ? rem.salarioCtps * ((getNum(dados, 'percentual_periculosidade_pago') || 30) / 100)
      : 0;
    diferencaPericulosidade = Math.max(0, devido - pago);
  }

  let diferencaInsalubridade = 0;
  let insalubridadeDevida = false;

  if (getBool(dados, 'insalubridade_devida') ||
      getBool(dados, 'trabalhava_camara_fria') ||
      getBool(dados, 'exposto_ruido_excessivo') ||
      getBool(dados, 'vibracao_constante')) {
    insalubridadeDevida = true;
    const grau = get(dados, 'grau_insalubridade') || 'medio';
    const percentuais: Record<string, number> = { minimo: 0.10, medio: 0.20, maximo: 0.40 };
    const percentual = percentuais[grau] || 0.20;
    const devido = SALARIO_MINIMO * percentual;
    const pago = getBool(dados, 'insalubridade_paga')
      ? SALARIO_MINIMO * ((getNum(dados, 'percentual_insalubridade_pago') || 0) / 100)
      : 0;
    diferencaInsalubridade = Math.max(0, devido - pago);
  }

  return {
    diferencaPericulosidadeMensal: diferencaPericulosidade,
    diferencaInsalubridade, periculosidadeDevida, insalubridadeDevida,
  };
}

// =============================================================================
// FASE 4 — HORA EXTRA REAL (base com adicionais)
// =============================================================================

interface HoraExtraBase {
  baseRealHoraExtraMensal: number;
  horaNormalReal: number;
  horaExtra50: number;
  horaExtra100: number;
}

function calcularBaseHoraExtra(
  rem: RemuneracaoBase, adicionais: Adicionais, params: ParametrosBase
): HoraExtraBase {
  const base = rem.remuneracaoBaseCorreta
    + adicionais.diferencaPericulosidadeMensal
    + adicionais.diferencaInsalubridade;
  const horaNormal = base / params.divisor;
  return {
    baseRealHoraExtraMensal: base,
    horaNormalReal: horaNormal,
    horaExtra50: horaNormal * 1.50,
    horaExtra100: horaNormal * 2.00,
  };
}

// =============================================================================
// FASE 5 — ADICIONAL NOTURNO
// =============================================================================

interface AdicionalNoturno {
  adicionalNoturnoMensal: number;
}

function calcularAdicionalNoturno(
  dados: DadosExtrasMap, heBase: HoraExtraBase, params: ParametrosBase
): AdicionalNoturno {
  if (!getBool(dados, 'dirigia_apos_22')) return { adicionalNoturnoMensal: 0 };

  const horasNoturnas = getNum(dados, 'horas_noturnas_dia_media');
  if (!horasNoturnas) return { adicionalNoturnoMensal: 0 };

  const aplicarReduzida = getBool(dados, 'aplicar_hora_reduzida_noturna') !== false;
  const horasReais = aplicarReduzida ? horasNoturnas * (60 / 52.5) : horasNoturnas;
  const valorHoraAdicional = heBase.horaNormalReal * 0.20;
  let adicionalMensal = horasReais * params.diasTrabalhadosMes * valorHoraAdicional;

  const valorPago = getNum(dados, 'valor_noturno_pago_mensal') || 0;
  adicionalMensal = Math.max(0, adicionalMensal - valorPago);

  return { adicionalNoturnoMensal: adicionalMensal };
}

// =============================================================================
// FASE 6 — SOBREAVISO (Súmula 428 TST)
// =============================================================================

interface Sobreaviso {
  sobreAvisoMensal: number;
}

function calcularSobreaviso(
  dados: DadosExtrasMap, heBase: HoraExtraBase, params: ParametrosBase
): Sobreaviso {
  if (!getBool(dados, 'ficava_de_sobreaviso') ||
      !getBool(dados, 'tinha_obrigacao_atender_chamado')) {
    return { sobreAvisoMensal: 0 };
  }

  const horasSobreaviso = getNum(dados, 'horas_sobreaviso_dia_medio');
  if (!horasSobreaviso) return { sobreAvisoMensal: 0 };

  const valorHoraSobreaviso = heBase.horaNormalReal * (1 / 3);
  let sobreAvisoMensal = horasSobreaviso * params.diasTrabalhadosMes * valorHoraSobreaviso;

  const valorPago = getNum(dados, 'valor_sobreaviso_pago') || 0;
  sobreAvisoMensal = Math.max(0, sobreAvisoMensal - valorPago);

  return { sobreAvisoMensal };
}

// =============================================================================
// FASE 7 — HORAS EXTRAS E TEMPO À DISPOSIÇÃO
// =============================================================================

interface ResultadoHorasExtras {
  horasExtrasDiariasIntegrais: number;
  horasExtrasDiariasModuladas: number;
  valorMensalHEIntegrais: number;
  valorMensalHEModuladas: number;
  valorMensalHETotal: number;
  mesesModulados: number;
  dataVencimentoRefModulado: Date | null;
  periodoModuladoInfo: PeriodoModulado | null;
}

function calcularHorasExtras(
  dados: DadosExtrasMap, heBase: HoraExtraBase, params: ParametrosBase
): ResultadoHorasExtras {
  let integrais = 0;
  let moduladas = 0;

  const horaInicio = get(dados, 'hora_inicio_media');
  const horaFim = get(dados, 'hora_fim_media');

  // ── Jornada real
  if (horaInicio && horaFim) {
    const [hi, hmi] = horaInicio.split(':').map(Number);
    const [hf, hmf] = horaFim.split(':').map(Number);
    let duracaoBruta = (hf * 60 + hmf - hi * 60 - hmi) / 60;
    if (duracaoBruta < 0) duracaoBruta += 24;
    const intervaloMin = getNum(dados, 'intervalo_refeicao_minutos_medio') || 60;
    const intervaloHoras = intervaloMin / 60;
    const duracaoLiquida = duracaoBruta - intervaloHoras;
    const jornadadContratual = getNum(dados, 'jornada_contratual_diaria_horas') || 8;
    if (duracaoLiquida > jornadadContratual) {
      integrais += duracaoLiquida - jornadadContratual;
    }
  }

  // ── A: Intervalo intrajornada suprimido
  const intervaloReal = getNum(dados, 'intervalo_real_minutos');
  const intervaloMedio = getNum(dados, 'intervalo_refeicao_minutos_medio') || 60;
  const horasSuprimidasIntervalo = intervaloReal
    ? Math.max(0, (60 - intervaloReal) / 60)
    : (intervaloMedio < 60 ? (60 - intervaloMedio) / 60 : 0);

  if (params.regime === 'pre_reforma') {
    integrais += horasSuprimidasIntervalo;
  } else if (params.regime === 'misto' && params.mesesTrabalhados > 0) {
    integrais += horasSuprimidasIntervalo * (params.mesesPreReforma / params.mesesTrabalhados);
  }

  // ── B: Interjornada violada (CLT art. 66)
  const descansoDB = getNum(dados, 'descanso_entre_jornadas_horas_medio');
  if (descansoDB && descansoDB < 11) {
    integrais += 11 - descansoDB;
  }

  // ── C: Descanso coincidia com pausa de condução
  if (getBool(dados, 'descanso_coincidia_com_pausa_conducao')) {
    integrais += 0.5;
  }

  // ── D: Pausa de direção não concedida (Lei do Motorista)
  if (get(dados, 'fazia_pausa_30min_direcao') === 'Nunca' ||
      getBool(dados, 'fazia_pausa_30min_direcao') === false) {
    integrais += 0.5;
  }

  // ── E: Horas in itinere (Súmula 90 TST — apenas pré-reforma)
  if (getBool(dados, 'local_trabalho_acesso_dificil') &&
      getBool(dados, 'empresa_fornecia_transporte')) {
    const tempoMin = getNum(dados, 'tempo_deslocamento_minutos_dia') || 0;
    if (params.regime === 'pre_reforma') {
      integrais += tempoMin / 60;
    } else if (params.regime === 'misto' && params.mesesTrabalhados > 0) {
      integrais += (tempoMin / 60) * (params.mesesPreReforma / params.mesesTrabalhados);
    }
  }

  // ── F: Sistema embarcado / digitação (Art. 72 CLT)
  if (getBool(dados, 'usava_sistema_embarcado_tablet') &&
      get(dados, 'frequencia_lancamentos') === 'alta') {
    integrais += 0.67;
  }

  // ── G: Higienização do veículo
  if (getBool(dados, 'fazia_higienizacao_veiculo')) {
    const tempoHigMin = getNum(dados, 'tempo_higienizacao_minutos_dia') || 0;
    integrais += tempoHigMin / 60;
  }

  // ── H a M: Rubricas MODULADAS (ADI 5322)
  const periodoMod = calcular_periodo_modulado(params.dataAdmissao, params.dataDemissao);

  if (periodoMod.meses_calculados > 0) {
    // H: Tempo de espera carga/descarga
    const tempoEspera = getNum(dados, 'tempo_espera_carga_descarga_horas_dia_medio') || 0;
    if (tempoEspera > 0) {
      const pctPago = getNum(dados, 'percentual_pago_tempo_espera') || 0;
      const pago = getBool(dados, 'tempo_espera_era_pago');
      const percentualNaoPago = pago ? (1 - pctPago / 100) : 1;
      moduladas += tempoEspera * percentualNaoPago;
    }

    // I: Barreiras fiscais
    const tempoBarreira = getNum(dados, 'tempo_fiscalizacao_barreira_horas_dia_medio') || 0;
    moduladas += tempoBarreira;

    // J: Fila de balança
    const tempoBalanca = getNum(dados, 'tempo_balanca_horas_dia_medio') || 0;
    moduladas += tempoBalanca;

    // K: Tempo em berço
    if (getBool(dados, 'dormia_no_veiculo') && getBool(dados, 'era_obrigatorio_permanecer')) {
      const horsBerco = getNum(dados, 'horas_berco_dia_medio') || 0;
      moduladas += horsBerco;
    }

    // L: Repouso com veículo em movimento
    if (getBool(dados, 'repouso_era_feito_com_veiculo_em_movimento')) {
      const hrsRepouso = getNum(dados, 'horas_repouso_invalido_dia_medio') || 0;
      moduladas += hrsRepouso;
    }
  }

  // ── Deduzir horas extras já pagas
  const hePagasMes = getNum(dados, 'horas_extras_pagas_horas_mes_media') || 0;
  const hePagasDia = hePagasMes / params.diasTrabalhadosMes;
  const totalDiario = integrais + moduladas;

  if (totalDiario > 0 && hePagasDia > 0) {
    const propInt = integrais / totalDiario;
    const propMod = moduladas / totalDiario;
    integrais = Math.max(0, integrais - hePagasDia * propInt);
    moduladas = Math.max(0, moduladas - hePagasDia * propMod);
  }

  const valorMensalInt = integrais * params.diasTrabalhadosMes * heBase.horaExtra50;
  const valorMensalMod = moduladas * params.diasTrabalhadosMes * heBase.horaExtra50;

  return {
    horasExtrasDiariasIntegrais: integrais,
    horasExtrasDiariasModuladas: moduladas,
    valorMensalHEIntegrais: valorMensalInt,
    valorMensalHEModuladas: valorMensalMod,
    valorMensalHETotal: valorMensalInt + valorMensalMod,
    mesesModulados: periodoMod.meses_calculados,
    dataVencimentoRefModulado: periodoMod.data_vencimento_ref
      ? new Date(periodoMod.data_vencimento_ref)
      : null,
    periodoModuladoInfo: periodoMod,
  };
}

// =============================================================================
// FASE 8 — REPOUSO SEMANAL EM VIAGENS (MODULADO)
// =============================================================================

interface RepousoViagem {
  repousoNaoConcedido: number;
  fracionamento: number;
  cumulacao: number;
}

function calcularRepousoViagem(
  dados: DadosExtrasMap, rem: RemuneracaoBase, params: ParametrosBase
): RepousoViagem {
  const periodoMod = calcular_periodo_modulado(params.dataAdmissao, params.dataDemissao);
  if (periodoMod.meses_calculados === 0) return { repousoNaoConcedido: 0, fracionamento: 0, cumulacao: 0 };
  if (!getBool(dados, 'fazia_viagens_longa_distancia')) return { repousoNaoConcedido: 0, fracionamento: 0, cumulacao: 0 };

  const remuneracaoSemanal = rem.remuneracaoBaseCorreta / 4.5;
  const semanasEmViagem = getNum(dados, 'semanas_em_viagem_por_mes_media') || 0;
  const meses = periodoMod.meses_calculados;

  let repousoNaoConcedido = 0;
  if (!getBool(dados, 'repouso_semanal_concedido_na_viagem')) {
    repousoNaoConcedido = semanasEmViagem * remuneracaoSemanal * 2 * meses;
  }

  let fracionamento = 0;
  if (getBool(dados, 'repouso_semanal_era_fracionado')) {
    const periodosFrac = getNum(dados, 'periodos_fracionados_mes_medio') || 0;
    fracionamento = periodosFrac * (remuneracaoSemanal * 0.5) * meses;
  }

  let cumulacao = 0;
  if (getBool(dados, 'empresa_acumulava_repousos')) {
    const maxAcum = getNum(dados, 'repousos_acumulados_consecutivos_maximo') || 2;
    const indevidos = maxAcum - 1;
    const ciclosPorMes = semanasEmViagem / maxAcum;
    cumulacao = indevidos * ciclosPorMes * (remuneracaoSemanal * 2) * meses;
  }

  return { repousoNaoConcedido, fracionamento, cumulacao };
}

// =============================================================================
// FASE 9 — DSR (Súmula 172 TST)
// =============================================================================

function calcularDSR(
  heResult: ResultadoHorasExtras, params: ParametrosBase, heBase: HoraExtraBase
): number {
  const totalHorasExtrasMes =
    heResult.horasExtrasDiariasIntegrais * params.diasTrabalhadosMes +
    heResult.horasExtrasDiariasModuladas * params.diasTrabalhadosMes;
  if (totalHorasExtrasMes === 0) return 0;

  const mediaHorasExtrasDia = totalHorasExtrasMes / params.diasTrabalhadosMes;
  const rsrSemanal = mediaHorasExtrasDia * heBase.horaExtra50;
  return rsrSemanal * 4.5;
}

// =============================================================================
// FASE 10 — BASE COM DSR (para reflexos)
// =============================================================================

function calcularBaseComDSR(
  rem: RemuneracaoBase, adicionais: Adicionais,
  heResult: ResultadoHorasExtras, noturno: AdicionalNoturno,
  sobreaviso: Sobreaviso, dsr: number
): number {
  return rem.remuneracaoBaseCorreta
    + adicionais.diferencaPericulosidadeMensal
    + adicionais.diferencaInsalubridade
    + heResult.valorMensalHETotal
    + dsr
    + noturno.adicionalNoturnoMensal
    + sobreaviso.sobreAvisoMensal;
}

// =============================================================================
// FASE 11 — ESTIMATIVA DE VERBAS JÁ RECEBIDAS NA RESCISÃO
// =============================================================================

interface VerbasPagasEstimadas {
  feriasPropPago: number;
  feriasPropTercoPago: number;
  feriasVencidasPago: number;
  decimoTerceiroPropPago: number;
  avisoPrevioBasePago: number;
  multa40Pago: number;
  baseEstimativaEmpresa: number;
}

function estimarVerbasPagasEmpresa(
  dados: DadosExtrasMap, rem: RemuneracaoBase, params: ParametrosBase
): VerbasPagasEstimadas {
  let baseEmpresa = rem.salarioCtps;
  if (getBool(dados, 'periculosidade_paga')) {
    const pct = getNum(dados, 'percentual_periculosidade_pago') || 30;
    baseEmpresa += rem.salarioCtps * (pct / 100);
  }
  if (getBool(dados, 'insalubridade_paga')) {
    const pct = getNum(dados, 'percentual_insalubridade_pago') || 20;
    baseEmpresa += SALARIO_MINIMO * (pct / 100);
  }
  if (getBool(dados, 'adicional_noturno_pago')) {
    baseEmpresa += getNum(dados, 'valor_noturno_pago_mensal') || 0;
  }

  const mesesProp = params.mesesTrabalhados % 12;
  const feriasProp = baseEmpresa * (mesesProp / 12);
  const feriasPropTerco = feriasProp / 3;
  const periodos = getNum(dados, 'periodos_ferias_vencidos_nao_gozados') || 0;
  const feriasVencidas = periodos > 0 ? (baseEmpresa * 2) + (baseEmpresa * 2 / 3) * periodos : 0;
  const decimoTerceiroMeses = params.mesesTrabalhados % 12;
  const decimoTerceiro = baseEmpresa * (decimoTerceiroMeses / 12);
  const diasAvisoPago = getNum(dados, 'dias_aviso_previo_efetivamente_pago') || 0;
  const avisoPrevio = (baseEmpresa / 30) * diasAvisoPago;
  const multa40 = rem.salarioCtps * 0.08 * params.mesesTrabalhados * 0.40;

  return {
    feriasPropPago: feriasProp,
    feriasPropTercoPago: feriasPropTerco,
    feriasVencidasPago: feriasVencidas,
    decimoTerceiroPropPago: decimoTerceiro,
    avisoPrevioBasePago: avisoPrevio,
    multa40Pago: multa40,
    baseEstimativaEmpresa: baseEmpresa,
  };
}

// =============================================================================
// FASE 12 — FÉRIAS
// =============================================================================

function calcularFerias(
  dados: DadosExtrasMap, baseComDSR: number,
  params: ParametrosBase, verbas: VerbasPagasEstimadas
): { prop: number; vencidas: number; multa: number } {
  const mesesProp = params.mesesTrabalhados % 12;
  const feriasPropCorreto = (baseComDSR * (mesesProp / 12)) * (4 / 3);
  const feriasPropPago = verbas.feriasPropPago + verbas.feriasPropTercoPago;
  const prop = Math.max(0, feriasPropCorreto - feriasPropPago);

  const periodos = getNum(dados, 'periodos_ferias_vencidos_nao_gozados') || 0;
  const feriasVencidasCorreto = periodos > 0
    ? ((baseComDSR * 2) + (baseComDSR * 2 / 3)) * periodos
    : 0;
  const vencidas = Math.max(0, feriasVencidasCorreto - verbas.feriasVencidasPago);

  const multa = getBool(dados, 'ferias_pagas_2_dias_antes') === false
    ? baseComDSR
    : 0;

  return { prop, vencidas, multa };
}

// =============================================================================
// FASE 13 — 13º SALÁRIO
// =============================================================================

function calcularDecimoTerceiro(
  dados: DadosExtrasMap, baseComDSR: number,
  rem: RemuneracaoBase, params: ParametrosBase,
  verbas: VerbasPagasEstimadas
): number {
  const mesesProp = params.mesesTrabalhados % 12;
  const decimoPropCorreto = baseComDSR * (mesesProp / 12);

  if (get(dados, 'decimo_terceiro_base_real') === 'Calculava tudo') {
    return 0;
  }

  const anosAnteriores = params.anosCompletos;
  const diferencaMensalBase = baseComDSR - rem.salarioCtps;
  const totalCorreto = decimoPropCorreto + diferencaMensalBase * anosAnteriores;
  return Math.max(0, totalCorreto - verbas.decimoTerceiroPropPago);
}

// =============================================================================
// FASE 14 — AVISO PRÉVIO PROPORCIONAL (Lei 12.506/2011)
// =============================================================================

function calcularAvisoPrevio(
  dados: DadosExtrasMap, baseComDSR: number,
  params: ParametrosBase, verbas: VerbasPagasEstimadas
): number {
  if (!getBool(dados, 'aviso_previo_indenizado')) return 0;

  let diasDevido = 30 + params.anosCompletos * 3;
  if (diasDevido > 90) diasDevido = 90;

  const diasPago = getNum(dados, 'dias_aviso_previo_efetivamente_pago') || 0;
  if (diasPago >= diasDevido) return 0;

  const diasDiferenca = diasDevido - diasPago;
  const valorCorreto = (baseComDSR / 30) * diasDiferenca;
  const valorPago = verbas.avisoPrevioBasePago;
  return Math.max(0, valorCorreto - valorPago);
}

// =============================================================================
// FASE 15 — FGTS
// =============================================================================

interface ResultadoFGTS {
  diferencaMensal: number;
  fgtsSobreAviso: number;
  multa40: number;
  contrib10: number;
  baseFGTSMensal: number;
}

function calcularFGTS(
  dados: DadosExtrasMap, rem: RemuneracaoBase, adicionais: Adicionais,
  heResult: ResultadoHorasExtras, noturno: AdicionalNoturno,
  sobreaviso: Sobreaviso, dsr: number,
  params: ParametrosBase, verbas: VerbasPagasEstimadas
): ResultadoFGTS {
  const baseFGTS = rem.remuneracaoBaseCorreta
    + adicionais.diferencaPericulosidadeMensal
    + adicionais.diferencaInsalubridade
    + heResult.valorMensalHETotal
    + dsr
    + noturno.adicionalNoturnoMensal
    + sobreaviso.sobreAvisoMensal;

  const fgtsMensalCorreto = baseFGTS * 0.08;

  let diferencaMensal = 0;
  if (!getBool(dados, 'fgts_depositado_corretamente')) {
    const fgtsMensalPago = rem.salarioCtps * 0.08;
    diferencaMensal = Math.max(0, (fgtsMensalCorreto - fgtsMensalPago) * params.mesesTrabalhados);
  }

  const diasAvisoDevido = Math.min(90, 30 + params.anosCompletos * 3);
  const fgtsSobreAviso = getBool(dados, 'aviso_previo_indenizado')
    ? (baseFGTS / 30) * diasAvisoDevido * 0.08
    : 0;

  const modalidade = get(dados, 'modalidade_desligamento') || '';
  const multa40 = modalidade.includes('dispensa_sem_justa_causa') ||
    modalidade.includes('Dispensa sem justa causa')
    ? (fgtsMensalCorreto * params.mesesTrabalhados + fgtsSobreAviso) * 0.40 - verbas.multa40Pago
    : 0;

  let contrib10 = 0;
  if ((multa40 > 0) && params.dataDemissao <= new Date('2019-09-13')) {
    contrib10 = (fgtsMensalCorreto * params.mesesTrabalhados + fgtsSobreAviso) * 0.10;
  }

  return {
    diferencaMensal,
    fgtsSobreAviso: Math.max(0, fgtsSobreAviso),
    multa40: Math.max(0, multa40),
    contrib10,
    baseFGTSMensal: baseFGTS,
  };
}

// =============================================================================
// FASE 16 — MULTAS RESCISÓRIAS
// =============================================================================

function calcularMultasRescisorias(
  dados: DadosExtrasMap, baseComDSR: number
): { multa477: number; multa467: number; multaNormativa: number } {
  const multa477 = getBool(dados, 'rescisao_paga_10_dias') === false ? baseComDSR : 0;

  let multa467 = 0;
  if (getBool(dados, 'verbas_incontroversas_atrasadas')) {
    const valor = getNum(dados, 'valor_verbas_incontroversas') || 0;
    multa467 = valor * 0.50;
  }

  let multaNormativa = 0;
  if (getBool(dados, 'havia_convencao_coletiva') &&
      !getBool(dados, 'empresa_cumpria_convencao')) {
    multaNormativa = getNum(dados, 'valor_multa_normativa_convencao') || 0;
  }

  return { multa477, multa467, multaNormativa };
}

// =============================================================================
// FASE 17 — VERBAS DIVERSAS
// =============================================================================

function calcularVerbasDiversas(
  dados: DadosExtrasMap, rem: RemuneracaoBase, params: ParametrosBase
): {
  transferencia: number; descontosIndevidos: number;
  valeTransporte: number; seguroDesemprego: number; planoSaude: number;
} {
  let transferencia = 0;
  if (getBool(dados, 'foi_transferido') && !getBool(dados, 'transferencia_definitiva')) {
    const mesesTransf = getNum(dados, 'meses_transferido') || 0;
    transferencia = rem.salarioCtps * 0.25 * mesesTransf;
  }

  let descontosIndevidos = 0;
  if (getBool(dados, 'empresa_fazia_descontos_indevidos')) {
    const valorMedio = getNum(dados, 'valor_medio_desconto_mensal') || 0;
    descontosIndevidos = valorMedio * params.mesesTrabalhados * 2;
  }

  let valeTransporte = 0;
  if (getBool(dados, 'precisava_deslocamento_ate_patio') &&
      !getBool(dados, 'recebia_vale_transporte')) {
    const custo = getNum(dados, 'custo_medio_transporte_mensal') || 0;
    valeTransporte = custo * params.mesesTrabalhados;
  }

  let seguroDesemprego = 0;
  if (!getBool(dados, 'conseguiu_receber_seguro')) {
    seguroDesemprego = getNum(dados, 'valor_parcelas_seguro_perdidas') || 0;
  }

  let planoSaude = 0;
  if (getBool(dados, 'tinha_plano_saude_empresa') &&
      getBool(dados, 'contribuia_plano') &&
      !getBool(dados, 'empresa_manteve_plano_pos_demissao')) {
    const custo = getNum(dados, 'custo_plano_mensal') || 0;
    const meses = getNum(dados, 'meses_manutencao_devidos') || 3;
    planoSaude = custo * meses;
  }

  return { transferencia, descontosIndevidos, valeTransporte, seguroDesemprego, planoSaude };
}

// =============================================================================
// FASE 18 — DANOS MORAIS E EXISTENCIAL
// =============================================================================

function calcularDanos(dados: DadosExtrasMap): {
  danoMoralAssedio: number; danoMoralRevista: number;
  danoExistencial: number; dispensaDiscriminatoria: number;
} {
  let danoMoralAssedio = 0;
  if (getBool(dados, 'sofreu_assedio_moral')) {
    const gravidade = get(dados, 'gravidade_assedio') || 'medio';
    const valores: Record<string, number> = { leve: 5000, medio: 15000, grave: 30000 };
    danoMoralAssedio = valores[gravidade.toLowerCase()] || 10000;
  }

  const danoMoralRevista = getBool(dados, 'sofreu_revista_intima') ? 10000 : 0;

  let danoExistencial = 0;
  if (getBool(dados, 'jornada_habitual_superior_12h') ||
      ((getNum(dados, 'periodos_fora_de_casa') || 0) > 7 &&
       getBool(dados, 'impacto_familiar_declarado'))) {
    danoExistencial = 10000;
  }

  let dispensaDiscriminatoria = 0;
  if (getBool(dados, 'motivo_real_dispensa_suspeito')) {
    dispensaDiscriminatoria = 20000;
  }

  return { danoMoralAssedio, danoMoralRevista, danoExistencial, dispensaDiscriminatoria };
}

// =============================================================================
// FASE 19 — ACIDENTE E DOENÇA OCUPACIONAL
// =============================================================================

function calcularAcidenteDoenca(
  dados: DadosExtrasMap, rem: RemuneracaoBase
): {
  lucrosCessantes: number; ressarcimentoMedico: number;
  danoMoralAcidente: number; pensaoVitalicia: number | null;
} {
  if (!getBool(dados, 'houve_acidente_ou_doenca') && !getBool(dados, 'doenca_ocupacional')) {
    return { lucrosCessantes: 0, ressarcimentoMedico: 0, danoMoralAcidente: 0, pensaoVitalicia: null };
  }

  const periodoAfastamento = getNum(dados, 'periodo_afastamento_meses') || 0;
  const valorAuxilio = getNum(dados, 'valor_auxilio_recebido') || 0;
  const lucrosCessantesMensal = Math.max(0, rem.remuneracaoBaseCorreta - valorAuxilio);
  const lucrosCessantes = lucrosCessantesMensal * periodoAfastamento;

  const ressarcimentoMedico = getBool(dados, 'gastos_medicos_comprovados')
    ? getNum(dados, 'valor_gastos_medicos') || 0
    : 0;

  let danoMoralAcidente = 0;
  if (getBool(dados, 'sequela_atual')) {
    const gravidade = get(dados, 'gravidade_sequela') || 'media';
    const valores: Record<string, number> = { leve: 10000, media: 25000, grave: 60000 };
    danoMoralAcidente = valores[gravidade.toLowerCase()] || 10000;
  }

  let pensaoVitalicia: number | null = null;
  const dataNasc = getDate(dados, 'data_nascimento');
  const grauIncapacidade = get(dados, 'grau_incapacidade') || '';
  const pctIncapacidade = getNum(dados, 'percentual_incapacidade') || 25;

  if (dataNasc && getBool(dados, 'sequela_atual')) {
    const idadeAtual = Math.floor(mesesEntreDatas(dataNasc, DATA_CALCULO) / 12);
    const mesesRestantes = Math.max(0, (75 - idadeAtual) * 12);
    let pensaoMensal = 0;
    if (grauIncapacidade.includes('total')) {
      pensaoMensal = rem.remuneracaoBaseCorreta;
    } else {
      pensaoMensal = rem.remuneracaoBaseCorreta * (pctIncapacidade / 100);
    }
    pensaoVitalicia = pensaoMensal * mesesRestantes;
  }

  return { lucrosCessantes, ressarcimentoMedico, danoMoralAcidente, pensaoVitalicia };
}

// =============================================================================
// FASE 20 — DOMINGOS SEM COMPENSAÇÃO
// =============================================================================

function calcularDomingos(
  dados: DadosExtrasMap, heBase: HoraExtraBase, params: ParametrosBase
): number {
  if (!getBool(dados, 'trabalhava_domingos')) return 0;
  if (get(dados, 'recebia_folga_compensatoria') === 'Sempre') return 0;

  const domingosPorMes = getNum(dados, 'domingos_trabalhados_mes_medio') || 0;
  const valorDomingoEmDobro = heBase.horaNormalReal * 8 * 2;
  return domingosPorMes * params.mesesTrabalhados * valorDomingoEmDobro;
}

// =============================================================================
// FASE 21 — INDENIZAÇÃO DE INTERVALO (pós-reforma) e INTERJORNADA
// =============================================================================

function calcularIndenizacoesIntervalo(
  dados: DadosExtrasMap, heBase: HoraExtraBase, params: ParametrosBase
): { indenizacaoIntervalo: number; indenizacaoInterjornada: number } {
  let indenizacaoIntervalo = 0;
  const intervaloMedio = getNum(dados, 'intervalo_refeicao_minutos_medio') || 60;
  const horasSuprimidas = Math.max(0, (60 - intervaloMedio) / 60);

  if (horasSuprimidas > 0) {
    const indenizacaoDiaria = horasSuprimidas * heBase.horaNormalReal * 0.50;
    if (params.regime === 'pos_reforma') {
      indenizacaoIntervalo = indenizacaoDiaria * params.diasTrabalhadosMes * params.mesesTrabalhados;
    } else if (params.regime === 'misto') {
      indenizacaoIntervalo = indenizacaoDiaria * params.diasTrabalhadosMes * params.mesesPosReforma;
    }
  }

  let indenizacaoInterjornada = 0;
  if (getBool(dados, 'violacao_interjornada')) {
    const freq = get(dados, 'frequencia_violacao_interjornada') || '';
    const valores: Record<string, number> = {
      'Quase sempre': 20000,
      'Frequentemente': 12000,
      'Às vezes': 7000,
      'Raramente': 3000,
    };
    indenizacaoInterjornada = valores[freq] || 10000;
  }

  return { indenizacaoIntervalo, indenizacaoInterjornada };
}

// =============================================================================
// FASE 22 — GRATIFICAÇÃO DE FUNÇÃO SUPRIMIDA
// =============================================================================

function calcularGratificacaoSuprimida(
  dados: DadosExtrasMap, rem: RemuneracaoBase, params: ParametrosBase
): number {
  if (!rem.diferencaGratificacao || rem.mesesGratificacaoSuprimida === 0) return 0;
  return rem.diferencaGratificacao * rem.mesesGratificacaoSuprimida;
}

// =============================================================================
// MONTAGEM DAS RUBRICAS INDIVIDUAIS (RubricaResult[])
// =============================================================================

// Helper interno para intervalo pré-reforma
function horasSuprimidasIntervaloPre(dados: DadosExtrasMap, params: ParametrosBase): number {
  if (params.regime === 'pos_reforma') return 0;
  const intervaloReal = getNum(dados, 'intervalo_real_minutos');
  const intervaloMedio = getNum(dados, 'intervalo_refeicao_minutos_medio') || 60;
  const min = intervaloReal !== null ? intervaloReal : intervaloMedio;
  return Math.max(0, (60 - min) / 60);
}

function montarRubricas(
  dados: DadosExtrasMap,
  params: ParametrosBase,
  rem: RemuneracaoBase,
  adicionais: Adicionais,
  heBase: HoraExtraBase,
  noturno: AdicionalNoturno,
  sobreaviso: Sobreaviso,
  heResult: ResultadoHorasExtras,
  repouso: RepousoViagem,
  dsr: number,
  baseComDSR: number,
  ferias: { prop: number; vencidas: number; multa: number },
  decimoTerceiro: number,
  avisoPrevio: number,
  fgts: ResultadoFGTS,
  multas: { multa477: number; multa467: number; multaNormativa: number },
  verbas: { transferencia: number; descontosIndevidos: number; valeTransporte: number; seguroDesemprego: number; planoSaude: number },
  danos: { danoMoralAssedio: number; danoMoralRevista: number; danoExistencial: number; dispensaDiscriminatoria: number },
  acidente: { lucrosCessantes: number; ressarcimentoMedico: number; danoMoralAcidente: number; pensaoVitalicia: number | null },
  domingos: number,
  intervalos: { indenizacaoIntervalo: number; indenizacaoInterjornada: number },
  gratSuprimida: number,
  periodoMod: PeriodoModulado
): RubricaResult[] {
  const dm = params.dataMediaContrato;
  const dd = params.dataDemissao;
  const dvMod = heResult.dataVencimentoRefModulado;

  const r = (
    id: string, nome: string, categoria: string,
    nominal: number, dataBase: Date,
    modulado = false, camposFaltantes: string[] = []
  ): RubricaResult => {
    if (nominal === 0) {
      return {
        id, nome, categoria, valorNominal: 0, valorAtualizado: 0,
        calculavel: true, camposFaltantes, modulado,
        mesesCalculados: modulado ? heResult.mesesModulados : params.mesesTrabalhados,
      };
    }
    return {
      id, nome, categoria,
      valorNominal: Math.round(nominal * 100) / 100,
      valorAtualizado: Math.round(atualizarValor(nominal, dataBase) * 100) / 100,
      calculavel: true, camposFaltantes, modulado,
      mesesCalculados: modulado ? heResult.mesesModulados : params.mesesTrabalhados,
      dataVencimentoRef: dataBase.toISOString(),
    };
  };

  return [
    // ── HORAS EXTRAS
    r('he_integral', 'Horas Extras (CLT)', 'Horas Extras',
      heResult.valorMensalHEIntegrais * params.mesesTrabalhados, dm),
    r('he_modulada', 'Tempo à Disposição (modulação STF)', 'Horas Extras',
      heResult.valorMensalHEModuladas * heResult.mesesModulados,
      dvMod || dm, true),
    r('domingos', 'Domingos sem Compensação', 'Horas Extras',
      domingos, dm),

    // ── INTERVALOS
    r('intervalo_suprimido', 'Intervalo Intrajornada Suprimido', 'Intervalos',
      horasSuprimidasIntervaloPre(dados, params) * params.diasTrabalhadosMes * heBase.horaExtra50 * params.mesesPreReforma, dm),
    r('intervalo_pos_reforma', 'Indenização Intervalo Pós-Reforma', 'Intervalos',
      intervalos.indenizacaoIntervalo, dm),
    r('interjornada', 'Interjornada Violada (CLT art. 66)', 'Intervalos',
      (getNum(dados, 'descanso_entre_jornadas_horas_medio') || 11) < 11
        ? ((11 - (getNum(dados, 'descanso_entre_jornadas_horas_medio') || 11)) * params.diasTrabalhadosMes * heBase.horaExtra50 * params.mesesTrabalhados)
        : 0, dm),
    r('indenizacao_interjornada', 'Indenização Autônoma por Violação Habitual', 'Intervalos',
      intervalos.indenizacaoInterjornada, dd),

    // ── REPOUSO SEMANAL (MODULADO)
    r('repouso_nao_concedido', 'Repouso Não Concedido em Viagem', 'Repouso Semanal',
      repouso.repousoNaoConcedido, dvMod || dm, true),
    r('repouso_fracionamento', 'Fracionamento Indevido do Repouso', 'Repouso Semanal',
      repouso.fracionamento, dvMod || dm, true),
    r('repouso_cumulacao', 'Cumulação Indevida de Repousos', 'Repouso Semanal',
      repouso.cumulacao, dvMod || dm, true),

    // ── ADICIONAIS
    r('noturno', 'Adicional Noturno', 'Adicionais',
      noturno.adicionalNoturnoMensal * params.mesesTrabalhados, dm),
    r('periculosidade', 'Adicional de Periculosidade', 'Adicionais',
      adicionais.diferencaPericulosidadeMensal * params.mesesTrabalhados, dm),
    r('insalubridade', 'Adicional de Insalubridade', 'Adicionais',
      adicionais.diferencaInsalubridade * params.mesesTrabalhados, dm),
    r('sobreaviso', 'Sobreaviso (Súmula 428 TST)', 'Adicionais',
      sobreaviso.sobreAvisoMensal * params.mesesTrabalhados, dm),
    r('transferencia', 'Adicional de Transferência', 'Adicionais',
      verbas.transferencia, dm),
    r('equiparacao', 'Diferença por Equiparação Salarial', 'Adicionais',
      rem.diferencaEquiparacao * params.mesesTrabalhados, dm),
    r('acumulo_funcao', 'Adicional por Acúmulo de Função', 'Adicionais',
      rem.adicionalAcumulo * params.mesesTrabalhados, dm),
    r('gratif_suprimida', 'Gratificação de Função Suprimida', 'Adicionais',
      gratSuprimida, dm),

    // ── REFLEXOS
    r('dsr', 'DSR sobre Horas Extras (Súmula 172)', 'Reflexos',
      dsr * params.mesesTrabalhados, dm),
    r('ferias_prop', 'Diferença Férias Proporcionais', 'Reflexos',
      ferias.prop, dd),
    r('ferias_vencidas', 'Férias Vencidas Não Gozadas (dobro)', 'Reflexos',
      ferias.vencidas, dm),
    r('multa_ferias', 'Multa Férias Pagas Fora do Prazo', 'Reflexos',
      ferias.multa, dd),
    r('decimo_terceiro', 'Diferença 13º Salário', 'Reflexos',
      decimoTerceiro, dm),
    r('aviso_previo', 'Diferença Aviso Prévio Proporcional', 'Reflexos',
      avisoPrevio, dd),

    // ── FGTS
    r('fgts_diferenca', 'Diferença FGTS Mensal', 'FGTS',
      fgts.diferencaMensal, dm),
    r('fgts_aviso', 'FGTS sobre Aviso Prévio Indenizado', 'FGTS',
      fgts.fgtsSobreAviso, dd),
    r('multa_fgts', 'Multa 40% FGTS', 'FGTS',
      fgts.multa40, dd),
    r('contrib_social', 'Contribuição Social 10% (LC 110/2001)', 'FGTS',
      fgts.contrib10, dd),

    // ── MULTAS RESCISÓRIAS
    r('multa_477', 'Multa Art. 477 (Atraso Rescisório)', 'Multas Rescisórias',
      multas.multa477, dd),
    r('multa_467', 'Multa Art. 467 (Verbas Incontroversas)', 'Multas Rescisórias',
      multas.multa467, dd),
    r('multa_normativa', 'Multa Normativa (Convenção Coletiva)', 'Multas Rescisórias',
      multas.multaNormativa, dd),

    // ── VERBAS DIVERSAS
    r('descontos_indevidos', 'Descontos Indevidos (devolução em dobro)', 'Verbas Diversas',
      verbas.descontosIndevidos, dm),
    r('vale_transporte', 'Vale-Transporte Não Fornecido', 'Verbas Diversas',
      verbas.valeTransporte, dm),
    r('seguro_desemprego', 'Seguro Desemprego Impedido', 'Verbas Diversas',
      verbas.seguroDesemprego, dd),
    r('plano_saude', 'Plano de Saúde Pós-Demissão', 'Verbas Diversas',
      verbas.planoSaude, dd),

    // ── DANOS
    r('dano_existencial', 'Dano Existencial', 'Danos',
      danos.danoExistencial, dd),
    r('dano_assedio', 'Dano Moral por Assédio', 'Danos',
      danos.danoMoralAssedio, dd),
    r('dano_revista', 'Dano Moral por Revista Íntima', 'Danos',
      danos.danoMoralRevista, dd),
    r('dispensa_discriminatoria', 'Dispensa Discriminatória', 'Danos',
      danos.dispensaDiscriminatoria, dd),

    // ── ACIDENTE E DOENÇA
    r('lucros_cessantes', 'Lucros Cessantes (período de afastamento)', 'Acidente e Doença',
      acidente.lucrosCessantes, dm),
    r('ressarcimento_medico', 'Ressarcimento de Gastos Médicos', 'Acidente e Doença',
      acidente.ressarcimentoMedico, dm),
    r('dano_moral_acidente', 'Dano Moral por Acidente/Doença', 'Acidente e Doença',
      acidente.danoMoralAcidente, dd),
  ];
}

// =============================================================================
// FUNÇÃO PRINCIPAL: calcularTudo
// =============================================================================

export function calcularTudo(dados: DadosExtrasMap): CalculoCompleto {
  const params = calcularParametrosBase(dados);
  if (!params) {
    return {
      categorias: [],
      subtotalIntegralNominal: 0, subtotalIntegralAtualizado: 0,
      subtotalModuladoNominal: 0, subtotalModuladoAtualizado: 0,
      totalGeralNominal: 0, totalGeralAtualizado: 0,
      pensaoVitalicia: null, totalComPensao: null,
      erro: 'Data de admissão não informada — cálculo impossível.',
    };
  }

  const rem = calcularRemuneracaoBase(dados, params);
  if (!rem) {
    return {
      categorias: [],
      subtotalIntegralNominal: 0, subtotalIntegralAtualizado: 0,
      subtotalModuladoNominal: 0, subtotalModuladoAtualizado: 0,
      totalGeralNominal: 0, totalGeralAtualizado: 0,
      pensaoVitalicia: null, totalComPensao: null,
      erro: 'Salário base não informado — cálculo impossível.',
    };
  }

  // Cascata de cálculos
  const adicionais = calcularAdicionais(dados, rem);
  const heBase = calcularBaseHoraExtra(rem, adicionais, params);
  const noturno = calcularAdicionalNoturno(dados, heBase, params);
  const sobreaviso = calcularSobreaviso(dados, heBase, params);
  const heResult = calcularHorasExtras(dados, heBase, params);
  const repouso = calcularRepousoViagem(dados, rem, params);
  const dsr = calcularDSR(heResult, params, heBase);
  const baseComDSR = calcularBaseComDSR(rem, adicionais, heResult, noturno, sobreaviso, dsr);
  const verbaPagas = estimarVerbasPagasEmpresa(dados, rem, params);
  const ferias = calcularFerias(dados, baseComDSR, params, verbaPagas);
  const decimoTerceiro = calcularDecimoTerceiro(dados, baseComDSR, rem, params, verbaPagas);
  const avisoPrevio = calcularAvisoPrevio(dados, baseComDSR, params, verbaPagas);
  const fgts = calcularFGTS(dados, rem, adicionais, heResult, noturno, sobreaviso, dsr, params, verbaPagas);
  const multas = calcularMultasRescisorias(dados, baseComDSR);
  const verbasDiv = calcularVerbasDiversas(dados, rem, params);
  const danos = calcularDanos(dados);
  const acidente = calcularAcidenteDoenca(dados, rem);
  const domingos = calcularDomingos(dados, heBase, params);
  const intervalos = calcularIndenizacoesIntervalo(dados, heBase, params);
  const gratSuprimida = calcularGratificacaoSuprimida(dados, rem, params);
  const periodoMod = calcular_periodo_modulado(params.dataAdmissao, params.dataDemissao);

  // Montar rubricas
  const todasRubricas = montarRubricas(
    dados, params, rem, adicionais, heBase, noturno, sobreaviso,
    heResult, repouso, dsr, baseComDSR, ferias, decimoTerceiro,
    avisoPrevio, fgts, multas, verbasDiv, danos, acidente,
    domingos, intervalos, gratSuprimida, periodoMod
  );

  // Pensão vitalícia (separada — não integra o total)
  const pensaoVitalicia = acidente.pensaoVitalicia;

  // Agrupar por categoria
  const categoriasMap = new Map<string, RubricaResult[]>();
  for (const rub of todasRubricas) {
    if (!categoriasMap.has(rub.categoria)) {
      categoriasMap.set(rub.categoria, []);
    }
    categoriasMap.get(rub.categoria)!.push(rub);
  }

  const categorias: CategoriaResult[] = Array.from(categoriasMap.entries()).map(([nome, rubricasCat]) => ({
    nome,
    rubricas: rubricasCat,
    totalNominal: rubricasCat.reduce((s, r) => s + (r.valorNominal || 0), 0),
    totalAtualizado: rubricasCat.reduce((s, r) => s + (r.valorAtualizado || 0), 0),
  }));

  // Subtotais
  const integrais = todasRubricas.filter(r => !r.modulado);
  const moduladasList = todasRubricas.filter(r => r.modulado);

  const subtotalIntegralNominal = integrais.reduce((s, r) => s + (r.valorNominal || 0), 0);
  const subtotalIntegralAtualizado = integrais.reduce((s, r) => s + (r.valorAtualizado || 0), 0);
  const subtotalModuladoNominal = moduladasList.reduce((s, r) => s + (r.valorNominal || 0), 0);
  const subtotalModuladoAtualizado = moduladasList.reduce((s, r) => s + (r.valorAtualizado || 0), 0);

  const totalGeralNominal = subtotalIntegralNominal + subtotalModuladoNominal;
  const totalGeralAtualizado = subtotalIntegralAtualizado + subtotalModuladoAtualizado;

  return {
    categorias,
    subtotalIntegralNominal: Math.round(subtotalIntegralNominal * 100) / 100,
    subtotalIntegralAtualizado: Math.round(subtotalIntegralAtualizado * 100) / 100,
    subtotalModuladoNominal: Math.round(subtotalModuladoNominal * 100) / 100,
    subtotalModuladoAtualizado: Math.round(subtotalModuladoAtualizado * 100) / 100,
    totalGeralNominal: Math.round(totalGeralNominal * 100) / 100,
    totalGeralAtualizado: Math.round(totalGeralAtualizado * 100) / 100,
    pensaoVitalicia: pensaoVitalicia !== null ? Math.round(pensaoVitalicia * 100) / 100 : null,
    totalComPensao: pensaoVitalicia !== null
      ? Math.round((totalGeralAtualizado + pensaoVitalicia) * 100) / 100
      : null,
    metadados: {
      dataCalculo: DATA_CALCULO.toISOString(),
      mesesTrabalhados: params.mesesTrabalhados,
      remuneracaoBaseCorreta: Math.round(rem.remuneracaoBaseCorreta * 100) / 100,
      baseComDSR: Math.round(baseComDSR * 100) / 100,
      divisorUtilizado: params.divisor,
      regime: params.regime,
      modulacaoSTF: periodoMod,
      baseEstimativaEmpresa: Math.round(verbaPagas.baseEstimativaEmpresa * 100) / 100,
      aviso: 'Estimativa técnica. Valores reais dependem de comprovação documental. ' +
             'Dedução de verbas rescisórias estimada com base no salário CTPS e adicionais declarados.',
    },
  };
}

// =============================================================================
// FUNÇÃO: estimarImpactoCampo
// Usada pelo Painel 2 (Lacunas) para ordenar perguntas por impacto financeiro
// =============================================================================

export function estimarImpactoCampo(
  campo: string,
  dadosAtuais: DadosExtrasMap
): number {
  const params = calcularParametrosBase(dadosAtuais);
  if (!params) return 0;

  const rem = calcularRemuneracaoBase(dadosAtuais, params);
  const salario = rem?.salarioCtps || getNum(dadosAtuais, 'salario_ctps_mensal') || 2000;
  const meses = params.mesesTrabalhados || 24;
  const horaNormal = salario / (params.divisor || 220);

  const impactos: Record<string, number> = {
    // Campos críticos — bloqueiam tudo
    salario_ctps_mensal: salario * meses * 0.5,
    data_admissao: salario * meses * 0.3,

    // Jornada — alto impacto
    hora_inicio_media: horaNormal * 2 * params.diasTrabalhadosMes * meses,
    hora_fim_media: horaNormal * 2 * params.diasTrabalhadosMes * meses,
    descanso_entre_jornadas_horas_medio: horaNormal * 1.5 * params.diasTrabalhadosMes * meses,

    // Tempo à disposição (modulado — desde 12/07/2023)
    tempo_espera_carga_descarga_horas_dia_medio: horaNormal * 1.5 * params.diasTrabalhadosMes * Math.min(meses, 20),
    tempo_fiscalizacao_barreira_horas_dia_medio: horaNormal * 1.5 * params.diasTrabalhadosMes * Math.min(meses, 20),

    // Adicionais sobre base completa
    periculosidade_devida: salario * 0.30 * meses,
    insalubridade_devida: SALARIO_MINIMO * 0.20 * meses,
    adicional_noturno_pago: salario * 0.10 * meses,

    // Repouso viagem
    repouso_semanal_concedido_na_viagem: (salario / 4.5) * 2 * Math.min(meses, 20),

    // Rescisão
    fgts_depositado_corretamente: salario * 0.08 * meses * 1.4,
    modalidade_desligamento: salario * 0.08 * meses * 0.40,
    aviso_previo_indenizado: (salario / 30) * 30 * 1.1,

    // Danos
    houve_acidente_ou_doenca: 30000,
    sofreu_assedio_moral: 15000,
    sequela_atual: 25000,

    // Férias
    periodos_ferias_vencidos_nao_gozados: salario * 2.67,
    ferias_pagas_2_dias_antes: salario,

    // Domingos
    trabalhava_domingos: horaNormal * 8 * 2 * 4 * meses,

    // Equiparação
    salario_paradigma: salario * 0.20 * meses,

    // Outros
    empresa_fazia_descontos_indevidos: 300 * meses * 2,
    ficava_de_sobreaviso: salario * 0.11 * meses,
  };

  return Math.round((impactos[campo] || 500) * 100) / 100;
}
