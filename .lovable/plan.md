

# Estado Persistente para IA Coach — Eliminacao de Duplicatas

## Diagnostico do Problema Atual

Hoje, a cada chamada ao `coaching-realtime`, o frontend envia:
- A transcricao COMPLETA desde o inicio
- Uma lista simples de IDs e labels dos itens ja gerados

O modelo re-le toda a transcricao, encontra os mesmos gatilhos novamente e gera sugestoes duplicadas com palavras ligeiramente diferentes. A instrucao "nao repetir" no prompt nao funciona de forma confiavel porque o modelo nao tem contexto estruturado do que ja foi tratado.

## Solucao: Objeto de Estado Persistente

Manter um `useRef` no frontend com o estado completo de todas as sugestoes (ativas + encerradas), incluindo o gatilho original do lead. Esse objeto e enviado inteiro a cada chamada, e o modelo retorna APENAS atualizacoes de status + novas sugestoes genuinas.

## Arquitetura Proposta

```text
+---------------------+       +----------------------+
|   Frontend (React)  |       |  Edge Function       |
|                     |       |  coaching-realtime   |
|  coachingStateRef   |       |                      |
|  {                  | ----> |  Recebe:             |
|    sugestoes_ativas |       |  - newTranscript     |
|    sugestoes_encerr.|       |  - coachingState     |
|  }                  |       |  - coachInstructions |
|                     |       |                      |
|  Aplica updates <-- | <---- |  Retorna:            |
|  Persiste estado    |       |  - updates[]         |
|                     |       |  - new_items[]       |
+---------------------+       +----------------------+
```

## Mudancas Detalhadas

### 1. Frontend — `RealtimeCoachingPanel.tsx`

**Novo ref de estado persistente:**

Um `useRef<CoachingState>` que acumula todas as sugestoes geradas durante a chamada, com estrutura:

```text
{
  sugestoes_ativas: [
    { id, gatilho, classificacao: "RECA"|"RALOCA"|"RAPOVECA", resposta_sugerida, status: "aguardando" }
  ],
  sugestoes_encerradas: [
    { id, gatilho, classificacao, status: "DITO"|"TIMING_PASSOU"|"DESCARTADO" }
  ]
}
```

**Mudanca no `requestAnalysis`:**

- Em vez de enviar `existingItems` (lista simples de IDs/labels), envia o `coachingState` completo
- Em vez de enviar a transcricao COMPLETA, envia apenas o trecho NOVO desde a ultima analise (delta)
- Ao receber a resposta, aplica os `updates` (muda status de itens existentes) e adiciona `new_items` ao estado
- Quando o SDR marca um item como "feito" manualmente (`handleCheckReca`, etc.), atualiza o `coachingStateRef` movendo o item para `sugestoes_encerradas` com status "DITO"
- Quando o SDR descarta um item (`handleDiscard`), move para `sugestoes_encerradas` com status "DESCARTADO"

**Novo ref para controle de delta:**

Um `lastAnalyzedIndexRef` que guarda o indice do ultimo transcript entry analisado. A cada chamada, envia apenas as entradas novas como `newTranscript`, mas inclui o estado completo para contexto.

### 2. Edge Function — `coaching-realtime/index.ts`

**Novo contrato de entrada:**

```text
{
  newTranscript: string,          // apenas falas novas desde a ultima analise
  fullTranscriptSummary?: string, // opcional: resumo do contexto anterior
  coachingState: {                // estado completo das sugestoes
    sugestoes_ativas: [...],
    sugestoes_encerradas: [...]
  },
  coachInstructions: string,
  leadName: string,
  leadContext?: string
}
```

**Novo prompt de sistema:**

O prompt sera reestruturado para:
1. Receber o estado completo como contexto ("Aqui estao todas as sugestoes ja geradas e seus status")
2. Receber apenas as falas NOVAS para analisar
3. Ter duas responsabilidades claras no output:
   - `updates`: array de `{ id, new_status }` para itens existentes que mudaram
   - `new_items`: array de novas sugestoes genuinas (mesmo formato atual)

**Novo schema de tool calling:**

```text
analyze_coaching:
  updates: [{ id: string, new_status: "DITO"|"TIMING_PASSOU"|"MANTER" }]
  new_items: {
    objections: [{ id, objection, suggested_response, addressed }],
    reca_items: [{ id, label, description, done }],
    raloca_items: [{ id, label, description, done }]
  }
```

### 3. Detector (`script-checker`) — Sem mudanca

O detector continua funcionando como antes para o roteiro (apresentacao, qualificacao, show_rate). Para os itens de coaching (RECA, RALOCA, RAPOVECA), a detecao de "DITO" agora e responsabilidade da IA Coach via `updates`, eliminando a duplicidade de responsabilidade entre as duas IAs.

## Beneficios

1. **Zero duplicatas**: o modelo ve explicitamente cada gatilho ja tratado com sua frase original
2. **Menor custo de tokens**: envia apenas as falas novas, nao a transcricao inteira repetida
3. **Modelo decide status**: a IA pode marcar "TIMING_PASSOU" se o momento de usar uma sugestao ja passou
4. **Estado auditavel**: o ref mantem historico completo para debug e eventual persistencia futura

## Arquivos a modificar

1. `src/components/crm/RealtimeCoachingPanel.tsx` — novo ref de estado, logica de delta, aplicacao de updates
2. `supabase/functions/coaching-realtime/index.ts` — novo contrato, prompt reestruturado, schema de resposta com updates + new_items
3. `src/components/crm/coaching/coachingData.ts` — novas interfaces `CoachingState`, `CoachingSugestao`, `CoachingUpdate`

