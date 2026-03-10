

## Problema identificado

Existem **dois bugs** que causam a perda de telefones nas abas SDR/Closer:

1. **Incompatibilidade de campo `obs` vs `observacao`**: `LeadDadosTab` usa `TelefoneEntry` com campo `obs`, mas `CrmLead`/`LeadTelefone` usa `observacao`. Quando o usuário salva na aba Dados, os telefones são salvos com `obs` no banco. As abas SDR/Closer leem `t.observacao` (linha 550), que não existe mais — e o mapeamento de `lead.telefones` para `TelefoneEntry` no `useMemo` (linha 38-42) não faz nenhuma conversão, mantendo o campo que vier do banco.

2. **Telefones no topo ao invés de dentro da seção "Dados de Contato"**: Conforme solicitação anterior (ainda pendente), os telefones devem ficar dentro da seção dinâmica "Dados de Contato", não no topo.

## Alterações

### 1. `src/components/crm/LeadDadosTab.tsx`

- **Remover** `TelefoneEntry` interface — usar `LeadTelefone` de `useCrmOutbound` diretamente (campo `observacao`)
- **Corrigir** `startEditing` para mapear `observacao` corretamente
- **Corrigir** `handleSave` para salvar com campo `observacao` (não `obs`)
- **Mover** a seção de telefones para dentro da seção cujo nome contenha "contato" (case-insensitive), tanto em visualização quanto edição
- **Remover** a exibição de telefones do topo do componente
- Se nenhuma seção "contato" existir, renderizar telefones como fallback no final

### 2. `src/pages/CrmFunilKanban.tsx`

Nenhuma alteração necessária — o código já itera `detailLead.telefones` corretamente. O bug era que após editar na aba Dados, o `onLeadUpdate` passava telefones com `obs` ao invés de `observacao`, corrompendo o estado. A correção no `LeadDadosTab` resolve isso.

