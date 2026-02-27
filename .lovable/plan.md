

# Fase 1 — Infraestrutura dos Tres Paineis

## Resumo

Criar a base de dados, tipos, hook de sincronizacao e estrutura esqueleto do motor de calculo. Nenhuma funcao de calculo sera implementada agora — apenas tipos, categorias e assinaturas vazias aguardando o motor v5.2.

---

## 1. Migracao: novas colunas em `robos_coach`

Adicionar duas colunas de texto para armazenar os prompts do extrator e do analisador de lacunas:

```sql
ALTER TABLE public.robos_coach
  ADD COLUMN IF NOT EXISTS instrucoes_extrator text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instrucoes_lacunas text NOT NULL DEFAULT '';
```

## 2. Atualizar interface `RoboCoach`

Em `src/hooks/useRobosCoach.ts`, adicionar os dois novos campos:

```typescript
instrucoes_extrator: string;
instrucoes_lacunas: string;
```

E atualizar os tipos dos mutations para aceitar esses campos.

## 3. Formato de metadados em `dados_extras`

### Novo tipo: `DadosExtrasField`

```typescript
// src/utils/trabalhista/types.ts

/** Valor armazenado em dados_extras com metadados */
export interface DadosExtrasField {
  valor: string;
  origem: "extrator_automatico" | "preenchimento_manual" | "importado";
  confianca: "alta" | "media" | "baixa" | "interpretado";
  turno_extracao: number | null;
  data_ultima_atualizacao: string; // ISO timestamp
}

/** Formato completo do dados_extras */
export type DadosExtrasMap = Record<string, string | DadosExtrasField>;
```

### Funcao utilitaria `getFieldValue()`

```typescript
export function getFieldValue(dados: DadosExtrasMap | null, key: string): { valor: string; meta: DadosExtrasField | null } {
  if (!dados || !dados[key]) return { valor: "", meta: null };
  const v = dados[key];
  if (typeof v === "string") return { valor: v, meta: null };
  return { valor: v.valor || "", meta: v };
}
```

## 4. Hook `useLeadDadosSync`

Novo arquivo `src/hooks/useLeadDadosSync.ts`.

**Responsabilidades**:
- Recebe `leadId` e carrega `dados_extras` do lead
- Expoe `dados` (estado local reativo), `getField(key)`, `setField(key, valor, origem)`, `setFields(campos[])` 
- `setField` grava imediatamente no banco via UPDATE parcial (merge no JSONB)
- Prioridade manual: se `origem === "preenchimento_manual"`, o campo nunca e sobrescrito por `extrator_automatico`
- Expoe `subscribe(callback)` para que os paineis reajam a mudancas
- Usa `useCallback` e `useRef` para evitar re-renders desnecessarios

**Interface publica**:

```typescript
interface UseLeadDadosSyncReturn {
  dados: DadosExtrasMap;
  loading: boolean;
  getField: (key: string) => { valor: string; meta: DadosExtrasField | null };
  setField: (key: string, valor: string, origem?: string) => Promise<void>;
  setFields: (fields: Array<{ key: string; valor: string; origem?: string; confianca?: string; turno?: number }>) => Promise<void>;
  allFieldKeys: string[]; // keys de todos os campos definidos em crm_lead_campos
}
```

## 5. Adaptar `LeadDadosTab` para retrocompatibilidade

A `LeadDadosTab` atual le `dados_extras` como `Record<string, unknown>`. Precisa:

- Usar `getFieldValue()` para ler valores (suporta tanto string simples quanto objeto com metadados)
- Na visualizacao, mostrar icone de lapis quando `origem === "preenchimento_manual"` e circulo de confianca colorido quando o campo tem metadados
- Na edicao, ao salvar, gravar como `DadosExtrasField` com `origem: "preenchimento_manual"`

## 6. Estrutura esqueleto do motor de calculo

### Arquivo: `src/utils/trabalhista/types.ts`

Tipos base para o motor:

```typescript
export interface RubricaResult {
  id: string;
  nome: string;
  categoria: string;
  valorNominal: number | null;
  valorAtualizado: number | null;
  calculavel: boolean;
  camposFaltantes: string[];
  modulado: boolean;
  dataInicioCalculo?: string;
  dataVencimentoRef?: string;
  mesesCalculados?: number;
}

export interface CategoriaResult {
  id: string;
  nome: string;
  rubricas: RubricaResult[];
  subtotalNominal: number;
  subtotalAtualizado: number;
}

export interface CalculoCompleto {
  categorias: CategoriaResult[];
  subtotalIntegralNominal: number;
  subtotalIntegralAtualizado: number;
  subtotalModuladoNominal: number;
  subtotalModuladoAtualizado: number;
  totalGeralNominal: number;
  totalGeralAtualizado: number;
  pensaoVitalicia: number | null;
  totalComPensao: number | null;
}

export type TipoCampo = "texto" | "data" | "numero" | "sim_nao" | "selecao" | "valor" | "horario";
```

