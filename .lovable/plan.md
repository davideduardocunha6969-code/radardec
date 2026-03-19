

## Remover fundo pontilhado do fluxograma na impressão

### Alteração

**`src/utils/printPlanoComercial.ts`** — linha 46-50, adicionar ao filtro a classe `react-flow__background` para excluir o padrão de pontos/grade da captura:

```typescript
filter: (node: HTMLElement) => {
  const cl = node?.classList;
  if (!cl) return true;
  return !cl.contains('react-flow__minimap') 
    && !cl.contains('react-flow__controls')
    && !cl.contains('react-flow__background');
},
```

Único arquivo alterado, uma linha adicionada ao filtro existente.

