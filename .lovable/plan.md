

## Correção: Fallback do nome usa key errada

### Problema
O campo "Nome" na seção "Dados Pessoais" tem a key `__nome__` (não `"nome"`). O fallback na linha 59 compara com `campo.key === "nome"`, que nunca é verdadeiro, por isso o nome nunca é pré-preenchido.

### Solução
Alterar a condição de fallback em `ZapSignDialog.tsx` (linha 59) para verificar `campo.key === "__nome__"` em vez de `campo.key === "nome"`. Também ajustar o `handleSend` (linha 116) para buscar `fieldData["__nome__"]` como fallback para `signer_name`.

### Alteração em `src/components/crm/ZapSignDialog.tsx`
- Linha 59: `campo.key === "nome"` → `campo.key === "__nome__"`
- Linha 116: `fieldData["nome"]` → `fieldData["__nome__"]`

