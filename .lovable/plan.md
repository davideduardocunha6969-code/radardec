

## Correção: Atendimento Inline no Power Dialer com Retry de Streams

### Resumo
Eliminar a segunda janela (`window.open`). Quando a chamada conectar, renderizar o coaching completo diretamente dentro de `AtendimentoAguardando`, passando os streams reais do Twilio ao `RealtimeCoachingPanel`. Incluir retry com até 5 tentativas para capturar streams.

### Alterações — `src/pages/AtendimentoAguardando.tsx` (único arquivo)

**1. Novos imports**
- `RealtimeCoachingPanel`, `AudioMonitorInfo`, `LabeledTranscript`
- `CoachingErrorBoundary`
- `GapsPanel`, `DataExtractorPanel`, `ValuesEstimationPanel`
- `useLeadDadosSync`
- `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent`
- `FileSearch`, `HelpCircle`, `Calculator`, `User`, `MapPin`, `FileText`
- Types: `RoboCoach`, `ScriptSdr`
- `getFieldValue`, `DadosExtrasMap`
- `logoEscritorio`

**2. Novos estados (topo do componente)**
```typescript
const [callStreams, setCallStreams] = useState<{ mic: MediaStream | null; remote: MediaStream | null }>({ mic: null, remote: null });
const [coach, setCoach] = useState<RoboCoach | null>(null);
const [script, setScript] = useState<ScriptSdr | null>(null);
const [leadData, setLeadData] = useState<any>(null);
const [transcriptChunks, setTranscriptChunks] = useState<LabeledTranscript[]>([]);
const [activePanel, setActivePanel] = useState<"extrator" | "lacunas" | "estimativa" | null>(null);
const leadDadosSync = useLeadDadosSync(leadData?.id ?? null);
```

**3. Remover** `showOpenButton`, `atendimentoUrl`, `atendimentoWindowRef` e o useEffect que preparava URL/botão (linhas 67-70 e 141-160)

**4. Captura de streams com retry** — dentro de `device.on("incoming")`, após `call.accept()`:
```typescript
const tryGetStreams = (attempt = 0) => {
  const localStream = (call as any).getLocalStream?.() ?? null;
  const remoteStream = (call as any).getRemoteStream?.() ?? null;
  if ((!localStream || !remoteStream) && attempt < 5) {
    setTimeout(() => tryGetStreams(attempt + 1), 500);
    return;
  }
  setCallStreams({ mic: localStream, remote: remoteStream });
};
setTimeout(() => tryGetStreams(), 500);
```

**5. Fetch coaching data** — novo `useEffect` quando `session.lead_atendido_id` é setado:
- Buscar lead de `crm_leads` (mesma query de Atendimento.tsx linha 134-138)
- Buscar funil via `crm_funis` usando `session.funil_id` e `session.papel`
- Setar `coach` e `script` (copiar lógica de Atendimento.tsx linhas 146-179)

**6. Substituir render `callActive`** (linhas 319-385) pelo layout completo:
- Header com logo, nome do lead, badge SDR/Closer, badge Power Dialer
- Barra de contexto do lead (dados_extras + resumo_caso)
- Barra de chamada: nome, timer, botões mute/hangup
- `RealtimeCoachingPanel` com `micStream={callStreams.mic}`, `systemStream={callStreams.remote}`, `coach`, `script`, `leadNome`, `leadContext`, `isRecording={true}`, `onTranscriptUpdate`
- Sidebar de ícones (Extrator, Lacunas, Estimativa) com painéis deslizantes — copiar estrutura de Atendimento.tsx linhas 357-416
- Mensagem "Conectando áudio..." enquanto `callStreams.mic` é null

### O que NÃO muda
- `RealtimeCoachingPanel` — zero alterações
- `Atendimento.tsx` — mantém como está (usado para discagem direta)
- Edge functions — nenhuma alteração
- Nenhuma migration

