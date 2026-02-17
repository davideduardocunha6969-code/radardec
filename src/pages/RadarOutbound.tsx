import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, PhoneOff, Clock, Star, Trophy, BarChart3, Filter } from "lucide-react";
import { useRadarOutbound, filterByFunil } from "@/hooks/useRadarOutbound";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

const RadarOutbound = () => {
  const { data: rawData, isLoading } = useRadarOutbound();
  const [selectedFunil, setSelectedFunil] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!rawData) return null;
    if (!selectedFunil) return rawData;
    const filtered = filterByFunil(rawData.allChamadas, rawData.profileMap, selectedFunil);
    return { ...rawData, ...filtered };
  }, [rawData, selectedFunil]);

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
        duracao: Math.round((s.duracaoMediaSegundos / 60) * 10) / 10,
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Radar Outbound</h1>
          <p className="text-muted-foreground text-sm">Análise de performance das ligações SDR</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedFunil || "todos"}
            onValueChange={(v) => setSelectedFunil(v === "todos" ? null : v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todos os funis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os funis</SelectItem>
              {rawData?.funisOptions.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {/* Hourly Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Ligações por Horário
            </CardTitle>
            <p className="text-xs text-muted-foreground">Horários com mais ligações efetuadas e atendidas</p>
          </CardHeader>
          <CardContent>
            {data.hourlyData.some((h) => h.efetuadas > 0) ? (
              <ChartContainer
                config={{
                  efetuadas: { label: "Efetuadas", color: "hsl(var(--primary))" },
                  atendidas: { label: "Atendidas", color: "hsl(var(--chart-2))" },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyData}>
                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="efetuadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={14} />
                    <Bar dataKey="atendidas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Best hours insight */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Melhores Horários para Ligar
            </CardTitle>
            <p className="text-xs text-muted-foreground">Baseado na taxa de atendimento</p>
          </CardHeader>
          <CardContent>
            <BestHoursInsight hourlyData={data.hourlyData} />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Ligações por SDR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartChamadas.length > 0 ? (
              <ChartContainer
                config={{
                  efetuadas: { label: "Efetuadas", color: "hsl(var(--primary))" },
                  atendidas: { label: "Atendidas", color: "hsl(var(--chart-2))" },
                }}
                className="h-[300px]"
              >
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

// Sub-component: Best hours insight card
function BestHoursInsight({ hourlyData }: { hourlyData: { hora: string; efetuadas: number; atendidas: number }[] }) {
  const insights = useMemo(() => {
    const withRate = hourlyData
      .filter((h) => h.efetuadas >= 2)
      .map((h) => ({
        ...h,
        taxa: h.efetuadas > 0 ? (h.atendidas / h.efetuadas) * 100 : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa);

    const topEfetuadas = [...hourlyData].sort((a, b) => b.efetuadas - a.efetuadas).slice(0, 3);
    const topAtendidas = [...hourlyData].sort((a, b) => b.atendidas - a.atendidas).slice(0, 3);

    return { topTaxa: withRate.slice(0, 3), topEfetuadas, topAtendidas };
  }, [hourlyData]);

  if (insights.topEfetuadas.every((h) => h.efetuadas === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sem dados suficientes</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">🎯 Maior Taxa de Atendimento</h4>
        <div className="space-y-1.5">
          {insights.topTaxa.map((h, i) => (
            <div key={h.hora} className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {h.hora}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {h.atendidas}/{h.efetuadas} ligações
                </span>
                <Badge variant={h.taxa >= 50 ? "default" : "secondary"}>
                  {Math.round(h.taxa)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">📞 Mais Ligações Efetuadas</h4>
        <div className="space-y-1.5">
          {insights.topEfetuadas.filter((h) => h.efetuadas > 0).map((h) => (
            <div key={h.hora} className="flex items-center justify-between text-sm">
              <span className="font-medium">{h.hora}</span>
              <span className="text-muted-foreground">{h.efetuadas} ligações</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">✅ Mais Atendidas</h4>
        <div className="space-y-1.5">
          {insights.topAtendidas.filter((h) => h.atendidas > 0).map((h) => (
            <div key={h.hora} className="flex items-center justify-between text-sm">
              <span className="font-medium">{h.hora}</span>
              <span className="text-muted-foreground">{h.atendidas} atendidas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RadarOutbound;
