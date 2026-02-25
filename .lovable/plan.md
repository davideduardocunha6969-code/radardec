

# Remover regra de palavras minimas do filtro de lead

## O que muda

A regra planejada anteriormente de "rejeitar frases do lead com menos de 4 palavras" **nao sera implementada**. Frases curtas do lead como "sim", "nao", "pode ser", "o que e isso" sao falas legitimas e devem aparecer na transcricao.

## Filtro que permanece

O filtro de alucinacoes continuara usando apenas os padroes de regex ja existentes no codigo (linha 168-181 do `RealtimeCoachingPanel.tsx`), que detectam frases especificas geradas pelo STT durante silencio (ex: "pilulas do evangelho", "inscreva-se", "amara.org", etc). Esses padroes se aplicam igualmente para SDR e Lead.

## Arquivo

- **`src/components/crm/RealtimeCoachingPanel.tsx`** — Nenhuma alteracao necessaria. O codigo atual ja esta correto: usa apenas regex patterns sem filtro de tamanho minimo de palavras. A regra de 4 palavras nunca foi implementada no codigo, apenas discutida no plano anterior, e nao sera adicionada.

