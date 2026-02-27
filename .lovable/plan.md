
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

## Fase 3 — Painel 1 (Extrator de Dados) ⏳ AGUARDANDO
- Edge function `extract-lead-data` — prompt lido de `robos_coach.instrucoes_extrator`
- UI com lista de campos extraídos + confiança
- Integração com transcrição em tempo real

## Fase 4 — Painel 2 (Lacunas) ⏳ AGUARDANDO
- Edge function `analyze-gaps` — prompt lido de `robos_coach.instrucoes_lacunas`
- Ordenação por impacto via `estimarImpactoCampo()` (não pela IA)
- UI com lista priorizada

## Fase 5 — Integração Final ⏳ AGUARDANDO
- Layout na página de Atendimento com os 3 painéis
- Testes de sincronização
