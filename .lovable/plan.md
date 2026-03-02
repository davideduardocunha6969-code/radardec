
Objetivo
Corrigir definitivamente dois problemas no fluxo de atendimento WhatsApp:
1) pedido duplicado de compartilhamento de tela;
2) latência alta na transcrição (especialmente no início da chamada).

O que eu confirmei no código atual
1) `src/components/crm/WhatsAppCallRecorder.tsx`
- Hoje existe apenas 1 chamada de `getDisplayMedia` por tentativa (bom).
- Mas o auto-start ainda depende de `useRef` local (`autoStartedRef`/`isStartingRef`), que não sobrevive a remount/navigation da aba popup.
- Se a aba `/atendimento` remonta/recarrega, o auto-start pode rodar novamente e abrir novo prompt de compartilhamento.
- O botão “Ligar pelo WhatsApp” continua clicável durante a fase de inicialização (status ainda `idle` até terminar permissões), o que aumenta chance de disparo duplicado por interação humana.

2) `src/pages/Atendimento.tsx`
- O gravador está estável em uma única instância (melhorou), mas o auto-start é disparado imediatamente ao montar.
- O painel de coaching/transcrição só aparece quando `activeRecording && coach`.
- Na prática, a gravação pode começar antes de `coach/script` estarem prontos, então a conexão Scribe começa tarde (percepção de latência de vários segundos no início).

3) `src/components/crm/RealtimeCoachingPanel.tsx`
- A conexão com transcrição faz 2 tokens + 2 conexões (`Promise.all`) e só inicia quando o painel monta.
- Enquanto `coach` não existe, o painel não monta; logo a transcrição não conecta.
- Isso explica regressão de latência inicial após as mudanças de auto-start.

Plano de implementação

Fase 1 — Eliminar prompt duplicado de compartilhamento
Arquivo: `src/components/crm/WhatsAppCallRecorder.tsx`

1.1 Criar trava persistente de auto-start por sessão de popup
- Introduzir uma chave estável (ex.: baseada em `window.name + leadId + numero + papel`).
- Antes de executar auto-start, verificar `sessionStorage`.
- Se já houve tentativa nesta sessão da aba, não disparar novamente.
- Marcar a tentativa no `sessionStorage` antes de iniciar permissões (garante idempotência até em remount rápido).

1.2 Tornar “inicializando” um estado explícito de UI
- Adicionar estado `starting` (ou `isStarting`) na máquina de status.
- Enquanto estiver iniciando:
  - botão WhatsApp desabilitado;
  - texto “Iniciando…” visível.
- Isso evita segundo clique manual durante janela de permissão.

1.3 Harden adicional no start
- Manter guardas por `ref`, mas complementar com guarda por estado persistido.
- Garantir reset consistente da trava de inicialização em todos os caminhos (`success`, `catch`, abort).

Resultado esperado da Fase 1
- Mesmo com remount/reload da popup, o auto-start não reabre compartilhamento automaticamente.
- Usuário não consegue disparar start manual concorrente durante inicialização.

Fase 2 — Reduzir latência de transcrição (voltar próximo de ~1s)
Arquivos: `src/pages/Atendimento.tsx` e `src/components/crm/RealtimeCoachingPanel.tsx`

2.1 Separar “iniciar gravação” de “iniciar transcrição”
- Em `Atendimento.tsx`, permitir que o pipeline de transcrição monte assim que `activeRecording` for true, sem depender de `coach` para conectar Scribe.
- Estratégia:
  - renderizar painel de transcrição com modo “transcrição já ativa / coaching carregando…”.
  - quando `coach` chegar, habilitar apenas a camada de análise/coaching (cards e sugestões).

2.2 Ajustar `RealtimeCoachingPanel` para tolerar coach tardio
- Conexão Scribe e captura de transcript independentes do `coach`.
- `requestAnalysis` só roda quando `coach` estiver disponível.
- Transcrições recebidas antes do coach ficam em buffer (já estão no estado/ref) e podem ser processadas depois.

2.3 Evitar reconexão desnecessária de Scribe
- Revisar dependências dos `useEffect` de conexão para garantir que mudanças de props de coaching não derrubem sessão de transcrição.
- Conexão/desconexão deve seguir estritamente o ciclo `isRecording` (não o ciclo de carregamento de dados do coach/script).

Resultado esperado da Fase 2
- Texto parcial/committed da transcrição aparece rapidamente desde o começo da chamada.
- Coaching pode entrar alguns instantes depois sem penalizar a transcrição base.

Fase 3 — Robustez no ponto de origem da popup
Arquivo: `src/pages/CrmFunilKanban.tsx`

3.1 Debounce/lock no clique que abre `/atendimento`
- Adicionar proteção contra clique duplo muito rápido no botão WhatsApp.
- Evita dupla navegação da mesma janela popup em sequência (que também pode rearmar auto-start).

3.2 Identificador único de sessão na URL (opcional, recomendado)
- Incluir `sessionId` no `window.open` para rastrear a tentativa de auto-start da chamada atual.
- Usar esse `sessionId` na trava persistente do gravador para comportamento determinístico.

Validação (fim a fim)
1) Fluxo SDR e Closer:
- Clicar 1 vez em WhatsApp no Kanban.
- Confirmar que só ocorre 1 solicitação de compartilhamento.
- Confirmar que não precisa clicar “Ligar pelo WhatsApp” dentro da popup.

2) Latência:
- Medir tempo entre início de fala e aparição de transcrição parcial/final.
- Meta: voltar para comportamento próximo do histórico (~1s em condições normais).

3) Cenários de estabilidade:
- Alternar foco entre popup e app principal.
- Confirmar que não há nova solicitação de compartilhamento.
- Finalizar chamada e iniciar nova: auto-start não deve disparar indevidamente na mesma sessão.

4) Regressão:
- Confirmar que finalizar/processar gravação continua funcionando.
- Confirmar que cards de coaching continuam sendo populados após coach carregar.

Riscos e mitigação
- Risco: transcrição iniciar sem coach pode gerar janela curta sem cards.
  - Mitigação: exibir estado visual “Coaching carregando”, mantendo transcrição ao vivo ativa.
- Risco: trava persistente impedir auto-start quando usuário realmente quer nova chamada na mesma popup.
  - Mitigação: chave por `sessionId` (chamada) em vez de chave estática por lead.

Escopo de arquivos
- `src/components/crm/WhatsAppCallRecorder.tsx` (idempotência persistente + estado de inicialização)
- `src/pages/Atendimento.tsx` (desacoplar render da transcrição do carregamento de coach)
- `src/components/crm/RealtimeCoachingPanel.tsx` (conectar Scribe sem depender do coach; analysis condicional)
- `src/pages/CrmFunilKanban.tsx` (anti-duplo clique + sessionId opcional)

Com esse pacote, tratamos a causa do prompt duplicado de forma determinística e removemos o gargalo que hoje empurra a transcrição para vários segundos no início.
