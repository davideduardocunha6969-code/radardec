

## Plano de correção dos Radares

Vou aplicar otimizações de performance nas edge functions para resolver o erro **"CPU Time exceeded"** que está derrubando o Radar Controladoria (e prevenir o mesmo problema nos demais Radares).

### O que será feito

**1. `supabase/functions/fetch-sheet/index.ts`**
- Trocar os 5 `fetch()` sequenciais por `Promise.all` (download paralelo das 5 abas).
- Substituir o `parseCSV` atual (loop char-by-char) pelo parser CSV padrão do Deno (`https://deno.land/std/csv`), que é nativo, otimizado e respeita 100% das regras de aspas/escapes/quebras de linha dentro de células — sem risco de perder ou corromper linhas.

**2. `supabase/functions/fetch-bancario/index.ts`**
- Paralelizar com `Promise.all` os fetches das abas (Iniciais, Saneamento, Trânsito).
- Aplicar o mesmo parser otimizado.

**3. `supabase/functions/fetch-trabalhista/index.ts`**
- Paralelizar com `Promise.all` os fetches das 2 abas (Iniciais, Atividades).
- Aplicar o mesmo parser otimizado.

**4. `supabase/functions/fetch-commercial/index.ts`**
- Paralelizar com `Promise.all` os fetches de todas as abas (é a função mais pesada).
- Aplicar o mesmo parser otimizado.

**5. `supabase/functions/fetch-previdenciario/index.ts`**
- Mesma otimização preventiva (paralelização + parser otimizado).

**6. `src/pages/RadarControladoria.tsx`**
- Melhorar a mensagem de erro exibida ao usuário quando a edge function falhar, trocando "Edge Function returned a non-2xx status code" por uma mensagem clara em português.

### Garantias

- **Lógica de leitura preservada**: continuamos baixando as mesmas abas, dos mesmos GIDs, da mesma planilha. O Google devolve o CSV completo independente de paralelismo.
- **Parser robusto**: o parser do `std/csv` do Deno é o padrão da linguagem, testado e tratado para todos os edge cases (vírgulas dentro de aspas, quebras de linha em células, aspas escapadas).
- **Sem mudança de schema, sem mudança de RLS, sem mudança no frontend** além da mensagem de erro.

### Resultado esperado

- Tempo de execução das edge functions cai de ~timeout para alguns segundos.
- Radar Controladoria volta a carregar normalmente.
- Demais Radares ficam protegidos contra o mesmo problema conforme as planilhas crescerem.

