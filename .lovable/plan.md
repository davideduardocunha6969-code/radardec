
# Correção: prompt de tela duplicado e latência na transcrição

## Diagnóstico

### Problema 1: Compartilhamento de tela pedido 2 vezes

A causa raiz está em `Atendimento.tsx`, no efeito de `fetchData` (linha 105):

```text
1. Auth resolve -> isAuthenticated=true -> WhatsAppCallRecorder monta com autoStart
2. autoStart dispara startWhatsAppCall() -> pede compartilhamento de tela (prompt 1)
3. fetchData inicia -> setLoading(true) -> tela de loading renderiza -> WhatsAppCallRecorder DESMONTA
4. Desmontagem reseta todos os refs (autoStartedRef, isStartingRef) e executa cleanup() que mata os streams
5. fetchData termina -> setLoading(false) -> lead existe -> WhatsAppCallRecorder monta DE NOVO
6. autoStart dispara novamente (ref resetou) -> pede compartilhamento de tela (prompt 2)
```

O ciclo `loading=true -> loading=false` destrói e recria o componente, perdendo os refs de proteção contra chamada duplicada.

### Problema 2: Latência alta na transcrição

O mesmo ciclo de montagem/desmontagem afeta o `RealtimeCoachingPanel`:
- Na primeira montagem, ele conecta ao ElevenLabs Scribe (busca tokens, abre WebSocket)
- Quando `loading=true`, o painel desmonta e desconecta
- Quando remonta, precisa reconectar do zero (novo token, novo WebSocket)
- Cada reconexão adiciona 2-4 segundos de latência antes de iniciar a transcrição
- A reconstrução dos pipelines de audio (`pipeStreamToScribe`) tambem adiciona overhead

Além disso, como os streams de audio foram destruidos pelo cleanup do gravador (no desmonte), os novos pipelines de audio podem estar operando com streams mortas ou recém-criadas, causando perda de dados e atrasos.

## Solução

### Arquivo 1: `src/pages/Atendimento.tsx`

**Mudança principal:** Não renderizar o spinner de loading de forma que desmonte o gravador. Em vez de trocar toda a arvore de componentes entre "loading" e "conteudo", manter o gravador e o coaching panel sempre montados (quando o leadId existe), e mostrar loading apenas na area de dados do lead.

Concretamente:
- Remover o early return `if (loading) return <Spinner />` (linha 199-205)
- Remover o early return `if (!lead) return <mensagem>` (linha 207-213)
- Mover esses estados para dentro do layout principal, mostrando loading/erro apenas no conteudo do lead (header, context bar), sem afetar a area do gravador
- O gravador e o coaching panel ficam montados desde que `authChecked && isAuthenticated && leadId` existam
- Passar o `numero` da URL diretamente ao gravador (já disponivel via searchParams, não depende de `lead`)

Isso elimina a desmontagem e garante que:
- `autoStartedRef` persiste -> sem segundo prompt de compartilhamento
- Streams de audio permanecem vivas
- Conexões Scribe permanecem ativas
- Transcrição começa sem delay de reconexão

### Arquivo 2: `src/components/crm/WhatsAppCallRecorder.tsx`

**Mudanca de seguranca adicional:** Mover a guarda de `autoStartedRef` para FORA do setTimeout, e adicionar uma segunda verificacao dentro do timeout para garantir que mesmo em cenarios de re-render rapido, `startWhatsAppCall` nao seja chamada duas vezes.

```text
useEffect(() => {
  if (autoStart && !autoStartedRef.current && status === "idle" && numero && !isStartingRef.current) {
    autoStartedRef.current = true;
    const timer = setTimeout(() => {
      // Double-check: component may have been restarted
      if (!isStartingRef.current) {
        startWhatsAppCall();
      }
    }, 500);
    return () => clearTimeout(timer);
  }
}, [autoStart, status, numero]);
```

## Resultado esperado

- Compartilhamento de tela pedido apenas 1 vez
- Transcrição inicia com latência baixa (~1s) como antes, pois a conexão Scribe não é interrompida
- Streams de audio permanecem estaveis durante todo o atendimento
- Gravador e coaching panel nao sofrem ciclos de desmontagem desnecessarios
