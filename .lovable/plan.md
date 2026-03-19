

## Corrigir captura das edges (linhas) do fluxograma na impressão

### Problema

O `html2canvas` não renderiza elementos SVG corretamente — as edges do ReactFlow são desenhadas em SVG dentro do container `.react-flow`, e o `html2canvas` frequentemente ignora ou falha ao rasterizá-las.

### Solução

Usar a API nativa do ReactFlow (`toSVG` ou `getViewportElement`) não é diretamente disponível, mas podemos contornar isso de duas formas:

**Abordagem escolhida**: Substituir `html2canvas` pelo método `toBlob()`/`toDataURL()` nativo via a API `@xyflow/react` que expõe `useReactFlow().toObject()`. Porém, a forma mais confiável é usar a biblioteca **`html-to-image`** (que lida melhor com SVG do que `html2canvas`).

### Alterações

**`src/utils/printPlanoComercial.ts`**
- Trocar `html2canvas` por `import { toPng } from 'html-to-image'`
- Chamar `toPng(flowElement, { backgroundColor: '#ffffff', pixelRatio: 2, filter: (node) => !(node?.classList?.contains('react-flow__minimap') || node?.classList?.contains('react-flow__controls')) })` para capturar o fluxograma incluindo SVGs (edges)
- O filtro remove minimap e controles da captura
- Remover dependência `html2canvas`, adicionar `html-to-image`

