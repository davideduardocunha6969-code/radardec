

# Power Dialer v4 Final — Plano de Implementacao

## Resumo

12 etapas para implementar Power Dialer por coluna do Kanban CRM com discagem em lotes de 5, Local Presence, registro completo de tentativas, e dados para relatorios. Inclui todos os ajustes acumulados das versoes anteriores.

---

## Etapa 1 — Migracao SQL

Uma unica migration com:

**1.1 Tabela `twilio_numeros`**
- Colunas: `id` (uuid PK), `numero` (text unique), `ddd` (text), `regiao` (text nullable), `ativo` (bool default true), `created_at`
- RLS: admin ALL via `has_role()`, autenticados SELECT

**1.2 Tabela `power_dialer_sessions`**
- Colunas: `id`, `user_id`, `funil_id`, `coluna_id`, `papel` (default 'sdr'), `status` (default 'ativo'), `numeros_fila` (jsonb []), `lote_atual` (int 0), `call_sids` (jsonb {}), `lead_atendido_id` (uuid nullable), `telefone_atendido` (text nullable), `resultado_por_numero` (jsonb {}), `leads_info` (jsonb []), `created_at`, `updated_at`
- RLS: usuario ALL WHERE auth.uid() = user_id
- Indices: (user_id, status), (updated_at DESC)
- Trigger update_updated_at_column()
- Realtime habilitado

**1.3 Novas colunas em `crm_chamadas`**
- `power_dialer_session_id` uuid FK nullable
- `caller_id_usado` text nullable
- `coluna_id_no_momento` uuid nullable
- `tentativa_numero` integer default 1
- `ddd_destino` text nullable
- `ddd_caller` text nullable
- `observacoes` text nullable
- Indice parcial: `idx_crm_chamadas_call_sid ON crm_chamadas(twilio_call_sid) WHERE twilio_call_sid IS NOT NULL`

**1.4 Funcao de limpeza**

```sql
CREATE OR REPLACE FUNCTION public.expire_old_dialer_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE power_dialer_sessions SET status = 'expirado'
  WHERE status = 'ativo' AND created_at < now() - interval '24 hours';

  UPDATE crm_chamadas SET status = 'falhou',
    observacoes = 'Timeout - callback Twilio nao recebido'
  WHERE status = 'em_andamento' AND created_at < now() - interval '1 hour';
END;
$$;
```

**SEM pg_cron** — limpeza agendada via edge function na Etapa 1B.

---

## Etapa 1B — Edge function agendada `expire-dialer-sessions`

Arquivo: `supabase/functions/expire-dialer-sessions/index.ts`

Funcao simples que usa SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY para criar um client com service role e chama `supabase.rpc('expire_old_dialer_sessions')`.

No `config.toml`:
```toml
[functions.expire-dialer-sessions]
schedule = "0 * * * *"
```

**NAO inclui `verify_jwt = false`** — mantem o padrao `verify_jwt = true`. A funcao e invocada internamente pelo scheduler, que usa service_role_key como bearer token.

---

## Etapa 2 — Atualizar `twilio-token`

Arquivo: `supabase/functions/twilio-token/index.ts`

Duas mudancas:
1. Linha 53: mudar `user_${user.id.replace(/-/g, "")}` para `user_${user.id}` (manter hifens)
2. Adicionar `incoming: { allow: true }` ao voice grant (linhas 60-67):

```typescript
voice: {
  outgoing: { application_sid: TWILIO_APP_ID || "" },
  incoming: { allow: true },
},
```

---

## Etapa 3 — Atualizar `twilio-twiml`

Arquivo: `supabase/functions/twilio-twiml/index.ts`

Aceitar parametro opcional `CallerId` via form data. Se fornecido, usar como `callerId` no `<Dial>` em vez de `TWILIO_PHONE_NUMBER`. Fallback para env var.

---

## Etapa 4 — Edge Function `power-dialer`

Novo arquivo: `supabase/functions/power-dialer/index.ts`

Tres acoes: `start`, `next-batch`, `cancel`. Autentica via getClaims(). Usa Twilio REST API (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN) para criar chamadas. Status Callback aponta para `power-dialer-status`. TwiML URL aponta para `power-dialer-twiml?clientIdentity=user_${userId}&sessionId=X`.

**`start`**: Verifica sessao ativa, chama `expire_old_dialer_sessions()` via RPC, busca leads da coluna, ordena telefones (WhatsApp > celular > fixo), seleciona caller ID por DDD via `twilio_numeros`, cria sessao, dispara ate 5 chamadas. Registro em `crm_chamadas` so apos Twilio retornar call_sid com sucesso (status `em_andamento`). Se Twilio falhar, grava com status `falhou` + observacoes. Atualiza `leads_info` com dados do lote atual.

**`next-batch`**: Cooldown 2-3s, cancela pendentes, avanca lote, mesma logica. Se fila vazia: status `finalizado_sem_atendimento`.

**`cancel`**: Cancela chamadas via Twilio REST, atualiza `crm_chamadas` para `cancelada`, sessao para `cancelado`.

