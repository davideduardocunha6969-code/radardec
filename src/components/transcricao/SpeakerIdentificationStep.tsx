import { useState } from "react";
import { Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Segmento } from "@/hooks/useTranscricao";
import { cn } from "@/lib/utils";

interface SpeakerIdentificationStepProps {
  segmentos: Segmento[];
  onComplete: (speakerNames: Record<string, string>) => void;
  onBack: () => void;
}

// Predefined speaker roles for legal hearings
const SPEAKER_ROLES = [
  "Magistrado",
  "Assessor(a)",
  "Advogado(a) do Autor",
  "Advogado(a) do Réu",
  "Autor",
  "Réu",
  "Testemunha 1",
  "Testemunha 2",
  "Testemunha 3",
  "Perito(a)",
  "Promotor(a)",
  "Defensor(a) Público(a)",
  "Outro",
];

// Speaker colors for visual distinction
const speakerColors: Record<string, string> = {
  "Falante 1": "bg-blue-100 text-blue-800 border-blue-300",
  "Falante 2": "bg-green-100 text-green-800 border-green-300",
  "Falante 3": "bg-purple-100 text-purple-800 border-purple-300",
  "Falante 4": "bg-orange-100 text-orange-800 border-orange-300",
  "Falante 5": "bg-pink-100 text-pink-800 border-pink-300",
  "Falante 6": "bg-cyan-100 text-cyan-800 border-cyan-300",
  "Falante 7": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Falante 8": "bg-red-100 text-red-800 border-red-300",
};

const getSpeakerColor = (speaker: string) => {
  return speakerColors[speaker] || "bg-gray-100 text-gray-800 border-gray-300";
};

// Format time in the style: 00h 01m 12s
const formatTimeDetailed = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
};

export function SpeakerIdentificationStep({
  segmentos,
  onComplete,
  onBack,
}: SpeakerIdentificationStepProps) {
  // Get unique speakers
  const uniqueSpeakers = [...new Set(segmentos.map((s) => s.falante))];

  // Initialize speaker names state
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    uniqueSpeakers.forEach((speaker) => {
      initial[speaker] = "";
    });
    return initial;
  });

  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  // Get first few segments for each speaker as examples
  const getSpeakerExamples = (speaker: string, maxExamples = 3) => {
    return segmentos
      .filter((s) => s.falante === speaker)
      .slice(0, maxExamples);
  };

  const handleRoleSelect = (speaker: string, role: string) => {
    setSpeakerNames((prev) => ({
      ...prev,
      [speaker]: role === "Outro" ? customNames[speaker] || "" : role,
    }));
  };

  const handleCustomNameChange = (speaker: string, name: string) => {
    setCustomNames((prev) => ({
      ...prev,
      [speaker]: name,
    }));
    // If "Outro" is selected, update the speaker name
    if (speakerNames[speaker] === "" || !SPEAKER_ROLES.includes(speakerNames[speaker])) {
      setSpeakerNames((prev) => ({
        ...prev,
        [speaker]: name,
      }));
    }
  };

  const isComplete = uniqueSpeakers.every(
    (speaker) => speakerNames[speaker] && speakerNames[speaker].trim() !== ""
  );

  const handleComplete = () => {
    if (isComplete) {
      onComplete(speakerNames);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Identificação de Falantes</CardTitle>
        </div>
        <CardDescription>
          Foram identificadas <strong>{uniqueSpeakers.length}</strong> vozes diferentes
          nesta audiência. Por favor, identifique quem é cada falante baseado nas frases
          de exemplo abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {uniqueSpeakers.map((speaker, index) => {
              const examples = getSpeakerExamples(speaker);
              const selectedRole = speakerNames[speaker];
              const isOther = selectedRole && !SPEAKER_ROLES.slice(0, -1).includes(selectedRole);

              return (
                <Card key={speaker} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-sm px-3 py-1", getSpeakerColor(speaker))}
                        >
                          {speaker}
                        </Badge>
                        {selectedRole && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {segmentos.filter((s) => s.falante === speaker).length} falas
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Example phrases */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Primeiras falas desta voz:
                      </Label>
                      <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                        {examples.map((example, i) => (
                          <div key={i} className="text-sm">
                            <span className="text-muted-foreground font-mono text-xs mr-2">
                              ({formatTimeDetailed(example.inicio)})
                            </span>
                            <span className="italic">"{example.texto}"</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Role selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`role-${speaker}`}>Quem é este falante?</Label>
                      <Select
                        value={
                          SPEAKER_ROLES.slice(0, -1).includes(selectedRole)
                            ? selectedRole
                            : selectedRole
                            ? "Outro"
                            : ""
                        }
                        onValueChange={(value) => handleRoleSelect(speaker, value)}
                      >
                        <SelectTrigger id={`role-${speaker}`}>
                          <SelectValue placeholder="Selecione o papel deste falante" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPEAKER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom name input (shown when "Outro" is selected or custom name exists) */}
                    {(isOther || customNames[speaker]) && (
                      <div className="space-y-2">
                        <Label htmlFor={`custom-${speaker}`}>Nome personalizado</Label>
                        <Input
                          id={`custom-${speaker}`}
                          value={customNames[speaker] || ""}
                          onChange={(e) => handleCustomNameChange(speaker, e.target.value)}
                          placeholder="Digite o nome ou papel do falante"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={handleComplete} disabled={!isComplete}>
            Concluir Identificação
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
