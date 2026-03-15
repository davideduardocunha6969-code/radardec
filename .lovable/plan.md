

## Filtros de Setor e Produto por gráfico/card na seção Atendimentos

### Situação atual
A seção "Radar Atendimentos" possui filtros globais (Setor, Responsável, Resultado) que afetam todos os gráficos ao mesmo tempo. O campo `produto` existe nos dados (`CommercialRecord.produto`) mas não é usado como filtro.

### Proposta
Adicionar filtros individuais de **Setor** e **Produto** em cada gráfico/card da seção. Cada card terá seus próprios selects no header, permitindo análise granular sem afetar os outros gráficos.

### Implementação

**Arquivo:** `src/pages/RadarComercial.tsx`

1. **Extrair opções de produto** no `filterOptions` (já existente, linha 93):
   - Adicionar `produtos` como opção de filtro extraída dos dados

2. **Criar estados de filtro por card** (10 pares de estado setor+produto):
   - `atendSemanaSetor`, `atendSemanaProduto`
   - `atendResponsavelSetor`, `atendResponsavelProduto`
   - `atendModalidadeSetor`, `atendModalidadeProduto`
   - `atendDireitoSetor`, `atendDireitoProduto`
   - `atendQualificadosSetor`, `atendQualificadosProduto`
   - `atendSetorSetor`, `atendSetorProduto`
   - `atendResultadoSetor`, `atendResultadoProduto`
   - `atendNoShowSetor`, `atendNoShowProduto`
   - `atendTempoSetor`, `atendTempoProduto`
   - `atendRankingSetor`, `atendRankingProduto`

   Para evitar a explosão de `useState`, criar um **único estado objeto** para gerenciar todos os filtros por card:
   ```ts
   const [cardFilters, setCardFilters] = useState<Record<string, { setor: string | null; produto: string | null }>>({});
   ```

3. **Criar componente auxiliar de filtro** inline (ou extraído) que renderiza dois `Select` (Setor + Produto) no header de cada card. O produto será filtrado dinamicamente conforme o setor selecionado.

4. **Criar helper de filtragem** que aplica setor+produto sobre `atendimentosFilteredData` para cada card:
   ```ts
   const getCardData = (cardKey: string) => {
     const filters = cardFilters[cardKey];
     let d = atendimentosFilteredData;
     if (filters?.setor) d = d.filter(r => r.setor === filters.setor);
     if (filters?.produto) d = d.filter(r => r.produto === filters.produto);
     return d;
   };
   ```

5. **Atualizar cada `useMemo`** dos gráficos (responsavelChartData, modalidadeChartData, etc.) para usar o dado filtrado por card OU mover a computação para dentro do JSX/helper.

   Como alterar 10 useMemos para depender de `cardFilters` poderia ser pesado, a abordagem mais limpa é usar **funções de computação** em vez de useMemos separados, recalculando sob demanda com base nos filtros do card.

6. **Adicionar os selects** no `CardHeader` de cada card, ao lado do título, com layout compacto (h-8, text-xs).

### Resultado
Cada gráfico terá dois dropdowns (Setor / Produto) no canto superior direito do card, permitindo análise independente por card. Os filtros globais da seção continuam funcionando como filtro base.

### Escopo de alteração
- **1 arquivo:** `src/pages/RadarComercial.tsx`
- Estimativa: ~200 linhas adicionadas/modificadas

