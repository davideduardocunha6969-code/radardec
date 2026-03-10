

## Plano de Implementação: Unificar Telefones

### Problema
1. Na importação de planilha, colunas mapeadas para `campo:telefone_1`, `campo:telefone_2`, etc. vão para `dados_extras` (strings) em vez do array `telefones` — por isso não aparecem nas abas SDR/Closer
2. Na aba Dados, telefones de `dados_extras` (telefone_1..4) renderizam como campos de texto normais, e o array `telefones` renderiza separadamente com botões add/remove — dois formatos
3. Abas SDR/Closer leem apenas `detailLead.telefones`, ignorando dados em `dados_extras`

### Alterações

**1. `src/components/crm/ImportMappingDialog.tsx`**
- No `buildLeads()`, interceptar mapeamentos `campo:telefone_1`, `campo:telefone_2`, `campo:telefone_3`, `campo:telefone_4` — redirecionar esses valores para o array `telefones` em vez de `dados_extras`
- Manter `__telefone__` funcionando como antes

**2. `src/components/crm/LeadDadosTab.tsx`**
- Filtrar campos dinâmicos cujo key comece com `telefone_` (regex `/^telefone_\d+$/`) — não renderizá-los como campos normais
- No `useMemo` de telefones, mesclar dados legados de `dados_extras.telefone_1..4` se o array `telefones` estiver vazio
- Renderizar 4 slots fixos (Telefone 1..4) no modo edição, com número + observação, sem botão add/remove dinâmico
- No modo visualização, mostrar até 4 telefones numerados

**3. `src/pages/CrmFunilKanban.tsx`**
- Ao setar `detailLead`, mesclar telefones legados de `dados_extras.telefone_*` no array `telefones` se o array estiver vazio — garante que abas SDR/Closer vejam todos os números

### Compatibilidade
- Power Dialer lê `lead.telefones` — continua funcionando
- Dados legados em `dados_extras` são mesclados automaticamente
- Novos imports vão direto para o array `telefones`

