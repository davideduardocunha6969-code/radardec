
# Auto-iniciar gravação WhatsApp ao abrir janela de atendimento

## Problema

Ao clicar no botão verde "WhatsApp" no Kanban (SDR ou Closer), a janela de atendimento abre mas o gravador fica parado no estado "idle". O usuário precisa clicar novamente no botão de gravar dentro da janela, e depois mais uma vez para de fato iniciar. Deveria ser um único clique.

## Solução

Passar um parâmetro `autoStart=true` na URL do atendimento, e fazer o `WhatsAppCallRecorder` iniciar automaticamente quando esse parâmetro estiver presente.

## Arquivos a modificar

### 1. `src/pages/CrmFunilKanban.tsx`
- Adicionar `&autoStart=true` nas URLs de abertura da janela de atendimento WhatsApp (tanto no bloco SDR ~linha 562 quanto no bloco Closer ~linha 643).

### 2. `src/pages/Atendimento.tsx`
- Ler o parâmetro `autoStart` dos searchParams.
- Passar `autoStart={true}` como prop para o `WhatsAppCallRecorder`.

### 3. `src/components/crm/WhatsAppCallRecorder.tsx`
- Adicionar prop `autoStart?: boolean` na interface.
- Adicionar um `useEffect` que chama `startWhatsAppCall()` automaticamente quando `autoStart` for true e o componente estiver montado (com status "idle").
- Garantir que o efeito roda apenas uma vez (ref de controle).

## Fluxo resultante

1. Usuário clica no botão verde "WhatsApp" no Kanban
2. Janela de atendimento abre com `autoStart=true` na URL
3. Componente monta, detecta `autoStart`, dispara `startWhatsAppCall()` automaticamente
4. Microfone é solicitado, gravação inicia, WhatsApp abre -- tudo em um único clique

## Detalhes técnicos

- O `startWhatsAppCall` já solicita permissão de microfone, inicia gravação e abre o WhatsApp ao final. Basta invocá-lo automaticamente.
- Usar um `useRef(false)` para garantir que o auto-start só executa uma vez, mesmo com re-renders do React.
- O `autoStart` só se aplica ao tipo "whatsapp" (o VoIP já tem fluxo próprio).
