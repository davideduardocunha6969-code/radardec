

# Corrigir 6 Problemas da Tela de Atendimento SDR

## Resumo dos Problemas e Soluções

### Problema 1: Card de transcrição cresce indefinidamente
O card de transcrição (`topBar`) usa `h-full` no ScrollArea mas o container pai não limita a altura adequadamente quando usado no layout split.

**Solução:** Garantir que o card de transcrição tenha altura fixa com scroll interno. No layout onde `topBarOnly` é usado, o container pai já deve limitar a altura. Dentro do card, forçar `max-h` fixo no ScrollArea para que nunca cresça além do espaço alocado.

### Problema 2: Falas do script não são riscadas
Os cards `ChecklistCard` (Apresentacao, Qualificacao, Show Rate) ja implementam `line-through` quando o item esta em `completedIds`. O problema esta no fato de que a IA retorna os IDs em `apresentacao_done`, `qualification_done`, `show_rate_done`, mas os itens nao estao sendo reordenados e a visualizacao pode nao estar clara. Alem disso, precisa garantir que a IA esteja marcando corretamente.

**Solucao:** Ja funciona visualmente (line-through existe no codigo). O ajuste principal sera na reordenacao (Problema 5) e no prompt da IA (Problema 6) para melhorar a deteccao.

### Problema 3: Cards RECA, RALOCA e RADOVECA devem ter tamanho dinamico
Os `DynamicChecklistCard` e `ObjectionsCard` ja sao dinamicos em conteudo, mas estao dentro de um container com `overflow-y-auto` e `flex-1` que pode estar limitando sua altura.

**Solucao:** Remover restricoes de altura fixa dos cards RECA, RALOCA e Objecoes. Eles devem crescer conforme o conteudo. O scroll fica no container pai das duas colunas.

### Problema 4: Falas realizadas devem ficar visiveis (resumidas) no card
Atualmente, itens feitos mostram `line-through` mas escondem a `description`. Precisam continuar visiveis com uma versao resumida.

**Solucao:** Nos cards `ChecklistCard`, `DynamicChecklistCard` e `ObjectionsCard`, quando um item esta feito/addressed, manter uma versao resumida visivel (apenas o label com line-through, sem a descricao completa — ja e o comportamento atual, mas garantir que permaneca no card).

### Problema 5: Falas ja ditas devem ir para o final do card
Atualmente os itens sao renderizados na ordem original. Itens feitos devem ser movidos para o final.

**Solucao:** Em `ChecklistCard`, `DynamicChecklistCard` e `ObjectionsCard`, reordenar os itens antes de renderizar: primeiro os pendentes (proxima fala no topo), depois os feitos (no final, com line-through).

### Problema 6: IA antecipa objecoes sem gatilho explicito
O prompt do sistema na edge function `coaching-realtime` instrui a IA a "identificar TODAS as objecoes" e gerar itens RECA/RALOCA dinamicamente. Isso faz a IA inventar objecoes e gatilhos emocionais antes de haver evidencia na transcricao.

**Solucao:** Ajustar o prompt na edge function para ser mais restritivo:
- So gerar objecoes quando houver evidencia EXPLICITA na transcricao de que o lead levantou uma objecao
- So gerar itens RECA quando houver sinal emocional claro do lead
- So gerar itens RALOCA quando houver uma questao logica levantada pelo lead
- Adicionar regra: "Se nao ha evidencia clara, retorne arrays vazios"

---

## Detalhes Tecnicos

### Arquivos a modificar

**1. `src/components/crm/RealtimeCoachingPanel.tsx`**
- Linha ~412: Adicionar altura maxima fixa ao ScrollArea da transcricao (ex: `h-[200px]` ou `max-h-[200px]`)
- Linha ~357: Garantir que o Card da transcricao tenha altura fixa
- Linhas ~439-488: No `scriptCards`, ajustar para que o container das colunas permita scroll geral mas os cards internos cresçam livremente

**2. `src/components/crm/coaching/ChecklistCard.tsx`**
- Reordenar itens: pendentes primeiro, feitos depois
- Itens feitos mostram apenas label resumido com line-through, enviados ao final da lista

**3. `src/components/crm/coaching/DynamicChecklistCard.tsx`**
- Mesma logica de reordenacao: `done: false` primeiro, `done: true` depois
- Itens feitos com label resumido + line-through no final

**4. `src/components/crm/coaching/ObjectionsCard.tsx`**
- Reordenar: objecoes nao addressed primeiro, addressed depois
- Objecoes addressed mostram versao resumida no final do card

**5. `supabase/functions/coaching-realtime/index.ts`**
- Ajustar o `systemPrompt` para adicionar regras mais restritivas:
  - "NAO gere objecoes especulativas. So liste objecoes que o lead EXPLICITAMENTE verbalizou na transcricao."
  - "NAO gere itens RECA ou RALOCA preventivos. So gere quando houver evidencia CLARA de gatilho emocional ou questao logica na fala do lead."
  - "Se nao ha evidencia suficiente, retorne arrays vazios para objections, reca_items e raloca_items."
  - "Prefira MENOS itens com ALTA precisao a MUITOS itens especulativos."

### Ordem de implementacao
1. Corrigir altura fixa da transcricao (Problema 1)
2. Reordenar itens nos 3 cards — pendentes primeiro, feitos ao final (Problemas 4 e 5)
3. Ajustar prompt da IA para evitar antecipacoes (Problema 6)
4. Ajustar containers dos cards RECA/RALOCA/RADOVECA para tamanho dinamico (Problema 3)
5. Problema 2 sera resolvido automaticamente pelos ajustes nos itens 2 e 3

