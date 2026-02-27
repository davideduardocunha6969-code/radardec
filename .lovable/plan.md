
# Manter pergunta condicional no lugar ate todas sub-respostas serem concluidas

## Problema

Quando o closer responde uma pergunta condicional (ex: "Sim"), a pergunta principal e imediatamente movida para o final do card. Porem as condicionais expandidas (sub-items) tambem vao para o final, obrigando o closer a rolar ate la para responde-las.

## Solucao

Alterar a logica de ordenacao no `ScriptChecklistCard.tsx` (linhas 79-84) para considerar um item como "totalmente concluido" somente quando:

1. O item principal foi respondido (ja tem answer), **E**
2. Todos os sub-items visiveis (filtrados pela resposta) tambem foram concluidos ou descartados

Se o item tem sub-items pendentes, ele permanece na posicao original mesmo que ja tenha sido respondido.

## Alteracao tecnica

### Arquivo: `src/components/crm/coaching/ScriptChecklistCard.tsx`

1. Criar funcao auxiliar `isFullyCompleted(item, answers, completedIds, discardedIds)` que verifica recursivamente se o item e todos os seus sub-items visiveis estao concluidos
2. Substituir a logica de sort atual para usar essa funcao em vez de apenas checar `completedIds.includes(a.id) || !!answers[a.id]`

A funcao verificara:
- Se o item nao tem answer/completed: nao esta completo
- Se o item tem answer e nao tem sub_items: esta completo
- Se o item tem answer e tem sub_items: filtra os sub-items visiveis e verifica se todos estao completed ou discarded (recursivamente)
