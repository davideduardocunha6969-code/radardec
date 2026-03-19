

## Expandir ambos os cards simultaneamente

### Alteração

**`src/components/plano-comercial/PlanoStatsCards.tsx`**

Trocar o estado de `expandedCard` (string | null) para `expanded` (boolean). Ao clicar em qualquer um dos dois cards (ocupadas ou pendentes), ambos expandem ou recolhem juntos.

- `const [expanded, setExpanded] = useState(false)`
- Ambos os cards usam `onClick={() => setExpanded(prev => !prev)}`
- Condicional de breakdown usa `expanded` em vez de `expandedCard === 'ocupadas'`

