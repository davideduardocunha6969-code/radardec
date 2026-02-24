

# Corrigir: Script do Coaching deve vir da coluna do lead, nao global

## Problema

O `RealtimeCoachingPanel` usa o hook `useActiveScriptSdr()` que busca o **primeiro script ativo global** do banco de dados. Isso significa que, independentemente de qual coluna o lead esta, o coaching sempre usa o mesmo script. Os campos `script_sdr_id` e `script_closer_id` configurados em cada coluna do funil sao ignorados.

## Solucao

Passar o script correto como prop do `CrmFunilKanban` para o `RealtimeCoachingPanel`, resolvendo-o a partir da coluna onde o lead esta.

## Mudancas

### 1. `RealtimeCoachingPanel.tsx`

- Adicionar prop opcional `script` do tipo `ScriptSdr | null` na interface `RealtimeCoachingPanelProps`
- Remover o import e uso de `useActiveScriptSdr`
- Usar `props.script` em vez de `activeScript` para derivar `qualificationItems` e `apresentacaoItems`
- Se `script` nao for passado, manter fallback para os itens padrao do `coachingData.ts`

### 2. `CrmFunilKanban.tsx`

- Criar funcao `getScriptForLead(lead, tipo)` similar a `getCoachForLead`:
  - Encontra a coluna do lead
  - Se `tipo === "closer"`, usa `coluna.script_closer_id` e busca em `scriptsCloser`
  - Se `tipo === "sdr"`, usa `coluna.script_sdr_id` e busca em `scriptsSdr`
- Passar o script resolvido como prop `script` nas duas instancias de `RealtimeCoachingPanel`:
  - Tab SDR (linha ~671): `script={getScriptForLead(detailLead, "sdr")}`
  - Tab Closer (linha ~734): `script={getScriptForLead(detailLead, "closer")}`

## Resultado

Cada coluna do funil usara o script correto configurado nela. Ao criar novos funis com scripts diferentes, o coaching automaticamente usara o script da coluna onde o lead esta posicionado.

