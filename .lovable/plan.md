

## Corrigir navegação do fluxograma e "Ver Tudo"

### Problemas identificados

1. **Pan com mouse quebrado**: `panOnDrag={[1, 2]}` restringe o pan apenas aos botões do meio (1) e direito (2) do mouse. O botão esquerdo (0) foi removido para dar lugar ao `selectionOnDrag`, mas isso quebrou a experiência principal de arrastar a tela.

2. **"Ver Tudo" não funciona bem**: `fitView` com `padding: 0.15` pode não ser suficiente. Além disso, React Flow tem `minZoom` padrão de 0.5 que pode impedir o zoom-out necessário para fluxogramas grandes.

### Solução

**`src/components/plano-comercial/FlowCanvas.tsx`**

- Restaurar `panOnDrag` para comportamento padrão (botão esquerdo arrasta a tela)
- Remover `selectionOnDrag` — manter seleção múltipla via **Shift+click** e **Shift+drag** (comportamento nativo do React Flow)
- Adicionar `minZoom={0.1}` ao `<ReactFlow>` para permitir zoom-out suficiente em fluxogramas grandes
- Ajustar `fitView` com `padding: 0.2` e incluir `minZoom: 0.1` nas opções do `fitView`

Resultado: arrastar a tela com o mouse volta a funcionar normalmente, seleção múltipla continua disponível via Shift, e "Ver Tudo" consegue mostrar fluxogramas grandes.

### Alteração (~5 linhas)

```tsx
<ReactFlow
  ...
  minZoom={0.1}
  // remover selectionOnDrag e panOnDrag={[1,2]}
  // remover selectionMode
>
```

```tsx
fitView({ padding: 0.2, duration: 300, minZoom: 0.1 })
```

