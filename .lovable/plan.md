

## Remover "Dados Nativos" do ZapSignDialog — usar apenas campos da aba Dados

### Problema
O Step 2 exibe uma seção "Dados Nativos" separada com Nome e Endereço hardcoded, duplicando campos que já existem na seção "Dados Pessoais". Isso confunde o usuário e não faz sentido ter dois nomes para o mesmo lead.

### Solução
Remover completamente a seção "Dados Nativos" e os campos `__nome__` e `__endereco__`. O dialog deve mostrar **apenas** os campos dinâmicos da seção "Dados Pessoais" que vêm da aba Dados do Lead.

### Alterações em `src/components/crm/ZapSignDialog.tsx`

1. **Remover do `useMemo`** (linhas 41-47): eliminar a inserção manual de `__nome__` e `__endereco__` no `values`
2. **Remover do template** (linhas 222-243): eliminar todo o bloco "Dados Nativos" do JSX
3. **Ajustar `handleSend`** (linhas 111-127):
   - Remover a validação obrigatória de `__nome__` (o nome do signatário virá do campo dinâmico "nome" ou equivalente da seção Dados Pessoais)
   - Remover os mapeamentos `__nome__`, `__telefone__`, `__endereco__` — todos os campos agora usam suas chaves reais
   - Para o `signer_name`, usar `fieldValues["nome"]` ou o campo que corresponda ao nome na seção, ou `lead.nome` como fallback

