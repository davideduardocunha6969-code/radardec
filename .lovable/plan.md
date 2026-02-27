

# Roteiro Closer Motorista de Caminhao — Campos + Script + Mapeamento

## Resumo

Tres grandes entregas:
1. Criar ~170 campos na secao "Dados leads Motoristas de caminhao" (secao_id ja existe)
2. Atualizar o script closer existente (id: eab44cb1) com o roteiro completo do documento, incluindo todas as condicionais via sub_items
3. Adicionar propriedade `campo_lead_key` ao ScriptItem para mapear cada pergunta ao campo da aba Dados

---

## 1. Adicionar `campo_lead_key` e `tipo_campo` ao ScriptItem

Alterar a interface `ScriptItem` em `src/hooks/useScriptsSdr.ts`:

```typescript
export interface ScriptItem {
  id: string;
  label: string;
  description: string;
  sub_items?: ScriptItem[];
  campo_lead_key?: string;   // key do campo em crm_lead_campos
  tipo_campo?: string;       // "texto", "data", "numero", "sim_nao", "selecao", "valor", "horario"
  opcoes_campo?: string[];   // opcoes para campos tipo selecao
}
```

## 2. Criar campos no banco (crm_lead_campos)

Inserir todos os ~170 campos extraidos do roteiro na secao "Dados leads Motoristas de caminhao" (secao_id = `ed3978a4-60ce-42fc-977a-2f68de64888b`). Cada campo com:
- `nome`: nome legivel (ex: "Data de nascimento")
- `key`: chave normalizada (ex: "data_nascimento")
- `tipo`: mapeado do tipo do roteiro (texto, data, numero, sim_nao, selecao, valor, horario)
- `ordem`: sequencial 1..170
- `secao_id`: ed3978a4-60ce-42fc-977a-2f68de64888b

Lista completa dos campos (agrupados por bloco):

**Bloco 1 — Linha do Tempo** (P1-P11): data_nascimento, data_admissao, contrato_ativo, data_demissao, modalidade_desligamento, aviso_previo_trabalhado, aviso_previo_indenizado, dias_aviso_previo_efetivamente_pago, rescisao_paga_10_dias, verbas_incontroversas_atrasadas, valor_verbas_incontroversas

**Bloco 2 — Funcao e Vinculo** (P12-P26): funcao_ctps, descarregava_caminhao, fazia_abastecimento, fazia_higienizacao_veiculo, tempo_higienizacao_minutos_dia, fazia_manutencao, tarefas_extras_exigidas, tipo_veiculo, existe_equiparacao, colega_salario_maior, salario_paradigma, tempo_paradigma_na_funcao_anos, foi_transferido, transferencia_definitiva, meses_transferido

**Bloco 3 — Remuneracao Real** (P27-P48): salario_ctps_mensal, holerite_existe, comissao_habitual, media_comissao_mensal, premio_habitual, media_premio_mensal, gratificacao_habitual, media_gratificacao_mensal, diarias_habitual, media_diarias_mensal, diarias_fixas_ou_variaveis, ajuda_custo_habitual, media_ajuda_custo_mensal, recebia_por_fora, valor_por_fora_mensal_medio, forma_pagamento_por_fora, denominacao_por_fora, recebia_gratificacao_funcao, tempo_recebendo_gratificacao_anos, gratificacao_foi_suprimida, data_supressao_gratificacao, valor_gratificacao_suprimida

**Bloco 4 — Jornada** (P49-P74): hora_inicio_media, hora_fim_media, variacao_horario, regime_semanal_contratual, fazia_intervalo_refeicao, intervalo_refeicao_minutos_medio, intervalo_menor_1hora, intervalo_real_minutos, descanso_entre_jornadas_horas_medio, violacao_interjornada, frequencia_violacao_interjornada, descanso_coincidia_com_pausa_conducao, fazia_pausa_30min_direcao, dirigia_apos_22, horas_noturnas_dia_media, adicional_noturno_pago, valor_noturno_pago_mensal, trabalhava_domingos, domingos_trabalhados_mes_medio, recebia_folga_compensatoria, pagava_horas_extras, horas_extras_pagas_horas_mes_media, percentual_hora_extra_pago, banco_horas, recebia_extrato_banco, assinava_compensacoes

**Bloco 5 — Tempo a Disposicao e Viagens** (P75-P100): ficava_aguardando_carga_descarga, tempo_espera_carga_descarga_horas_dia_medio, tempo_espera_era_pago, percentual_pago_tempo_espera, ficava_em_barreiras_fiscais, tempo_fiscalizacao_barreira_horas_dia_medio, ficava_em_fila_balanca, tempo_balanca_horas_dia_medio, dormia_no_veiculo, era_obrigatorio_permanecer, horas_berco_dia_medio, fazia_viagens_longa_distancia, duracao_media_viagem_dias, semanas_em_viagem_por_mes_media, repouso_semanal_concedido_na_viagem, repouso_semanal_era_fracionado, empresa_acumulava_repousos, periodos_fracionados_mes_medio, repousos_acumulados_consecutivos_maximo, repouso_era_feito_com_veiculo_em_movimento, horas_repouso_invalido_dia_medio, ficava_de_sobreaviso, tinha_obrigacao_atender_chamado, horas_sobreaviso_dia_medio, recebia_sobreaviso, valor_sobreaviso_pago

