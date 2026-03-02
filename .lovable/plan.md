
Objetivo: corrigir o fluxo para que um único clique no botão WhatsApp (no Kanban SDR/Closer) já inicie gravação/transcrição sem novo clique na tela de atendimento, e eliminar os pedidos repetidos de compartilhamento de tela.

Diagnóstico confirmado no código atual:
1) Há duas instâncias diferentes do gravador na tela de atendimento (`Atendimento.tsx`):
- Instância A (quando `activeRecording` é false): recebe `autoStart`.
- Instância B (quando `activeRecording && coach`): fica dentro de `RealtimeCoachingPanel` via `callControls` e não recebe `autoStart`.
2) Quando a Instância A inicia, ela seta `activeRecording=true`; o componente troca de branch e desmonta a Instância A.
3) No unmount, o `cleanup()` do `WhatsAppCallRecorder` encerra streams e contexto de áudio, interrompendo a sessão recém-iniciada.
4) A Instância B aparece “idle”, forçando novo clique.
5) O pedido de compartilhamento múltiplo é amplificado por reinícios do fluxo + tentativa dupla de `getDisplayMedia` no mesmo start (com fallback que pode abrir novo prompt).

Plano de implementação

1) Tornar o gravador uma instância única e estável em `Atendimento.tsx`
- Refatorar o layout para não alternar entre dois `WhatsAppCallRecorder`.
- Manter o gravador sempre montado no mesmo ponto da árvore React (fora da troca `activeRecording ? ... : ...`).
- Quando estiver gravando, renderizar apenas o `RealtimeCoachingPanel` abaixo (sem injetar outra instância de gravador em `callControls`).
- Resultado esperado: o componente que iniciou a gravação não desmonta, então não ocorre reset de streams nem “segundo clique obrigatório”.

2) Blindar o `startWhatsAppCall` contra múltiplos disparos em `WhatsAppCallRecorder.tsx`
- Adicionar guardas de idempotência:
  - `isStartingRef` para bloquear reentrada enquanto permissões/boot estão em andamento.
  - checagem de estado para ignorar chamadas se já estiver em `recording`, `paused` ou `processing`.
- Ajustar `autoStart` para chamar start somente quando não houver start em progresso.
- Resultado esperado: clique manual adicional, re-render ou efeito duplicado não dispara novo fluxo de captura.

3) Reduzir prompts de compartilhamento para no máximo 1 por tentativa de start
- Simplificar a aquisição de display:
  - fazer uma única chamada de `getDisplayMedia` (config compatível), sem segunda chamada automática que reabre prompt.
  - se falhar/for negado, seguir em modo microfone (com aviso claro), sem reprompt automático.
- Manter a estratégia resiliente já existente (não quebrar a gravação quando o áudio de sistema não vier).
- Resultado esperado: parar de pedir compartilhamento 2–3x seguidas na mesma tentativa.

4) Preservar UX e segurança operacional
- Continuar abrindo `whatsapp://` após o delay já existente, mas sem reiniciar gravação por troca de componente.
- Manter `stopRef`, autosave parcial e processamento em background como estão.
- Não alterar backend nem políticas; problema é de ciclo de vida frontend.

Arquivos a alterar
1) `src/pages/Atendimento.tsx`
- Reestruturar renderização para uma única instância de:
  - `WhatsAppCallRecorder` (com `autoStart`)
  - ou `VoipDialer` (sem mudanças de comportamento)
- Remover uso de `callControls` com novo gravador dentro do `RealtimeCoachingPanel`.

2) `src/components/crm/WhatsAppCallRecorder.tsx`
- Adicionar guardas de start (`isStartingRef` + checagens de estado).
- Ajustar efeito de autoStart para respeitar trava de start.
- Simplificar fluxo de `getDisplayMedia` para evitar prompts duplicados na mesma tentativa.

Validação (fim a fim)
1) Abrir Kanban SDR, clicar uma vez em “WhatsApp”.
2) Confirmar permissões quando solicitado.
3) Verificar que:
- a gravação inicia sem clicar novamente na tela de atendimento;
- transcrição/cards (script, RECA, RALOCA, RADOVECA) carregam durante a mesma sessão;
- não há nova solicitação de compartilhamento em sequência na mesma tentativa.
4) Repetir no fluxo Closer.
5) Testar cenário de negação de compartilhamento:
- sistema deve seguir com microfone (quando possível) e sem loop de prompts.
6) Validar que botão “Finalizar” continua encerrando e processando normalmente.

Riscos e mitigação
- Risco: mudança de layout reduzir visibilidade dos controles durante coaching.
  - Mitigação: manter gravador em área fixa no topo do conteúdo para permanecer acessível.
- Risco: bloquear start indevidamente após erro.
  - Mitigação: garantir reset da trava (`isStartingRef=false`) em todos os caminhos de erro/finalização.

Resultado esperado após implementação
- Fluxo verdadeiramente “1 clique” do Kanban até gravação/transcrição.
- Sem necessidade de clicar “Ligar pelo WhatsApp” novamente na tela de atendimento.
- Fim dos prompts de compartilhamento repetidos em cascata.
