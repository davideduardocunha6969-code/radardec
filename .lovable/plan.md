

## Adicionar criação/exclusão de campos na tela de Configurações

### Problema
A página de Configurações (`LeadSecoesConfig`) permite apenas gerenciar seções (criar, renomear, excluir) e arrastar campos entre elas. Não há como criar novos campos ou excluir campos existentes — a criação só existe dentro do `ImportMappingDialog` durante importação de planilhas.

### Alterações

**`src/components/configuracoes/LeadSecoesConfig.tsx`**

1. Adicionar formulário de criação de campo com:
   - Input "Nome do campo" (ex: "Estado Civil")
   - Select de tipo (texto, numero, data, select)
   - Botão "Novo Campo"
   - Usa `useCreateCrmLeadCampo` + `normalizeKey` do hook existente para gerar a key automaticamente

2. Adicionar botão de excluir (X) em cada campo arrastável (`DraggableCampo`), com confirmação

3. Adicionar hook `useDeleteCrmLeadCampo` em `useCrmLeadCampos.ts`:
   - `DELETE FROM crm_lead_campos WHERE id = ?`
   - Invalida query `crm_lead_campos`

### Fluxo
```text
Configurações → Aba "Campos do Lead"
  → Formulário no topo: Nome + Tipo → "Novo Campo"
  → Campo criado aparece em "Sem seção"
  → Cada campo tem botão X para excluir (com confirm)
  → Arrasta para organizar em seções
```

### Arquivos modificados
- `src/hooks/useCrmLeadCampos.ts` — adicionar `useDeleteCrmLeadCampo`
- `src/components/configuracoes/LeadSecoesConfig.tsx` — formulário de criação + botão excluir nos campos