### Arquivo: `src/utils/trabalhista/correcao.ts`

Funcoes de correcao com IPCA-E medio de 5% a.a. como constante:

```typescript
const IPCA_E_ANUAL_MEDIO = 0.05;
const JUROS_MORATORIOS_MENSAL = 0.01;

export function corrigirIPCAE(valor: number, dataBase: Date, dataCalculo?: Date): number { /* implementar */ }
export function aplicarJurosMoratorios(valor: number, dataBase: Date, dataCalculo?: Date): number { /* implementar */ }
```

### Arquivo: `src/utils/trabalhista/calculator.ts`

Esqueleto com categorias e assinaturas vazias:

```typescript
export function calcularTudo(dados: DadosExtrasMap): CalculoCompleto {
  // Placeholder — sera preenchido com motor v5.2
  return { categorias: [], subtotalIntegralNominal: 0, /* ... */ };
}

export function estimarImpactoCampo(campo: string, dadosAtuais: DadosExtrasMap): number {
  // Placeholder — retorna 0 ate motor v5.2
  return 0;
}

export function calcular_periodo_modulado(dataBase: Date, rubricaId: string): {
  meses_calculados: number;
  data_inicio_calculo: Date;
  data_vencimento_ref: Date;
} {
  // Placeholder — sera preenchido com motor v5.2
}
```

### Arquivo: `src/utils/trabalhista/rubricas.ts`

Definicao das 27 categorias e suas rubricas (sem logica de calculo):

```typescript
export interface RubricaDef {
  id: string;
  nome: string;
  categoria: string;
  camposNecessarios: string[];
  modulavel: boolean;
}

export const CATEGORIAS: Array<{ id: string; nome: string }> = [
  { id: "horas_extras", nome: "Horas Extras" },
  { id: "intervalo_intrajornada", nome: "Intervalo Intrajornada" },
  { id: "interjornada", nome: "Interjornada" },
  // ... todas as 27 categorias
];

export const RUBRICAS: RubricaDef[] = [
  // Sera preenchido com motor v5.2
];
```

## 7. Estrutura de pastas dos paineis (vazios)

Criar arquivos placeholder para os 3 paineis — so exportam componentes vazios com titulo:

```
src/components/crm/extrator/DataExtractorPanel.tsx
src/components/crm/lacunas/GapsPanel.tsx
src/components/crm/estimativa/ValuesEstimationPanel.tsx
```

Cada um exporta um componente simples com Card e titulo, sem logica. Servem como ponto de montagem para as fases seguintes.

---

## Arquivos novos (8 arquivos)

1. `src/utils/trabalhista/types.ts` — Tipos do motor e metadados
2. `src/utils/trabalhista/correcao.ts` — Correcao monetaria (IPCA-E 5% + juros 1%)
3. `src/utils/trabalhista/calculator.ts` — Esqueleto do motor
4. `src/utils/trabalhista/rubricas.ts` — Definicao de categorias e rubricas
5. `src/hooks/useLeadDadosSync.ts` — Hook de sincronizacao bidirecional
6. `src/components/crm/extrator/DataExtractorPanel.tsx` — Placeholder Painel 1
7. `src/components/crm/lacunas/GapsPanel.tsx` — Placeholder Painel 2
8. `src/components/crm/estimativa/ValuesEstimationPanel.tsx` — Placeholder Painel 3

## Arquivos alterados (2 arquivos)

1. `src/hooks/useRobosCoach.ts` — Adicionar `instrucoes_extrator` e `instrucoes_lacunas`
2. `src/components/crm/LeadDadosTab.tsx` — Retrocompatibilidade com novo formato de metadados

## Migracao (1)

- ALTER TABLE `robos_coach` ADD COLUMN `instrucoes_extrator`, `instrucoes_lacunas`

---

## O que NAO sera feito agora

- Conteudo das funcoes de calculo (aguardando motor v5.2)
- Edge functions `extract-lead-data` e `analyze-gaps` (aguardando prompts)
- Layout dos paineis na pagina de Atendimento (Fase 5)
- Logica de extracao em tempo real (Fase 3)
- Logica de analise de lacunas (Fase 4)

