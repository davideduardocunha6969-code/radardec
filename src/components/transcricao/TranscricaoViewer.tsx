import { useState, useRef, useEffect } from "react";
import { Play, Pause, Copy, Download, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Segmento } from "@/hooks/useTranscricao";
import { cn } from "@/lib/utils";
import { AiAnalysisSection } from "./AiAnalysisSection";
interface TranscricaoViewerProps {
  segmentos: Segmento[];
  textoCompleto: string;
  titulo: string;
  duracaoSegundos?: number;
  videoUrl?: string;
}

// Map speakers to colors
const speakerColors: Record<string, string> = {
  "Falante 1": "bg-blue-100 text-blue-800 border-blue-300",
  "Falante 2": "bg-green-100 text-green-800 border-green-300",
  "Falante 3": "bg-purple-100 text-purple-800 border-purple-300",
  "Falante 4": "bg-orange-100 text-orange-800 border-orange-300",
  "Falante 5": "bg-pink-100 text-pink-800 border-pink-300",
  "Falante 6": "bg-cyan-100 text-cyan-800 border-cyan-300",
};

const getSpeakerColor = (speaker: string) => {
  return speakerColors[speaker] || "bg-gray-100 text-gray-800 border-gray-300";
};

export function TranscricaoViewer({
  segmentos,
  textoCompleto,
  titulo,
  duracaoSegundos,
  videoUrl,
}: TranscricaoViewerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Get unique speakers
  const uniqueSpeakers = [...new Set(segmentos.map((s) => s.falante))];

  // Update current time as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleSegmentClick = (inicio: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = inicio;
      videoRef.current.play();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const getSpeakerDisplayName = (speaker: string) => {
    return speakerNames[speaker] || speaker;
  };

  const startEditingSpeaker = (speaker: string) => {
    setEditingSpeaker(speaker);
    setEditValue(speakerNames[speaker] || speaker);
  };

  const saveSpeakerName = () => {
    if (editingSpeaker && editValue.trim()) {
      setSpeakerNames((prev) => ({
        ...prev,
        [editingSpeaker]: editValue.trim(),
      }));
    }
    setEditingSpeaker(null);
    setEditValue("");
  };

  const cancelEditingSpeaker = () => {
    setEditingSpeaker(null);
    setEditValue("");
  };

  const getFormattedText = () => {
    return segmentos
      .map(
        (s) =>
          `[${formatTime(s.inicio)}] ${getSpeakerDisplayName(s.falante)}:\n${
            s.texto
          }`
      )
      .join("\n\n");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFormattedText());
    toast({
      title: "Copiado!",
      description: "Transcrição copiada para a área de transferência.",
    });
  };

  const downloadAsText = () => {
    const formattedText = `# ${titulo}\n\nDuração: ${
      duracaoSegundos ? formatDuration(duracaoSegundos) : "N/A"
    }\n\n---\n\n${getFormattedText()}`;

    const blob = new Blob([formattedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.replace(/[^a-z0-9]/gi, "_")}_transcricao.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isSegmentActive = (segmento: Segmento) => {
    return currentTime >= segmento.inicio && currentTime <= segmento.fim;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Player (if available) */}
        {videoUrl && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Vídeo</CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full rounded-lg"
                controls
              />
            </CardContent>
          </Card>
        )}

        {/* Transcription */}
        <Card className={cn("lg:col-span-2", !videoUrl && "lg:col-span-3")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{titulo}</CardTitle>
                {duracaoSegundos && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Duração: {formatDuration(duracaoSegundos)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsText}>
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Speaker Legend */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
              {uniqueSpeakers.map((speaker) => (
                <div key={speaker} className="flex items-center gap-1">
                  {editingSpeaker === speaker ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 w-32 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveSpeakerName();
                          if (e.key === "Escape") cancelEditingSpeaker();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={saveSpeakerName}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={cancelEditingSpeaker}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getSpeakerColor(speaker))}
                      >
                        {getSpeakerDisplayName(speaker)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => startEditingSpeaker(speaker)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Segments */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {segmentos.map((segmento, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSegmentActive(segmento)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleSegmentClick(segmento.inicio)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          getSpeakerColor(segmento.falante)
                        )}
                      >
                        {getSpeakerDisplayName(segmento.falante)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(segmento.inicio)} -{" "}
                        {formatTime(segmento.fim)}
                      </span>
                      {videoUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSegmentClick(segmento.inicio);
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{segmento.texto}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      <AiAnalysisSection transcricaoTexto={getFormattedText()} />
    </div>
  );
}
