

## Cards de análise de posições no topo do Plano de Implementação

### Resumo

Adicionar 3 cards no topo da página mostrando: **Total de Posições**, **Posições Ocupadas** (com breakdown por cargo) e **Posições Pendentes** (com breakdown por cargo). Dados derivados em tempo real do estado `nodes` do hook, atualizando automaticamente a cada alteração.

### Arquitetura

Atualmente `usePlanoComercial()` é chamado dentro de `FlowCanvasInner`. Para compartilhar os dados com os cards de estatísticas, vou:

1. **Levantar o hook** para `PlanoImplementacaoComercial.tsx` (página)
2. **Passar os dados e funções** como props para `FlowCanvas`
3. **Criar componente `PlanoStatsCards`** que recebe `nodes` e computa as métricas com `useMemo`

### Lógica dos cards

Filtra apenas nodes com `node_type === 'posicao'`:
- **Total**: contagem total
- **Ocupadas**: `pessoa_nome` preenchido E `precisa_contratar === false`
- **Pendentes**: `!pessoa_nome` OU `precisa_contratar === true`

Dentro dos cards de ocupadas/pendentes, agrupa por `label` (nome do cargo) e mostra a contagem por cargo.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/plano-comercial/PlanoStatsCards.tsx` | Criar — 3 cards com breakdown por cargo |
| `src/pages/PlanoImplementacaoComercial.tsx` | Levantar hook, renderizar stats + canvas |
| `src/components/plano-comercial/FlowCanvas.tsx` | Receber dados via props em vez de chamar o hook internamente |

### Detalhes do `PlanoStatsCards`

Recebe `nodes: PlanoNode[]`. Usa `useMemo` para computar:

```text
posicoes = nodes.filter(n => n.node_type === 'posicao')
ocupadas = posicoes.filter(n => n.pessoa_nome && !n.precisa_contratar)
pendentes = posicoes.filter(n => !n.pessoa_nome || n.precisa_contratar)

// Agrupa por label (cargo)
ocupadasPorCargo = Map<label, count>
pendentesPorCargo = Map<label, count>
```

Cada card mostra o total + lista de cargos com contagem. Layout em grid de 3 colunas.

### Detalhes do `FlowCanvas` refactor

- `FlowCanvas` passa a receber todas as props do hook como parâmetros
- `FlowCanvasInner` deixa de chamar `usePlanoComercial()` diretamente
- A página orquestra tudo

