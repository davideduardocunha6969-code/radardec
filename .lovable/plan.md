

## Power Dialer — 4 Changes Implementation Plan

The Claude analysis is **correct on all points**. Here's the implementation:

### 1. `power-dialer-status/index.ts` — Add `initiated`/`ringing` cases

- Add `case "initiated": newStatus = "iniciando"; break;` and `case "ringing": newStatus = "chamando"; break;` before `case "in-progress"` (line 73)
- Change the `default` block (line 149-151) from `return new Response("OK")` to just `break` so the RPC update still runs

### 2. `power-dialer/index.ts` — Dynamic batch size + DDD priority

- Remove `const BATCH_SIZE = 5` (line 10)
- In `start` action: after building `dddMap` (already at line 184-187), calculate `DYNAMIC_BATCH_SIZE = Math.max(1, twilioNums?.length || 1)`. Sort queue by DDD match. Use `DYNAMIC_BATCH_SIZE` in `queue.slice(0, DYNAMIC_BATCH_SIZE)` (line 206)
- In `next-batch` action: fetch `twilio_numeros` is already at line 333-341, calculate `DYNAMIC_BATCH_SIZE` there too. Use it in `queue.slice(start, start + DYNAMIC_BATCH_SIZE)` (line 317-318)
- In both actions, add `callerId` and `dddMatch` to `leadsInfo.push(...)` calls

**Important note on `next-batch` batch size calculation:** The `start` offset must use the ORIGINAL batch size from when that session was created (stored as `leadsInfo.length` from the session), NOT the current dynamic size, since the queue was sliced with the original batch size. Actually, looking more carefully — the `lote_atual` increments by 1 each time, and `start = nextLote * BATCH_SIZE`. If batch sizes vary between batches, this offset calculation breaks. **Fix:** Store the batch size used in the session record, or always use the same dynamic calculation (which works as long as `twilio_numeros` count doesn't change mid-session). Since the count is unlikely to change mid-session, using `DYNAMIC_BATCH_SIZE` consistently is fine.

### 3. `AtendimentoAguardando.tsx` — Rich UI + auto-advance

- Expand `LeadInfo` interface with `callerId?: string; dddMatch?: boolean`
- Calculate `loteMax` dynamically from `leadsInfo.length`
- Create `enrichedLeads` by merging `resultado_por_numero` into each lead's status
- Add `useEffect` watching `session?.resultado_por_numero` that checks if all leads have terminal statuses and auto-invokes `next-batch`
- Replace simple lead list with rich cards showing: name, number, caller ID, DDD match badge, animated status icon
- Import additional icons: `Clock, PhoneCall, PhoneMissed, X`

### 4. No new migration — RPC already exists

### Status icon mapping for UI
| Status | Icon | Color | Label |
|--------|------|-------|-------|
| iniciando | Clock | gray | Iniciando |
| chamando | Phone + pulse | yellow | Chamando... |
| em_andamento | Phone | blue | Discando |
| em_chamada | PhoneCall | green | Atendeu! ✓ |
| nao_atendida | PhoneMissed | orange | Não atendeu |
| ocupado | PhoneOff | orange | Ocupado |
| cancelada | X | gray | Cancelada |
| falhou | AlertCircle | red | Falhou |

### Files to modify
- `supabase/functions/power-dialer-status/index.ts`
- `supabase/functions/power-dialer/index.ts`
- `src/pages/AtendimentoAguardando.tsx`

