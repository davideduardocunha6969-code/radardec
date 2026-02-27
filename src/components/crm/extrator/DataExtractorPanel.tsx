import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch } from "lucide-react";

interface DataExtractorPanelProps {
  leadId: string;
}

export function DataExtractorPanel({ leadId }: DataExtractorPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-primary" />
          Extrator de Dados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground italic">
          Aguardando transcrição para extrair dados automaticamente...
        </p>
      </CardContent>
    </Card>
  );
}
