import { useState, useRef, useCallback } from "react";
import { Upload, Video, X, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  onVideoSelected: (file: File) => void;
  onAudioExtracted: (audioBlob: Blob, fileName: string) => void;
  isProcessing: boolean;
}

export function VideoUploader({
  onVideoSelected,
  onAudioExtracted,
  isProcessing,
}: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
          setSelectedFile(file);
          onVideoSelected(file);
        }
      }
    },
    [onVideoSelected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        onVideoSelected(file);
      }
    },
    [onVideoSelected]
  );

  const extractAudio = useCallback(async () => {
    if (!selectedFile) return;

    setExtracting(true);
    setExtractionProgress(10);

    try {
      // Check if it's already an audio file
      if (selectedFile.type.startsWith("audio/")) {
        setExtractionProgress(100);
        onAudioExtracted(selectedFile, selectedFile.name);
        return;
      }

      setExtractionProgress(20);

      // Create audio context for extraction
      const audioContext = new AudioContext();

      setExtractionProgress(30);

      // Read the video file
      const arrayBuffer = await selectedFile.arrayBuffer();

      setExtractionProgress(50);

      // Decode the audio from the video
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      setExtractionProgress(70);

      // Convert to WAV format
      const wavBlob = audioBufferToWav(audioBuffer);

      setExtractionProgress(90);

      // Generate audio filename
      const audioFileName = selectedFile.name.replace(/\.[^/.]+$/, "") + ".wav";

      setExtractionProgress(100);

      onAudioExtracted(wavBlob, audioFileName);
    } catch (error) {
      console.error("Error extracting audio:", error);
      
      // Fallback: just send the video file directly
      // ElevenLabs can accept video files
      onAudioExtracted(selectedFile, selectedFile.name);
    } finally {
      setExtracting(false);
      setExtractionProgress(0);
    }
  }, [selectedFile, onAudioExtracted]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="video-upload">Arquivo de Vídeo ou Áudio</Label>
        <Card
          className={cn(
            "mt-2 border-2 border-dashed transition-colors cursor-pointer",
            dragActive && "border-primary bg-primary/5",
            selectedFile && "border-green-500 bg-green-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && inputRef.current?.click()}
        >
          <CardContent className="p-6">
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedFile.type.startsWith("audio/") ? (
                    <FileAudio className="h-10 w-10 text-green-600" />
                  ) : (
                    <Video className="h-10 w-10 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  disabled={isProcessing || extracting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, WebM, MOV, AVI, MP3, WAV (máx. 50MB)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Input
          ref={inputRef}
          id="video-upload"
          type="file"
          accept="video/*,audio/*"
          className="hidden"
          onChange={handleChange}
          disabled={isProcessing || extracting}
        />
      </div>

      {selectedFile && (
        <div className="space-y-2">
          {extracting && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${extractionProgress}%` }}
              />
            </div>
          )}
          <Button
            onClick={extractAudio}
            disabled={isProcessing || extracting}
            className="w-full"
          >
            {extracting
              ? "Extraindo áudio..."
              : selectedFile.type.startsWith("audio/")
              ? "Usar este áudio"
              : "Extrair áudio e transcrever"}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to convert AudioBuffer to WAV Blob
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < numOfChan; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
