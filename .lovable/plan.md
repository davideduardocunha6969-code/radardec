

# Transcrever chamadas interrompidas automaticamente

## Situacao atual
Quando uma chamada e marcada como "interrompida" pelo cleanup, o audio parcial ja esta salvo no storage (o auto-save a cada 30s garante isso via `savePartialAudio`). Porem, ninguem dispara o processamento de transcricao para essas chamadas -- o `process-chamada-background` so e chamado no fluxo de finalizacao manual (`handleRecordingComplete`).

## Solucao

Modificar o `useCleanupOrphanedChamadas` em `src/hooks/useCrmChamadas.ts` para, apos marcar chamadas como "interrompida", verificar se possuem `audio_url` e, caso positivo, disparar o edge function `process-chamada-background` para cada uma delas.

### Alteracoes em `src/hooks/useCrmChamadas.ts`

1. No `cleanupOrphans`, apos o UPDATE, iterar sobre as chamadas retornadas
2. Para cada chamada com `audio_url`, buscar os dados necessarios (lead_id, lead nome, user nome) e chamar `supabase.functions.invoke("process-chamada-background")` em fire-and-forget
3. O select do update passara a retornar `id, audio_url, lead_id` em vez de apenas `id`

### Fluxo resultante

```text
1. Usuario fecha a aba durante uma chamada
2. Auto-save ja salvou o audio parcial no storage (a cada 30s)
3. Na proxima vez que o usuario abre o sistema:
   - useCleanupOrphanedChamadas detecta chamadas com status "em_chamada"/"iniciando" ha mais de 5min
   - Atualiza status para "interrompida"
   - Para cada chamada que tem audio_url, dispara process-chamada-background
   - O edge function transcreve o audio parcial e gera feedback normalmente
4. A transcricao parcial aparece no historico de contatos do lead
```

### Detalhes tecnicos

No `useCleanupOrphanedChamadas`:

```text
// Apos o update:
// 1. Buscar dados complementares para cada chamada com audio
// 2. Para cada uma, buscar lead_id -> nome do lead
// 3. Buscar profile do user -> display_name
// 4. Invocar process-chamada-background com os dados
```

O edge function `process-chamada-background` ja lida com a deteccao de chamada nao atendida (verifica se ha 2+ speakers na transcricao). Se o audio parcial tiver apenas o operador falando, o status final sera "nao_atendida" e nao havera feedback IA -- comportamento correto.

### Arquivos afetados
- **`src/hooks/useCrmChamadas.ts`**: Modificar `useCleanupOrphanedChamadas` para disparar transcricao das chamadas interrompidas que possuem audio

Nenhuma alteracao no edge function e necessaria -- ele ja suporta esse fluxo.

