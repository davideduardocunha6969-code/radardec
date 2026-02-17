import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, PhoneOff, Clock, Star, Trophy, BarChart3 } from "lucide-react";
import { useRadarOutbound } from "@/hooks/useRadarOutbound";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

const RadarOutbound = () => {
  const { data, isLoading } = useRadarOutbound();

  const rankingNotas = useMemo(() => {
    if (!data) return [];
    return [...data.sdrStats]
      .filter((s) => s.notaMedia != null)
      .sort((a, b) => (b.notaMedia ?? 0) - (a.notaMedia ?? 0));
  }, [data]);

  const chartChamadas = useMemo(() => {
    if (!data) return [];
    return data.sdrStats.map((s) => ({
      name: s.nome.split(" ")[0],
      efetuadas: s.totalChamadas,
      atendidas: s.atendidas,
    }));
  }, [data]);

  const chartDuracao = useMemo(() => {
    if (!data) return [];
    return data.sdrStats
      .filter((s) => s.duracaoMediaSegundos > 0)
      .map((s) => ({
        name: s.nome.split(" ")[0],
        duracao: Math.round(s.duracaoMediaSegundos / 60 * 10) / 10,
      }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Radar Outbound</h1>
        <p className="text-muted-foreground text-sm">Análise de performance das ligações SDR</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Phone className="h-3.5 w-3.5" />
              Total Ligações
            </div>
            <p className="text-2xl font-bold">{data.totalGeral}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Finalizadas
            </div>
            <p className="text-2xl font-bold text-green-600">{data.totalFinalizadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <PhoneOff className="h-3.5 w-3.5" />
              Não Atendidas
            </div>
            <p className="text-2xl font-bold text-destructive">{data.totalNaoAtendidas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3.5 w-3.5" />
              Duração Média
            </div>
            <p className="text-2xl font-bold">{formatDuration(data.duracaoMediaGeral)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Star className="h-3.5 w-3.5" />
              Nota Média IA
            </div>
            <p className="text-2xl font-bold">{data.notaMediaGeral ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Ranking ligações efetuadas vs atendidas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Ligações por SDR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartChamadas.length > 0 ? (
              <ChartContainer config={{ efetuadas: { label: "Efetuadas", color: "hsl(var(--primary))" }, atendidas: { label: "Atendidas", color: "hsl(var(--chart-2))" } }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartChamadas} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="efetuadas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
                    <Bar dataKey="atendidas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Tempo médio por SDR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Duração Média por SDR (min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartDuracao.length > 0 ? (
              <ChartContainer config={{ duracao: { label: "Duração (min)", color: "hsl(var(--chart-3))" } }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDuracao} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="duracao" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} barSize={20}>
                      <LabelList dataKey="duracao" position="right" style={{ fontSize: 11 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Ranking Completo de SDRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>SDR</TableHead>
                <TableHead className="text-center">Efetuadas</TableHead>
                <TableHead className="text-center">Finalizadas</TableHead>
                <TableHead className="text-center">Não Atendidas</TableHead>
                <TableHead className="text-center">Duração Média</TableHead>
                <TableHead className="text-center">Nota Média IA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sdrStats.map((sdr, i) => (
                <TableRow key={sdr.userId}>
                  <TableCell className="font-medium">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{sdr.nome}</TableCell>
                  <TableCell className="text-center">{sdr.totalChamadas}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {sdr.finalizadas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {sdr.naoAtendidas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{formatDuration(sdr.duracaoMediaSegundos)}</TableCell>
                  <TableCell className="text-center">
                    {sdr.notaMedia != null ? (
                      <Badge variant={sdr.notaMedia >= 7 ? "default" : "secondary"}>
                        {sdr.notaMedia}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data.sdrStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma ligação registrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ranking por Nota IA */}
      {rankingNotas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Ranking por Nota Média IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>SDR</TableHead>
                  <TableHead className="text-center">Nota Média</TableHead>
                  <TableHead className="text-center">Ligações Avaliadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingNotas.map((sdr, i) => (
                  <TableRow key={sdr.userId}>
                    <TableCell className="font-medium">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{sdr.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={sdr.notaMedia! >= 7 ? "default" : "secondary"} className="text-sm">
                        {sdr.notaMedia}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{sdr.totalChamadas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RadarOutbound;
