

## Plano: Adicionar todas as páginas protegidas ao painel de permissões do Admin

### Problema
O array `AVAILABLE_PAGES_GROUPED` em `src/pages/Admin.tsx` lista apenas um subconjunto das páginas que efetivamente usam `pageKey` nas rotas protegidas. Resultado: o admin não consegue conceder acesso a 8 páginas.

### Páginas faltantes

```text
Grupo Comercial:
  - radar-outbound     → Radar Outbound
  - crm-outbound       → CRM Outbound

Grupo Robôs:
  - robos-perfil-ia         → Perfil IA
  - robos-coach             → Robô Coach
  - robos-modelador-replica → Modelador Réplica

Grupo Marketing:
  - marketing-radar         → Radar de Viralização
  - marketing-reels-machine → Reels Machine

Grupo Recrutamento (novo):
  - recrutamento            → Recrutamento Inteligente
```

### Solução
Atualizar o array `AVAILABLE_PAGES_GROUPED` em `src/pages/Admin.tsx` (linhas 27-63) adicionando as entradas faltantes nos grupos correspondentes e criando o grupo "Recrutamento".

### Arquivo modificado
- `src/pages/Admin.tsx` — apenas o array `AVAILABLE_PAGES_GROUPED`

