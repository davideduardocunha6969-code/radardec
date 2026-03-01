
# Corrigir Power Dialer: erro "now is not defined" no twilio-token

## Problema raiz

O erro `Edge function returned 500: {"error":"now is not defined"}` vem da funcao `twilio-token/index.ts`. Nas linhas 67-76, o codigo referencia variaveis `now`, `expiry` e `header` que nunca foram declaradas. Isso impede a geracao do token JWT do Twilio.

O `PowerDialerButton` chama `twilio-token` ao montar o componente para inicializar o Twilio Device. Sem o device registrado, as chamadas de entrada (quando um lead atende) nao podem ser aceitas pelo navegador.

## Correcao

### 1. Adicionar variaveis faltantes no `twilio-token/index.ts`

Depois da linha 65 (apos o bloco `grants`), adicionar as declaracoes que estao faltando:

```text
const now = Math.floor(Date.now() / 1000);
const expiry = now + 3600; // 1 hora de validade

const header = { alg: "HS256", typ: "JWT" };
```

Essas variaveis sao usadas nas linhas 67-76 para construir o payload e o header do JWT.

### 2. O arquivo corrigido tera este fluxo

1. Validar usuario via `getUser()`
2. Montar o objeto `grants` com permissoes de voz
3. Declarar `now`, `expiry` e `header`
4. Construir payload JWT com `jti`, `iss`, `sub`, `iat`, `exp`, `grants`
5. Assinar com HMAC-SHA256 usando `API_SECRET`
6. Retornar o token

### Resultado esperado

- O `twilio-token` vai gerar tokens JWT validos
- O `PowerDialerButton` vai conseguir registrar o Twilio Device
- O Power Dialer vai funcionar corretamente: discar, receber chamadas atendidas, e cancelar

## Arquivo modificado

- `supabase/functions/twilio-token/index.ts` -- adicionar declaracoes de `now`, `expiry` e `header`