---

## Etapa 5 — Edge Function `power-dialer-twiml`

Novo arquivo: `supabase/functions/power-dialer-twiml/index.ts`

Recebe `clientIdentity` e `sessionId` como query params. Gera:
```xml
<Response><Dial><Client>{clientIdentity}</Client></Dial></Response>
```

---

## Etapa 6 — Edge Function `power-dialer-status`

Novo arquivo: `supabase/functions/power-dialer-status/index.ts`

Deteccao em dois estagios:
- `in-progress`: atualiza `crm_chamadas` para `em_chamada`. NAO atualiza sessao.
- `completed` + `CallDuration > 0`: atualiza `crm_chamadas` para `finalizada` com `duracao_segundos`. AGORA atualiza sessao: `lead_atendido_id`, `telefone_atendido`, status `atendida`. Dispara Realtime para o frontend.
- `completed` + `CallDuration = 0`: status `nao_atendida`
- `no-answer`: status `nao_atendida`
- `busy`: status `ocupado`
- `failed`: status `falhou`
- `canceled`: status `cancelada`

Atualiza `resultado_por_numero` na sessao em todos os casos.

---

## Etapa 7 — Componente `PowerDialerButton`

Novo arquivo: `src/components/crm/PowerDialerButton.tsx`

**Device em standby (on mount)**: useEffect busca token, cria Device, registra, escuta incoming. Cleanup: destroy.

**Fluxo de clique**:
1. Dialog seleciona papel (SDR/Closer)
2. `window.open('/atendimento-aguardando?status=iniciando')` — sincrono, antes de await
3. `await invoke('power-dialer', { action: 'start' })` — recebe sessionId
4. `janela.location.href = '/atendimento-aguardando?sessionId=' + sessionId`
5. Assina Realtime em `power_dialer_sessions`

**Monitoramento**: Quando `lead_atendido_id` aparece e janela aberta: redireciona. Se janela fechada: alerta inline no Kanban com botao "Abrir atendimento". Quando lote termina sem atendimento: chama `next-batch`. Botao cancelar visivel.

---

## Etapa 8 — Pagina `AtendimentoAguardando`

Novo arquivo: `src/pages/AtendimentoAguardando.tsx`

Autonoma. Le query params. Se `status=iniciando` sem sessionId: spinner. Se sessionId: query inicial + Realtime em `power_dialer_sessions`. Exibe lote, nomes, progresso. Botao cancelar.

---

## Etapa 9 — Integrar no Kanban

No `CrmFunilKanban.tsx`: adicionar `PowerDialerButton` no cabecalho do `DroppableColumn`, passando `colId`, `funilId`, `leads`. So exibe se coluna tem leads com telefone.

---

## Etapa 10 — Hook `useTwilioNumeros`

Novo: `src/hooks/useTwilioNumeros.ts` — CRUD para `twilio_numeros`.

---

## Etapa 11 — Aba "Numeros VoIP" em Configuracoes

Em `Configuracoes.tsx`: nova aba para cadastrar/listar/ativar/desativar numeros Twilio.

---

## Etapa 12 — Rota, Config e Tipos

- `App.tsx`: rota `/atendimento-aguardando` fora do MainLayout
- `config.toml`: registrar 3 funcoes com `verify_jwt = false` + 1 funcao agendada SEM `verify_jwt = false`:

```toml
[functions.power-dialer]
verify_jwt = false

[functions.power-dialer-twiml]
verify_jwt = false

[functions.power-dialer-status]
verify_jwt = false

[functions.expire-dialer-sessions]
schedule = "0 * * * *"
```

- `useCrmChamadas.ts`: atualizar interface CrmChamada com 7 novos campos

---

## Consistencia de Identity

```text
twilio-token:       identity = user_${user.id}         (UUID com hifens)
power-dialer:       clientIdentity = user_${userId}     (mesmo formato)
power-dialer-twiml: <Client>{clientIdentity}</Client>  (valor da URL)
```

---

## Arquivos envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabelas + colunas + indices + funcao |
| `supabase/functions/expire-dialer-sessions/index.ts` | Nova (agendada, sem verify_jwt=false) |
| `supabase/functions/power-dialer/index.ts` | Nova |
| `supabase/functions/power-dialer-twiml/index.ts` | Nova |
| `supabase/functions/power-dialer-status/index.ts` | Nova |
| `supabase/functions/twilio-twiml/index.ts` | Atualizar (Local Presence) |
| `supabase/functions/twilio-token/index.ts` | Atualizar (identity + incoming) |
| `supabase/config.toml` | 4 novas entradas |
| `src/components/crm/PowerDialerButton.tsx` | Novo |
| `src/pages/AtendimentoAguardando.tsx` | Nova |
| `src/hooks/useTwilioNumeros.ts` | Novo |
| `src/hooks/useCrmChamadas.ts` | Atualizar interface |
| `src/pages/CrmFunilKanban.tsx` | Integrar botao + alerta |
| `src/pages/Configuracoes.tsx` | Aba numeros VoIP |
| `src/App.tsx` | Rota |

