

# Corrigir latência da transcrição — desacoplar Scribe do carregamento de coach

## Problema

Na linha 301 de `Atendimento.tsx`:
```
{coach ? <RealtimeCoachingPanel coach={coach} ... /> : <Card>Carregando...</Card>}
```

O painel só monta quando `coach` é carregado (3 queries sequenciais: lead -> funil -> robos_coach). Enquanto isso, a conexão ElevenLabs Scribe NÃO inicia, causando latência de vários segundos.

A conexão Scribe (linhas 481-535 do `RealtimeCoachingPanel`) depende apenas de `isRecording` — não usa `coach`. Mas o componente inteiro não existe na árvore React até `coach` chegar.

## Solução

Duas mudanças simples:

### 1. `src/components/crm/RealtimeCoachingPanel.tsx`
- Alterar a prop `coach` de `RoboCoach` para `RoboCoach | null` na interface
- Na função `requestAnalysis`, adicionar `if (!coach) return;` no início (análise de coaching espera, transcrição não)
- Nos trechos de UI que usam `coach.instrucoes`, `coach.nome`, etc., adicionar verificação de null

### 2. `src/pages/Atendimento.tsx`
- Remover o ternário `coach ? <Panel> : <Loading>` (linhas 301-318)
- Sempre renderizar `<RealtimeCoachingPanel>` quando `activeRecording` é true, passando `coach` (que pode ser null inicialmente)

```tsx
{activeRecording && (
  <CoachingErrorBoundary>
    <RealtimeCoachingPanel
      coach={coach}           // pode ser null nos primeiros segundos
      leadNome={lead?.nome || ""}
      ...
    />
  </CoachingErrorBoundary>
)}
```

## Resultado esperado

- Scribe conecta imediatamente quando a gravação inicia (~1s de latência como antes)
- Cards de coaching aparecem assim que `coach` chega (alguns segundos depois)
- Transcrição ao vivo funciona independentemente do carregamento de dados
