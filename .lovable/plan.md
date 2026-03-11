

## Correção: Endpoint errado na criação de documento ZapSign

### Análise da sugestão do Claude

| Sugestão | Correto? | Motivo |
|----------|----------|--------|
| Configurar secret `ZAPSIGN_API_TOKEN` | Desnecessário | Já existe e funciona (logs mostram status 200 no list-templates) |
| Mudar `Bearer` para `Token` | **Errado** | Documentação oficial da ZapSign usa `Bearer`. O list-templates já funciona com `Bearer` |
| Criar tabela `zapsign_documentos` | Desnecessário | Já existe no banco de dados |

### Problema real

A edge function `zapsign-create-doc` usa a URL errada:
- **Atual (errado):** `POST /api/v1/templates/${template_id}/create-doc/`
- **Correto (docs oficiais ZapSign):** `POST /api/v1/models/create-doc/` com `template_id` no body

### Solução

**Arquivo:** `supabase/functions/zapsign-create-doc/index.ts`

1. Mudar a URL de `https://api.zapsign.com.br/api/v1/templates/${template_id}/create-doc/` para `https://api.zapsign.com.br/api/v1/models/create-doc/`
2. Adicionar `template_id` ao objeto `zapBody` enviado no corpo da requisição

