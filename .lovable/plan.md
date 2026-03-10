

## Unificar telefones: Dados de Contato como fonte única

### Problema atual
Os telefones aparecem em 3 lugares com código duplicado:
- **Aba Dados** (`LeadDadosTab`): exibe telefones, permite editar — correto
- **Aba Atendimento SDR** (inline no `CrmFunilKanban.tsx` linhas 503-597): tem sua própria seção de telefones com edição duplicada + botões de ligação
- **Aba Atendimento Closer** (linhas 634-680): mesma duplicação

### Solução
1. **Remover** a seção de edição de telefones das abas SDR e Closer (remover `editingLeadData`, `editLeadForm` e todo o bloco de edição inline)
2. **Manter** nas abas SDR e Closer apenas a **listagem de telefones com botões de ação** (WhatsApp AI, WhatsApp ligação, VoIP) — sem edição, pois a edição fica na aba Dados
3. A aba Dados (`LeadDadosTab`) continua sendo a fonte única para CRUD de telefones

### Alteração — `src/pages/CrmFunilKanban.tsx`

**Aba Atendimento SDR (linhas ~503-597):**
- Remover o bloco `editingLeadData` (botão "Editar Dados", formulário com nome/endereço/telefones, botões cancelar/salvar)
- Manter apenas a listagem read-only de telefones com os botões WhatsApp AI, WhatsApp e Ligar
- Remover estados `editingLeadData` e `editLeadForm` se não usados em outro lugar

**Aba Atendimento Closer (linhas ~634-680):**
- Já está sem edição — manter como está

### Resultado
- Telefones editados apenas na aba "Dados"
- Abas SDR e Closer mostram os mesmos telefones com botões de ação para ligação
- Sem duplicação de código de edição

