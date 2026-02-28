

# Fix: Extrator nao recebe transcricao em tempo real

## Causa raiz

Em `Atendimento.tsx`, existem **duas instancias** do `RealtimeCoachingPanel`:

1. Linha 274: `topBarOnly` -- tem `onTranscriptUpdate` (deveria alimentar o Extrator)
2. Linha 317: `bottomOnly` -- **NAO** tem `onTranscriptUpdate`

O problema: ambas as instancias executam toda a logica interna -- conectam ao ElevenLabs Scribe, criam `AudioContext`, pipam os mesmos `micStream`/`systemStream`. Isso gera **4 conexoes Scribe** e **4 AudioContexts** disputando os mesmos streams de audio.

O resultado provavel: o `bottomOnly` (sem `onTranscriptUpdate`) consegue capturar o audio e mostrar a transcricao na tela (pois `topBarOnly` renderiza o top bar e `bottomOnly` renderiza os cards abaixo). Mas a instancia `topBarOnly`, que e a unica que chama `onTranscriptUpdate`, pode nao estar recebendo audio porque o stream ja foi consumido pela outra instancia. Assim, `transcriptChunks` no `Atendimento.tsx` permanece vazio, e o Extrator nunca dispara.

## Solucao

Transformar o `RealtimeCoachingPanel` para que a logica pesada (Scribe, audio, analise) rode **apenas uma vez**, e o segundo render (bottomOnly) receba os dados via props em vez de duplicar conexoes.

### Mudanca 1: `RealtimeCoachingPanel.tsx` -- Skip logica quando `bottomOnly`

Adicionar um guard no inicio do componente: se `bottomOnly === true`, pular toda a logica de conexao Scribe, piping de audio e analise. A instancia `bottomOnly` deve receber os dados de coaching (objections, recaItems, ralocaItems, etc.) via props ou contexto.

Na pratica, a forma mais simples e:
- No `useEffect` que conecta ao Scribe (linha 478), adicionar `if (bottomOnly) return;` no inicio
- No `useEffect` que faz pipe de audio (onde chama `pipeStreamToScribe`), adicionar `if (bottomOnly) return;`
- Na funcao `requestAnalysis`, adicionar `if (bottomOnly) return;` no inicio

Porem, isso faz com que o `bottomOnly` nao tenha dados de coaching (objections, recaItems, etc). A solucao completa requer elevar o estado de coaching para o `Atendimento.tsx`.

### Mudanca 2: Elevar o estado de transcricao e coaching

Refatorar para que `Atendimento.tsx` tenha uma unica instancia de `RealtimeCoachingPanel` (nao duas), e esse componente renderize tanto o top bar quanto os cards inferiores na mesma arvore.

Concretamente:
- Remover a segunda instancia `RealtimeCoachingPanel` (bottomOnly, linhas 314-329)
- Na primeira instancia (topBarOnly, linhas 271-287), remover a prop `topBarOnly` para que ela renderize TUDO (top bar + cards)
- Ajustar o layout para que o top bar fique na parte superior e os cards na parte inferior, dentro de uma unica instancia

### Mudanca 3: Layout ajustado em `Atendimento.tsx`

```text
Antes:
  <div> (top row)
    {activeRecording && coach && <RealtimeCoachingPanel topBarOnly onTranscriptUpdate={...} />}
    <WhatsAppCallRecorder />
  </div>
  {activeRecording && coach && <RealtimeCoachingPanel bottomOnly />}

Depois:
  {activeRecording && coach && (
    <CoachingErrorBoundary>
      <RealtimeCoachingPanel
        coach={coach}
        ... todas as props ...
        onTranscriptUpdate={handleTranscriptUpdate}
        callControls={<WhatsAppCallRecorder ... />}
      />
    </CoachingErrorBoundary>
  )}
```

Ou, alternativamente, manter o layout atual mas **passar o slot de call controls como children/render prop** para que so exista uma instancia do componente.

### Abordagem mais simples (preferida)

Em vez de refatorar o layout inteiro, a correcao minima e:

1. No `RealtimeCoachingPanel`, adicionar `if (bottomOnly) return;` nos useEffects de Scribe e pipe de audio
2. Passar os dados de coaching do `topBarOnly` para o `bottomOnly` via estado elevado no `Atendimento.tsx`

Isso requer:
- Adicionar um callback `onCoachingUpdate` no `RealtimeCoachingPanel` que exporta `{ objections, recaItems, ralocaItems, radarValues, ... }`
- No `Atendimento.tsx`, armazenar esses dados em estado e passa-los como props para o segundo `RealtimeCoachingPanel` (bottomOnly)
- No `bottomOnly`, usar os dados recebidos via props em vez de gerar internamente

### Mudancas em arquivos

**`src/components/crm/RealtimeCoachingPanel.tsx`**:
- Adicionar props opcionais para receber dados de coaching externamente (para o caso `bottomOnly`)
- Nos `useEffect` de Scribe e pipe de audio, adicionar guard `if (bottomOnly) return;`
- Adicionar callback `onCoachingUpdate` que emite o estado de coaching para o pai
- Quando `bottomOnly` e as props externas estao presentes, usar os dados das props

**`src/pages/Atendimento.tsx`**:
- Adicionar estado para dados de coaching (`coachingData`)
- Passar `onCoachingUpdate` para a instancia `topBarOnly`
- Passar os dados de coaching como props para a instancia `bottomOnly`
- Garantir que `onTranscriptUpdate` so existe na instancia que roda o Scribe

## Resultado esperado

- Apenas 2 conexoes Scribe (SDR + Lead) em vez de 4
- Audio piped corretamente sem conflito entre AudioContexts
- `onTranscriptUpdate` recebe transcricoes de forma confiavel
- `transcriptChunks` popula corretamente no `Atendimento.tsx`
- `DataExtractorPanel` recebe os chunks e chama a Edge Function `extract-lead-data`
- Campos sao extraidos e exibidos em tempo real no painel do Extrator
