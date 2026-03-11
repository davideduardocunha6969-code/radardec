

## Correção: Forçar fonte system-ui no input de Variável

### Problema
A fonte **Inter** (fonte global do projeto) renderiza o caractere `º` (ordinal masculino) com um traço embaixo. Remover `font-mono` não resolveu porque a fonte base já tem esse comportamento.

### Solução
Aplicar `font-family: system-ui` inline no input "Variável" para usar a fonte nativa do sistema operacional, que renderiza `º` sem traço.

### Alteração

**Arquivo:** `src/components/crm/ZapSignDialog.tsx` (linha 298)

```tsx
// De:
className="mt-0.5 text-xs"

// Para:
className="mt-0.5 text-xs"
style={{ fontFamily: 'system-ui, sans-serif' }}
```

Alteração de 1 linha. O dado enviado ao ZapSign continua idêntico — é apenas correção visual.

