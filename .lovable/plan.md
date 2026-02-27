

# Fase 2 -- Motor v5.2 + Painel Estimativa de Valores

## Tarefa 1: Atualizar `rubricas.ts` com definicoes completas

**Arquivo:** `src/utils/trabalhista/rubricas.ts`

O arquivo atual e um placeholder vazio. Sera preenchido com as 40+ rubricas que o motor ja gera na funcao `montarRubricas()` de `calculator.ts`, incluindo campo `descricao` opcional para tooltips futuros. As categorias serao alinhadas com as que o motor efetivamente usa (Horas Extras, Intervalos, Repouso Semanal, Adicionais, Reflexos, FGTS, Multas Rescisorias, Verbas Diversas, Danos, Acidente e Doenca).

Nenhum import novo necessario -- o arquivo ja exporta `RubricaDef`, `CATEGORIAS` e `RUBRICAS`.

## Tarefa 2: Verificar/manter `calculator.ts`

**Arquivo:** `src/utils/trabalhista/calculator.ts`

O motor ja esta completo com:
- `calcular_periodo_modulado(dataAdmissao, dataDemissao)` -- assinatura correta (ADI 5322)
- 22 fases de calculo
- `calcularTudo(dados)` retornando `CalculoCompleto`
- `estimarImpactoCampo(campo, dadosAtuais)`
- Constantes: IPCA-E 5% a.a., juros 1% a.m., salario minimo R$ 1.412

Se os arquivos enviados trouxerem diferencas, serao aplicadas. Caso contrario, o motor existente ja esta funcional.

## Tarefa 3: Construir `ValuesEstimationPanel` completo

**Arquivo:** `src/components/crm/estimativa/ValuesEstimationPanel.tsx`

### Logica

- `useLeadDadosSync(leadId)` para obter dados
- `useMemo(() => calcularTudo(dados), [dados])` para calculo reativo
- `getFieldValue(dados, 'modalidade_desligamento')` para condicao do aviso de deducao

### Layout

```text
+--------------------------------------------+
| [Calculator] Estimativa de Valores         |
+--------------------------------------------+
| [Barra resumo - Card com bg-muted/50]      |
|  Total Nominal: R$ XXX | Atualizado: R$ YYY|
+--------------------------------------------+
| [Metadados colapsavel via Collapsible]     |
|  Meses: X | Base: R$ X | Regime: misto    |
|  Divisor: 220 | Modulacao: PARCIAL        |
+--------------------------------------------+
| [Accordion por categoria]                  |
|  v Horas Extras (R$ XXX)                   |
|    | Rubrica          | Nominal | Atual.  ||
|    | HE CLT           | 12.000  | 15.400  ||
|    | Tempo Disp. [Mod] | 5.000   | 6.200  ||
|  > Intervalos (R$ XXX)                     |
|  > Adicionais (R$ XXX)                     |
+--------------------------------------------+
| [Rodape]                                   |
|  Integral: R$ X / R$ Y                     |
|  Modulado: R$ X / R$ Y                     |
|  Total Geral: R$ X (atualizado)            |
|  Pensao Vitalicia: R$ X (se aplicavel)     |
|  Total c/ Pensao: R$ X (se aplicavel)      |
|  [Aviso deducao - condicional]             |
|  [Aviso legal do motor]                    |
+--------------------------------------------+
```

### Detalhes visuais

- Formatacao monetaria: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Rubricas com `valorNominal > 0`: texto normal
- Rubricas com `valorNominal === 0`: texto `text-muted-foreground`
- Rubricas moduladas: Badge "Modulada" azul (`variant="secondary"`)
- Rubricas nao calculaveis: icone AlertTriangle + lista de campos faltantes
- Categorias com total > 0: abertas por padrao (accordion `defaultValue`)
- Categorias com total === 0: fechadas
- Loading: Skeleton enquanto `loading === true`
- Erro (campos obrigatorios faltam): Alert com descricao do erro

### Aviso condicional de deducao rescisoria (novo requisito)

Logo abaixo dos subtotais, quando a modalidade for uma das tres listadas:

```tsx
const modalidade = getFieldValue(dados, 'modalidade_desligamento')?.valor ?? '';
const exibirAvisoDeducao = [
  'Dispensa sem justa causa',
  'Rescisao indireta',
  'Acordo mutuo'
].includes(modalidade);
```

Texto exibido em `text-xs text-muted-foreground` com icone de aviso, sempre visivel (nao colapsado, nao tooltip):

"Os valores ja recebidos na rescisao foram estimados com base no salario registrado na CTPS e nos adicionais declarados como pagos pela empresa. A diferenca real sera apurada com precisao apos analise dos documentos rescisorios."

### Aviso legal do motor

Sempre visivel abaixo de tudo, texto do campo `metadados.aviso` em `text-xs text-muted-foreground italic`.

### Dependencias (todas ja existentes no projeto)

- `useLeadDadosSync` -- hook
- `calcularTudo` -- motor
- `getFieldValue` -- types.ts
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` -- shadcn
- `Card`, `CardHeader`, `CardTitle`, `CardContent` -- shadcn
- `Badge` -- shadcn
- `Alert`, `AlertTitle`, `AlertDescription` -- shadcn
- `Skeleton` -- shadcn
- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` -- shadcn
- Lucide icons: `Calculator`, `AlertTriangle`, `ChevronDown`, `Info`, `Scale`

### Nenhuma migracao de banco necessaria

Dados vem de `crm_leads.dados_extras` (JSONB) via `useLeadDadosSync`.

