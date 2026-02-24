import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, HelpCircle, AlertTriangle } from "lucide-react";

interface DizerAgoraCardProps {
  dizerAgora: string | null;
  proximaPergunta: string | null;
  alertaCompliance: string | null;
}

export function DizerAgoraCard({ dizerAgora, proximaPergunta, alertaCompliance }: DizerAgoraCardProps) {
  return (
    <div className="space-y-1.5">
      {alertaCompliance && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="px-2.5 py-2 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive">{alertaCompliance}</p>
          </CardContent>
        </Card>
      )}

      {dizerAgora && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="px-2.5 py-2">
            <div className="flex items-start gap-2">
              <MessageCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">Dizer Agora</p>
                <p className="text-xs font-medium text-foreground leading-snug">{dizerAgora}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {proximaPergunta && (
        <Card className="border-border/60">
          <CardContent className="px-2.5 py-2 flex items-start gap-2">
            <HelpCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-0.5">Próxima Pergunta</p>
              <p className="text-xs text-foreground leading-snug">{proximaPergunta}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
