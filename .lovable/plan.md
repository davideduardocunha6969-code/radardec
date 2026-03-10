

## Correção: URL da API ZapSign para listar templates

### Problema
A edge function `zapsign-list-templates` está chamando a URL errada: `https://api.zapsign.com.br/api/v1/models/` — retorna 404. A URL correta segundo a documentação ZapSign é `https://api.zapsign.com.br/api/v1/templates/`.

Além disso, a resposta da API é paginada (`{ count, next, previous, results }`) e não um array direto. O frontend precisa receber o array `results`.

A autenticação também precisa de ajuste: `getClaims` não existe no Supabase JS v2. Deve usar `getUser()` para validar o token.

### Alterações

**`supabase/functions/zapsign-list-templates/index.ts`**
1. Corrigir URL de `/api/v1/models/` para `/api/v1/templates/`
2. Extrair `results` da resposta paginada antes de retornar
3. Substituir `getClaims` por `getUser()` para validação de autenticação

**`supabase/functions/zapsign-create-doc/index.ts`**
- Verificar se a URL de criação de documento também precisa de correção (deve ser `/api/v1/templates/create-doc/`)
- Mesma correção de `getClaims` → `getUser()`

