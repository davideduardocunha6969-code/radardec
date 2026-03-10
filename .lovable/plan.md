

## Atualizar credenciais Twilio para o Power Dialer

### Contexto
As chamadas individuais VoIP funcionam porque usam `TWILIO_API_KEY` + `TWILIO_API_SECRET`. O Power Dialer usa `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` via REST API, e o token atual está retornando erro "Authenticate".

### Ação
Atualizar o secret `TWILIO_AUTH_TOKEN` com o valor visível na imagem do console Twilio fornecida pelo usuário. O `TWILIO_ACCOUNT_SID` também será verificado e atualizado se necessário.

Nenhuma alteração de código é necessária — apenas atualização dos secrets.

