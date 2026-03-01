

# Corrigir Power Dialer: popup nao carrega dados e cancelar nao funciona

## Causa raiz

O backend esta funcionando corretamente (retorna 324 leads, cancel retorna OK). O problema e na **janela popup**.

Quando o `window.open()` abre a pagina `/atendimento-aguardando`, o React inicia do zero nessa janela. O cliente do banco de dados precisa restaurar a sessao de autenticacao do localStorage, mas o `fetchSession` roda **antes** da autenticacao estar pronta. Como a tabela `power_dialer_sessions` tem politica de seguranca que exige `auth.uid() = user_id`, a consulta retorna vazio -- resultando em "0 leads na fila".

O mesmo problema afeta o botao "Cancelar Discagem": a chamada ao backend precisa do token de autenticacao, que ainda nao esta disponivel.

## Correcoes

### 1. Aguardar autenticacao antes de buscar dados (`AtendimentoAguardando.tsx`)

Adicionar um listener `onAuthStateChange` para detectar quando a sessao esta pronta, e so entao fazer o fetch da sessao e configurar o realtime:

```text
// Aguardar sessao de auth estar pronta
const [authReady, setAuthReady] = useState(false);

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) setAuthReady(true);
  });
  // Check if already authenticated
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) setAuthReady(true);
  });
  return () => subscription.unsubscribe();
}, []);
```

### 2. Condicionar fetch e realtime ao `authReady`

Os useEffects de fetch e realtime so executam quando `authReady` for `true`:

```text
useEffect(() => {
  if (!sessionId || !authReady) return;
  // fetch session...
}, [sessionId, authReady]);
```

### 3. Adicionar retry no fetch com fallback

Caso o primeiro fetch falhe (por timing), tentar novamente apos 1 segundo:

```text
const fetchSession = async (retries = 2) => {
  const { data, error } = await supabase...;
  if (error && retries > 0) {
    setTimeout(() => fetchSession(retries - 1), 1000);
    return;
  }
  if (data) setSession(data);
};
```

### 4. Atualizar UI apos cancelar

Apos o cancel com sucesso, atualizar o estado local para refletir o cancelamento imediatamente, sem depender apenas do realtime:

```text
const handleCancel = async () => {
  // ... invoke cancel ...
  if (!error) {
    setSession(prev => prev ? { ...prev, status: "cancelado" } : prev);
  }
};
```

## Arquivos modificados

- `src/pages/AtendimentoAguardando.tsx` -- todas as correcoes acima

## Resultado esperado

- A janela popup vai aguardar a autenticacao carregar antes de buscar os dados
- Os 324 leads vao aparecer corretamente na interface
- O botao "Cancelar Discagem" vai funcionar e atualizar a tela imediatamente

