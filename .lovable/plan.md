

## Correção: Scrollbar visível no Step 2 do ZapSignDialog

### Problema
O `ScrollArea` na linha 226 usa `max-h-[50vh]` mas o componente `ScrollArea` do Radix precisa de uma altura **fixa** (não `max-h`) para calcular o overflow e exibir a scrollbar. Com `max-h`, o componente não sabe quando ativar o scroll.

### Solução
Trocar `max-h-[50vh]` por `h-[50vh]` no `ScrollArea` para que ele tenha uma altura definida e renderize a barra de rolagem corretamente.

### Arquivo alterado
- `src/components/crm/ZapSignDialog.tsx` — linha 226: `className="max-h-[50vh] pr-3"` → `className="h-[50vh] pr-3"`

