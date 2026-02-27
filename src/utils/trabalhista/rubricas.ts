// ========================================
// Definição de Categorias e Rubricas v5.2
// Alinhado com montarRubricas() em calculator.ts
// ========================================

export interface RubricaDef {
  id: string;
  nome: string;
  categoria: string;
  camposNecessarios: string[];
  modulavel: boolean;
  descricao?: string;
}

export const CATEGORIAS: Array<{ id: string; nome: string }> = [
  { id: "horas_extras", nome: "Horas Extras" },
  { id: "intervalos", nome: "Intervalos" },
  { id: "repouso_semanal", nome: "Repouso Semanal" },
  { id: "adicionais", nome: "Adicionais" },
  { id: "reflexos", nome: "Reflexos" },
  { id: "fgts", nome: "FGTS" },
  { id: "multas_rescisorias", nome: "Multas Rescisórias" },
  { id: "verbas_diversas", nome: "Verbas Diversas" },
  { id: "danos", nome: "Danos" },
  { id: "acidente_doenca", nome: "Acidente e Doença" },
];

export const RUBRICAS: RubricaDef[] = [
  // ── HORAS EXTRAS
  {
    id: "he_integral", nome: "Horas Extras (CLT)", categoria: "Horas Extras",
    camposNecessarios: ["hora_inicio_media", "hora_fim_media"],
    modulavel: false,
    descricao: "Horas extras integrais pela jornada excedente, intervalos suprimidos e demais verbas pré-modulação.",
  },
  {
    id: "he_modulada", nome: "Tempo à Disposição (modulação STF)", categoria: "Horas Extras",
    camposNecessarios: ["tempo_espera_carga_descarga_horas_dia_medio"],
    modulavel: true,
    descricao: "Tempo de espera, barreiras, balança e berço — modulação ADI 5322 a partir de 12/07/2023.",
  },
  {
    id: "domingos", nome: "Domingos sem Compensação", categoria: "Horas Extras",
    camposNecessarios: ["trabalhava_domingos", "domingos_trabalhados_mes_medio"],
    modulavel: false,
    descricao: "Domingos trabalhados sem folga compensatória, pagos em dobro.",
  },

  // ── INTERVALOS
  {
    id: "intervalo_suprimido", nome: "Intervalo Intrajornada Suprimido", categoria: "Intervalos",
    camposNecessarios: ["intervalo_refeicao_minutos_medio"],
    modulavel: false,
    descricao: "Intervalo intrajornada inferior a 1 hora (período pré-reforma — natureza salarial).",
  },
  {
    id: "intervalo_pos_reforma", nome: "Indenização Intervalo Pós-Reforma", categoria: "Intervalos",
    camposNecessarios: ["intervalo_refeicao_minutos_medio"],
    modulavel: false,
    descricao: "Indenização de 50% sobre o período suprimido (pós-reforma — natureza indenizatória).",
  },
  {
    id: "interjornada", nome: "Interjornada Violada (CLT art. 66)", categoria: "Intervalos",
    camposNecessarios: ["descanso_entre_jornadas_horas_medio"],
    modulavel: false,
    descricao: "Descanso entre jornadas inferior a 11 horas.",
  },
  {
    id: "indenizacao_interjornada", nome: "Indenização Autônoma por Violação Habitual", categoria: "Intervalos",
    camposNecessarios: ["violacao_interjornada", "frequencia_violacao_interjornada"],
    modulavel: false,
    descricao: "Indenização por violação habitual e sistemática da interjornada.",
  },

  // ── REPOUSO SEMANAL (MODULADO)
  {
    id: "repouso_nao_concedido", nome: "Repouso Não Concedido em Viagem", categoria: "Repouso Semanal",
    camposNecessarios: ["fazia_viagens_longa_distancia", "repouso_semanal_concedido_na_viagem"],
    modulavel: true,
    descricao: "Repouso semanal não concedido durante viagens de longa distância.",
  },
  {
    id: "repouso_fracionamento", nome: "Fracionamento Indevido do Repouso", categoria: "Repouso Semanal",
    camposNecessarios: ["repouso_semanal_era_fracionado", "periodos_fracionados_mes_medio"],
    modulavel: true,
    descricao: "Fracionamento indevido do descanso semanal em viagem.",
  },
  {
    id: "repouso_cumulacao", nome: "Cumulação Indevida de Repousos", categoria: "Repouso Semanal",
    camposNecessarios: ["empresa_acumulava_repousos", "repousos_acumulados_consecutivos_maximo"],
    modulavel: true,
    descricao: "Acúmulo forçado de repousos semanais consecutivos.",
  },

  // ── ADICIONAIS
  {
    id: "noturno", nome: "Adicional Noturno", categoria: "Adicionais",
    camposNecessarios: ["dirigia_apos_22", "horas_noturnas_dia_media"],
    modulavel: false,
    descricao: "Adicional noturno de 20% sobre horas entre 22h e 5h, com hora reduzida.",
  },
  {
    id: "periculosidade", nome: "Adicional de Periculosidade", categoria: "Adicionais",
    camposNecessarios: ["periculosidade_devida"],
    modulavel: false,
    descricao: "Adicional de 30% sobre a remuneração base por exposição a risco.",
  },
  {
    id: "insalubridade", nome: "Adicional de Insalubridade", categoria: "Adicionais",
    camposNecessarios: ["insalubridade_devida"],
    modulavel: false,
    descricao: "Adicional sobre o salário mínimo por condições insalubres.",
  },
  {
    id: "sobreaviso", nome: "Sobreaviso (Súmula 428 TST)", categoria: "Adicionais",
    camposNecessarios: ["ficava_de_sobreaviso", "horas_sobreaviso_dia_medio"],
    modulavel: false,
    descricao: "Remuneração de 1/3 da hora normal pelo período em sobreaviso.",
  },
  {
    id: "transferencia", nome: "Adicional de Transferência", categoria: "Adicionais",
    camposNecessarios: ["foi_transferido"],
    modulavel: false,
    descricao: "Adicional de 25% do salário durante transferência provisória.",
  },
  {
    id: "equiparacao", nome: "Diferença por Equiparação Salarial", categoria: "Adicionais",
    camposNecessarios: ["existe_equiparacao", "salario_paradigma"],
    modulavel: false,
    descricao: "Diferença salarial entre reclamante e paradigma em função equivalente.",
  },
  {
    id: "acumulo_funcao", nome: "Adicional por Acúmulo de Função", categoria: "Adicionais",
    camposNecessarios: ["existe_acumulo"],
    modulavel: false,
    descricao: "Adicional de 20% por exercício habitual de funções além do contratado.",
  },
  {
    id: "gratif_suprimida", nome: "Gratificação de Função Suprimida", categoria: "Adicionais",
    camposNecessarios: ["recebia_gratificacao_funcao", "gratificacao_foi_suprimida", "tempo_recebendo_gratificacao_anos"],
    modulavel: false,
    descricao: "Restauração de gratificação de função suprimida após 10+ anos de recebimento.",
  },

  // ── REFLEXOS
  {
    id: "dsr", nome: "DSR sobre Horas Extras (Súmula 172)", categoria: "Reflexos",
    camposNecessarios: [],
    modulavel: false,
    descricao: "Reflexo das horas extras no descanso semanal remunerado.",
  },
  {
    id: "ferias_prop", nome: "Diferença Férias Proporcionais", categoria: "Reflexos",
    camposNecessarios: [],
    modulavel: false,
    descricao: "Diferença entre férias proporcionais devidas (base correta) e pagas (base CTPS).",
  },
  {
    id: "ferias_vencidas", nome: "Férias Vencidas Não Gozadas (dobro)", categoria: "Reflexos",
    camposNecessarios: ["periodos_ferias_vencidos_nao_gozados"],
    modulavel: false,
    descricao: "Férias vencidas não gozadas, pagas em dobro conforme CLT.",
  },
  {
    id: "multa_ferias", nome: "Multa Férias Pagas Fora do Prazo", categoria: "Reflexos",
    camposNecessarios: ["ferias_pagas_2_dias_antes"],
    modulavel: false,
    descricao: "Multa por pagamento de férias fora do prazo legal de 2 dias antes.",
  },
  {
    id: "decimo_terceiro", nome: "Diferença 13º Salário", categoria: "Reflexos",
    camposNecessarios: [],
    modulavel: false,
    descricao: "Diferença do 13º calculado sobre a remuneração real vs. base CTPS.",
  },
  {
    id: "aviso_previo", nome: "Diferença Aviso Prévio Proporcional", categoria: "Reflexos",
    camposNecessarios: ["aviso_previo_indenizado"],
    modulavel: false,
    descricao: "Diferença do aviso prévio proporcional (Lei 12.506/2011).",
  },

  // ── FGTS
  {
    id: "fgts_diferenca", nome: "Diferença FGTS Mensal", categoria: "FGTS",
    camposNecessarios: ["fgts_depositado_corretamente"],
    modulavel: false,
    descricao: "Diferença entre FGTS sobre base real e FGTS sobre base CTPS.",
  },
  {
    id: "fgts_aviso", nome: "FGTS sobre Aviso Prévio Indenizado", categoria: "FGTS",
    camposNecessarios: ["aviso_previo_indenizado"],
    modulavel: false,
    descricao: "FGTS incidente sobre o período do aviso prévio indenizado.",
  },
  {
    id: "multa_fgts", nome: "Multa 40% FGTS", categoria: "FGTS",
    camposNecessarios: ["modalidade_desligamento"],
    modulavel: false,
    descricao: "Multa de 40% sobre o saldo do FGTS na dispensa sem justa causa.",
  },
  {
    id: "contrib_social", nome: "Contribuição Social 10% (LC 110/2001)", categoria: "FGTS",
    camposNecessarios: ["modalidade_desligamento"],
    modulavel: false,
    descricao: "Contribuição social de 10% sobre FGTS (contratos até 13/09/2019).",
  },

  // ── MULTAS RESCISÓRIAS
  {
    id: "multa_477", nome: "Multa Art. 477 (Atraso Rescisório)", categoria: "Multas Rescisórias",
    camposNecessarios: ["rescisao_paga_10_dias"],
    modulavel: false,
    descricao: "Multa de um salário por atraso no pagamento das verbas rescisórias.",
  },
  {
    id: "multa_467", nome: "Multa Art. 467 (Verbas Incontroversas)", categoria: "Multas Rescisórias",
    camposNecessarios: ["verbas_incontroversas_atrasadas", "valor_verbas_incontroversas"],
    modulavel: false,
    descricao: "Multa de 50% sobre verbas incontroversas não pagas na audiência.",
  },
  {
    id: "multa_normativa", nome: "Multa Normativa (Convenção Coletiva)", categoria: "Multas Rescisórias",
    camposNecessarios: ["havia_convencao_coletiva", "empresa_cumpria_convencao"],
    modulavel: false,
    descricao: "Multa prevista em convenção coletiva descumprida pela empresa.",
  },

  // ── VERBAS DIVERSAS
  {
    id: "descontos_indevidos", nome: "Descontos Indevidos (devolução em dobro)", categoria: "Verbas Diversas",
    camposNecessarios: ["empresa_fazia_descontos_indevidos", "valor_medio_desconto_mensal"],
    modulavel: false,
    descricao: "Restituição em dobro de descontos indevidos efetuados pela empresa.",
  },
  {
    id: "vale_transporte", nome: "Vale-Transporte Não Fornecido", categoria: "Verbas Diversas",
    camposNecessarios: ["precisava_deslocamento_ate_patio", "recebia_vale_transporte"],
    modulavel: false,
    descricao: "Reembolso do custo de transporte quando VT não era fornecido.",
  },
  {
    id: "seguro_desemprego", nome: "Seguro Desemprego Impedido", categoria: "Verbas Diversas",
    camposNecessarios: ["conseguiu_receber_seguro"],
    modulavel: false,
    descricao: "Indenização por impossibilidade de receber seguro-desemprego.",
  },
  {
    id: "plano_saude", nome: "Plano de Saúde Pós-Demissão", categoria: "Verbas Diversas",
    camposNecessarios: ["tinha_plano_saude_empresa", "contribuia_plano"],
    modulavel: false,
    descricao: "Manutenção do plano de saúde não oferecida após demissão.",
  },

  // ── DANOS
  {
    id: "dano_existencial", nome: "Dano Existencial", categoria: "Danos",
    camposNecessarios: ["jornada_habitual_superior_12h"],
    modulavel: false,
    descricao: "Indenização por privação do convívio social e familiar.",
  },
  {
    id: "dano_assedio", nome: "Dano Moral por Assédio", categoria: "Danos",
    camposNecessarios: ["sofreu_assedio_moral"],
    modulavel: false,
    descricao: "Indenização por assédio moral sofrido no ambiente de trabalho.",
  },
  {
    id: "dano_revista", nome: "Dano Moral por Revista Íntima", categoria: "Danos",
    camposNecessarios: ["sofreu_revista_intima"],
    modulavel: false,
    descricao: "Indenização por revista íntima vexatória.",
  },
  {
    id: "dispensa_discriminatoria", nome: "Dispensa Discriminatória", categoria: "Danos",
    camposNecessarios: ["motivo_real_dispensa_suspeito"],
    modulavel: false,
    descricao: "Indenização por dispensa com motivação discriminatória.",
  },

  // ── ACIDENTE E DOENÇA
  {
    id: "lucros_cessantes", nome: "Lucros Cessantes (período de afastamento)", categoria: "Acidente e Doença",
    camposNecessarios: ["houve_acidente_ou_doenca", "periodo_afastamento_meses"],
    modulavel: false,
    descricao: "Diferença entre remuneração e auxílio durante o afastamento.",
  },
  {
    id: "ressarcimento_medico", nome: "Ressarcimento de Gastos Médicos", categoria: "Acidente e Doença",
    camposNecessarios: ["gastos_medicos_comprovados", "valor_gastos_medicos"],
    modulavel: false,
    descricao: "Reembolso de despesas médicas comprovadas.",
  },
  {
    id: "dano_moral_acidente", nome: "Dano Moral por Acidente/Doença", categoria: "Acidente e Doença",
    camposNecessarios: ["sequela_atual", "gravidade_sequela"],
    modulavel: false,
    descricao: "Indenização por dano moral decorrente de acidente ou doença ocupacional.",
  },
];
