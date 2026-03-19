

## Botão "Ver Tudo" no fluxograma

### Alteração

**`src/components/plano-comercial/FlowCanvas.tsx`**

Adicionar um botão "Ver Tudo" na toolbar (ao lado do "Novo Card") que chama `reactFlowInstance.fitView()` para ajustar o zoom e centralizar todos os nodes na tela.

- Usar o hook `useReactFlow()` do `@xyflow/react` para acessar a instância
- Envolver o `ReactFlow` em um `ReactFlowProvider` (necessário para `useReactFlow` funcionar)
- Botão com ícone `Maximize2` e texto "Ver Tudo"
- Ao clicar: `fitView({ padding: 0.15, duration: 300 })` — ajusta com animação suave

~15 linhas alteradas em 1 arquivo.

