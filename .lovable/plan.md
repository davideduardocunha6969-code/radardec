

# Correções Finais do Power Dialer

## Situacao atual

O codigo nos arquivos ja possui AMD, logica de vencedor no TwiML, cancelamento de chamadas e polling. O problema principal que persiste e o **"Erro ao carregar sessao"** no popup, causado pela dependencia de autenticacao (RLS) que falha intermitentemente no popup.

Alem disso, ha uma race condition onde duas chamadas humanas simultaneas podem ambas passar pela verificacao de vencedor antes da primeira gravar.

## Correcao 1: Edge Function `power-dialer-session-status` (NOVA)

Criar uma edge function que busca os dados da sessao usando `service_role` (bypass RLS), eliminando a dependencia de auth no popup.

**Fluxo:**
1. Popup envia `sessionId` + token Bearer do usuario
2. Edge function valida o token (confirma que e um usuario autenticado)
3. Busca sessao com `service_role` (sem RLS)
4. Verifica que `user_id` da sessao pertence ao usuario autenticado
5. Retorna dados da sessao

**Arquivo:** `supabase/functions/power-dialer-session-status/index.ts`

## Correcao 2: Atualizar `AtendimentoAguardando.tsx`

Substituir a query direta ao banco (que depende de RLS) pela chamada a nova edge function.

**Mudancas:**
- `fetchSession` passa a chamar `supabase.functions.invoke("power-dialer-session-status", { body: { sessionId } })`
- Polling tambem usa a edge function
- Remover necessidade de esperar `authReady` para o fetch inicial (a edge function valida o token internamente)
- Manter Realtime como canal secundario (quando auth estiver disponivel)

## Correcao 3: Race condition no TwiML

No `power-dialer-twiml`, apos o update de `lead_atendido_id`, fazer um SELECT para confirmar que o lead vencedor e este call. Se outro call ganhou a corrida, retornar `<Hangup/>` ao inves de `<Dial>`.

**Mudanca no arquivo:** `supabase/functions/power-dialer-twiml/index.ts`

Adicionar apos o update:
```text
// Re-read session to confirm this call won the race
const { data: confirmed } = await supabase
  .from("power_dialer_sessions")
  .select("lead_atendido_id")
  .eq("id", sessionId)
  .single();

if (confirmed?.lead_atendido_id !== chamada.lead_id) {
  // Another call won the race - hang up
  return <Hangup/>;
}
```

## Correcao 4: Config

Adicionar `power-dialer-session-status` ao `supabase/config.toml` com `verify_jwt = false` (a validacao do token e feita manualmente dentro da funcao).

## Arquivos modificados

1. `supabase/functions/power-dialer-session-status/index.ts` — novo
2. `supabase/functions/power-dialer-twiml/index.ts` — race condition fix
3. `src/pages/AtendimentoAguardando.tsx` — usar edge function ao inves de query direta
4. `supabase/config.toml` — adicionar nova funcao

## Resultado esperado

- "Erro ao carregar sessao" eliminado (bypass RLS)
- Audio duplicado eliminado (race condition resolvida)
- Redirecionamento automatico funciona de forma confiavel