**Bloco 6 — Adicionais** (P101-P112): transportava_carga_perigosa, periculosidade_paga, percentual_periculosidade_pago, fazia_abastecimento_frequente, trabalhava_camara_fria, insalubridade_paga, exposto_ruido_excessivo, vibracao_constante, percentual_insalubridade_pago

**Bloco 7 — Ferias e 13o** (P113-P117): ferias_regulares, ferias_pagas_2_dias_antes, ferias_vencidas_nao_gozadas, periodos_ferias_vencidos_nao_gozados, decimo_terceiro_base_real

**Bloco 8 — FGTS e Beneficios** (P118-P128): fgts_depositado_corretamente, precisava_deslocamento_ate_patio, recebia_vale_transporte, custo_medio_transporte_mensal, tinha_plano_saude_empresa, contribuia_plano, empresa_manteve_plano_pos_demissao, custo_plano_mensal, recebeu_guias_seguro_desemprego, conseguiu_receber_seguro, valor_parcelas_seguro_perdidas

**Bloco 9 — Descontos Indevidos** (P129-P132): empresa_fazia_descontos_indevidos, tipo_desconto_indevido, valor_medio_desconto_mensal, assinava_autorizacao_desconto

**Bloco 10 — Empresa e Tomadora** (P133-P134): trabalhava_para_transportadora, nome_empresa_tomadora

**Bloco 11 — Saude e Acidentes** (P135-P156): houve_acidente, tipo_acidente, data_acidente, houve_cat, houve_afastamento, periodo_afastamento_meses, recebia_auxilio_doenca_inss, valor_auxilio_recebido, sequela_atual, capacidade_laboral_atual, gravidade_sequela, tem_laudos_medicos, percentual_incapacidade, gastos_medicos_comprovados, valor_gastos_medicos, teve_alta_medica, data_alta_medica, demissao_dentro_12m_alta, doenca_ocupacional, tipo_doenca_ocupacional, tem_diagnostico_doenca, esta_em_tratamento

**Bloco 12 — Ambiente de Trabalho** (P157-P162): sofreu_assedio_moral, frequencia_assedio, gravidade_assedio, sofreu_revista_intima, motivo_real_dispensa_suspeito, indicios_discriminacao

**Bloco 13 — Impacto Pessoal** (P163-P165): jornada_habitual_superior_12h, periodos_fora_de_casa, impacto_familiar_declarado

**Bloco 14 — Provas** (P166-P170): holerites_disponiveis, veiculo_tinha_tacografo, motorista_tem_acesso_dados_tacografo, registros_digitais_disponiveis, testemunhas_disponiveis

**Bloco 15 — Rescisao Indireta** (P171-P174): empresa_atrasa_salario, empresa_nao_deposita_fgts, empresa_exige_jornada_excessiva, condicoes_degradantes

## 3. Atualizar o Script Closer existente

Atualizar o registro `eab44cb1-c485-438f-b5d5-8d2422980f7b` na tabela `scripts_sdr` com:

- **apresentacao**: 6 falas da Etapa 1 (sem perguntas, sem campo_lead_key)
- **qualificacao**: Todas as perguntas P1-P174 organizadas com sub_items para condicionais, cada item com `campo_lead_key` apontando para a key do campo correspondente, `tipo_campo` e `opcoes_campo` quando aplicavel
- **fechamento**: Etapas 3 e 4 do roteiro (transicao e fechamento)

Exemplo de estrutura de um item com condicionais:

```json
{
  "id": "contrato_ativo",
  "label": "P3 — O contrato ainda está ativo?",
  "description": "O contrato ainda está ativo?",
  "campo_lead_key": "contrato_ativo",
  "tipo_campo": "sim_nao",
  "sub_items": [
    {
      "id": "data_demissao",
      "label": "P4 — SE NÃO: Data de desligamento",
      "description": "Qual foi a data de desligamento?",
      "campo_lead_key": "data_demissao",
      "tipo_campo": "data"
    }
  ]
}
```

## 4. Atualizar o Editor Visual (ScriptItemEditor)

Adicionar ao editor de cada item:
- Campo "Campo do Lead" (input texto) para exibir/editar `campo_lead_key`
- Campo "Tipo" (select) para exibir/editar `tipo_campo`
- Badge visual mostrando o campo mapeado quando preenchido

Esses campos tambem aparecerao nos sub_items condicionais.

## 5. Atualizar o Painel de Atendimento (RealtimeCoachingPanel)

No card de qualificacao do coaching panel, ao lado de cada pergunta mostrar o campo do lead associado. Quando o closer marca a pergunta como feita, idealmente permitir que ele insira o valor da resposta diretamente, e esse valor sera salvo em `dados_extras` do lead.

---

## Detalhes tecnicos

### Migracao (SQL)
- INSERT em massa na tabela `crm_lead_campos` com ~170 registros
- Nao requer alteracao de schema (campos ja usam JSONB `dados_extras`)

### Arquivos a alterar
1. `src/hooks/useScriptsSdr.ts` — adicionar `campo_lead_key`, `tipo_campo`, `opcoes_campo` ao ScriptItem
2. `src/components/robos/ScriptItemEditor.tsx` — mostrar campos de mapeamento no editor
3. `src/components/crm/RealtimeCoachingPanel.tsx` — exibir campo associado e permitir input de resposta
4. Script closer atualizado via INSERT/UPDATE direto no banco

### Sequencia
1. Adicionar campos ao ScriptItem (interface)
2. Inserir os ~170 campos no banco
3. Atualizar o script closer com o roteiro completo
4. Atualizar o editor visual
5. Atualizar o painel de coaching para usar campo_lead_key

