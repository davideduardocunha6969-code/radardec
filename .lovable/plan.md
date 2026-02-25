
# Evolucao do Objeto de Estado de Sugestoes do Coach

## Analise: Estado Atual vs Proposta

O estado atual em `coachingData.ts` e mais simples:

```text
ATUAL:
  sugestoes_ativas: [{id, gatilho, classificacao, resposta_sugerida, status}]
  sugestoes_encerradas: [{id, gatilho, classificacao, status}]

PROPOSTA DO USUARIO:
  sugestoes_ativas: [{id, turno_gerado, gatilho, classificacao, resposta_sugerida, pergunta_sugerida, status}]
  sugestoes_encerradas: [{id, turno_gerado, gatilho, classificacao, status, turno_encerrado}]
  fases_cumpridas: string[]
  ancoras_registradas: string[]
```

### Diferencas identificadas

| Campo | Atual | Proposta | Avaliacao |
|-------|-------|----------|-----------|
| `turno_gerado` | Nao existe | Numero do turno em que a sugestao foi criada | Util para o coach saber "idade" da sugestao e decidir TIMING_PASSOU |
| `turno_encerrado` | Nao existe | Numero do turno em que foi encerrada | Util para auditoria, sem custo extra |
| `pergunta_sugerida` | Nao existe | Pergunta que o closer pode fazer | Diferencial importante: resposta_sugerida e reativo, pergunta_sugerida e proativo |
| `fases_cumpridas` | Detectado pelo script-checker separadamente | Centralizado no estado | Faz sentido para o CLOSER (nao usa script-checker do SDR), o coach precisa saber em que fase esta |
| `ancoras_registradas` | Nao existe | Frases-chave que o lead disse e que podem ser reutilizadas | Permite ao coach referenciar falas anteriores em sugestoes futuras |
| `RADOVECA` vs `RAPOVECA` | Codigo usa "RAPOVECA" | Proposta usa "RADOVECA" | Precisa alinhar nomenclatura — sera "RADOVECA" conforme proposta |

### Decisao: estado compartilhado ou separado para SDR vs Closer?

O estado atual serve o SDR. A proposta e especifica para o Closer (fases_cumpridas, ancoras, pergunta_sugerida). A solucao e:
- **SDR continua com o estado atual** (nao quebramos nada)
- **Closer usa o estado enriquecido** (novos tipos)
- O `coaching-realtime` recebe ambos os formatos sem quebrar (campos novos sao opcionais no JSON enviado)

## Plano de Implementacao

### 1. Atualizar tipos em `coachingData.ts`

Adicionar novos tipos para o Closer sem alterar os existentes do SDR:

```text
// Classificacao unificada — adicionar RADOVECA
SugestaoClassificacao = "RECA" | "RALOCA" | "RAPOVECA" | "RADOVECA"

// Sugestao ativa do Closer (estende a do SDR)
CoachingSugestaoAtivaCloser extends CoachingSugestaoAtiva {
  turno_gerado: number
  pergunta_sugerida?: string
}

// Sugestao encerrada do Closer
CoachingSugestaoEncerradaCloser extends CoachingSugestaoEncerrada {
  turno_gerado: number
  turno_encerrado: number
}

// Estado completo do Closer
CoachingStateCloser extends CoachingState {
  fases_cumpridas: string[]
  ancoras_registradas: string[]
}
```

### 2. Atualizar edge function `coaching-realtime`

- Aceitar campo opcional `radar_atual` no body (para o Closer)
- Aceitar campos `fases_cumpridas` e `ancoras_registradas` no `coachingState`
- Injetar no system prompt do coach:
  - Bloco `RADAR_ATUAL` com os 5 scores (quando presente)
  - Bloco `FASES CUMPRIDAS` (quando presente)
  - Bloco `ANCORAS REGISTRADAS` (quando presente)
- Atualizar o tool schema para incluir `pergunta_sugerida` nos new_items
- Adicionar output de `fases_cumpridas` e `ancoras_registradas` no retorno da IA (para que o coach possa adicionar novas ancoras e marcar fases)

