

# Melhorar o card do lead no kanban

## O que muda visualmente
- Remove o telefone do card
- Adiciona 3 informacoes em texto pequeno abaixo do nome:
  - "Cadastrado em DD/MM/AAAA" (data de criacao do lead)
  - "Nesta etapa desde DD/MM/AAAA" (data em que o lead foi movido para a coluna atual)
  - "Sem contato desde DD/MM/AAAA" (data do ultimo contato registrado, ou "Sem contato" se nunca houve)

## Alteracoes tecnicas

### 1. Nova migracao SQL - adicionar campo `etapa_desde`
- Adicionar coluna `etapa_desde` (timestamptz) na tabela `crm_leads`, com default `now()`
- Popular os registros existentes com o valor de `updated_at` (melhor aproximacao disponivel)
- Atualizar a funcao `bulk_insert_leads` para incluir `etapa_desde = now()` nos inserts

### 2. `src/hooks/useCrmOutbound.ts` - Atualizar `etapa_desde` ao mover lead
- Na mutacao `useUpdateLead`, quando `coluna_id` muda, incluir `etapa_desde: new Date().toISOString()` no update

### 3. `src/pages/CrmFunilKanban.tsx` - Alterar o card do lead
- Remover a secao de telefone (linhas 76-81)
- Adicionar as 3 linhas de informacao usando `created_at`, `etapa_desde` e data do ultimo contato
- Para "ultimo contato": usar uma subquery no hook `useCrmLeads` ou buscar separadamente a data da chamada mais recente por lead

### 4. Buscar data do ultimo contato
- Criar um hook auxiliar ou enriquecer a query de leads com a data da chamada mais recente de cada lead (tabela `crm_chamadas`, campo `created_at`, filtrado por `lead_id`)
- Alternativa mais simples: adicionar um campo `ultimo_contato_em` na tabela `crm_leads` e atualiza-lo automaticamente via trigger quando uma chamada e criada

**Abordagem escolhida para ultimo contato**: Adicionar coluna `ultimo_contato_em` em `crm_leads` e criar um trigger que atualiza esse campo sempre que um registro e inserido/atualizado em `crm_chamadas`. Isso evita queries extras no kanban.

### 5. Resumo da migracao SQL

```text
ALTER TABLE crm_leads ADD COLUMN etapa_desde timestamptz DEFAULT now();
ALTER TABLE crm_leads ADD COLUMN ultimo_contato_em timestamptz;

-- Popular existentes
UPDATE crm_leads SET etapa_desde = updated_at;

-- Popular ultimo_contato_em com base nas chamadas existentes
UPDATE crm_leads SET ultimo_contato_em = sub.max_at
FROM (SELECT lead_id, MAX(created_at) AS max_at FROM crm_chamadas GROUP BY lead_id) sub
WHERE crm_leads.id = sub.lead_id;

-- Trigger para atualizar ultimo_contato_em automaticamente
CREATE FUNCTION update_lead_ultimo_contato() RETURNS trigger ...
CREATE TRIGGER trg_update_lead_ultimo_contato AFTER INSERT ON crm_chamadas ...
```

### 6. Atualizar interface do tipo `CrmLead`
- O arquivo `types.ts` sera atualizado automaticamente pela migracao
- Adicionar os campos `etapa_desde` e `ultimo_contato_em` na interface local `CrmLead` em `useCrmOutbound.ts`

### Arquivos modificados
- Nova migracao SQL (campos + trigger)
- `src/hooks/useCrmOutbound.ts` (interface CrmLead + logica de etapa_desde ao mover)
- `src/pages/CrmFunilKanban.tsx` (visual do card)
