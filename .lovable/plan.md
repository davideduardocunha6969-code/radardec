

## Correção do Power Dialer: Áudio e Tela de Atendimento

A análise está correta nos 3 pontos. Confirmei no código:

1. **`power-dialer/index.ts`** — `MachineDetection: "DetectMessageEnd"` com timeout de 5s causa delay antes do TwiML ser chamado. Trocar para `"Enable"` (async) elimina essa espera.

2. **`power-dialer-twiml/index.ts`** — Após o winner selection atômico (linha ~107), as 8 cancelações são feitas sequencialmente com `await` antes de retornar o TwiML. Mover para fire-and-forget (sem await) permite retornar o `<Dial><Client>` imediatamente.

3. **`AtendimentoAguardando.tsx`** — Linhas 154-165: `window.open()` dentro de `setTimeout` no `useEffect` é bloqueado por popup blockers. Substituir por um botão visível que o usuário clica manualmente.

### Alterações

**`supabase/functions/power-dialer/index.ts`**
- Remover `MachineDetectionTimeout: "5"`
- Trocar `MachineDetection: "DetectMessageEnd"` para `MachineDetection: "Enable"`

**`supabase/functions/power-dialer-twiml/index.ts`**
- Após winner selection e update de status, retornar o TwiML imediatamente
- Mover cancelamentos das chamadas perdedoras para `Promise.all` sem `await` (fire-and-forget)

**`src/pages/AtendimentoAguardando.tsx`**
- Adicionar estados `showOpenButton` e `atendimentoUrl`
- No useEffect do `lead_atendido_id`, preparar a URL mas não chamar `window.open()`
- Na view `callActive`, renderizar botão "Abrir Tela de Atendimento" que chama `window.open()` no `onClick`