O tool schema do `analyze_coaching` ganha:

```text
new_items.objections[].pergunta_sugerida (string, opcional)
new_items.reca_items[].pergunta_sugerida (string, opcional)
new_items.raloca_items[].pergunta_sugerida (string, opcional)

state_updates:
  novas_ancoras: string[]       // ancoras a adicionar
  fases_cumpridas: string[]     // fases a marcar como cumpridas
```

### 3. Atualizar orquestracao no `RealtimeCoachingPanel.tsx`

Para o fluxo do Closer (quando `coach.tipo === 'coaching_closer'`):

- Manter um contador de turnos (`turnoRef`) incrementado a cada nova fala
- Ao criar sugestoes ativas, incluir `turno_gerado` com o valor atual
- Ao encerrar sugestoes, incluir `turno_encerrado`
- Manter `fases_cumpridas` e `ancoras_registradas` no ref do estado
- Enviar esses campos no body do `coaching-realtime`
- Processar o retorno `state_updates` para atualizar ancoras e fases

Fluxo sequencial do Closer:

```text
1. coaching-radar (transcricao completa) + script-checker em paralelo
2. Atualizar radarValues
3. coaching-realtime (delta + estado enriquecido + radar_atual)
4. Aplicar updates + new_items + state_updates
5. Renderizar cards
```

### 4. Criar edge function `coaching-radar` (novo)

Funcao rapida com `gemini-2.5-flash-lite`. Recebe transcricao completa + prompt do radar (do campo `instrucoes_radar` do robo coach). Retorna 5 indicadores:

```text
{
  prova_tecnica: { valor: 7, justificativa: "..." },
  confianca: { valor: 6, justificativa: "..." },
  conviccao: { valor: 5, justificativa: "..." },
  resistencia: { valor: 4, justificativa: "..." },
  prob_fechamento: { valor: 7, justificativa: "..." }
}
```

### 5. Criar componente `RadarCard.tsx`

Card compacto com 5 barras de progresso coloridas e justificativas. Renderizado apenas no fluxo do Closer.

### 6. UI: exibir pergunta_sugerida nos cards de sugestao

Nos cards RECA/RALOCA/RADOVECA do Closer, alem da `resposta_sugerida`, mostrar a `pergunta_sugerida` em destaque (ex: icone de interrogacao, cor diferente) para que o closer saiba o que perguntar proativamente.

## Nomenclatura: RADOVECA

Alinhar todo o codigo para usar `RADOVECA` em vez de `RAPOVECA` no contexto do Closer. O SDR pode manter `RAPOVECA` se necessario, ou migrar tambem — como sao strings no JSON, a mudanca e transparente.

**Sugestao**: unificar para `RADOVECA` em todo o sistema ja que e a mesma tecnica. Isso significa renomear nos tipos, no prompt do coach, e no campo `instrucoes_radoveca` do robo (que ja existe com esse nome na tabela).

## Arquivos modificados

1. `src/components/crm/coaching/coachingData.ts` — novos tipos + RADOVECA
2. `supabase/functions/coaching-realtime/index.ts` — aceitar radar_atual, fases, ancoras, pergunta_sugerida
3. `supabase/functions/coaching-radar/index.ts` — nova edge function
4. `src/components/crm/RealtimeCoachingPanel.tsx` — orquestracao Closer (turno, fases, ancoras, radar sequencial)
5. `src/components/crm/coaching/RadarCard.tsx` — novo componente
6. `src/components/crm/coaching/DynamicChecklistCard.tsx` — exibir pergunta_sugerida
7. `src/components/crm/coaching/ObjectionsCard.tsx` — exibir pergunta_sugerida

## Sequencia de implementacao

1. Tipos em coachingData.ts (base para tudo)
2. Edge function coaching-radar (independente)
3. Atualizar coaching-realtime (aceitar novos campos)
4. RadarCard.tsx (componente visual)
5. Orquestracao no RealtimeCoachingPanel.tsx (conectar tudo)
6. Atualizar cards de sugestao (pergunta_sugerida)
