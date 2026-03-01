
Objetivo: corrigir de forma definitiva o fluxo do Power Dialer para que:
1) a tela de espera não fique presa sem redirecionar,
2) só exista áudio da ligação realmente humana,
3) ao primeiro atendimento humano, as demais chamadas parem e a tela de atendimento (SDR/CLOSER com coach/transcrição/script) abra imediatamente.

Diagnóstico consolidado (com base no código + logs):
- O `power-dialer-twiml` está sendo chamado e detectando `AnsweredBy` (`human`, `machine_end_other`, `unknown`), então a detecção está chegando.
- As sessões (`power_dialer_sessions`) estão sendo criadas, mas `lead_atendido_id` não está sendo preenchido nas execuções reais.
- Sem `lead_atendido_id`, tanto `AtendimentoAguardando.tsx` quanto `PowerDialerButton.tsx` não disparam redirecionamento.
- O redirecionamento hoje depende do callback de status (`power-dialer-status`) para marcar vencedor; esse ponto está frágil na prática.
- `AnsweredBy: unknown` hoje é tratado como humano no TwiML, o que pode liberar áudio indevido (caixa/mensagem ambígua).

Estratégia de correção:
- Tirar a dependência do callback de status para decisão principal de “quem atendeu”.
- Decidir o “vencedor” no próprio `power-dialer-twiml` (que já está comprovadamente sendo invocado).
- Deixar `power-dialer-status` como fallback/telemetria e atualização de status de chamada.
- Endurecer regra de áudio: somente `AnsweredBy === "human"` conecta no client; demais encerram sem áudio.
- Adicionar fallback de polling na tela de espera para evitar travamento caso realtime falhe no popup.

Plano de implementação (arquivos):

1) `supabase/functions/power-dialer-twiml/index.ts` (ponto principal)
- Adicionar cliente backend (service role) dentro da função.
- Ler `CallSid`, `AnsweredBy`, `sessionId`, `clientIdentity`.
- Regra de roteamento:
  - Se `AnsweredBy !== "human"`: retornar `<Hangup/>` imediatamente (sem abrir áudio no navegador).
  - Se `AnsweredBy === "human"`:
    - localizar a `crm_chamadas` pelo `twilio_call_sid = CallSid`;
    - carregar `power_dialer_sessions` da sessão;
    - fazer atualização idempotente (somente se `lead_atendido_id` ainda for null):
      - `lead_atendido_id`,
      - `telefone_atendido`,
      - `status = "atendida"`.
    - cancelar todas as outras chamadas do lote via API Twilio (`Status=canceled`);
    - atualizar chamadas irmãs para `cancelada` (com filtro de status pendente).
    - atualizar chamada vencedora para `em_chamada`.
    - só então retornar `<Dial><Client>...`.
- Observabilidade:
  - logs estruturados com `sessionId`, `CallSid`, `AnsweredBy`, “winner_set=true/false”, “canceled_calls_count”.

Resultado esperado:
- A sessão recebe `lead_atendido_id` no exato momento em que humano é confirmado.
- Realtime do frontend passa a ter dado confiável para redirecionar.

2) `supabase/functions/power-dialer-status/index.ts` (fallback + robustez)
- Manter função como fallback para status de lifecycle.
- Tornar parsing resiliente:
  - evitar falha por content-type ausente (parse com `req.text()` + `URLSearchParams` quando necessário).
- Tratar ambos cenários de resposta:
  - `CallStatus = in-progress` e/ou `answered` como possíveis sinais de atendimento.
- Se receber atendimento humano e sessão ainda sem vencedor:
  - repetir lógica idempotente de setar `lead_atendido_id` e cancelar demais (fallback de segurança).
- Manter atualização de `resultado_por_numero`.
- Adicionar logs detalhados por evento para facilitar rastreio.

Resultado esperado:
- Mesmo que exista variação no callback, sessão ainda converge para estado correto.

3) `src/pages/AtendimentoAguardando.tsx` (anti-travamento da UI)
- Manter fetch inicial com retries (já existe), mas incluir polling de segurança enquanto status estiver ativo:
  - a cada 2s buscar sessão até detectar:
    - `lead_atendido_id` (redireciona),
    - ou `status` final (`cancelado`, `finalizado_sem_atendimento`, `expirado`).
- Evitar depender exclusivamente de realtime no popup.
- Melhorar mensagens:
  - diferenciar “aguardando resposta de chamada” de erro real de sessão.
- Garantir cleanup dos timers e channel em unmount.

Resultado esperado:
- Popup deixa de ficar eternamente em “carregando/discando” quando houver falha pontual de realtime/auth popup.

4) `src/components/crm/PowerDialerButton.tsx` (consistência de abertura da tela de atendimento)
- Ajustar `missedAlert` para preservar `papel` real da sessão ao abrir manualmente:
  - hoje o botão manual força `papel=sdr`; corrigir para usar `sess.papel`.
- Manter redirecionamento automático existente quando `lead_atendido_id` chegar.

Resultado esperado:
- Quando abrir manualmente após perda da janela, o atendimento abre no modo correto (SDR/CLOSER).

5) `supabase/functions/power-dialer/index.ts` (ajuste de precisão AMD)
- Manter AMD síncrono.
- Ajustar parâmetros para reduzir ambiguidade em `unknown` (sem voltar para modo assíncrono).
- Não mover mais a decisão de vencedor para este arquivo; apenas origem da chamada.

Validações após implementação:
1. Fluxo “humano atende”:
- iniciar discagem;
- confirmar que `power_dialer_sessions.lead_atendido_id` é preenchido imediatamente;
- confirmar redirecionamento automático para `/atendimento?...&papel=...`;
- confirmar cancelamento das demais chamadas do lote.

2. Fluxo “caixa postal”:
- confirmar que TwiML retorna `Hangup` para não-human;
- confirmar ausência de áudio de caixa no navegador;
- confirmar que sessão segue para próximos leads/lote sem poluição de áudio.

3. Fluxo “popup fechada”:
- ao atender, confirmar alerta “Abrir atendimento”;
- confirmar abertura com `papel` correto.

4. Fluxo de erro:
- forçar indisponibilidade de realtime e validar polling de fallback no `AtendimentoAguardando`.

Riscos e mitigação:
- Risco: `AnsweredBy=unknown` em chamadas humanas reais.
  - Mitigação: iniciar com regra estrita para eliminar áudio indevido e medir taxa de perda com logs; se necessário, permitir política configurável depois.
- Risco: concorrência entre múltiplas chamadas humanas quase simultâneas.
  - Mitigação: atualização idempotente do vencedor (set apenas quando `lead_atendido_id` ainda nulo) + cancelamento imediato das demais.

Sem mudanças de schema:
- Não é necessário criar/alterar tabelas para esta correção.
- Foco total em fluxo de funções backend + fallback de frontend.
