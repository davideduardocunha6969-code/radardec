
# Fix: Janela de atendimento fica carregando / nao carrega dados

## Problema identificado

Na pagina `/atendimento` (popup), o fluxo de autenticacao tem um bug de race condition:

1. `onAuthStateChange` dispara com o evento `INITIAL_SESSION` e `session=null` (antes do token ser restaurado do localStorage)
2. Isso seta `isAuthenticated=false` e `authChecked=true` imediatamente
3. O componente renderiza, ve `!isAuthenticated` e faz `Navigate to="/login"`
4. Quando `getSession()` resolve com a sessao valida, ja e tarde demais — o redirect ja aconteceu

Ou, em alguns casos, o redirect nao acontece visivelmente (por causa de timing), mas `isAuthenticated` fica `false` tempo suficiente para que o fetch de dados nunca execute, deixando a tela no spinner de "loading" eternamente.

## Solucao

Corrigir o `useEffect` de auth em `src/pages/Atendimento.tsx` para nao definir `authChecked=true` prematuramente quando a sessao e null no evento inicial.

### Mudanca em `src/pages/Atendimento.tsx` (linhas 73-95)

Logica atual (bugada):
```text
onAuthStateChange((_event, session) => {
  setIsAuthenticated(!!session);   // <-- seta false no INITIAL_SESSION
  setAuthChecked(true);            // <-- marca como checado com false!
});
```

Logica corrigida:
```text
onAuthStateChange((event, session) => {
  if (session) {
    setIsAuthenticated(true);
    setAuthChecked(true);
  } else if (event === 'SIGNED_OUT') {
    setIsAuthenticated(false);
    setAuthChecked(true);
  }
  // Para INITIAL_SESSION com null, NAO marcar authChecked
  // Deixar o getSession() ou o timeout de 3s resolver
});
```

Isso garante que:
- Se ha sessao: autenticacao confirmada imediatamente
- Se o usuario fez logout explicitamente: redireciona ao login
- Se e o evento inicial sem sessao: espera o `getSession()` resolver (que busca do localStorage) ou o timeout de 3s como fallback

## Arquivo modificado

1. `src/pages/Atendimento.tsx` — corrigir logica do `onAuthStateChange` (apenas 3 linhas alteradas)

## Resultado esperado

A janela de atendimento nao redireciona para login prematuramente e carrega os dados do lead normalmente.
