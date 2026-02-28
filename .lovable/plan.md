

# Fases 3 e 4 — Extrator de Dados + Lacunas (com ajustes)

## Correcoes aplicadas

1. **System prompt**: lido de `robos_coach.instrucoes_extrator` e `robos_coach.instrucoes_lacunas` (via `coachId`), NAO de `scripts_sdr`
2. **Retorno da IA**: JSON puro parseado com `JSON.parse()`, sem tool calling
3. **GapsPanel**: so chama `analyze-gaps` se houver >= 3 lacunas com `impacto_estimado > 0`

---

## Arquivos a criar

### 1. `supabase/functions/extract-lead-data/index.ts`

- Recebe: `{ leadId, coachId, transcript }`
- Busca `robos_coach.instrucoes_extrator` pelo `coachId` (usando service role)
- Busca `crm_lead_campos` para lista de campos validos (key, nome, tipo, descricao)
- Busca `crm_leads.dados_extras` atual para contexto
- Monta chamada ao Lovable AI Gateway (`google/gemini-2.5-flash`) com:
  - System: conteudo de `instrucoes_extrator`
  - User: transcricao + campos disponiveis + dados atuais
- Parseia resposta JSON pura (sem tool calling)
- Para cada campo extraido: verifica se `origem !== 'preenchimento_manual'` antes de gravar em `crm_leads.dados_extras`
- Retorna array de `{ key, valor, confianca }` para o frontend

### 2. `supabase/functions/analyze-gaps/index.ts`

- Recebe: `{ leadId, coachId, gaps }` onde `gaps` ja contem `impacto_estimado` calculado no frontend
- Busca `robos_coach.instrucoes_lacunas` pelo `coachId` (usando service role)
- Monta chamada ao Lovable AI Gateway (`google/gemini-2.5-flash`) com:
  - System: conteudo de `instrucoes_lacunas`
  - User: lista de lacunas com key, nome, impacto_estimado
- Parseia resposta JSON pura
- Retorna array com perguntas sugeridas e priorizacao

---

## Arquivos a modificar

### 3. `supabase/config.toml`

Adicionar:

```text
[functions.extract-lead-data]
verify_jwt = false

[functions.analyze-gaps]
verify_jwt = false
```

### 4. `src/components/crm/extrator/DataExtractorPanel.tsx` — reescrever

- Props: `leadId`, `coachId`, `transcriptChunks: LabeledTranscript[]`
- Usa `useLeadDadosSync(leadId)` para estado atual
- Rastreia ultimo chunk processado via `useRef`
- A cada novo chunk, chama `invoke('extract-lead-data', { leadId, coachId, transcript })`
- Grava campos de alta confianca via `setFields()` (respeitando manual)
- Exibe campos em 3 categorias:
  - Auto-preenchidos (verde, CheckCircle)
  - Revisao necessaria — confianca media/baixa (amarelo, AlertTriangle, botao Confirmar)
  - Manuais/bloqueados (cinza, Lock)
- Botao Confirmar promove campo para `preenchimento_manual`

### 5. `src/components/crm/lacunas/GapsPanel.tsx` — reescrever

- Props: `leadId`, `coachId`
- Usa `useLeadDadosSync(leadId)` + `useCrmLeadCampos()`
- Calcula lacunas localmente (campos sem valor)
- Chama `estimarImpactoCampo(campo, dados)` para cada lacuna
- Condicao de chamada: so invoca edge function se >= 3 lacunas com `impacto_estimado > 0`
- Debounce de 2s nas mudancas de dados
- Exibe lista ordenada por impacto decrescente:
  - Nome do campo, impacto (BRL formatado), pergunta sugerida pela IA
  - Badge de prioridade (Alta/Media/Baixa)
  - Botao copiar pergunta

### 6. `src/pages/Atendimento.tsx` — editar

- Adicionar state `transcriptChunks` e expor callback `onTranscriptChunk`
- O `RealtimeCoachingPanel` ja gerencia transcritos internamente — precisamos expor os chunks para fora
- Adicionar prop `onTranscriptUpdate` ao `RealtimeCoachingPanel` que emite `labeledTranscripts` sempre que muda
- Passar `coachId={coach.id}` e `transcriptChunks` ao `DataExtractorPanel`
- Passar `coachId={coach.id}` ao `GapsPanel`

### 7. `src/components/crm/RealtimeCoachingPanel.tsx` — editar

- Adicionar prop opcional `onTranscriptUpdate?: (transcripts: LabeledTranscript[]) => void`
- Chamar `onTranscriptUpdate` sempre que `labeledTranscripts` mudar (dentro do useEffect existente)
- Exportar tipo `LabeledTranscript` para uso externo

---

## Fluxo de dados

```text
ElevenLabs Scribe -> RealtimeCoachingPanel (transcricao)
  -> onTranscriptUpdate -> Atendimento.tsx (transcriptChunks state)
    -> DataExtractorPanel detecta novo chunk
      -> invoke('extract-lead-data', { leadId, coachId, transcript })
        -> Edge fn le instrucoes_extrator de robos_coach
        -> AI retorna JSON puro
        -> Edge fn grava no banco (respeitando manual)
      -> Panel atualiza via useLeadDadosSync

useLeadDadosSync.dados muda
  -> GapsPanel recalcula lacunas
  -> estimarImpactoCampo() para cada (motor TS local)
  -> filtro: >= 3 lacunas com impacto > 0
  -> debounce 2s
  -> invoke('analyze-gaps', { leadId, coachId, gaps })
    -> Edge fn le instrucoes_lacunas de robos_coach
    -> AI retorna JSON puro
  -> Panel exibe lista priorizada
```

## Modelo de IA

Ambas funcoes usam `google/gemini-2.5-flash` via Lovable AI Gateway. Retorno JSON puro (sem tool calling), parseado com `JSON.parse()` no backend.

