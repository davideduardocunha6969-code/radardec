

# Fase 5 — Integracao Final dos 3 Paineis

## Problema Central de Sincronizacao

Atualmente, cada painel (`DataExtractorPanel`, `GapsPanel`, `ValuesEstimationPanel`) cria sua propria instancia de `useLeadDadosSync(leadId)`. Isso significa que:

- Quando o Extrator grava um campo, o GapsPanel e o ValuesEstimationPanel NAO recebem a atualizacao (cada um tem seu proprio state `dados` isolado).
- Quando o Closer edita manualmente na aba Dados, nenhum dos 3 paineis percebe.
- A cadeia reativa desejada (editar campo -> Painel 3 recalcula -> Painel 2 remove lacuna) nao funciona.

## Solucao: Elevar `useLeadDadosSync` para o `Atendimento.tsx`

Chamar `useLeadDadosSync(leadId)` uma unica vez no componente pai (`Atendimento.tsx`) e passar o retorno como props para os 3 paineis. Assim, todos compartilham a mesma fonte de verdade.

---

## Alteracoes por Arquivo

### 1. `src/pages/Atendimento.tsx`

- Importar e chamar `useLeadDadosSync(lead?.id ?? null)` no nivel do componente
- Passar o objeto retornado (`dados`, `setField`, `setFields`, `getField`, `allFieldKeys`, `loading`) para os 3 paineis via props
- Remover a dependencia de `coach` no render do `DataExtractorPanel` e `GapsPanel` quando `coachId` nao existir (os paineis ja lidam com ausencia de coach internamente)

### 2. `src/components/crm/extrator/DataExtractorPanel.tsx`

- Remover chamada interna a `useLeadDadosSync`
- Receber `dados`, `setField`, `setFields` como props
- Remover export duplicado de `LabeledTranscript` (ja exportado de `RealtimeCoachingPanel`)
- Importar `LabeledTranscript` de `RealtimeCoachingPanel` (ou de um tipo compartilhado)

### 3. `src/components/crm/lacunas/GapsPanel.tsx`

- Remover chamada interna a `useLeadDadosSync`
- Receber `dados` e `loading` como props

### 4. `src/components/crm/estimativa/ValuesEstimationPanel.tsx`

- Remover chamada interna a `useLeadDadosSync`
- Receber `dados` e `loading` como props

### 5. Remover `LabeledTranscript` duplicado

O tipo `LabeledTranscript` esta definido em 2 arquivos (`RealtimeCoachingPanel.tsx` e `DataExtractorPanel.tsx`). Remover a definicao duplicada do `DataExtractorPanel` e importar do `RealtimeCoachingPanel`.

---

## Fluxo de Sincronizacao Apos a Mudanca

```text
useLeadDadosSync(leadId)  <-- unica instancia no Atendimento.tsx
  |
  +-- dados --> DataExtractorPanel (le + escreve via setFields)
  |                |
  |                +-- setFields() --> atualiza dados no state compartilhado
  |                                    --> persiste no banco
  |
  +-- dados --> GapsPanel (le, recalcula lacunas sempre que dados muda)
  |                |
  |                +-- estimarImpactoCampo() --> calculo local
  |                +-- invoke('analyze-gaps') --> se >= 3 lacunas com impacto > 0
  |
  +-- dados --> ValuesEstimationPanel (le, recalcula calcularTudo sempre que dados muda)
```

Qualquer chamada a `setFields` ou `setField` (pelo Extrator ou por edicao manual) atualiza o state compartilhado, que propaga instantaneamente para todos os paineis.

---

## Validacao dos Fluxos

Apos a implementacao, os 4 fluxos pedidos funcionarao:

1. **Edicao manual -> Painel 3 recalcula -> Painel 2 remove lacuna**: `setField` atualiza `dados`, ambos os paineis recebem o novo `dados` via props e recalculam.

2. **Extrator grava campo -> Painel 3 recalcula -> Painel 2 atualiza**: `setFields` do Extrator atualiza o mesmo `dados`, propagando para os outros paineis.

3. **Campo manual nao sobrescrito**: Logica ja implementada em `useLeadDadosSync.setField` (verifica `isManualField`) e na edge function `extract-lead-data` (verifica `origem === 'preenchimento_manual'`).

4. **Aviso de deducao estimada**: Ja implementado no `ValuesEstimationPanel` — verifica `modalidade_desligamento` contra 3 valores especificos e exibe o alerta.

---

## Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/Atendimento.tsx` | Adicionar `useLeadDadosSync`, passar props aos 3 paineis |
| `src/components/crm/extrator/DataExtractorPanel.tsx` | Remover hook interno, receber props, remover tipo duplicado |
| `src/components/crm/lacunas/GapsPanel.tsx` | Remover hook interno, receber props |
| `src/components/crm/estimativa/ValuesEstimationPanel.tsx` | Remover hook interno, receber props |

Nenhuma migracao de banco. Nenhuma edge function alterada. Apenas refatoracao de estado frontend.

