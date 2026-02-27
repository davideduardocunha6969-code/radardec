

# Perguntas Condicionais nos Scripts (SDR e Closer)

## Objetivo

Permitir que cada pergunta do script tenha sub-perguntas condicionais. Exemplo: a pergunta "Tipo de demissao" pode ter sub-perguntas diferentes dependendo da resposta (se foi justa causa, surgem perguntas X; se pediu conta, surgem perguntas Y).

## Estrutura de Dados

A mudanca e 100% no JSON armazenado na coluna `qualificacao`, `apresentacao`, `fechamento` e `show_rate` (todas ja sao JSONB). Nao e necessaria nenhuma migration SQL.

O tipo `ScriptItem` atual:
```text
{ id, label, description }
```

Passa a ser:
```text
{ id, label, description, sub_items?: ScriptItem[] }
```

Cada `sub_item` pode ter seus proprios `sub_items`, permitindo N niveis de condicionalidade (na pratica, 2 niveis ja atende).

## Mudancas

### 1. Tipo `ScriptItem` (`src/hooks/useScriptsSdr.ts`)

Adicionar campo opcional `sub_items`:

```typescript
export interface ScriptItem {
  id: string;
  label: string;
  description: string;
  sub_items?: ScriptItem[];
}
```

### 2. Editor de Script (`ScriptItemEditor`) -- SDR e Closer

Tanto em `ScriptsSdrTab.tsx` quanto em `ScriptsCloserTab.tsx`, o componente `ScriptItemEditor` sera atualizado para:

- Exibir um botao "+ Condicional" em cada item (ao lado do botao X de remover)
- Ao clicar, exibir sub-itens indentados abaixo do item pai, com visual diferenciado (borda lateral colorida, fundo levemente diferente)
- Cada sub-item tem os mesmos campos (label + description) e pode ser removido individualmente
- Indicador visual de quantas condicionais cada item possui

Layout do item com condicionais:
```text
[Grip] [Titulo: Tipo de demissao           ] [+ Condicional] [X]
       [Descricao: Como foi a demissao?    ]
       |-- [Sub] Justa causa: Qual o motivo?       [X]
       |-- [Sub] Pediu conta: Teve pressao?        [X]
       |-- [Sub] Acordo: Foi acordo extrajudicial? [X]
```

### 3. `ChecklistCard` e `DynamicChecklistCard` -- Exibicao durante o atendimento

No `RealtimeCoachingPanel.tsx`, ao montar os `ChecklistItem[]` a partir do script, incluir os sub_items como itens filhos com indentacao visual. Existem duas abordagens:

**Abordagem escolhida**: Flatten com prefixo -- os sub_items sao achatados na lista de checklist, mas exibidos com indentacao (padding-left) e um indicador visual de que sao condicionais (ex: icone de seta ou borda). O ID do sub_item concatena com o pai para manter unicidade.

Isso garante que a IA de deteccao (coaching-realtime) tambem receba os sub_items no contexto e possa marcar como "DITO" quando o SDR/Closer abordar a pergunta condicional.

### 4. Contexto para a IA (coaching-realtime edge function)

Nao precisa de mudanca na edge function. Os itens ja sao enviados como arrays de checklist. Ao flatten dos sub_items na lista, eles chegam naturalmente ao contexto da IA.

## Arquivos Modificados

1. `src/hooks/useScriptsSdr.ts` -- tipo `ScriptItem` + campo `sub_items`
2. `src/components/robos/ScriptsSdrTab.tsx` -- `ScriptItemEditor` com suporte a condicionais
3. `src/components/robos/ScriptsCloserTab.tsx` -- `ScriptItemEditor` com suporte a condicionais
4. `src/components/crm/RealtimeCoachingPanel.tsx` -- flatten de sub_items ao montar checklist
5. `src/components/crm/coaching/ChecklistCard.tsx` -- indentacao visual para itens condicionais (prop `depth` ou `isChild`)

## Retrocompatibilidade

- Scripts existentes sem `sub_items` continuam funcionando normalmente (o campo e opcional)
- A IA nao precisa de ajuste, pois recebe a lista ja achatada
- Nao ha migration SQL necessaria (dados sao JSONB flexivel)
