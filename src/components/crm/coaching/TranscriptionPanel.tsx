import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

interface TranscriptEntry {
  id: string;
  text: string;
}

interface TranscriptionPanelProps {
  isConnected: boolean;
  isAnalyzing: boolean;
  connectionError: string | null;
  micLevel: number;
  committedTranscripts: TranscriptEntry[];
  partialTranscript: string;
}

export function TranscriptionPanel({
  isConnected,
  isAnalyzing,
  connectionError,
  micLevel,
  committedTranscripts,
  partialTranscript,
}: TranscriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [committedTranscripts, partialTranscript]);

  function copyLine(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!", { duration: 1500 });
  }

  return (
    <Card className="border-primary/20 flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-1 px-3 pt-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-semibold">
            {isConnected ? (
              <Mic className="h-4 w-4 text-primary" />
            ) : (
              <MicOff className="h-4 w-4 text-muted-foreground" />
            )}
            Transcrição
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
              {isConnected ? "Ao vivo" : "Conectando..."}
            </Badge>
          </div>
        </div>
        <Progress value={micLevel} className="h-1 mt-1" />
      </CardHeader>
      <CardContent className="px-3 pb-2 flex-1 min-h-0">
        {connectionError && (
          <p className="text-[10px] text-destructive mb-1">{connectionError}</p>
        )}
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <div className="space-y-1.5">
            {committedTranscripts.map((t) => (
              <p
                key={t.id}
                className="text-sm text-foreground leading-relaxed cursor-pointer hover:bg-accent/30 rounded px-1.5 py-0.5 transition-colors group"
                onClick={() => copyLine(t.text)}
                title="Clique para copiar"
              >
                {t.text}
                <Copy className="h-3 w-3 inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
              </p>
            ))}
            {partialTranscript && (
              <p className="text-sm text-muted-foreground italic px-1.5">{partialTranscript}</p>
            )}
            {!committedTranscripts.length && !partialTranscript && (
              <p className="text-muted-foreground text-sm text-center py-10">🎙️ Aguardando fala...</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
