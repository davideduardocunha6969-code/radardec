

## Nova página "Funcionalidades" no menu Administração

### Objetivo
Criar uma página `/admin/funcionalidades` com documentação completa passo a passo de todas as funcionalidades do CRM Outbound, acessível apenas para admins.

### Alterações

**1. `src/pages/Funcionalidades.tsx`** (novo)
- Página com Accordion organizado por seções, documentando todas as funcionalidades:
  - **Funis e Kanban**: criação de funis, colunas, reordenação, status ativo/desativado, exclusão com confirmação, equipe
  - **Importação de Listas**: upload Excel/CSV, mapeamento de colunas, telefones (1-4) direcionados ao array JSONB, bulk insert via RPC
  - **Cards de Lead**: dados dinâmicos (`crm_lead_campos`), seções configuráveis, campo Nome como `__nome__`, dados extras JSONB
  - **Telefones e Contatos**: array unificado `telefones` (número, tipo, observação), 4 slots fixos na aba Dados, ações somente-leitura nas abas SDR/Closer
  - **Scripts e Roteiros**: SDR vs Closer, estrutura tripartida Closer (Apresentação/Qualificação/Fechamento), perguntas condicionais (SE SIM/SE NÃO), sub_items recursivos, mapeamento campo_lead_key
  - **Robô Coach e Feedback**: configuração por funil (não por coluna), prompts independentes (IA Coach, IA Detectora, Resumo IA, IA Extratora/Lacunas, IA Radar para Closer)
  - **Transcrição em Tempo Real**: captura áudio local (microfone) + remoto (lead), auto-save a cada 30s, recuperação de chamadas órfãs (>5min), badge "Parcial"
  - **Ligação WhatsApp**: 1-click flow com autoStart=true, SID único, gravação fixa na página, debounce 2s, encerramento automático (>20 chars, 2+ interlocutores)
  - **Ligação VoIP (Twilio)**: discagem direta via VoipDialer, captura getUserMedia + getRemoteStream, registro automático em crm_chamadas
  - **Power Dialer**: lotes dinâmicos baseados em números Twilio ativos, Local Presence (prioridade DDD), AMD modo Enable (assíncrono), atualização atômica lead_atendido_id, retry 5x para streams, interface inline em /atendimento-aguardando, gravação server-side (CallSid outbound), session-status via service_role
  - **Extrator de Dados**: instruções_extrator no script, extração automática de dados do lead durante atendimento
  - **Cálculo de Valor da Ação**: instruções_lacunas no script, painel de lacunas em tempo real
  - **Coaching em Tempo Real**: checklist dinâmico, radar de objeções, script condicional colapsável, verificação recursiva isFullyCompleted
  - **Histórico de Contatos**: resumo IA (resumo_contatos_lead), último contato automático via trigger, chamadas registradas com status e caller_id

- Cada seção terá: título, descrição do fluxo, regras de negócio em bullet points
- Estilo visual consistente com o resto do sistema (Cards + Accordion)

**2. `src/components/AppSidebar.tsx`**
- Adicionar item "Funcionalidades" com ícone `FileText` abaixo de "Administrador" no grupo Administração (visível apenas para admin)

**3. `src/App.tsx`**
- Adicionar rota `/admin/funcionalidades` protegida com `ProtectedRoute` (sem pageKey, acesso admin implícito via sidebar)

