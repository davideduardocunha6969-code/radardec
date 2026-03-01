

# Corrigir Power Dialer: audio de secretaria eletronica e redirect ao atender

## Problemas identificados

Existem 3 problemas interligados na arquitetura atual:

### 1. Audio de secretaria eletronica toca no navegador
Com `AsyncAmd: "true"`, o Twilio executa o TwiML (`<Dial><Client>`) IMEDIATAMENTE e roda a detecao de maquina em paralelo. Isso significa que quando a secretaria eletronica atende, o audio ja esta sendo transmitido ao navegador antes de o AMD detectar que e maquina. Cancelar a chamada depois nao adianta -- o audio ja tocou.

### 2. Tela nao redireciona quando lead atende
O `lead_atendido_id` so e preenchido no callback `completed` (quando a chamada TERMINA com duracao > 0). Ou seja, o redirect so aconteceria DEPOIS que o usuario desligasse -- o que e o oposto do desejado.

### 3. Outras chamadas nao sao canceladas quando um lead atende
Quando um lead atende, as outras 4 chamadas do lote continuam ativas, podendo gerar mais conexoes de audio simultaneas.

---

## Solucao: AMD Sincronico + TwiML inteligente

A correcao envolve mudar de AMD assincrono para **AMD sincronico**. Com AMD sincronico, o Twilio primeiro detecta se e humano ou maquina, e SO ENTAO chama a URL do TwiML. A URL do TwiML recebe o parametro `AnsweredBy` e decide: se humano, conecta ao Client; se maquina, desliga.

### Arquivo 1: `supabase/functions/power-dialer/index.ts`

Remover os parametros de AMD assincrono e usar AMD sincronico:

```text
Antes:
  MachineDetection: "DetectMessageEnd",
  MachineDetectionTimeout: "5",
  AsyncAmd: "true",
  AsyncAmdStatusCallback: statusCallbackUrl,
  AsyncAmdStatusCallbackMethod: "POST",

Depois:
  MachineDetection: "DetectMessageEnd",
  MachineDetectionTimeout: "5",
```

Apenas remover `AsyncAmd`, `AsyncAmdStatusCallback` e `AsyncAmdStatusCallbackMethod`. O parametro `MachineDetection` sem `AsyncAmd` ja faz o AMD sincronico por padrao.

### Arquivo 2: `supabase/functions/power-dialer-twiml/index.ts`

Atualizar para verificar o parametro `AnsweredBy` que o Twilio envia quando usa AMD sincronico:

- Se `AnsweredBy` = `human` ou ausente: retornar `<Dial><Client>` normalmente
- Se `AnsweredBy` contem `machine`: retornar `<Hangup/>` -- **nenhum audio e transmitido ao navegador**

Tambem: ao detectar humano, chamar a funcao de cancelamento das outras chamadas do lote. Para isso, o TwiML precisa receber o `sessionId` (ja recebe via query param) e atualizar a sessao com `lead_atendido_id`.

### Arquivo 3: `supabase/functions/power-dialer-status/index.ts`

Atualizar o handler `in-progress`:
- Quando o status e `in-progress`, significa que a chamada foi conectada ao Client (humano atendeu)
- Neste momento: definir `lead_atendido_id` na sessao e cancelar todas as outras chamadas do lote
- Remover a logica de AMD assincrono (nao sera mais necessaria, pois maquinas sao filtradas no TwiML)

O fluxo `completed` com `callDuration > 0` permanece como fallback, mas o redirect principal acontece via `in-progress`.

### Cancelamento das outras chamadas

Ao detectar que um lead atendeu (via `in-progress`), o `power-dialer-status` deve:
1. Atualizar a sessao com `lead_atendido_id`, `telefone_atendido` e `status: "atendida"`
2. Buscar todos os outros `call_sids` da sessao
3. Cancelar cada um via API do Twilio
4. Atualizar o status das respectivas chamadas para `cancelada`

### Sem mudancas no frontend

O `PowerDialerButton.tsx` e o `AtendimentoAguardando.tsx` ja escutam o `lead_atendido_id` via Realtime e redirecionam automaticamente. Nenhuma mudanca necessaria no frontend.

---

## Resumo dos arquivos modificados

1. **`supabase/functions/power-dialer/index.ts`** -- remover parametros de AMD assincrono
2. **`supabase/functions/power-dialer-twiml/index.ts`** -- verificar `AnsweredBy`, retornar `<Hangup/>` para maquinas
3. **`supabase/functions/power-dialer-status/index.ts`** -- mover logica de `lead_atendido_id` para `in-progress`, cancelar outras chamadas do lote, remover handler de AMD assincrono

## Resultado esperado

- Secretarias eletronicas sao detectadas ANTES de conectar o audio -- usuario nunca ouve mensagem de correio de voz
- Quando um humano atende, o redirect para a tela de atendimento (SDR/Closer com script, IA coach, transcricao) acontece imediatamente
- As outras chamadas do lote sao canceladas automaticamente ao primeiro atendimento humano
