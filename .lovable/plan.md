

## Botão de Imprimir Relatório do Plano Comercial

### Resumo

Adicionar um botão "Imprimir" na página que gera um relatório em paisagem contendo: resumo de posições, lista detalhada de ocupadas e pendentes (agrupadas por setor), e uma captura do fluxograma.

### Alterações

**1. `src/pages/PlanoImplementacaoComercial.tsx`**
- Adicionar botão "Imprimir" ao lado do título
- Importar e chamar a função de impressão passando `planoData.nodes` e uma ref do container do ReactFlow

**2. `src/components/plano-comercial/FlowCanvas.tsx`**
- Expor uma `ref` ao container do ReactFlow para captura via `html2canvas` (ou usar a API `toObject`/`getNodes` do ReactFlow para renderizar)
- Alternativa mais simples: usar `@xyflow/react`'s `useReactFlow().getViewport()` + capturar o `.react-flow` DOM node

**3. Novo: `src/utils/printPlanoComercial.ts`**
- Função `printPlanoComercial(nodes: PlanoNode[], flowElement: HTMLElement)` que:
  1. Usa `html2canvas` para capturar o fluxograma como imagem
  2. Abre uma janela `window.open()` com conteúdo HTML em orientação paisagem (`@page { size: landscape }`)
  3. Seções do relatório:
     - **Cabeçalho**: "Plano de Implementação Comercial" + data
     - **Resumo**: Total, Ocupadas, Pendentes (números)
     - **Posições Ocupadas** agrupadas por setor, com nome do cargo, pessoa contratada, funil e observações
     - **Posições Pendentes** agrupadas por setor, com nome do cargo, funil e observações
     - **Fluxograma**: imagem capturada do canvas
  4. Chama `window.print()` automaticamente

**4. Dependência: `html2canvas`**
- Adicionar ao `package.json` para captura do fluxograma

### Detalhes técnicos

- Orientação paisagem via CSS `@page { size: landscape; }` na janela de impressão
- Dados extras (observações) extraídos de `node.dados_extras.observacoes`
- Agrupamento por setor reutiliza a mesma lógica de `groupBySetorCargo`
- O fluxograma é capturado fazendo `fitView` antes do screenshot para garantir que todos os nodes apareçam

