

# Correção: Cards RECA/RALOCA ficam em "Aguardando análise..." sem gerar sugestões

## Causa raiz

Problema de **stale closure** no `RealtimeCoachingPanel.tsx`:

```text
1. Componente monta com coach=null
2. requestAnalysis é criado com coach=null -> retorna imediatamente (if (!coach) return)
3. addTranscript é criado referenciando esse requestAnalysis
4. useScribe() captura addTranscript no momento da criação (hooks não atualizam callbacks depois)
5. Scribe conecta, transcrição começa a chegar
6. coach chega (alguns segundos depois) -> requestAnalysis é RECRIADO com coach válido
7. addTranscript é RECRIADO com o novo requestAnalysis
8. MAS useScribe ainda usa o addTranscript ANTIGO (passo 3), que chama o requestAnalysis ANTIGO (passo 2)
9. Resultado: toda transcrição committed entra no requestAnalysis onde coach===null -> retorna sem fazer nada
10. Cards RECA/RALOCA nunca recebem sugestões
```

## Solução

Usar um **ref** para `requestAnalysis` para que o callback do `useScribe` sempre acesse a versão mais recente, independente de quando foi capturado.

### Arquivo: `src/components/crm/RealtimeCoachingPanel.tsx`

1. Criar um `requestAnalysisRef` que sempre aponta para a versao atual de `requestAnalysis`
2. Em `addTranscript`, chamar `requestAnalysisRef.current(...)` em vez de `requestAnalysis(...)` diretamente
3. Remover `requestAnalysis` das dependencias de `addTranscript` (pois agora acessa via ref)

```text
// Adicionar ref:
const requestAnalysisRef = useRef(requestAnalysis);
requestAnalysisRef.current = requestAnalysis;

// Em addTranscript, mudar:
requestAnalysis(buildFullTranscript());
// para:
requestAnalysisRef.current(buildFullTranscript());

// Atualizar deps de addTranscript:
[isHallucination, requestAnalysis, buildFullTranscript]
// para:
[isHallucination, buildFullTranscript, onTranscriptUpdate]
```

Isso garante que quando o `coach` chega e `requestAnalysis` é recriado com o coach valido, o ref aponta para a versao nova, e o `addTranscript` capturado pelo `useScribe` consegue acessar a versao correta via ref.

## Resultado esperado

- Transcrição inicia imediatamente (~1s) como antes
- Quando `coach` carrega (alguns segundos depois), a proxima fala committed dispara a analise real
- Cards RECA e RALOCA passam a receber sugestões da IA normalmente

