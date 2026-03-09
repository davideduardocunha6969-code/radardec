

## Power Dialer — Fix Plan

### Problem Summary
The Twilio Device lives in the CRM window (`PowerDialerButton`), auto-accepts the call there, and then a redirect to `/atendimento` creates a NEW Device that never receives the call. Audio stays in the wrong window.

### Why Option A (BroadcastChannel to pass Call object) won't work
Twilio `Call` objects contain WebRTC connections, audio streams, and event listeners — these are **not serializable**. You cannot transfer them between windows via BroadcastChannel or postMessage. Only primitive data can cross window boundaries.

### Option B (Move Device to AtendimentoAguardando) — Recommended, with refinement

The critical insight: **you cannot redirect away from the window holding the active call** without killing the audio. So AtendimentoAguardando must stay alive as the audio bridge and open `/atendimento` as a separate window.

### Architecture After Fix

```text
CRM Window (PowerDialerButton)
  └── Starts session → opens /atendimento-aguardando popup
      (NO Twilio Device here anymore)

AtendimentoAguardando Window (PERSISTENT — never redirects)
  ├── Registers Twilio Device on mount
  ├── Shows "Discando..." UI with batch progress
  ├── When lead answers:
  │   ├── Device accepts incoming call (audio lives HERE)
  │   ├── Transforms UI into audio bridge (mute, hangup, timer)
  │   ├── Opens /atendimento?powerDialerMode=true as NEW window
  │   └── Sends call state via BroadcastChannel (simple strings)
  └── On hangup → notifies atendimento, resets or closes

/atendimento?powerDialerMode=true (NEW window)
  ├── Does NOT render VoipDialer (no second Device)
  ├── Listens to BroadcastChannel for call state
  ├── Auto-starts coaching panel (activeRecording=true)
  └── Shows scripts, extractor, lacunas, estimativa
```

### Files to Change

| File | Change |
|------|--------|
| `PowerDialerButton.tsx` | Remove Device init, remove incoming handler, remove redirect logic. Keep only: session start, cancel button, missed-alert. |
| `AtendimentoAguardando.tsx` | Add Device registration. On incoming call → accept, transform UI to audio bridge (mute/hangup/timer). Open `/atendimento?powerDialerMode=true` as new window. Send call state via BroadcastChannel. |
| `Atendimento.tsx` | Detect `powerDialerMode` param. Skip VoipDialer render. Listen to BroadcastChannel for call-ended to stop coaching. Auto-set `activeRecording=true`. |
| `power-dialer-twiml/index.ts` | Atomic winner: `.eq("id", sessionId).is("lead_atendido_id", null)` instead of read-check-write. |
| `power-dialer-status/index.ts` | Same atomic winner fix. Use RPC for JSONB update. |
| **DB migration** | Create `update_resultado_por_numero` RPC function for atomic JSONB merge. |

### BroadcastChannel Protocol (simple)
Channel name: `power-dialer-audio`
Messages: `{ type: "call-active", leadId, numero }`, `{ type: "call-ended" }`, `{ type: "mute-changed", muted: boolean }`

### Atomic Winner Fix (both Edge Functions)
```typescript
const { data: winner } = await supabase
  .from("power_dialer_sessions")
  .update({ lead_atendido_id: chamada.lead_id, telefone_atendido: chamada.numero_discado, status: "atendida" })
  .eq("id", sessionId)
  .is("lead_atendido_id", null)
  .select("id")
  .maybeSingle();

if (!winner) {
  // Lost the race — hang up
  return new Response(hangupTwiml, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
}
```

### JSONB RPC Function
```sql
CREATE OR REPLACE FUNCTION update_resultado_por_numero(p_session_id uuid, p_numero text, p_status text)
RETURNS void AS $$
  UPDATE power_dialer_sessions
  SET resultado_por_numero = COALESCE(resultado_por_numero, '{}'::jsonb) || jsonb_build_object(p_numero, p_status)
  WHERE id = p_session_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
```

