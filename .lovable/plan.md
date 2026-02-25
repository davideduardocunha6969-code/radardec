

# Botoes Manuais de Check e Descartar nos Cards de Coaching

## Objetivo

Adicionar botoes clicaveis ao lado de cada item nos cards do painel de coaching, permitindo que o SDR marque manualmente um item como concluido (check) ou descarte-o (lixeira). Isso funciona **cumulativamente** com a deteccao automatica da IA -- ambos os mecanismos coexistem.

## Comportamento

- **Botao Check**: Marca o item como concluido (mesmo efeito visual de quando a IA detecta: line-through, mover para o final da lista)
- **Botao Lixeira**: Remove o item da lista completamente (descartado pelo SDR como irrelevante para aquela chamada)
- Ambos os botoes aparecem apenas em itens **nao concluidos** (itens ja riscados nao precisam de botoes)
- Os botoes sao pequenos e discretos para nao poluir a interface compacta

## Cards afetados

1. **ChecklistCard** (Apresentacao, Qualificacao, Show Rate) -- adicionar `onCheck(id)` e `onDiscard(id)` como callbacks opcionais
2. **DynamicChecklistCard** (RECA, RALOCA) -- adicionar `onCheck(id)` e `onDiscard(id)`
3. **ObjectionsCard** (Objecoes) -- adicionar `onAddressed(id)` e `onDiscard(id)`

## Mudancas Tecnicas

### 1. MODIFICAR `src/components/crm/coaching/ChecklistCard.tsx`

- Adicionar props opcionais: `onCheck?: (id: string) => void` e `onDiscard?: (id: string) => void`
- Ao lado de cada item nao concluido, renderizar dois botoes pequenos (icones `Check` e `Trash2` do lucide-react)
- `onCheck` adiciona o ID ao array `completedIds` (via callback ao pai)
- `onDiscard` remove o item da lista (via callback ao pai)
- Botoes ficam visiveis no hover ou sempre visiveis (melhor para uso rapido durante chamada)

### 2. MODIFICAR `src/components/crm/coaching/DynamicChecklistCard.tsx`

- Mesma logica: adicionar `onCheck?: (id: string) => void` e `onDiscard?: (id: string) => void`
- Botoes Check e Trash2 ao lado de itens nao concluidos

### 3. MODIFICAR `src/components/crm/coaching/ObjectionsCard.tsx`

- Adicionar `onAddressed?: (id: string) => void` e `onDiscard?: (id: string) => void`
- Botao Check marca objecao como respondida
- Botao Trash2 remove a objecao da lista

### 4. MODIFICAR `src/components/crm/RealtimeCoachingPanel.tsx`

- Criar handlers para cada card:
  - `handleCheckApresentacao(id)` -- adiciona ID ao `apresentacaoDone`
  - `handleDiscardApresentacao(id)` -- remove item de `apresentacaoItems` (via estado local de itens descartados)
  - Idem para qualificacao, show rate, RECA, RALOCA, objecoes
- Manter um estado `discardedIds` (Set) para itens descartados, filtrando-os antes de renderizar
- Passar os callbacks como props para cada card

### Arquivos a modificar

1. `src/components/crm/coaching/ChecklistCard.tsx` -- botoes check/discard
2. `src/components/crm/coaching/DynamicChecklistCard.tsx` -- botoes check/discard
3. `src/components/crm/coaching/ObjectionsCard.tsx` -- botoes addressed/discard
4. `src/components/crm/RealtimeCoachingPanel.tsx` -- handlers + estado de descartados

