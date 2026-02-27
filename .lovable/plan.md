

# Implementacao do Motor de Calculo v5.2

## Resumo

Implementar o motor completo de calculo trabalhista com 22 fases de calculo, ~40 rubricas individuais e funcao `estimarImpactoCampo`. O motor e 100% deterministico (sem IA).

## Ajustes necessarios nos tipos (`types.ts`)

O motor v5.2 traz algumas diferencas em relacao ao esqueleto atual:

1. **PeriodoModulado**: O motor usa `string` (ISO) para datas e adiciona campos `status` e `motivo`:
```text
Atual:   { meses_calculados, data_inicio_calculo: Date, data_vencimento_ref: Date }
Motor:   { meses_calculados, data_inicio_calculo: string, data_vencimento_ref: string, status, motivo }
```

2. **RubricaResult**: O motor adiciona campo `observacao` (usado por `rubricaZero`)

3. **CategoriaResult**: O motor usa `totalNominal`/`totalAtualizado` em vez de `subtotalNominal`/`subtotalAtualizado`, e nao tem campo `id`

4. **CalculoCompleto**: O motor adiciona campos `erro` e `metadados`

## Plano de implementacao

### 1. Atualizar `types.ts`

- Alterar `PeriodoModulado` para usar `string` nas datas e adicionar `status` e `motivo`
- Adicionar `observacao?: string` a `RubricaResult`
- Alterar `CategoriaResult`: remover `id`, renomear para `totalNominal`/`totalAtualizado`
- Adicionar `erro?: string` e `metadados?: object` a `CalculoCompleto`

### 2. Reescrever `calculator.ts` com o motor completo

O arquivo contera:

**Constantes**: `DATA_MODULACAO_STF` (12/07/2023), `DATA_REFORMA_TRABALHISTA` (11/11/2017), `SALARIO_MINIMO` (1412), `DIVISORES`

**Helpers de leitura**: `get()`, `getNum()`, `getBool()`, `getDate()` — leem de `DadosExtrasMap` com retrocompatibilidade

**Helpers de data**: `mesesEntreDatas()`, `adicionarMeses()`, `dataMedia()`, `anosCompletos()`

**22 fases de calculo** (todas como funcoes internas):

| Fase | Funcao | Descricao |
|------|--------|-----------|
| 1 | `calcularParametrosBase` | Data admissao/demissao, divisor, regime pre/pos reforma |
| 2 | `calcularRemuneracaoBase` | Salario + verbas habituais + acumulo + equiparacao + gratificacao |
| 3 | `calcularAdicionais` | Periculosidade e insalubridade |
| 4 | `calcularBaseHoraExtra` | Base real para hora extra (com adicionais) |
| 5 | `calcularAdicionalNoturno` | Hora reduzida noturna, deduz pago |
| 6 | `calcularSobreaviso` | Sumula 428 TST |
| 7 | `calcularHorasExtras` | Jornada real, intervalo, interjornada, pausa conducao, in itinere, sistema embarcado, higienizacao + rubricas moduladas (tempo espera, barreiras, balanca, berco, repouso em movimento) |
| 8 | `calcularRepousoViagem` | Repouso nao concedido, fracionamento, cumulacao (modulado) |
| 9 | `calcularDSR` | Sumula 172 TST |
| 10 | `calcularBaseComDSR` | Base completa para reflexos |
| 11 | `estimarVerbasPagasEmpresa` | Deduz ferias/13o/aviso/multa40 ja pagos pela empresa |
| 12 | `calcularFerias` | Proporcionais, vencidas em dobro, multa prazo |
| 13 | `calcularDecimoTerceiro` | Diferenca 13o sobre base correta |
| 14 | `calcularAvisoPrevio` | Proporcional (Lei 12.506/2011) |
| 15 | `calcularFGTS` | Diferenca mensal, sobre aviso, multa 40%, contrib social 10% |
| 16 | `calcularMultasRescisorias` | Art. 477, 467, normativa |
| 17 | `calcularVerbasDiversas` | Transferencia, descontos indevidos, VT, seguro, plano saude |
| 18 | `calcularDanos` | Assedio, revista intima, dano existencial, dispensa discriminatoria |
| 19 | `calcularAcidenteDoenca` | Lucros cessantes, ressarcimento, dano moral, pensao vitalicia |
| 20 | `calcularDomingos` | Domingos sem compensacao (100%) |
| 21 | `calcularIndenizacoesIntervalo` | Indenizacao intervalo pos-reforma, interjornada autonoma |
| 22 | `calcularGratificacaoSuprimida` | Sumula 372 TST |

**Funcao `montarRubricas`**: Converte resultados das 22 fases em ~40 `RubricaResult[]` com valores nominais e atualizados

**Funcao principal `calcularTudo`**: Executa cascata completa e retorna `CalculoCompleto` com categorias agrupadas, subtotais integral/modulado, total geral, pensao vitalicia e metadados

**Funcao `estimarImpactoCampo`**: Tabela de impacto financeiro estimado por campo, usada pelo Painel 2 (Lacunas) para ordenacao — nao usa IA

**Funcao `calcular_periodo_modulado`**: ADI 5322, 3 cenarios (pre-modulacao, pos-modulacao, misto)

### 3. Manter `correcao.ts` e `rubricas.ts`

- `correcao.ts` ja esta correto (IPCA-E 5% + juros 1%) — sem alteracoes
- `rubricas.ts` pode ser atualizado futuramente com a lista de `RUBRICAS[]` se necessario para o Painel 2, mas o motor v5.2 nao depende dele

## Campos necessarios em `dados_extras`

O motor v5.2 le ~100 campos. Os principais blocos:

- **Contrato**: `data_admissao`, `data_demissao`, `contrato_ativo`, `regime_semanal_contratual`, `jornada_contratual_diaria_horas`, `modalidade_desligamento`
- **Remuneracao**: `salario_ctps_mensal`, `media_comissao_mensal`, `media_premio_mensal`, `media_gratificacao_mensal`, `media_diarias_mensal`, `valor_por_fora_mensal_medio`, `media_ajuda_custo_mensal`
- **Jornada**: `hora_inicio_media`, `hora_fim_media`, `intervalo_refeicao_minutos_medio`, `intervalo_real_minutos`, `descanso_entre_jornadas_horas_medio`
- **Motorista**: `tempo_espera_carga_descarga_horas_dia_medio`, `tempo_fiscalizacao_barreira_horas_dia_medio`, `tempo_balanca_horas_dia_medio`, `dormia_no_veiculo`, `repouso_era_feito_com_veiculo_em_movimento`
- **Adicionais**: `periculosidade_devida`, `insalubridade_devida`, `dirigia_apos_22`, `ficava_de_sobreaviso`
- **Rescisao**: `fgts_depositado_corretamente`, `aviso_previo_indenizado`, `rescisao_paga_10_dias`
- **Danos**: `sofreu_assedio_moral`, `houve_acidente_ou_doenca`, `sequela_atual`

## Arquivos alterados

1. `src/utils/trabalhista/types.ts` — Ajustar `PeriodoModulado`, `RubricaResult`, `CategoriaResult`, `CalculoCompleto`
2. `src/utils/trabalhista/calculator.ts` — Reescrita completa com motor v5.2

## Arquivos nao alterados

- `src/utils/trabalhista/correcao.ts` — ja esta correto
- `src/utils/trabalhista/rubricas.ts` — mantido como referencia
- Nenhum outro arquivo do projeto e afetado

