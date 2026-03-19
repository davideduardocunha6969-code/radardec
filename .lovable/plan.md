

## Cores dos cards + Checklist de requisitos para funis

### Resumo
1. Adicionar cores aos cards: **vermelho** (precisa contratar), **amarelo** (ocupado), **verde** (funil completo)
2. Criar tabela de checklist de requisitos por funil
3. Criar dialog de checklist que abre ao clicar num card de tipo "funil"
4. O funil só fica verde se TODAS as posições filhas estão ocupadas E TODOS os itens do checklist estão cumpridos. Caso contrário, fica vermelho.

### Banco de dados

Nova tabela `plano_comercial_checklist`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| node_id | uuid FK → plano_comercial_nodes | Card de funil |
| user_id | uuid | Dono |
| texto | text | Descrição do requisito |
| concluido | boolean | Se foi cumprido |
| ordem | integer | Ordem de exibição |
| created_at | timestamptz | |

RLS: `auth.uid() = user_id` para ALL.

### Alterações em componentes

**1. `PosicaoNode.tsx`** -- Aplicar cores condicionais:
- Card raiz `div`: classes de borda e fundo baseadas em `d.statusColor` (passado via data)
  - `'red'` → `border-red-500 bg-red-500/10`
  - `'yellow'` → `border-yellow-500 bg-yellow-500/10`
  - `'green'` → `border-green-500 bg-green-500/10`
- Para funis: adicionar indicador clicável "Requisitos (X/Y)" que chama `d.onOpenChecklist?.(d.nodeId)`

**2. `FlowCanvas.tsx`** -- Calcular `statusColor` ao montar flowNodes:
- Cards `posicao`/`grupo`/`setor`:
  - `precisa_contratar` → `'red'`
  - `pessoa_nome` preenchido → `'yellow'`
  - Senão → sem cor especial
- Cards `funil`:
  - Buscar filhos (edges onde source = funil.id) + checklist items
  - Se filhos existem E todos ocupados E todos checklist concluídos → `'green'`
  - Senão → `'red'`
- Adicionar estado para checklist items (carregar junto com nodes/edges no hook)
- Adicionar estado `checklistNodeId` para abrir o dialog

**3. Novo `FunilChecklistDialog.tsx`**:
- Dialog que abre ao clicar no card de funil
- Lista de itens de checklist com checkbox para marcar como concluído
- Input para adicionar novos requisitos
- Botão para excluir requisitos
- Persistência via hook

**4. `usePlanoComercial.ts`** -- Adicionar:
- Estado `checklist` com fetch da tabela `plano_comercial_checklist`
- CRUD: `addChecklistItem`, `toggleChecklistItem`, `deleteChecklistItem`
- Expor `checklist` agrupado por `node_id`

### Lógica de cor do funil (detalhada)

```text
funilCompleto = 
  childNodes.length > 0
  AND childNodes.every(n => n.pessoa_nome && !n.precisa_contratar)
  AND checklistItems.filter(i => i.node_id === funil.id).length > 0
  AND checklistItems.filter(i => i.node_id === funil.id).every(i => i.concluido)

statusColor = funilCompleto ? 'green' : 'red'
```

Se o funil não tem checklist items cadastrados, ele fica vermelho (incentiva o usuário a cadastrar os requisitos).

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `plano_comercial_checklist` + RLS |
| `src/hooks/usePlanoComercial.ts` | Adicionar CRUD checklist |
| `src/components/plano-comercial/PosicaoNode.tsx` | Cores + botão requisitos |
| `src/components/plano-comercial/FlowCanvas.tsx` | Calcular statusColor, abrir dialog |
| `src/components/plano-comercial/FunilChecklistDialog.tsx` | Criar |

