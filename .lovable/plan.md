

## Plano: Reordenar seções — Dados Pessoais antes de Dados de Contato

### Problema
Ambas as seções "Dados pessoais" e "Dados de contato" têm `ordem = 2` no banco. A ordem de exibição fica indefinida.

### Solução
Executar uma migração SQL para definir `ordem = 1` para "Dados pessoais" e manter `ordem = 2` para "Dados de contato".

```sql
UPDATE public.crm_lead_secoes SET ordem = 1 WHERE id = 'e02d048b-768d-4e19-bb10-4d519534a10d';
```

Nenhuma alteração de código é necessária — o componente já ordena por `ordem ASC` via query.

