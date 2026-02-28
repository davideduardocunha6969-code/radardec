

# Fix: estimarImpactoCampo deve mapear todos os 107 campos do motor v5.2

## Problema

A funcao `estimarImpactoCampo` (linhas 1366-1413 de `calculator.ts`) mapeia apenas ~25 campos no objeto `impactos`, enquanto o motor v5.2 utiliza **107 campos**. O fallback `|| 500` na linha 1413 faz com que campos nao-mapeados (como telefone, endereco) aparecam com impacto falso, e campos relevantes do motor que nao estao no mapa sao ignorados.

## Solucao

### 1. `src/utils/trabalhista/calculator.ts` — Reescrever o mapa `impactos`

Substituir o mapa atual (~25 campos) por um mapa completo com todos os 107 campos, organizados por categoria conforme o motor:

**Linha do Tempo (4 campos)**
- `data_admissao`, `data_demissao`, `contrato_ativo`, `regime_semanal_contratual`

**Remuneracao (17 campos)**
- `salario_ctps_mensal`, `media_comissao_mensal`, `media_premio_mensal`, `media_gratificacao_mensal`, `media_diarias_mensal`, `valor_por_fora_mensal_medio`, `media_ajuda_custo_mensal`, `existe_acumulo`, `existe_equiparacao`, `salario_paradigma`, `tempo_paradigma_na_funcao_anos`, `recebia_gratificacao_funcao`, `gratificacao_foi_suprimida`, `tempo_recebendo_gratificacao_anos`, `valor_gratificacao_suprimida`, `data_supressao_gratificacao`

**Jornada (22 campos)**
- `hora_inicio_media`, `hora_fim_media`, `jornada_contratual_diaria_horas`, `intervalo_refeicao_minutos_medio`, `intervalo_real_minutos`, `intervalo_menor_1hora`, `descanso_entre_jornadas_horas_medio`, `violacao_interjornada`, `frequencia_violacao_interjornada`, `descanso_coincidia_com_pausa_conducao`, `fazia_pausa_30min_direcao`, `dirigia_apos_22`, `horas_noturnas_dia_media`, `adicional_noturno_pago`, `valor_noturno_pago_mensal`, `aplicar_hora_reduzida_noturna`, `trabalhava_domingos`, `domingos_trabalhados_mes_medio`, `recebia_folga_compensatoria`, `pagava_horas_extras`, `horas_extras_pagas_horas_mes_media`, `banco_horas`

**Tempo a Disposicao (14 campos)**
- `ficava_aguardando_carga_descarga`, `tempo_espera_carga_descarga_horas_dia_medio`, `tempo_espera_era_pago`, `percentual_pago_tempo_espera`, `ficava_em_barreiras_fiscais`, `tempo_fiscalizacao_barreira_horas_dia_medio`, `ficava_em_fila_balanca`, `tempo_balanca_horas_dia_medio`, `dormia_no_veiculo`, `era_obrigatorio_permanecer`, `horas_berco_dia_medio`, `repouso_era_feito_com_veiculo_em_movimento`, `horas_repouso_invalido_dia_medio`

**Sobreaviso e Viagens (13 campos)**
- `ficava_de_sobreaviso`, `tinha_obrigacao_atender_chamado`, `horas_sobreaviso_dia_medio`, `recebia_sobreaviso`, `valor_sobreaviso_pago`, `fazia_viagens_longa_distancia`, `semanas_em_viagem_por_mes_media`, `repouso_semanal_concedido_na_viagem`, `repouso_semanal_era_fracionado`, `periodos_fracionados_mes_medio`, `empresa_acumulava_repousos`, `repousos_acumulados_consecutivos_maximo`

**Adicionais (11 campos)**
- `transportava_carga_perigosa`, `fazia_abastecimento_frequente`, `periculosidade_paga`, `percentual_periculosidade_pago`, `trabalhava_camara_fria`, `exposto_ruido_excessivo`, `vibracao_constante`, `insalubridade_paga`, `percentual_insalubridade_pago`, `grau_insalubridade`

**Rescisao (14 campos)**
- `modalidade_desligamento`, `aviso_previo_indenizado`, `dias_aviso_previo_efetivamente_pago`, `rescisao_paga_10_dias`, `verbas_incontroversas_atrasadas`, `valor_verbas_incontroversas`, `ferias_regulares`, `ferias_pagas_2_dias_antes`, `ferias_vencidas_nao_gozadas`, `periodos_ferias_vencidos_nao_gozados`, `decimo_terceiro_base_real`, `fgts_depositado_corretamente`, `havia_convencao_coletiva`, `empresa_cumpria_convencao`, `valor_multa_normativa_convencao`

**Verbas Diversas (12 campos)**
- `foi_transferido`, `transferencia_definitiva`, `meses_transferido`, `empresa_fazia_descontos_indevidos`, `valor_medio_desconto_mensal`, `precisava_deslocamento_ate_patio`, `recebia_vale_transporte`, `custo_medio_transporte_mensal`, `conseguiu_receber_seguro`, `valor_parcelas_seguro_perdidas`, `tinha_plano_saude_empresa`, `contribuia_plano`, `empresa_manteve_plano_pos_demissao`, `custo_plano_mensal`, `meses_manutencao_devidos`

**Danos e Acidente (14 campos)**
- `sofreu_assedio_moral`, `gravidade_assedio`, `sofreu_revista_intima`, `jornada_habitual_superior_12h`, `periodos_fora_de_casa`, `impacto_familiar_declarado`, `motivo_real_dispensa_suspeito`, `houve_acidente`, `periodo_afastamento_meses`, `valor_auxilio_recebido`, `sequela_atual`, `capacidade_laboral_atual`, `gravidade_sequela`, `percentual_incapacidade`, `gastos_medicos_comprovados`, `valor_gastos_medicos`, `data_nascimento`, `doenca_ocupacional`

Cada campo tera um impacto estimado proporcional a sua relevancia no calculo, usando as variaveis `salario`, `meses`, `horaNormal` e `diasTrabalhadosMes` ja calculadas.

Campos booleanos que "ativam" rubricas (ex: `ficava_aguardando_carga_descarga`, `transportava_carga_perigosa`) terao impacto proporcional ao valor da rubrica que ativam.

Campos de "deducao" (ex: `periculosidade_paga`, `tempo_espera_era_pago`) terao impacto menor, pois sao refinamentos e nao rubricas novas.

### 2. Trocar fallback de 500 para 0

Linha 1413:
```text
Antes:  return Math.round((impactos[campo] || 500) * 100) / 100;
Depois: return Math.round((impactos[campo] || 0) * 100) / 100;
```

Isso garante que SOMENTE os 107 campos do motor aparecem no painel de lacunas. Qualquer campo fora do motor (telefone, endereco, etc.) retorna impacto 0 e e filtrado pelo `gapsWithImpact`.

### 3. `src/components/crm/lacunas/GapsPanel.tsx` — UX

- Adicionar subtitulo: "Campos faltantes que mais impactam o valor da causa"
- Mudar display de `{formatBRL(g.impacto_estimado)}` para `Impacto: ~{formatBRL(g.impacto_estimado)}`

## Resultado esperado

- De 181 lacunas para no maximo 107 (e na pratica ~30-50, pois muitos booleanos ja tem valor default)
- Ordenacao correta por impacto financeiro real
- Campos irrelevantes (texto livre, telefones) nao aparecem mais
- Labels claros evitando confusao entre valor do campo e impacto financeiro

