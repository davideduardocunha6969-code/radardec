import { useMemo } from "react";
import { ChevronDown, Video, FileImage, Briefcase, Scale, Landmark, Gavel, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { IdeiaConteudo } from "@/hooks/useIdeiasConteudo";
import { SETOR_LABELS, FORMATO_LABELS, Setor, Formato } from "@/hooks/useConteudosMidia";

interface IdeiaStatsSectionProps {
  ideias: IdeiaConteudo[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RankingItem {
  label: string;
  count: number;
  percentage: number;
  icon?: React.ReactNode;
}

const SETOR_ICONS: Record<Setor, React.ReactNode> = {
  trabalhista: <Briefcase className="h-4 w-4" />,
  previdenciario: <Scale className="h-4 w-4" />,
  civel: <Gavel className="h-4 w-4" />,
  bancario: <Landmark className="h-4 w-4" />,
};

const FORMATO_ICONS: Record<Formato, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  video_longo: <Video className="h-4 w-4" />,
  carrossel: <FileImage className="h-4 w-4" />,
  estatico: <FileImage className="h-4 w-4" />,
};

function RankingCard({ title, items }: { title: string; items: RankingItem[] }) {
  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados</p>
        ) : (
          items.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground">({item.percentage.toFixed(0)}%)</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function IdeiaStatsSection({ ideias, isOpen, onOpenChange }: IdeiaStatsSectionProps) {
  const stats = useMemo(() => {
    const total = ideias.length;
    if (total === 0) return { formato: [], setor: [], situacao: [] };

    // Ranking por formato
    const formatoCounts: Record<string, number> = {};
    ideias.forEach((i) => {
      formatoCounts[i.formato] = (formatoCounts[i.formato] || 0) + 1;
    });
    const formatoRanking: RankingItem[] = Object.entries(formatoCounts)
      .map(([key, count]) => ({
        label: FORMATO_LABELS[key as Formato] || key,
        count,
        percentage: (count / total) * 100,
        icon: FORMATO_ICONS[key as Formato],
      }))
      .sort((a, b) => b.count - a.count);

    // Ranking por setor
    const setorCounts: Record<string, number> = {};
    ideias.forEach((i) => {
      setorCounts[i.setor] = (setorCounts[i.setor] || 0) + 1;
    });
    const setorRanking: RankingItem[] = Object.entries(setorCounts)
      .map(([key, count]) => ({
        label: SETOR_LABELS[key as Setor] || key,
        count,
        percentage: (count / total) * 100,
        icon: SETOR_ICONS[key as Setor],
      }))
      .sort((a, b) => b.count - a.count);

    // Ranking por situação
    const situacaoCounts = {
      pendente: ideias.filter((i) => !i.validado).length,
      validado: ideias.filter((i) => i.validado).length,
    };
    const situacaoRanking: RankingItem[] = [
      {
        label: "Pendente",
        count: situacaoCounts.pendente,
        percentage: (situacaoCounts.pendente / total) * 100,
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
      },
      {
        label: "Validado",
        count: situacaoCounts.validado,
        percentage: (situacaoCounts.validado / total) * 100,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      },
    ].sort((a, b) => b.count - a.count);

    return { formato: formatoRanking, setor: setorRanking, situacao: situacaoRanking };
  }, [ideias]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50">
        <span className="font-medium">Estatísticas</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RankingCard title="Ranking por Formato" items={stats.formato} />
          <RankingCard title="Ranking por Setor" items={stats.setor} />
          <RankingCard title="Ranking por Situação" items={stats.situacao} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
