

# Importacao transacional (tudo ou nada)

## Problema
Com a abordagem de lotes, se um lote falha apos outros terem sido inseridos, o usuario precisaria editar a planilha manualmente para remover os leads ja cadastrados antes de tentar novamente -- processo confuso e propenso a erro.

## Solucao
Criar uma funcao no banco de dados que recebe todos os leads de uma vez e os insere dentro de uma unica transacao. Se qualquer erro ocorrer, nenhum lead e inserido (rollback automatico). Isso garante comportamento "tudo ou nada".

## Alteracoes

### 1. Migracao: criar funcao `bulk_insert_leads` no banco

Funcao RPC que:
- Recebe um array JSON com todos os leads
- Insere todos dentro da mesma transacao (comportamento padrao de funcoes PL/pgSQL)
- Se qualquer insert falhar, toda a transacao e revertida automaticamente
- Sem limite de 1000 linhas (o limite do PostgREST nao se aplica a chamadas RPC)

```text
Fluxo:
App envia JSON[] --> RPC bulk_insert_leads --> BEGIN (implicito)
  --> INSERT lead 1 OK
  --> INSERT lead 2 OK
  --> ...
  --> INSERT lead N ERRO --> ROLLBACK automatico (nenhum lead inserido)
  ou
  --> INSERT lead N OK --> COMMIT (todos inseridos)
```

### 2. `src/hooks/useCrmOutbound.ts` - Usar RPC em vez de insert direto

Modificar `useBulkCreateLeads` para:
- Chamar `supabase.rpc('bulk_insert_leads', { leads: [...] })` em vez de `supabase.from('crm_leads').insert()`
- Remover logica de batching (nao e mais necessaria)
- Manter a interface publica do hook inalterada

### 3. `src/components/crm/ImportMappingDialog.tsx` - Feedback adequado

- Manter feedback simples: "Importando..." durante o processo
- Em caso de sucesso: "X leads importados com sucesso!"
- Em caso de erro: "Nenhum lead foi importado. Corrija o problema e tente novamente." -- sem preocupacao com estado parcial

## Vantagens
- Zero risco de importacao parcial
- Usuario pode sempre re-importar a mesma planilha sem medo de duplicatas
- Mais simples de entender e manter
- Suporta milhares de linhas (sem limite do PostgREST)

## Arquivos modificados
- Nova migracao SQL (funcao `bulk_insert_leads`)
- `src/hooks/useCrmOutbound.ts`
- `src/components/crm/ImportMappingDialog.tsx` (ajustes menores no feedback)

