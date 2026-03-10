

## Correção: Adicionar debug logging e validar token ZapSign

### Problema
A edge function `zapsign-list-templates` está com URL e headers corretos conforme a documentação, mas a API ZapSign continua retornando 404. Isso indica provável problema com o token configurado.

### Plano

**1. Adicionar logging de debug na edge function**
- Logar os primeiros 8 caracteres do token para confirmar que está sendo lido corretamente
- Logar a URL exata sendo chamada
- Logar o status e headers da resposta da ZapSign para mais contexto

**2. Testar com URL alternativa**
- A documentação ZapSign mostra que alguns endpoints usam `https://api.zapsign.com.br/api/v1/templates/` (com trailing slash) e outros sem. Vamos testar ambos formatos.

### Arquivo modificado
- `supabase/functions/zapsign-list-templates/index.ts` — adicionar logs de debug

### Próximo passo
Após reimplantar, verificar os logs da edge function para identificar se o token está sendo lido corretamente. Se o token estiver errado, será necessário reconfigurá-lo.

