import { useState, useEffect, useCallback } from "react";
import { Atendimento, useAtendimentosClosers } from "@/hooks/useAtendimentosClosers";
import { AtendimentoList } from "@/components/atendimentos/AtendimentoList";
import { AtendimentoDetail } from "@/components/atendimentos/AtendimentoDetail";
import { CallRecorder } from "@/components/atendimentos/CallRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone } from "lucide-react";

type ViewState = "list" | "new" | "detail";

export default function AtendimentosClosers() {
  const {
    atendimentos,
    isLoading,
    fetchAtendimentos,
    createAtendimento,
    updateAtendimento,
    uploadAudio,
    transcribeAudio,
    deleteAtendimento,
  } = useAtendimentosClosers();

  const [view, setView] = useState<ViewState>("list");
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [currentAtendimentoId, setCurrentAtendimentoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAtendimentos();
  }, [fetchAtendimentos]);

  const handleNewAtendimento = async () => {
    const id = await createAtendimento();
    if (id) {
      setCurrentAtendimentoId(id);
      setView("new");
    }
  };

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, durationSeconds: number) => {
    if (!currentAtendimentoId) return;

    setIsProcessing(true);

    try {
      // Upload audio
      const audioUrl = await uploadAudio(currentAtendimentoId, audioBlob);
      
      if (audioUrl) {
        await updateAtendimento(currentAtendimentoId, { 
          audio_url: audioUrl,
          duracao_segundos: durationSeconds,
        });
      }

      // Transcribe
      const success = await transcribeAudio(currentAtendimentoId, audioBlob);
      
      if (success) {
        await fetchAtendimentos();
        // Find the updated atendimento
        const updated = atendimentos.find(a => a.id === currentAtendimentoId);
        if (updated) {
          setSelectedAtendimento(updated);
          setView("detail");
        } else {
          setView("list");
        }
      }
    } finally {
      setIsProcessing(false);
      setCurrentAtendimentoId(null);
    }
  }, [currentAtendimentoId, uploadAudio, updateAtendimento, transcribeAudio, fetchAtendimentos, atendimentos]);

  const handleViewAtendimento = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setView("detail");
  };

  const handleBack = () => {
    setSelectedAtendimento(null);
    setCurrentAtendimentoId(null);
    setView("list");
    fetchAtendimentos();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Atendimentos</h1>
            <p className="text-sm text-muted-foreground">
              Grave e transcreva suas chamadas com clientes
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === "list" && (
        <AtendimentoList
          atendimentos={atendimentos}
          isLoading={isLoading}
          onNewAtendimento={handleNewAtendimento}
          onViewAtendimento={handleViewAtendimento}
          onDeleteAtendimento={deleteAtendimento}
        />
      )}

      {view === "new" && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Novo Atendimento</CardTitle>
              <CardDescription>
                Grave a chamada com seu cliente para transcrição automática
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CallRecorder
                onRecordingComplete={handleRecordingComplete}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {view === "detail" && selectedAtendimento && (
        <AtendimentoDetail
          atendimento={selectedAtendimento}
          onBack={handleBack}
          speakerNames={speakerNames}
        />
      )}
    </div>
  );
}
