
# Fix: Abas SDR e Closer nao carregam — objeto renderizado como React child

## Causa raiz

O erro no console e:
```text
Objects are not valid as a React child
(found: object with keys {valor, origem, confianca, turno_extracao, data_ultima_atualizacao})
```

Apos a implementacao do Extrator de Dados, os campos em `dados_extras` passaram a ser salvos como objetos `DadosExtrasField` (com metadados de confianca, origem, etc.) em vez de strings simples. Porem, o `CrmFunilKanban.tsx` renderiza esses valores diretamente com `{(detailLead.dados_extras as Record<string, string>).empresa}`, o que faz o React crashar ao tentar renderizar um objeto.

O problema afeta dois blocos identicos:
- **Linhas 484-491**: Aba "Atendimento SDR" — grid de dados extras
- **Linhas 608-616**: Aba "Atendimento Closer" — grid de dados extras

## Solucao

Usar a funcao `getFieldValue` (ja existente em `src/utils/trabalhista/types.ts`) para extrair o valor string de cada campo, com retrocompatibilidade para strings legadas.

### Mudanca em `src/pages/CrmFunilKanban.tsx`

1. Adicionar import no topo do arquivo:
```typescript
import { getFieldValue, type DadosExtrasMap } from "@/utils/trabalhista/types";
```

2. Criar helper local para simplificar o acesso:
```typescript
const getExtra = (dados: any, key: string): string => 
  getFieldValue(dados as DadosExtrasMap, key).valor;
```

3. Substituir todas as ocorrencias de:
```text
(detailLead.dados_extras as Record<string, string>).empresa
```
por:
```text
getExtra(detailLead.dados_extras, "empresa")
```

Isso afeta ~14 ocorrencias nos dois blocos (SDR e Closer), cobrindo os campos: `empresa`, `cargo`, `data_admissao`, `data_demissao`, `motivo_demissao`, `cpf`, `municipio`, `uf`.

## Resultado esperado

- As abas SDR e Closer voltam a renderizar normalmente
- Campos com metadados (salvos pelo Extrator) exibem apenas o valor textual
- Campos legados (strings puras) continuam funcionando sem alteracao
- Nenhum impacto na aba Dados (que ja usa `getFieldValue` via `LeadDadosTab`)
