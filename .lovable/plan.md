

# Auto-importar numeros Twilio

## O que muda

Em vez de cadastrar manualmente cada numero na aba "Numeros VoIP", adicionar um botao "Importar do Twilio" que busca todos os numeros comprados na conta via API REST e os cadastra automaticamente com DDD e regiao extraidos do numero.

---

## Implementacao

### 1. Nova Edge Function `sync-twilio-numeros`

Arquivo: `supabase/functions/sync-twilio-numeros/index.ts`

- Autentica o usuario via JWT (apenas admins)
- Chama a API REST do Twilio: `GET https://api.twilio.com/2010-04-01/Accounts/{SID}/IncomingPhoneNumbers.json`
- Usa `TWILIO_ACCOUNT_SID` e `TWILIO_AUTH_TOKEN` (Basic Auth)
- Para cada numero retornado:
  - Extrai DDD do numero (posicoes 3-4 para numeros +55XX...)
  - Usa `friendly_name` ou logica de mapeamento DDD-para-cidade como regiao
  - Faz upsert na tabela `twilio_numeros` (ON CONFLICT numero)
- Retorna lista de numeros sincronizados e quantos foram novos vs atualizados

### 2. Registrar no config.toml

```toml
[functions.sync-twilio-numeros]
verify_jwt = false
```

(verify_jwt = false porque a validacao de admin e feita manualmente no codigo)

### 3. Atualizar a aba "Numeros VoIP" em Configuracoes

- Adicionar botao "Importar do Twilio" ao lado do formulario de cadastro manual
- Ao clicar, chama `supabase.functions.invoke('sync-twilio-numeros')`
- Exibe toast com resultado: "X numeros importados, Y ja existiam"
- Invalida query `twilio_numeros` para atualizar a lista

### 4. Mapeamento DDD para Regiao

Tabela estatica no codigo da edge function com os principais DDDs brasileiros:

```text
11 -> Sao Paulo
21 -> Rio de Janeiro
31 -> Belo Horizonte
41 -> Curitiba
51 -> Porto Alegre
61 -> Brasilia
71 -> Salvador
81 -> Recife
85 -> Fortaleza
62 -> Goiania
... (demais DDDs)
```

---

## Arquivos envolvidos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/sync-twilio-numeros/index.ts` | Nova edge function |
| `supabase/config.toml` | Registrar nova funcao |
| `src/pages/Configuracoes.tsx` | Botao "Importar do Twilio" |

---

## Fluxo do usuario

1. Vai em Configuracoes > Numeros VoIP
2. Clica "Importar do Twilio"
3. Sistema busca todos os numeros da conta Twilio
4. Numeros aparecem na lista com DDD e regiao preenchidos automaticamente
5. Usuario pode ativar/desativar individualmente conforme necessidade

O cadastro manual continua disponivel como alternativa.

