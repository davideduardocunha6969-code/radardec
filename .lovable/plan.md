

# Janela de Atendimento Independente para SDR/Closer

## Problema
Quando o SDR sai da tela do lead durante uma chamada, os componentes de gravacao e coaching sao desmontados pelo React, encerrando a gravacao e a conexao com o Scribe. Porem o banco de dados ainda mostra a chamada "em andamento".

## Solucao
Criar uma pagina dedicada de atendimento (`/atendimento`) que abre em uma **nova janela do navegador** quando o SDR clica em "Ligar WhatsApp" ou "Ligar VoIP". Essa janela independente mantem a gravacao, coaching e transcricao vivos enquanto o SDR navega livremente na janela principal.

## Como vai funcionar para o SDR

1. O SDR clica no botao de ligar (WhatsApp ou VoIP) no card do lead
2. Uma nova janela abre com a interface de atendimento completa
3. Nessa janela aparecem: dados do lead, controles de gravacao, cards do coach em tempo real, e transcricao
4. O SDR pode voltar para a janela principal e navegar normalmente sem perder a chamada
5. Ao encerrar a chamada na janela de atendimento, o processamento (transcricao, feedback) acontece normalmente

## Detalhes Tecnicos

### 1. Nova pagina: `src/pages/Atendimento.tsx`
- Rota: `/atendimento?leadId=xxx&numero=yyy&tipo=whatsapp|voip&funilId=zzz`
- Busca os dados do lead, coluna e coach diretamente do banco
- Renderiza o `WhatsAppCallRecorder` ou `VoipDialer` conforme o parametro `tipo`
- Renderiza o `RealtimeCoachingPanel` com o coach configurado na coluna
- Layout limpo e focado (sem sidebar, sem menu), apenas o header com nome do lead e indicador de gravacao
- Inclui info do lead (nome, telefone, resumo do caso) em formato compacto no topo

### 2. Rota no `App.tsx`
- Adicionar rota `/atendimento` como rota protegida, porem **fora do MainLayout** (sem sidebar/menu) para maximizar espaco
- A autenticacao funciona automaticamente pois a sessao e compartilhada via localStorage entre janelas do mesmo dominio

### 3. Alteracao nos botoes de ligar em `CrmFunilKanban.tsx`
- Ao inves de iniciar a gravacao inline, os botoes `WhatsAppCallRecorder` e `VoipDialer` passam a abrir a nova janela via `window.open()`
- Os componentes atuais serao adaptados: na pagina do Kanban, o botao apenas abre a janela; na pagina de Atendimento, o componente funciona normalmente com gravacao
- Para o WhatsApp, o link `whatsapp://send` sera aberto a partir da janela de atendimento

### 4. Correcao do erro do Scribe
- O log mostra `"Either microphone options or (audioFormat + sampleRate) must be provided"` no `scribe.connect()`
- Sera corrigido passando `audioFormat: "pcm_16000"` e `sampleRate: 16000` na chamada `scribe.connect()`, conforme documentado na memoria do projeto

### 5. Correcao do warning de ref no ChecklistCard
- O warning `"Function components cannot be given refs"` sera resolvido adicionando `React.forwardRef` ao componente `ChecklistCard`

### Arquivos a criar
- `src/pages/Atendimento.tsx` — pagina completa de atendimento em janela separada

### Arquivos a modificar
- `src/App.tsx` — adicionar rota `/atendimento` fora do MainLayout
- `src/pages/CrmFunilKanban.tsx` — botoes de ligar abrem `window.open()` ao inves de iniciar inline
- `src/components/crm/RealtimeCoachingPanel.tsx` — corrigir `scribe.connect()` com audioFormat/sampleRate
- `src/components/crm/coaching/ChecklistCard.tsx` — adicionar forwardRef

