

## Integração ZapSign — Assinatura Digital via Templates

### Resumo
Botão "Enviar para Assinatura" na aba Dados do Lead. Ao clicar, abre dialog que lista templates ZapSign, pré-preenche os dados do signatário a partir dos campos da seção "Dados de Contato" do lead (nome, email, telefone, CPF, etc.), permite edição, e envia para assinatura. O link gerado pode ser copiado.

### Pré-requisito
- Secret `ZAPSIGN_API_TOKEN` (token da API ZapSign) — será solicitado ao usuário.

### Arquivos novos

**1. Migração SQL — tabela `zapsign_documentos`**
- Colunas: `id`, `lead_id` (uuid), `user_id` (uuid), `doc_token`, `signer_token`, `sign_url`, `template_id`, `template_nome`, `status` (text default 'pendente'), `dados_enviados` (jsonb), `created_at`
- RLS: authenticated users podem INSERT e SELECT onde `user_id = auth.uid()`

**2. `supabase/functions/zapsign-list-templates/index.ts`**
- GET `https://api.zapsign.com.br/api/v1/models/` com `Authorization: Bearer {ZAPSIGN_API_TOKEN}`
- Retorna lista de templates

**3. `supabase/functions/zapsign-create-doc/index.ts`**
- Recebe: `template_id`, `signer_name`, `signer_email`, `signer_phone`, `lead_id`, `user_id`
- POST `https://api.zapsign.com.br/api/v1/models/create-doc/`
- Salva registro em `zapsign_documentos` via service_role
- Retorna `sign_url`

**4. `src/hooks/useZapSignDocumentos.ts`**
- Query: lista documentos por `lead_id`
- Mutations: listar templates (via edge function) e criar documento

**5. `src/components/crm/ZapSignDialog.tsx`**
- Dialog com 2 passos:
  - **Passo 1**: Selecionar template (dropdown)
  - **Passo 2**: Revisar/editar dados do signatário — pré-preenchidos da seção "Dados de Contato" do lead
- Lógica de pré-preenchimento: identifica a seção cujo nome contém "contato" (mesmo padrão já usado em `LeadDadosTab` via `contatoSecaoId`), extrai todos os campos dessa seção + telefones do lead usando `getFieldValue`
- Botão "Enviar para Assinatura" → chama edge function → exibe link com botão copiar

### Arquivo modificado

**6. `src/components/crm/LeadDadosTab.tsx`**
- Adicionar botão com ícone `FileSignature` ao lado do botão "Editar"
- Abre `ZapSignDialog` passando `lead`, `campos` filtrados pela seção de contato, e `telefones`

### Fluxo
```text
Aba Dados → Botão "Enviar para Assinatura"
  → Dialog abre
  → Seleciona template ZapSign
  → Campos da seção "Dados de Contato" pré-preenchidos (editáveis)
  → Clica "Enviar"
  → Edge function cria doc na ZapSign
  → Salva em zapsign_documentos
  → Exibe link de assinatura com botão copiar
```

