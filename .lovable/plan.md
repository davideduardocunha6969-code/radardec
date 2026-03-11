

## Correção: Renderização do caractere "º" no input de Variável

### Problema
O input "Variável" no Step 2 do ZapSignDialog usa a classe `font-mono`, que aplica uma fonte monospace. Nessa fonte, o caractere `º` (ordinal masculino, U+00BA) é renderizado com um traço embaixo, diferente de como aparece no template DOCX.

O caractere em si está correto nos dados — é apenas visual. Mas como o usuário vê a diferença e não tem certeza se vai funcionar, a solução mais simples é remover o `font-mono` do input.

### Solução

**Arquivo:** `src/components/crm/ZapSignDialog.tsx` (linha 298)

Remover `font-mono` da classe do input de "Variável":
```
// De:
className="mt-0.5 text-xs font-mono"
// Para:
className="mt-0.5 text-xs"
```

Isso faz o input usar a mesma fonte padrão do resto da UI, onde o `º` renderiza sem o traço — igual ao que aparece no template DOCX.

Nenhuma outra alteração necessária. O dado já é enviado corretamente ao ZapSign.

