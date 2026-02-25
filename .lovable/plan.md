
# Corrigir "Acesso Negado" temporario no login

## Problema

Existe uma condicao de corrida (race condition) no `useAuth.ts`. O fluxo atual:

1. O usuario faz login
2. `onAuthStateChange` dispara, seta `user` e chama `setLoading(false)` **imediatamente**
3. `fetchUserData` e chamado via `setTimeout(..., 0)` -- as permissoes ainda nao foram carregadas
4. `ProtectedRoute` ve: usuario logado + loading=false + permissoes vazias = mostra "Acesso Negado"
5. Millisegundos depois, `fetchUserData` completa, permissoes atualizam, e a pagina correta aparece

## Solucao

Modificar `useAuth.ts` para que `loading` so mude para `false` **apos** as permissoes serem carregadas:

### Arquivo: `src/hooks/useAuth.ts`

1. Remover o `setTimeout` wrapper do `fetchUserData` -- chamar diretamente com `await`
2. Mover `setLoading(false)` para **dentro** do `fetchUserData` (no final, apos setar permissoes)
3. Adicionar um `finally` para garantir que `setLoading(false)` sempre executa, mesmo em caso de erro
4. No `onAuthStateChange`, so chamar `setLoading(false)` diretamente quando **nao** houver usuario (logout)
5. No `getSession`, mesmo principio: so setar loading=false apos fetchUserData completar

### Detalhes tecnicos

```text
Antes:
  onAuthStateChange -> setUser -> setTimeout(fetchUserData) -> setLoading(false)
                                                                 ^^ MUITO CEDO

Depois:
  onAuthStateChange -> setUser -> await fetchUserData -> setLoading(false)
                                                          ^^ CORRETO
```

Mudancas especificas:
- Linha 70: Trocar `setTimeout(() => fetchUserData(...), 0)` por `await fetchUserData(...)`
- Linha 75: Mover `setLoading(false)` para dentro do bloco `if/else`, apos `fetchUserData`
- Linhas 80-87: Mesma logica -- `setLoading(false)` so apos `fetchUserData` completar
- Adicionar `try/finally` no `fetchUserData` para garantir que `setLoading(false)` sempre roda

Nenhuma outra pagina ou componente precisa ser alterado.
