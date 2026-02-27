
# Remover deteccao automatica de script pela IA Detectora

## Contexto

Atualmente, a IA Detectora (`script-checker`) analisa a transcricao e automaticamente risca itens do Roteiro (Apresentacao, Qualificacao, Show Rate/Fechamento) e tambem itens de coaching (RECA, RALOCA, objecoes). Com scripts condicionais, a deteccao automatica de itens do roteiro gera muitos erros. A marcacao do roteiro passara a ser apenas manual.

## O que muda

- A IA Detectora **deixa de riscar** itens de Apresentacao, Qualificacao e Show Rate/Fechamento
- A IA Detectora **continua riscando** itens RECA, RALOCA e objecoes normalmente
- Os botoes manuais de check nos cards do roteiro continuam funcionando (ja existem)

## Alteracoes tecnicas

### 1. Edge function `script-checker` (supabase/functions/script-checker/index.ts)

- Remover `apresentacao_done`, `qualification_done` e `show_rate_done` do schema da tool `check_progress`
- Remover essas categorias do prompt do sistema (nao listar itens de Apresentacao, Qualificacao e Show Rate para a IA)
- Manter apenas `reca_done`, `raloca_done` e `objections_addressed`
- Ajustar o early return para retornar apenas os 3 campos mantidos

### 2. Frontend `RealtimeCoachingPanel.tsx`

- Na funcao `processDetectorResult`: remover os blocos que fazem `setApresentacaoDone`, `setQualificationDone` e `setShowRateDone` a partir da resposta da IA
- No payload enviado ao `script-checker`: parar de enviar `scriptItems` (apresentacao, qualificacao, show_rate) — enviar apenas `coachingItems`
- Os handlers manuais (`handleCheckApresentacao`, `handleCheckQualificacao`, `handleCheckShowRate`) permanecem inalterados

### 3. Sem mudanca no banco de dados

Nenhuma migracao necessaria.

## Resultado

- O closer marca manualmente cada item do roteiro clicando no check
- A IA continua detectando automaticamente quando sugestoes RECA, RALOCA e objecoes foram abordadas
- Elimina falsos positivos em scripts com perguntas condicionais
