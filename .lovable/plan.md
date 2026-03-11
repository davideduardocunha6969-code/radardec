

## Correção: Suprimir erro "JWT expired" e retry automático

### Problema
Quando o token JWT expira durante uma operação (editar dados na aba Dados), a requisição falha com "JWT expired". O Supabase client renova o token automaticamente, mas a requisição que estava em andamento já falhou e o toast de erro aparece.

### Solução
Criar um wrapper utilitário que detecta erros de JWT expirado e faz retry automático após aguardar o refresh do token.

**Arquivo novo:** `src/utils/supabaseRetry.ts`
- Função `withRetry(fn)` que executa a operação, e se receber erro contendo "JWT" ou "expired", aguarda 1s (para o refresh completar) e tenta novamente uma vez.

**Arquivo:** `src/components/crm/LeadDadosTab.tsx`
- No `handleSave`, envolver a chamada `updateLead.mutateAsync` com `withRetry` para que erros de JWT expirado sejam tratados silenciosamente com retry.

**Arquivo:** `src/hooks/useLeadDadosSync.ts`
- Na função `persistToDb`, aplicar o mesmo padrão de retry.

### Resultado
Se o JWT expirar durante uma operação de salvar dados, o sistema aguarda o refresh automático e tenta novamente sem mostrar erro ao usuário.

