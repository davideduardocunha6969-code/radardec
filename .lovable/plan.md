

# Corrigir abas sumindo do sidebar

## Problema
A correção anterior no `AuthContext.tsx` substituiu o `throw Error` por um fallback com `hasPageAccess: () => false`. Durante re-renderizações (HMR, navegação), o contexto retorna esse fallback e o sidebar oculta todas as abas que dependem de permissão, deixando apenas Agenda e Meu Painel visíveis.

## Solução
Duas mudanças coordenadas para resolver o problema de forma robusta:

### 1. Corrigir `useAuth.ts` - Garantir que `loading` permanece `true` até permissoes carregarem

O `setLoading(false)` acontece no `onAuthStateChange` ANTES do `fetchUserData` completar (que roda num `setTimeout`). Isso cria uma janela onde o usuario esta autenticado mas `isAdmin` ainda e `false`.

- Mover `setLoading(false)` para DENTRO do `fetchUserData`, garantindo que so marca como carregado apos buscar perfil e permissoes.
- Remover o `setTimeout` desnecessario no `onAuthStateChange`.

### 2. Corrigir `AppSidebar.tsx` - Mostrar loading ou todas as abas enquanto carrega

Enquanto `loading` for `true`, o sidebar nao deve filtrar as abas. Duas opcoes:
- Mostrar um skeleton/spinner no sidebar durante loading
- OU tratar `loading === true` como "mostrar tudo" temporariamente

A abordagem mais simples: se `loading` for `true`, nao filtrar (mostrar todas as abas). Quando loading terminar, as permissoes corretas ja estarao carregadas.

## Arquivos a modificar

1. **`src/hooks/useAuth.ts`**
   - Mover `setLoading(false)` para depois do `fetchUserData` completar
   - Remover `setTimeout` wrapper no `onAuthStateChange`

2. **`src/components/AppSidebar.tsx`**
   - Adicionar verificacao de `loading` do contexto
   - Quando `loading === true`, pular filtragem de permissoes (mostrar todos os itens)

## Detalhes tecnicos

No `useAuth.ts`, a funcao `fetchUserData` passara a chamar `setLoading(false)` ao final:

```text
fetchUserData:
  fetch profile -> set profile
  fetch role -> set isAdmin
  fetch permissions -> set allowedPages
  setLoading(false)  // <-- mover para ca
```

No `AppSidebar.tsx`, a filtragem muda para:

```text
const { loading, isAdmin, hasPageAccess } = useAuthContext();

const visibleRadarItems = loading
  ? radarItems           // mostra tudo durante loading
  : radarItems.filter(item => hasPageAccess(item.pageKey));
```

Isso garante que as abas nunca "somem" durante carregamento, e quando o carregamento termina, as permissoes corretas ja estao aplicadas.
