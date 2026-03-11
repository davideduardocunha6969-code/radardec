

## Avaliação: Claude está correto

A análise está precisa. O problema está na linha 61 da edge function:

```typescript
dataArray.push({ de: `{{${key}}}`, para: value.trim() });
```

Quando `field_data` chega com chaves como `__nome__`, o resultado é `{{__nome__}}` — que não casa com `{{nome}}` no template DOCX.

### Correção

**Arquivo:** `supabase/functions/zapsign-create-doc/index.ts` (linha 61)

Sanitizar a chave antes de montar o placeholder:

```typescript
const cleanKey = key.replace(/^_+|_+$/g, '');
dataArray.push({ de: `{{${cleanKey}}}`, para: value.trim() });
```

Isso converte `__nome__` → `nome`, `__email__` → `email`, `__telefone__` → `telefone`.

**Nenhum outro arquivo precisa ser alterado.** O formato `{de, para}` está correto conforme a API ZapSign. O `ZapSignDialog.tsx` continua enviando as chaves internas normalmente — a sanitização acontece no servidor antes de enviar à API.

