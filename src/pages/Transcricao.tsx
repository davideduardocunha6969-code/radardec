import { useState, useEffect, useCallback } from "react";
import { Mic, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { VideoUploader } from "@/components/transcricao/VideoUploader";
import { TranscricaoViewer } from "@/components/transcricao/TranscricaoViewer";
import { TranscricaoList } from "@/components/transcricao/TranscricaoList";
import { SpeakerIdentificationStep } from "@/components/transcricao/SpeakerIdentificationStep";
import { useTranscricao, Transcricao } from "@/hooks/useTranscricao";

export default function TranscricaoPage() {
  const {
    transcricoes,
    isLoading,
    progress,
    fetchTranscricoes,
    transcreverAudio,
    deleteTranscricao,
  } = useTranscricao();

  const [titulo, setTitulo] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedTranscricao, setSelectedTranscricao] =
    useState<Transcricao | null>(null);
  const [view, setView] = useState<"list" | "new" | "identify" | "detail">("list");
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTranscricoes();
  }, [fetchTranscricoes]);

  const handleVideoSelected = useCallback((file: File) => {
    setSelectedVideo(file);
    // Auto-fill title from filename
    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
    setTitulo(nameWithoutExtension);
  }, []);

  const handleAudioExtracted = useCallback(
    async (audioBlob: Blob, fileName: string) => {
      if (!titulo.trim()) {
        return;
      }

      const result = await transcreverAudio(audioBlob, titulo, fileName);

      if (result) {
        setSelectedTranscricao(result);
        // Check if there are multiple speakers to identify
        const uniqueSpeakers = [...new Set(result.segmentos.map((s) => s.falante))];
        if (uniqueSpeakers.length > 1) {
          setView("identify");
        } else {
          // Single speaker, go directly to detail
          setSpeakerNames({});
          setView("detail");
        }
        setTitulo("");
        setSelectedVideo(null);
        fetchTranscricoes();
      }
    },
    [titulo, transcreverAudio, fetchTranscricoes]
  );

  const handleSelectTranscricao = useCallback((transcricao: Transcricao) => {
    setSelectedTranscricao(transcricao);
    // Check if there are multiple speakers that need identification
    const uniqueSpeakers = [...new Set(transcricao.segmentos.map((s) => s.falante))];
    if (uniqueSpeakers.length > 1) {
      setView("identify");
    } else {
      setSpeakerNames({});
      setView("detail");
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTranscricao(id);
      if (selectedTranscricao?.id === id) {
        setSelectedTranscricao(null);
        setView("list");
      }
    },
    [deleteTranscricao, selectedTranscricao]
  );

  const handleBack = useCallback(() => {
    if (view === "detail" && selectedTranscricao) {
      // Go back to identification step
      const uniqueSpeakers = [...new Set(selectedTranscricao.segmentos.map((s) => s.falante))];
      if (uniqueSpeakers.length > 1) {
        setView("identify");
        return;
      }
    }
    setView("list");
    setSelectedTranscricao(null);
    setSpeakerNames({});
    setTitulo("");
    setSelectedVideo(null);
  }, [view, selectedTranscricao]);

  const handleSpeakerIdentificationComplete = useCallback((names: Record<string, string>) => {
    setSpeakerNames(names);
    setView("detail");
  }, []);

  const handleBackToList = useCallback(() => {
    setView("list");
    setSelectedTranscricao(null);
    setSpeakerNames({});
    setTitulo("");
    setSelectedVideo(null);
  }, []);

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== "list" && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Transcritor de Audiências</h1>
          </div>
        </div>
        {view === "list" && (
          <Button onClick={() => setView("new")}>Nova Transcrição</Button>
        )}
      </div>

      {/* Content based on view */}
      {view === "list" && (
        <TranscricaoList
          transcricoes={transcricoes}
          onSelect={handleSelectTranscricao}
          onDelete={handleDelete}
          isLoading={false}
        />
      )}

      {view === "new" && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Transcrição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="titulo">Título da Transcrição</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Audiência de Conciliação - Processo 123456"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <VideoUploader
              onVideoSelected={handleVideoSelected}
              onAudioExtracted={handleAudioExtracted}
              isProcessing={isLoading}
            />

            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processando transcrição...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">
                  Isso pode levar alguns minutos dependendo do tamanho do
                  arquivo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {view === "identify" && selectedTranscricao && (
        <SpeakerIdentificationStep
          segmentos={selectedTranscricao.segmentos}
          onComplete={handleSpeakerIdentificationComplete}
          onBack={handleBackToList}
        />
      )}

      {view === "detail" && selectedTranscricao && (
        <TranscricaoViewer
          segmentos={selectedTranscricao.segmentos}
          textoCompleto={selectedTranscricao.texto_completo || ""}
          titulo={selectedTranscricao.titulo}
          duracaoSegundos={selectedTranscricao.duracao_segundos || undefined}
          speakerNames={speakerNames}
        />
        )}
      </div>
    </div>
  );
}
