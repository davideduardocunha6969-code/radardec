

# Corrigir Power Dialer: dados nao carregam e cancelar nao funciona

## Problemas identificados

### 1. Bug de autenticacao no edge function `power-dialer`
A linha 81 do `supabase/functions/power-dialer/index.ts` usa `supabase.auth.getClaims(token)` que nao existe no SDK. Esse mesmo bug foi corrigido no `sync-twilio-numeros` anteriormente. Isso faz com que:
- A acao `cancel` retorne 401 (Unauthorized), impedindo o cancelamento
- A acao `start` pode ter funcionado por cache de deploy anterior, mas e instavel

### 2. Pagina mostra "0 leads na fila"
O banco de dados confirma que a sessao tem 324 leads na fila e 5 no lote atual. A sessao foi criada com sucesso (status `ativo`). O problema pode estar na leitura dos dados na pagina popup -- o fetch inicial retorna null se houver problemas de autenticacao ou o componente nao re-renderiza corretamente.

### 3. Botao Cancelar nao responde
O `handleCancel` chama o edge function com `action: "cancel"`, mas a funcao rejeita com 401 por causa do `getClaims`. O `supabase.functions.invoke` nao lanca excecao em erros HTTP, entao o frontend nao exibe feedback de erro ao usuario.

## Correcoes planejadas

### Correcao 1: Edge function `power-dialer/index.ts`
Substituir `getClaims` por `getUser()` (linhas 80-88):

```text
Antes:
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) { ... }
  const userId = claimsData.claims.sub as string;

Depois:
  const { data: userData, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !userData?.user) { ... }
  const userId = userData.user.id;
```

### Correcao 2: Feedback de erro no cancelamento (`AtendimentoAguardando.tsx`)
Adicionar tratamento de erro no `handleCancel` para informar o usuario caso a operacao falhe:

```text
const handleCancel = async () => {
  if (!sessionId) return;
  setCancelling(true);
  try {
    const { error } = await supabase.functions.invoke("power-dialer", {
      body: { action: "cancel", sessionId },
    });
    if (error) {
      toast.error("Erro ao cancelar discagem");
    }
  } catch (e) {
    toast.error("Erro ao cancelar discagem");
  }
  setCancelling(false);
};
```

### Correcao 3: Tratamento de erro no fetch da sessao (`AtendimentoAguardando.tsx`)
Adicionar log/feedback quando o fetch da sessao falhar para facilitar debug:

```text
const { data, error } = await (supabase
  .from("power_dialer_sessions" as any)
  .select("*")
  .eq("id", sessionId)
  .single() as any);
if (error) console.error("Fetch session error:", error);
if (data) setSession(data);
```

### Deploy
Redeployar a edge function `power-dialer` apos a correcao.

## Resultado esperado
- O Power Dialer vai exibir corretamente os leads do lote atual e o total na fila
- O botao "Cancelar Discagem" vai funcionar, cancelando as chamadas Twilio ativas
- Erros serao exibidos ao usuario via toast
