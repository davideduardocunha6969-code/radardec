import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface ValuesEstimationPanelProps {
  leadId: string;
}

export function ValuesEstimationPanel({ leadId }: ValuesEstimationPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Estimativa de Valores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground italic">
          Aguardando dados para cálculo de estimativa...
        </p>
      </CardContent>
    </Card>
  );
}
