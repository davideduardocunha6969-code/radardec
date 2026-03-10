

## Exibir telefones na aba "Dados do Lead"

### Problema
Os telefones do lead (`lead.telefones`) não aparecem na aba "Dados" (`LeadDadosTab`). Eles só são visíveis nas abas de atendimento SDR/Closer. Como dado de contato, deveriam estar nos dados do lead.

### Solução
Adicionar uma seção de telefones no `LeadDadosTab`, exibida antes dos campos dinâmicos. No modo visualização, mostra os telefones com ícone, número, tipo (badge) e observação. No modo edição, permite editar/adicionar/remover telefones inline (mesma UX que já existe no Kanban).

### Alteração — `src/components/crm/LeadDadosTab.tsx`

1. **Importar** `Phone`, `Plus`, `Trash2` do lucide-react e `Badge` do shadcn
2. **Adicionar estado** `editTelefones` ao formulário de edição (em `startEditing`, copiar `lead.telefones`)
3. **No `handleSave`**, incluir `telefones` na atualização do banco (filtrar telefones vazios)
4. **Modo visualização**: renderizar seção "Telefones" no topo (antes dos campos sem seção), mostrando cada telefone com ícone Phone, número, badge de tipo e observação
5. **Modo edição**: renderizar inputs para cada telefone (número + tipo + observação + botão remover) + botão "Adicionar Telefone"
6. **Atualizar `hasAnyFilled`** para considerar telefones preenchidos

