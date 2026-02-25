

# Separar Deteccao de Script em IA Dedicada

## Por que o script nao esta sendo riscado

O prompt atual da edge function `coaching-realtime` tem mais de 100 linhas e pede que a IA faca 6 analises diferentes numa unica chamada. A deteccao de itens de script (apresentacao, qualificacao, show rate) e a tarefa mais simples, mas acaba sendo negligenciada porque a IA prioriza as tarefas mais complexas (objecoes, RECA, RALOCA). O resultado: arrays vazios para `apresentacao_done`, `qualification_done` e `show_rate_done`.

## Solucao: Duas IAs em paralelo

Criar uma edge function nova `script-checker` dedicada exclusivamente a verificar quais itens do script foram ditos. A IA de coaching existente continua cuidando de RECA, RALOCA e objecoes.

```text
Transcrição nova chega
        |
        +---> [script-checker] --> apresentacao_done, qualification_done, show_rate_done
        |         (simples, rapido)
        |
        +---> [coaching-realtime] --> objections, reca_items, raloca_items
                  (complexo, coach)
```

### Impacto na latencia

- As duas chamadas rodam **em paralelo** (Promise.all), entao o tempo total e o da mais lenta, nao a soma
- O `script-checker` sera **mais rapido** que o coaching atual porque o prompt e 5x menor e a resposta e so uma lista de IDs
- O `coaching-realtime` ficara **mais rapido** porque o prompt encolhe (sem a parte de script)
- Resultado liquido: **latencia igual ou menor** que a atual

### Custo

- Ligeiramente mais tokens por ter duas chamadas, mas o prompt do script-checker e muito curto
- Usa o modelo mais barato (`gemini-2.5-flash-lite`) para o script-checker, reservando o flash para o coaching

## Mudancas tecnicas

### 1. Nova edge function: `supabase/functions/script-checker/index.ts`

- Recebe: `transcript` + `scriptItems` (apresentacao, qualificacao, show_rate com IDs e descricoes)
- Prompt simples: "Analise a transcricao e retorne os IDs dos itens que o SDR ja cobriu. Seja flexivel: se o tema/intencao foi abordado, marque como feito."
- Usa tool calling com schema minimo (3 arrays de strings)
- Modelo: `google/gemini-2.5-flash-lite` (mais rapido e barato)
- Retorna: `{ apresentacao_done: [], qualification_done: [], show_rate_done: [] }`

### 2. Atualizar edge function: `supabase/functions/coaching-realtime/index.ts`

- Remover toda a logica de apresentacao, qualificacao e show_rate do prompt e do tool calling
- O prompt fica focado apenas em: objecoes, RECA, RALOCA
- Continua usando `google/gemini-3-flash-preview`

### 3. Atualizar frontend: `src/components/crm/RealtimeCoachingPanel.tsx`

- Na funcao `requestAnalysis`, fazer duas chamadas em paralelo:
  ```text
  const [scriptResult, coachResult] = await Promise.all([
    supabase.functions.invoke("script-checker", { body: { transcript, scriptItems } }),
    supabase.functions.invoke("coaching-realtime", { body: { transcript, coachInstructions, leadName, leadContext } })
  ]);
  ```
- Processar `scriptResult` para atualizar apresentacaoDone, qualificationDone, showRateDone (com merge via Set)
- Processar `coachResult` para atualizar objections, recaItems, ralocaItems (com merge via Map)

### 4. Atualizar `supabase/config.toml`

- Adicionar entrada para a nova funcao:
  ```text
  [functions.script-checker]
  verify_jwt = false
  ```

### 5. Adicionar console.logs de diagnostico

- No `script-checker`: logar os IDs recebidos e os IDs retornados pela IA
- No frontend: logar o resultado de cada chamada para facilitar debug futuro

## Arquivos a criar/modificar

1. **CRIAR** `supabase/functions/script-checker/index.ts` — nova edge function dedicada
2. **MODIFICAR** `supabase/functions/coaching-realtime/index.ts` — remover logica de script
3. **MODIFICAR** `src/components/crm/RealtimeCoachingPanel.tsx` — duas chamadas em paralelo
4. **MODIFICAR** `supabase/config.toml` — adicionar nova funcao (nota: este arquivo e gerenciado automaticamente, mas a entrada sera adicionada)

