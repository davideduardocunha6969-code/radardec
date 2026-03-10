

## Diagnóstico: Transcrições de chamadas VoIP não aparecem no card do lead

### Evidência do banco de dados
Todas as chamadas VoIP (`canal: voip`) têm:
- `recording_url: NULL` — nenhuma gravação foi salva
- `audio_url: NULL` — nenhum áudio no storage
- `transcricao: NULL` — sem transcrição
- `duracao_segundos: 0` — duração zerada

Chamadas WhatsApp do mesmo período têm áudio + transcrição funcionando normalmente.

### Causa raiz (2 problemas)

**Problema 1: Stale closure no `duration`**
No `VoipDialer.tsx`, o handler `disconnect` captura a variável `duration` no momento em que a closure é criada (dentro de `startCall`), quando `duration = 0`. Assim, `duracao_segundos` é sempre salvo como 0.

**Problema 2: Gravação nunca é processada**
O fluxo de gravação depende do callback do Twilio (`RecordingStatusCallback`) para o webhook. O webhook baixa o áudio, salva no storage e dispara a transcrição. Porém:
- A resposta do `start-recording` não é verificada (pode falhar silenciosamente)
- O `process-chamada-background` e `feedback-chamada` NÃO estão no `config.toml`, então têm `verify_jwt = true` — chamadas internas com service_role key DEVEM funcionar, mas para robustez devem estar explícitos
- Não há fallback se o callback do Twilio nunca chegar

### Plano de correção

**1. Corrigir stale closure do `duration` (`VoipDialer.tsx`)**
Usar um `ref` para rastrear a duração, garantindo que o handler `disconnect` sempre tenha o valor atual.

**2. Verificar resposta do `start-recording` (`VoipDialer.tsx`)**
Checar se a resposta do `start-recording` foi bem-sucedida e logar erros detalhados.

**3. Adicionar funções ao `config.toml`**
Incluir `process-chamada-background` e `feedback-chamada` com `verify_jwt = false` para eliminar riscos de JWT.

**4. Adicionar fallback de transcrição no `disconnect` (`VoipDialer.tsx`)**
Quando a chamada desconecta, se houver `callSid` e duração > 0, aguardar alguns segundos e verificar se a gravação foi processada. Caso não tenha sido, disparar `process-chamada-background` diretamente pelo cliente usando o áudio do Twilio como fallback.

### Arquivos a modificar
- `src/components/crm/VoipDialer.tsx` — fix stale closure, verificar resposta start-recording, fallback de transcrição
- `supabase/config.toml` — adicionar `process-chamada-background` e `feedback-chamada`

