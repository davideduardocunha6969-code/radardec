

# Corrigir Script Não Riscando — Merge de IDs

## Problema

As linhas 126-128 do arquivo `src/components/crm/RealtimeCoachingPanel.tsx` continuam **substituindo** os arrays de IDs concluídos ao invés de **acumulá-los**:

```text
// Código ATUAL (linha 126-128) — SUBSTITUI:
setApresentacaoDone(analysis.apresentacao_done || []);
setQualificationDone(analysis.qualification_done || []);
setShowRateDone(analysis.show_rate_done || []);
```

Isso significa que se a IA detectou o item "jornada" como feito na análise 1, mas não o retornou na análise 2, ele desaparece. O item volta a ficar sem risco.

## Solução

Trocar as 3 linhas para usar merge com `Set`, igual já é feito para objeções, RECA e RALOCA logo abaixo no mesmo arquivo:

```text
// Código NOVO — ACUMULA:
setApresentacaoDone(prev => {
  const merged = new Set(prev);
  for (const id of (analysis.apresentacao_done || [])) merged.add(id);
  return Array.from(merged);
});
setQualificationDone(prev => {
  const merged = new Set(prev);
  for (const id of (analysis.qualification_done || [])) merged.add(id);
  return Array.from(merged);
});
setShowRateDone(prev => {
  const merged = new Set(prev);
  for (const id of (analysis.show_rate_done || [])) merged.add(id);
  return Array.from(merged);
});
```

## Arquivo

- `src/components/crm/RealtimeCoachingPanel.tsx` — linhas 126-128

## Por que isso resolve

Uma vez que um ID de script é detectado como feito pela IA, ele permanece no `Set` para sempre durante a sessão. Mesmo que análises posteriores não retornem aquele ID, ele não será removido. Isso garante que o risco (`line-through`) no `ChecklistCard` persista.

Nenhum outro arquivo precisa ser alterado. O `ChecklistCard`, `DynamicChecklistCard`, `ObjectionsCard` e a edge function já estão corretos.

