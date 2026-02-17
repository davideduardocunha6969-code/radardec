

# CRM Outbound - Plataforma Completa de Prospecao Ativa

## Visao Geral

Sistema completo de CRM Outbound com funis personalizaveis, discador inteligente com ligacoes simultaneas (power dialer), analise de chamadas em tempo real por IA com sugestoes de quebra de objecoes, scripts de atendimento e agenda de Closers com controle de conflitos.

## Fase 1 - Estrutura Base do CRM e Funis

### Banco de Dados

Tabelas a serem criadas:

**crm_funis** - Funis por area de atuacao
- id, nome, area_atuacao (previdenciario, civel, trabalhista), tipo_acao, descricao, user_id, created_at, updated_at

**crm_colunas** - Colunas do Kanban de cada funil
- id, funil_id (FK crm_funis), nome, cor, ordem, created_at

**crm_leads** - Leads potenciais
- id, funil_id (FK crm_funis), coluna_id (FK crm_colunas), nome, endereco, telefones (jsonb - array de objetos com numero e tipo), resumo_caso (text, preenchido pela IA), dados_extras (jsonb), ordem, user_id, created_at, updated_at

### Frontend

- Nova secao "CRM Outbound" no sidebar, dentro do grupo Comercial
- Pagina principal com lista de funis (cards com area de atuacao e contagem de leads)
- Tela de Kanban por funil com colunas arrastaveis (drag-and-drop)
- Card de lead no kanban com nome, telefone principal e botao de telefone
- Dialog de detalhe do lead com todas as informacoes
- Funcionalidade de upload de lista de clientes via CSV/Excel com mapeamento de colunas

---

## Fase 2 - Integracao VoIP com Twilio

### Pre-requisito

Conta Twilio com numero brasileiro e credenciais (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_PHONE_NUMBER).

### Banco de Dados

**crm_chamadas** - Registro de ligacoes
- id, lead_id (FK crm_leads), user_id, twilio_call_sid, numero_discado, status (ringing, in-progress, completed, failed, no-answer, busy), duracao_segundos, recording_url, audio_url (storage), transcricao (text), resumo_ia (text), created_at, updated_at

### Edge Functions

- **twilio-token**: Gera Access Token JWT para o SDK do navegador
- **twilio-twiml**: Retorna instrucoes XML para a chamada com gravacao ativada
- **twilio-webhook**: Recebe callbacks de status, processa gravacoes e dispara transcricao

### Frontend

- Componente VoipDialer embutido no card do lead
- Botao de telefone no card que inicia a chamada via WebRTC (SDK @twilio/voice-sdk)
- Indicador de status da chamada (discando, em chamada, encerrada)
- Timer de duracao
- Controles: mudo, desligar
- Ao finalizar: gravacao e transcrita automaticamente e resumo salvo no card

---

## Fase 3 - Power Dialer (Ligacoes Simultaneas)

### Logica

Botao no topo de cada coluna do Kanban que inicia o "Power Dialer":

1. O sistema seleciona N leads da coluna que ainda nao foram contatados (configuravel, ex: 5 simultaneas)
2. Inicia ligacoes paralelas via Twilio para todos
3. A primeira ligacao atendida (status "in-progress") e conectada ao operador
4. As demais ligacoes sao canceladas imediatamente via API do Twilio
5. O card do lead que atendeu abre automaticamente na tela
6. Os leads que nao atenderam sao marcados com status "nao atendeu" no historico

### Edge Functions

- **twilio-power-dialer**: Inicia multiplas chamadas simultaneas, monitora status e cancela as nao atendidas quando uma e conectada
- **twilio-cancel-calls**: Cancela chamadas em andamento

### Frontend

- Botao "Discar Coluna" no header de cada coluna
- Dialog de configuracao (quantas ligacoes simultaneas, filtros)
- Indicador visual de quais leads estao sendo discados
- Auto-abertura do card do lead quando atendido

---

## Fase 4 - Scripts de Atendimento e Treinamento da IA

### Banco de Dados

**crm_scripts** - Scripts/fluxos de atendimento por tipo de produto
- id, nome, tipo_produto (previdenciario, civel, trabalhista, etc), etapas (jsonb - array ordenado de passos do script), instrucoes_ia (text - prompt de analise), razoes_emocionais (text), razoes_logicas (text), instrucoes_objecoes (text - como quebrar objecoes), user_id, created_at, updated_at

### Frontend

