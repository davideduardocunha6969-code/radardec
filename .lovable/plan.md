

# Atualizar modelo do Coaching em Tempo Real

## Resumo
Trocar o modelo de IA da edge function `coaching-realtime` de `google/gemini-2.5-flash` para `google/gemini-3-flash-preview`.

## O que muda
- **Arquivo:** `supabase/functions/coaching-realtime/index.ts`
- **Linha 170:** trocar `"google/gemini-2.5-flash"` por `"google/gemini-3-flash-preview"`

## Detalhes
- A arquitetura permanece a mesma: 1 unica chamada de IA que retorna analise completa (Roteiro, RECA, RALOCA, RADOVECA)
- O `gemini-3-flash-preview` oferece melhor raciocinio com latencia similar ao `2.5-flash`
- Nenhuma outra alteracao necessaria no frontend ou na estrutura da function

