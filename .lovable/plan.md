
# Tres Paineis de Atendimento — Status

## Fase 1 — Infraestrutura ✅ CONCLUÍDA

- [x] Migração: colunas `instrucoes_extrator` e `instrucoes_lacunas` em `robos_coach`
- [x] Tipos: `DadosExtrasField`, `DadosExtrasMap`, `getFieldValue()`, `createField()`, `isManualField()`
- [x] Hook `useLeadDadosSync` com sincronização bidirecional e prioridade manual
- [x] `LeadDadosTab` adaptada para retrocompatibilidade (string legada + objeto com metadados)
- [x] Indicadores visuais de confiança (círculos coloridos) e origem manual (ícone lápis)
- [x] Esqueleto motor de cálculo: `calculator.ts`, `correcao.ts`, `rubricas.ts`, `types.ts`
- [x] Painéis placeholder: `DataExtractorPanel`, `GapsPanel`, `ValuesEstimationPanel`
- [x] Interface `RoboCoach` e mutations atualizados com novos campos

## Fase 2 — Painel 3 (Estimativa de Valores) ✅ CONCLUÍDA
- [x] Motor v5.2 completo (22 fases) em `calculator.ts`
- [x] `calcular_periodo_modulado(dataAdmissao, dataDemissao)` — ADI 5322
- [x] `estimarImpactoCampo()` — para ordenação de lacunas
- [x] `rubricas.ts` — 40+ rubricas com categorias alinhadas ao motor
- [x] UI do accordion hierárquico com metadados, subtotais e avisos condicionais

## Fase 3 — Painel 1 (Extrator de Dados) ✅ CONCLUÍDA
- [x] Edge function `extract-lead-data` — prompt lido de `robos_coach.instrucoes_extrator`
- [x] JSON puro (sem tool calling), modelo `google/gemini-2.5-flash`
- [x] Grava campos de alta confiança automaticamente, respeita `preenchimento_manual`
- [x] UI com 3 categorias: auto-preenchidos (verde), revisão (amarelo), manuais (cinza)
- [x] Botão Confirmar promove campo para manual
- [x] Integração com transcrição em tempo real via `onTranscriptUpdate`

## Fase 4 — Painel 2 (Lacunas) ✅ CONCLUÍDA
- [x] Edge function `analyze-gaps` — prompt lido de `robos_coach.instrucoes_lacunas`
- [x] Ordenação por impacto via `estimarImpactoCampo()` (motor TS local, não IA)
- [x] Condição: só chama IA se >= 3 lacunas com impacto > 0
- [x] Debounce de 2s nas mudanças de dados
- [x] UI com lista priorizada, badges de impacto, botão copiar pergunta
- [x] Campos `contexto_para_o_closer` e `urgencia` preservados

## Fase 5 — Integração Final ✅ CONCLUÍDA
- [x] `RealtimeCoachingPanel` exporta tipo `LabeledTranscript` e prop `onTranscriptUpdate`
- [x] `Atendimento.tsx` compartilha `transcriptChunks` com `DataExtractorPanel`
- [x] `Atendimento.tsx` passa `coachId` para ambos os painéis
- [x] Config.toml atualizado com as duas novas funções
