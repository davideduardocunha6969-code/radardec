

## Fix: Inflated Updated Values in Estimativa de Valores

### Root Cause
`correcao.ts` → `atualizarValor()` applies IPCA-E correction **plus** 1% monthly simple interest (juros moratórios). Juros moratórios only begin from the date a lawsuit is filed (`ajuizamento`). Since this is a **pre-litigation estimate** (no lawsuit filed yet), juros should **not** be included. This alone accounts for ~60-70% additional inflation on already-corrected values, explaining why updated values appear ~2.5x the nominal instead of ~1.3x.

### Fix
In `src/utils/trabalhista/correcao.ts`, change `atualizarValor` to apply **only** IPCA-E correction (no juros moratórios):

```typescript
export function atualizarValor(
  valor: number,
  dataBase: Date,
  dataCalculo: Date = new Date()
): number {
  return corrigirIPCAE(valor, dataBase, dataCalculo);
}
```

Keep `aplicarJurosMoratorios` as a standalone export for future use in liquidation mode (when a filing date is known), but don't call it from `atualizarValor`.

### Expected Result
- Nominal R$ 271,771 → Updated ~R$ 360,000 (IPCA-E only, ~1.3x) instead of R$ 664,735 (2.45x)
- Horas Extras R$ 186,850 → ~R$ 248,000 instead of R$ 470,109

### Files to modify
- `src/utils/trabalhista/correcao.ts` — remove juros from `atualizarValor`

