

## Correção: Pré-preencher campo "nome" com fallback para lead.nome

### Problema
O campo "nome" da seção Dados Pessoais aparece em branco porque o valor pode estar salvo apenas na coluna nativa `lead.nome` da tabela `crm_leads`, e não necessariamente duplicado em `dados_extras.nome`. O código atual só consulta `dados_extras`.

### Solução
No `useMemo` que monta os `initialFieldValues`, após buscar o valor em `dados_extras`, fazer fallback para `lead.nome` quando a chave do campo for `"nome"` e o valor estiver vazio.

### Alteração em `src/components/crm/ZapSignDialog.tsx`

Na linha 57-60, após o `getFieldValue`, adicionar fallback:

```typescript
const { valor } = getFieldValue(dadosExtras, campo.key);
let finalValue = valor.trim();
// Fallback: se o campo é "nome" e está vazio, usar lead.nome
if (!finalValue && campo.key === "nome" && lead.nome) {
  finalValue = lead.nome;
}
if (finalValue) {
  values[campo.key] = finalValue;
}
```

Isso garante que o nome do lead sempre apareça pré-preenchido, independentemente de onde ele foi originalmente salvo.

