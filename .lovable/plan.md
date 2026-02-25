

# Corrigir duplicidade do campo "Endereco" e prevenir nomes duplicados

## Problema
A aba "Dados" exibe dois campos "Endereco" porque:
1. O componente `LeadDadosTab` renderiza um campo fixo "Endereco" (coluna dedicada `crm_leads.endereco`)
2. A tabela `crm_lead_campos` tambem possui um registro com `key: endereco` e `nome: Endereco`

## Solucao

### 1. Excluir o registro duplicado da tabela `crm_lead_campos`
Remover o registro com `key = 'endereco'` via ferramenta de dados (DELETE), ja que o endereco ja e uma coluna propria da tabela `crm_leads` e ja e renderizado de forma fixa no componente.

### 2. Adicionar constraint UNIQUE na coluna `nome` (migracao SQL)
Criar uma constraint de unicidade na coluna `nome` da tabela `crm_lead_campos` para que o banco de dados impeca a criacao de dois campos com o mesmo nome.

```sql
ALTER TABLE public.crm_lead_campos ADD CONSTRAINT crm_lead_campos_nome_unique UNIQUE (nome);
```

### 3. Validacao client-side ao criar campos
No `ImportMappingDialog.tsx`, na funcao `handleCreateField`, alem da verificacao por `key` que ja existe, adicionar verificacao por `nome` (case-insensitive) para dar feedback imediato ao usuario.

No hook `useCrmLeadCampos.ts`, na funcao `useCreateCrmLeadCampo`, tambem seria ideal validar o nome antes de inserir.

### Arquivos afetados
- **Dados**: DELETE no registro `crm_lead_campos` onde `key = 'endereco'`
- **Migracao**: Constraint UNIQUE em `crm_lead_campos.nome`
- **`src/components/crm/ImportMappingDialog.tsx`**: Adicionar validacao de nome duplicado em `handleCreateField`
- **`src/hooks/useCrmLeadCampos.ts`**: Validacao adicional na mutacao de criacao

