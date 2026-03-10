

## Plano: Adicionar Email aos Dados de Contato + Mostrar Contato na Assinatura

### Problema
1. Não existe campo de email no lead — o ZapSign precisa de email e telefone do signatário.
2. O dialog de assinatura mostra apenas campos da seção "Dados Pessoais", ignorando "Dados de Contato" (telefones).

### Solução

#### 1. Migração: Adicionar coluna `email` na tabela `crm_leads`
```sql
ALTER TABLE public.crm_leads ADD COLUMN email text;
```

#### 2. Atualizar interface TypeScript (`CrmLead`)
- Adicionar `email: string | null` em `src/hooks/useCrmOutbound.ts`.

#### 3. Atualizar `LeadDadosTab.tsx` — Email na seção Dados de Contato
- Exibir campo "Email" junto dos telefones dentro da seção "Dados de Contato" (tanto em modo visualização quanto edição).
- Persistir no `handleSave` junto com os demais campos nativos.
- Inicializar no `startEditing`.

#### 4. Atualizar `ZapSignDialog.tsx` — Incluir seção Dados de Contato
- Além de "Dados Pessoais", incluir também a seção "Dados de Contato" no filtro de seções.
- Adicionar campos fixos de contato (telefones do array `lead.telefones` e `lead.email`) na tela de revisão, pré-preenchidos.
- Passar `signer_email` e `signer_phone` corretamente ao enviar, usando os valores do lead.

### Arquivos modificados
- `src/hooks/useCrmOutbound.ts` — tipo CrmLead
- `src/components/crm/LeadDadosTab.tsx` — email na seção contato
- `src/components/crm/ZapSignDialog.tsx` — seção contato + email/telefone na assinatura
- Migração SQL para coluna `email`

