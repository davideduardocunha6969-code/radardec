

## Fix E.164 Number Formatting

The bug is confirmed. The `replace(/\D/g, "")` strips the `+` but keeps `55`, then `+55` is prepended again creating `+5555...`.

### Changes

**1. `supabase/functions/power-dialer/index.ts` (line 156-158)**
Replace the E.164 conversion in the `start` action:
```typescript
const cleanNum = best.numero.replace(/\D/g, "");
const withoutCountry = cleanNum.startsWith("55") && cleanNum.length > 11
  ? cleanNum.slice(2)
  : cleanNum;
const e164 = `+55${withoutCountry}`;
const ddd = withoutCountry.length >= 10 ? withoutCountry.slice(0, 2) : "";
```

**2. `src/components/crm/VoipDialer.tsx` (line 143)**
Same bug exists for direct calls from lead cards:
```typescript
const cleanDigits = numero.replace(/\D/g, "");
const withoutCountry = cleanDigits.startsWith("55") && cleanDigits.length > 11
  ? cleanDigits.slice(2)
  : cleanDigits;
const formattedNumber = `+55${withoutCountry}`;
```

### Files to modify
- `supabase/functions/power-dialer/index.ts` — E.164 fix in `start` action (only place queue is built)
- `src/components/crm/VoipDialer.tsx` — E.164 fix for direct VoIP calls

