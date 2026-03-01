
# Corrigir Power Dialer: popup travada e audio de secretaria eletronica

## Problema 1: Popup travada em "Iniciando Power Dialer..."

A pagina `AtendimentoAguardando.tsx` espera que `authReady` fique `true` antes de buscar os dados da sessao. Na janela popup aberta via `window.open()`, a restauracao da sessao de autenticacao do localStorage pode falhar ou demorar, fazendo com que `authReady` nunca fique `true`. O resultado: a pagina fica presa na tela de carregamento para sempre.

### Correcao

Remover a dependencia de `authReady` como condicao obrigatoria para buscar dados. Em vez disso:

1. Tentar buscar a sessao imediatamente com retries (ate 5 tentativas com delay crescente de 1s)
2. Remover o guard `!authReady` dos useEffects de fetch e realtime
3. Manter o listener de auth apenas para acionar um re-fetch caso a sessao seja restaurada depois
4. Se apos todas as tentativas a sessao nao for encontrada, mostrar uma mensagem de erro em vez de ficar carregando infinitamente

### Arquivo: `src/pages/AtendimentoAguardando.tsx`

```text
Antes:
  useEffect(() => {
    if (!sessionId || !authReady) return;
    const fetchSession = async (retries = 2) => { ... };
    fetchSession();
  }, [sessionId, authReady]);

Depois:
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async (retries = 5) => {
      const { data, error } = await supabase...;
      if (error || !data) {
        if (retries > 0) {
          setTimeout(() => fetchSession(retries - 1), 1500);
          return;
        }
        setFetchError(true);
        return;
      }
      setSession(data);
    };
    // Small delay for auth to restore from localStorage
    setTimeout(() => fetchSession(), 500);
  }, [sessionId]);
```

Mesma logica para o realtime: remover dependencia de `authReady`, iniciar imediatamente.

Para a tela de loading, adicionar timeout com mensagem de erro caso os dados nao carreguem.

---

## Problema 2: Audio de secretaria eletronica tocando no navegador

Quando o lead nao atende e a chamada vai para o correio de voz, o TwiML `<Dial><Client>` conecta o audio do correio de voz ao navegador do usuario. O usuario ouve "deixe sua mensagem apos o sinal".

### Correcao

Ativar **Answering Machine Detection (AMD)** nas chamadas do Power Dialer. Isso faz com que o Twilio detecte automaticamente se quem atendeu foi uma pessoa ou uma secretaria eletronica:

- Se for **maquina/secretaria**, o Twilio encerra a chamada automaticamente (nao conecta ao navegador)
- Se for **humano**, a chamada segue normalmente e conecta ao Client

### Arquivo: `supabase/functions/power-dialer/index.ts`

Adicionar parametros AMD ao criar a chamada (funcao `twilioCall`):

```text
Antes:
  const body = new URLSearchParams({
    From: from,
    To: to,
    Url: twimlUrl,
    Timeout: "20",
    StatusCallback: statusCallbackUrl,
    StatusCallbackEvent: "initiated ringing answered completed",
    StatusCallbackMethod: "POST",
  });

Depois:
  const body = new URLSearchParams({
    From: from,
    To: to,
    Url: twimlUrl,
    Timeout: "20",
    StatusCallback: statusCallbackUrl,
    StatusCallbackEvent: "initiated ringing answered completed",
    StatusCallbackMethod: "POST",
    MachineDetection: "DetectMessageEnd",
    MachineDetectionTimeout: "5",
    AsyncAmd: "true",
    AsyncAmdStatusCallback: statusCallbackUrl,
    AsyncAmdStatusCallbackMethod: "POST",
  });
```

### Arquivo: `supabase/functions/power-dialer-status/index.ts`

Adicionar tratamento para o callback AMD. Quando o resultado for `machine_end_beep` ou `machine_end_other`, encerrar a chamada automaticamente:

```text
// Handle AMD callback
const answeredBy = formData.get("AnsweredBy") as string;
if (answeredBy && ["machine_end_beep", "machine_end_other", "machine_end_silence", "machine_start"].includes(answeredBy)) {
  // Cancel this call - it's a voicemail
  await cancelTwilioCall(ACCOUNT_SID, AUTH_TOKEN, callSid);
  // Update chamada status
  await supabase.from("crm_chamadas").update({ status: "secretaria_eletronica" }).eq("twilio_call_sid", callSid);
  // Update resultado_por_numero
  ...
}
```

---

## Resumo dos arquivos modificados

1. `src/pages/AtendimentoAguardando.tsx` -- remover dependencia de authReady, adicionar retries com delay e fallback de erro
2. `supabase/functions/power-dialer/index.ts` -- adicionar parametros AMD nas chamadas
3. `supabase/functions/power-dialer-status/index.ts` -- tratar callback AMD para encerrar chamadas de secretaria eletronica

## Resultado esperado

- A janela popup vai carregar os dados da sessao mesmo se a autenticacao demorar a restaurar
- Chamadas para secretaria eletronica serao detectadas e encerradas automaticamente
- O usuario nao ouvira mais mensagens de correio de voz