- Pagina de gestao de Scripts dentro do CRM Outbound
- Editor de fluxo com etapas do script (passo a passo para o SDR)
- Campos para razoes emocionais e logicas de contratacao
- Campo para instrucoes de quebra de objecoes
- Vinculacao do script ao funil/tipo de acao

---

## Fase 5 - IA em Tempo Real Durante a Chamada

### Arquitetura

Utiliza o ElevenLabs Scribe (Realtime STT) para transcrever a chamada em tempo real, e o Lovable AI Gateway para analisar trechos da conversa e gerar sugestoes.

### Edge Functions

- **crm-analyze-call-realtime**: Recebe trechos da transcricao em tempo real + script + instrucoes de objecoes, e retorna sugestoes para o SDR em streaming

### Frontend

- Painel lateral que aparece durante a chamada com:
  - Script do atendimento (passo a passo) com indicador de etapa atual
  - Area de sugestoes da IA que atualiza em tempo real conforme a conversa avanca
  - Transcricao ao vivo da chamada
- A cada X segundos (ou a cada pausa na conversa), o trecho mais recente e enviado para a IA analisar
- A IA retorna sugestoes de como responder, quebrar objecoes, argumentos emocionais e logicos
- As sugestoes aparecem como cards destacados na tela

### Fluxo Tecnico

1. Chamada conectada via Twilio WebRTC
2. Audio capturado no navegador e enviado ao ElevenLabs Scribe (realtime STT)
3. Transcricao parcial exibida em tempo real na tela
4. A cada trecho commitado (via VAD), o texto e enviado ao backend
5. O backend injeta o contexto (script + razoes + instrucoes de objecoes) e envia ao Lovable AI
6. A resposta em streaming e exibida como sugestao na tela do SDR

---

## Fase 6 - Agenda de Closers

### Banco de Dados

**crm_closers** - Closers disponiveis
- id, user_id (FK profiles), nome, ativo, created_at

**crm_agendamentos** - Agenda dos closers
- id, closer_id (FK crm_closers), lead_id (FK crm_leads), chamada_id (FK crm_chamadas, nullable), data_hora_inicio (timestamptz), data_hora_fim (timestamptz), observacoes (text), status (agendado, realizado, cancelado, no-show), user_id, created_at, updated_at
- Constraint UNIQUE via trigger: nao permitir sobreposicao de horarios para o mesmo closer

### Frontend

- Dentro do card do lead (durante ou apos a chamada): botao "Agendar com Closer"
- Seletor de Closer disponivel
- Calendario com horarios disponiveis (mostra apenas slots livres)
- Ao agendar, o sistema valida que nao ha conflito de horario
- Pagina de Agenda dos Closers com visao de calendario semanal/diario
- Indicadores visuais de slots ocupados vs disponiveis

---

## Resumo da Navegacao

```text
Comercial (sidebar)
  |-- Atendimentos (existente)
  |-- CRM Outbound (novo)
       |-- Funis (lista de funis)
       |-- Scripts (gestao de scripts)
       |-- Agenda Closers (calendario)
```

## Ordem de Implementacao Sugerida

Devido a complexidade, recomendo implementar em etapas:

1. **Fase 1** - CRM base com funis, colunas, leads e upload de lista (funcional sem VoIP)
2. **Fase 2** - VoIP individual (ligar do card do lead)
3. **Fase 4** - Scripts de atendimento (nao depende de VoIP para cadastrar)
4. **Fase 6** - Agenda de Closers (nao depende de VoIP)
5. **Fase 3** - Power Dialer (depende da Fase 2)
6. **Fase 5** - IA em tempo real (depende das Fases 2 e 4)

## Consideracoes Importantes

- **Twilio**: Sera necessario criar uma conta e configurar as credenciais. Chamadas para celulares brasileiros custam aproximadamente US$0.15/min
- **ElevenLabs Scribe**: Ja configurado no projeto (ELEVENLABS_API_KEY existente), sera usado para transcricao em tempo real
- **Lovable AI**: Ja configurado (LOVABLE_API_KEY existente), sera usado para analise de objecoes e sugestoes em tempo real
- **Custo estimado por chamada**: ~US$0.15/min (Twilio) + custo de transcricao (ElevenLabs) + custo de analise IA (Lovable AI)
- **Total de tabelas novas**: 7 tabelas (crm_funis, crm_colunas, crm_leads, crm_chamadas, crm_scripts, crm_closers, crm_agendamentos)
- **Total de edge functions novas**: 5 funcoes (twilio-token, twilio-twiml, twilio-webhook, twilio-power-dialer, crm-analyze-call-realtime)

