import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface GapsPanelProps {
  leadId: string;
}

export function GapsPanel({ leadId }: GapsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          Lacunas e Perguntas Sugeridas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground italic">
          Aguardando dados do lead para análise de lacunas...
        </p>
      </CardContent>
    </Card>
  );
}
