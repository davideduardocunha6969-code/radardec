import { useMemo, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import {
  ConteudoMidia,
  SETOR_LABELS,
  FORMATO_LABELS,
  STATUS_LABELS,
  Setor,
  Formato,
  Status,
} from "@/hooks/useConteudosMidia";

const WEEKLY_GOAL = 21;

const SETOR_OPTIONS: { value: Setor | "all"; label: string }[] = [
  { value: "all", label: "Todos os Setores" },
  ...Object.entries(SETOR_LABELS).map(([value, label]) => ({
    value: value as Setor,
    label,
  })),
];

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

interface WeeklyData {
  semana: number;
  quantidade: number;
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
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const filteredConteudos = useMemo(() => {
    if (statusFilter === "all") return conteudos;
    return conteudos.filter((c) => c.status === statusFilter);
  }, [conteudos, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredConteudos.length;
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

    filteredConteudos.forEach((c) => {
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
  }, [filteredConteudos]);

  // Calculate weekly data for previdenciario sector with status "postado"
  const weeklyData = useMemo(() => {
    const previdenciarioPostados = conteudos.filter(
      (c) => c.setor === "previdenciario" && c.status === "postado"
    );

    const weekCounts: Record<number, number> = {};
    
    previdenciarioPostados.forEach((c) => {
      const week = c.semana_publicacao;
      if (week && week >= 1 && week <= 53) {
        weekCounts[week] = (weekCounts[week] || 0) + 1;
      }
    });

    // Create array for weeks 1-53
    const data: WeeklyData[] = [];
    for (let i = 1; i <= 53; i++) {
      if (weekCounts[i] !== undefined) {
        data.push({
          semana: i,
          quantidade: weekCounts[i],
        });
      }
    }

    return data.sort((a, b) => a.semana - b.semana);
  }, [conteudos]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                📊 Estatísticas de Conteúdo - Previdenciário
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
        {/* Status Filter */}
        <div className="flex items-center gap-2 mt-4 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as Status | "all")}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekly Goal Chart */}
        <Card className="mt-4 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              📈 Evolução Semanal de Conteúdos Postados (Meta: {WEEKLY_GOAL}/semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={weeklyData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="semana"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `S${value}`}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value, "Conteúdos"]}
                    labelFormatter={(label) => `Semana ${label}`}
                  />
                  <ReferenceLine
                    y={WEEKLY_GOAL}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{
                      value: `Meta: ${WEEKLY_GOAL}`,
                      position: "right",
                      fill: "hsl(var(--primary))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.quantidade >= WEEKLY_GOAL
                            ? "hsl(221, 83%, 53%)"
                            : "hsl(0, 84%, 60%)"
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="quantidade"
                      position="top"
                      fill="hsl(var(--foreground))"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>Nenhum conteúdo postado com semana de publicação definida</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <RankingCard title="📹 Ranking por Formato" items={stats.byFormato} />
          <RankingCard title="📌 Ranking por Status" items={stats.byStatus} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
