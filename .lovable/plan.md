

## Correção: Enviar dados do lead como variáveis do template ZapSign

### Problema
Você tem razão em dois pontos:

1. **Dados incompletos**: O dialog só envia nome, email e telefone — mas deveria enviar TODOS os campos da seção "Dados Pessoais" (e potencialmente outras seções) do lead.
2. **Mapeamento de variáveis**: A API ZapSign usa variáveis dinâmicas no formato `{{nome_variavel}}` dentro do DOCX. Para preencher essas variáveis, o endpoint `create-doc` aceita um array `data` com pares `de`/`para` (de = nome da variável no template, para = valor a substituir). Atualmente, não estamos enviando esse array.

### Como funciona o ZapSign
O template DOCX deve conter placeholders como `{{nome_completo}}`, `{{cpf}}`, `{{endereco}}`, etc. Na chamada da API, enviamos:
```text
data: [
  { "de": "nome_completo", "para": "LUCAS CARDOSO DA COSTA REIS" },
  { "de": "cpf",           "para": "123.456.789-00" },
  { "de": "email",         "para": "david@..." },
  ...
]
```

### Plano de implementação

**1. Frontend — `ZapSignDialog.tsx`**
- No step 2, em vez de mostrar apenas nome/email/telefone, coletar TODOS os campos de TODAS as seções do lead (ou pelo menos "Dados Pessoais" + "Dados de Contato")
- Mostrar uma lista editável com os campos do lead e seus valores pré-preenchidos do `dados_extras`
- Incluir também o campo `nome` nativo do lead
- Enviar todos os dados como um objeto `field_data` para a edge function

**2. Edge Function — `zapsign-create-doc/index.ts`**
- Corrigir o endpoint para `POST /api/v1/models/create-doc/` (que é o endpoint correto segundo a documentação oficial)
- Receber o `field_data` (Record de key→value) do frontend
- Montar o array `data` no formato `[{ de: "{{key}}", para: "valor" }, ...]`
- Enviar junto com `signer_name`, `signer_email`, `signer_phone` e `template_id`

**3. Frontend — Step 2 revisado**
- Agrupar campos por seção (Dados Pessoais, Dados de Contato, etc.)
- Cada campo editável com label = nome do campo e valor pré-preenchido do `dados_extras`
- Scroll area para comportar muitos campos
- O usuário pode revisar/editar antes de enviar

### Nota importante sobre os templates DOCX
Para que o preenchimento automático funcione, as variáveis no template DOCX devem corresponder exatamente às keys dos campos do CRM (ex: `{{nome_completo}}`, `{{cpf}}`, `{{data_nascimento}}`). Isso é configurado diretamente no arquivo DOCX do template no painel ZapSign — não é algo que configuramos via código.

### Arquivos alterados
- `src/components/crm/ZapSignDialog.tsx` — redesenhar step 2 para mostrar todos os campos do lead
- `src/hooks/useZapSignDocumentos.ts` — ajustar interface de parâmetros para incluir `field_data`
- `supabase/functions/zapsign-create-doc/index.ts` — corrigir endpoint e montar array `data` com pares de/para

