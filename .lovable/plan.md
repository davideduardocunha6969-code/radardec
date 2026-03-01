

# Corrigir importacao de numeros Twilio

## Problema
A funcao `sync-twilio-numeros` esta falhando com erro 401 (Authenticate) do Twilio por credenciais incorretas. Alem disso, o codigo usa `supabase.auth.getClaims()` que nao existe na biblioteca.

## Solucao

### 1. Atualizar secrets do Twilio
- `TWILIO_ACCOUNT_SID` -> `AC2274fd76df8f60993bdb34c7fe5b1eb0`
- `TWILIO_AUTH_TOKEN` -> `1028b3f4a337d8f52541fbb6a7f8bb03`

### 2. Corrigir a edge function
No arquivo `supabase/functions/sync-twilio-numeros/index.ts`:
- Substituir `supabase.auth.getClaims(token)` por `supabase.auth.getUser(token)` que e o metodo correto
- Ajustar a extracao do `userId` do resultado

### Resultado esperado
Apos as correcoes, o botao "Importar do Twilio" vai autenticar corretamente na API Twilio e buscar todos os numeros comprados, cadastrando-os automaticamente na tabela com DDD e regiao.

