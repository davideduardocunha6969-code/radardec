

## Adicionar gravação no power-dialer-twiml

### Problema
No Power Dialer, a gravação precisa ser iniciada na perna outbound (Twilio → lead), cujo CallSid está salvo em `crm_chamadas.twilio_call_sid`. O `device.on("incoming")` no browser recebe o CallSid da perna inbound (Twilio → browser) — SID diferente, que não é encontrado pelo webhook ao salvar o MP3.

### Solução
Adicionar o start-recording em `supabase/functions/power-dialer-twiml/index.ts`, logo após `winnerSet = true;`, antes do `Promise.all(cancelPromises)`. Fire-and-forget para não bloquear o retorno do TwiML.

### Alteração — `supabase/functions/power-dialer-twiml/index.ts`

Após a linha `winnerSet = true;` (~linha 89), adicionar:

```typescript
// Start dual-channel recording on the OUTBOUND call leg
// (callSid here is the outbound SID stored in crm_chamadas.twilio_call_sid)
const SUPABASE_URL_ENV = Deno.env.get("SUPABASE_URL")!;
fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}/Recordings.json`,
  {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      RecordingChannels: "dual",
      RecordingStatusCallback: `${SUPABASE_URL_ENV}/functions/v1/twilio-webhook`,
      RecordingStatusCallbackEvent: "completed",
    }).toString(),
  }
).then(r => r.json())
 .then(d => console.log("[twiml] Recording started:", d.sid))
 .catch(e => console.error("[twiml] start-recording error:", e));
```

Nenhum outro arquivo alterado. Nenhuma migration.

