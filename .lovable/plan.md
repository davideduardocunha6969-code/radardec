

## Cards colapsáveis no Plano de Implementação

### Alteração

**`src/components/plano-comercial/PlanoStatsCards.tsx`**

Tornar o breakdown por cargo nos cards de "Ocupadas" e "Pendentes" colapsável:

- Adicionar estado `expandedCard` (null | 'ocupadas' | 'pendentes') para controlar qual card está expandido
- O breakdown por cargo fica oculto por padrão
- Ao clicar no card (ou num botão chevron), expande/recolhe a lista de cargos
- Card de "Total" permanece simples, sem expansão
- Adicionar ícone `ChevronDown`/`ChevronUp` como indicador visual nos cards que têm breakdown
- Adicionar `cursor-pointer` nos cards clicáveis

Resultado: cards ocupam apenas 1 linha por padrão, expandindo sob demanda.

