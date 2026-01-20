import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  ConteudoMidia,
  SETOR_LABELS,
  FORMATO_LABELS,
  STATUS_LABELS,
  Setor,
  Formato,
  Status,
} from "@/hooks/useConteudosMidia";

interface ConteudoStatsSectionProps {
  conteudos: ConteudoMidia[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RankingItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

function RankingCard({
  title,
  items,
}: {
  title: string;
  items: RankingItem[];
}) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={item.key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                {index < 3 && (
                  <span className="text-lg">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </span>
                )}
                {item.label}
              </span>
              <span className="text-muted-foreground">
                {item.count} ({item.percentage.toFixed(0)}%)
              </span>
            </div>
            <Progress
              value={(item.count / maxCount) * 100}
              className="h-2"
            />
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum dado disponível
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ConteudoStatsSection({
  conteudos,
  isOpen,
  onOpenChange,
}: ConteudoStatsSectionProps) {
  const stats = useMemo(() => {
    const total = conteudos.length;
    if (total === 0) {
      return {
        byFormato: [],
        bySetor: [],
        byStatus: [],
      };
    }

    const formatoCount: Record<Formato, number> = {
      video: 0,
      video_longo: 0,
      carrossel: 0,
      estatico: 0,
    };
    const setorCount: Record<Setor, number> = {
      trabalhista: 0,
      previdenciario: 0,
      civel: 0,
      bancario: 0,
    };
    const statusCount: Record<Status, number> = {
      a_gravar: 0,
      gravado: 0,
      em_edicao: 0,
      editado: 0,
      postado: 0,
    };

    conteudos.forEach((c) => {
      formatoCount[c.formato]++;
      setorCount[c.setor]++;
      statusCount[c.status]++;
    });

    const byFormato: RankingItem[] = Object.entries(formatoCount)
      .map(([key, count]) => ({
        key,
        label: FORMATO_LABELS[key as Formato],
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    const bySetor: RankingItem[] = Object.entries(setorCount)
      .map(([key, count]) => ({
        key,
        label: SETOR_LABELS[key as Setor],
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    const byStatus: RankingItem[] = Object.entries(statusCount)
      .map(([key, count]) => ({
        key,
        label: STATUS_LABELS[key as Status],
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    return { byFormato, bySetor, byStatus };
  }, [conteudos]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                📊 Estatísticas de Conteúdo
              </CardTitle>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <RankingCard title="📹 Ranking por Formato" items={stats.byFormato} />
          <RankingCard title="📁 Ranking por Setor" items={stats.bySetor} />
          <RankingCard title="📌 Ranking por Status" items={stats.byStatus} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
