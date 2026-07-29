import { useMemo, useState } from "react";
import { Calendar, Users, Target, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekFilter } from "@/components/WeekFilter";
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
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import type { CommercialRecord } from "@/hooks/useCommercialData";

interface SetorOverviewCardsProps {
  data: CommercialRecord[];
  weeks: number[];
  isLoading?: boolean;
  setores: string[];
  produtosBySetor: Record<string, string[]>;
  allProdutos: string[];
  onAposentadoriasClick?: () => void;
}

const normalize = (v: string) =>
  (v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const isNoShow = (r: CommercialRecord) => {
  const res = normalize(r.resultado);
  return res.includes("no-show") || res.includes("no show") || res.includes("noshow");
};

const isContrato = (r: CommercialRecord) => normalize(r.resultado).includes("contrato fechado");

const isQualificado = (r: CommercialRecord) => {
  const pd = normalize(r.possuiDireito).trim();
  return pd === "sim" || pd === "com direito";
};

const SETORES = [
  { key: "previdenciario", label: "Previdenciário", match: "previden", accent: "text-blue-500" },
  { key: "trabalhista", label: "Trabalhista", match: "trabalh", accent: "text-emerald-500" },
  { key: "bancario", label: "Bancário", match: "banc", accent: "text-purple-500" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function SetorOverviewCards({
  data,
  weeks,
  isLoading = false,
  setores,
  produtosBySetor,
  allProdutos,
  onAposentadoriasClick,
}: SetorOverviewCardsProps) {
  const [week, setWeek] = useState<number | null>(null);
  const [chartSetores, setChartSetores] = useState<string[]>([]);
  const [chartProdutos, setChartProdutos] = useState<string[]>([]);
  const [showMedia, setShowMedia] = useState(true);
  const [showTendencia, setShowTendencia] = useState(true);

  const weekData = useMemo(
    () => (week ? data.filter((r) => r.semana === week) : data),
    [data, week]
  );

  const setorStats = useMemo(() => {
    return SETORES.map((s) => {
      const records = weekData.filter((r) => normalize(r.setor).includes(s.match));
      const contratos = records.filter(isContrato);
      const qualificados = records.filter((r) => !isNoShow(r) && isQualificado(r));
      const honorariosIniciais = contratos.reduce((sum, r) => sum + (r.honorariosIniciais || 0), 0);
      const honorariosExito = contratos.reduce((sum, r) => sum + (r.honorariosExito || 0), 0);

      return {
        ...s,
        totalAtendimentos: records.length,
        contratos: contratos.length,
        taxaGeral: records.length > 0 ? (contratos.length / records.length) * 100 : 0,
        totalQualificados: qualificados.length,
        taxaQualificada:
          qualificados.length > 0
            ? (qualificados.filter(isContrato).length / qualificados.length) * 100
            : 0,
        honorariosIniciais,
        honorariosExito,
        honorariosTotal: honorariosIniciais + honorariosExito,
        aposentadoriasFuturas: records.filter((r) =>
          normalize(r.resultado).includes("aposentadoria futura")
        ).length,
      };
    });
  }, [weekData]);

  const availableProdutos = useMemo(() => {
    if (chartSetores.length === 0) return allProdutos;
    const set = new Set<string>();
    chartSetores.forEach((s) => (produtosBySetor[s] || []).forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [chartSetores, produtosBySetor, allProdutos]);

  const contratosPorSemana = useMemo(() => {
    const counts: Record<number, number> = {};
    data
      .filter((r) => isContrato(r))
      .filter((r) => (chartSetores.length ? chartSetores.includes(r.setor) : true))
      .filter((r) => (chartProdutos.length ? chartProdutos.includes(r.produto) : true))
      .forEach((r) => {
        if (r.semana > 0 && r.semana <= 53) counts[r.semana] = (counts[r.semana] || 0) + 1;
      });

    const base = Array.from({ length: 53 }, (_, i) => ({
      semana: `${i + 1}`,
      weekNumber: i + 1,
      contratos: counts[i + 1] || 0,
    }));

    // Intervalo com dados (primeira à última semana com contratos)
    const comDados = base.filter((d) => d.contratos > 0);
    const first = comDados.length ? comDados[0].weekNumber : 1;
    const last = comDados.length ? comDados[comDados.length - 1].weekNumber : 53;
    const range = base.filter((d) => d.weekNumber >= first && d.weekNumber <= last);

    const n = range.length;
    const media = n > 0 ? range.reduce((s, d) => s + d.contratos, 0) / n : 0;

    // Regressão linear simples sobre o intervalo com dados
    let slope = 0;
    let intercept = media;
    if (n > 1) {
      const mx = range.reduce((s, d) => s + d.weekNumber, 0) / n;
      const my = media;
      const num = range.reduce((s, d) => s + (d.weekNumber - mx) * (d.contratos - my), 0);
      const den = range.reduce((s, d) => s + (d.weekNumber - mx) ** 2, 0);
      slope = den !== 0 ? num / den : 0;
      intercept = my - slope * mx;
    }

    return base.map((d) => {
      const inRange = d.weekNumber >= first && d.weekNumber <= last;
      return {
        ...d,
        media: inRange ? parseFloat(media.toFixed(2)) : null,
        tendencia: inRange
          ? parseFloat(Math.max(0, slope * d.weekNumber + intercept).toFixed(2))
          : null,
      };
    });
  }, [data, chartSetores, chartProdutos]);

  const totalContratosChart = contratosPorSemana.reduce((s, d) => s + d.contratos, 0);
  const semanasComDados = contratosPorSemana.filter((d) => d.contratos > 0).length;


  return (
    <div className="space-y-6 mb-8">
      <WeekFilter
        weeks={weeks}
        selectedWeek={week}
        onWeekChange={setWeek}
        isLoading={isLoading}
      />

      {setorStats.map((s) => (
        <div key={s.key} className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className={`h-4 w-4 ${s.accent}`} />
            <h3 className="text-sm font-semibold text-foreground">{s.label}</h3>
            <span className="text-xs text-muted-foreground">
              {week ? `Semana ${week}` : "Todas as semanas"}
            </span>
          </div>

          <div
            className={`grid gap-4 md:grid-cols-2 ${
              s.key === "previdenciario" ? "lg:grid-cols-5" : "lg:grid-cols-4"
            }`}
          >
            {s.key === "previdenciario" && (
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onAposentadoriasClick}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Aposentadorias Futuras
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {isLoading ? "--" : s.aposentadoriasFuturas}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Clique para detalhes</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Atendimentos
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? "--" : s.totalAtendimentos}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.totalQualificados} qualificados (sem no-show)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contratos Fechados
                </CardTitle>
                <Target className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? "--" : s.contratos}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {week ? `Semana ${week}` : "Todas as semanas"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Conversão
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {isLoading ? "--%" : `${s.taxaGeral.toFixed(1)}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Geral • {s.contratos}/{s.totalAtendimentos} atendimentos
                  </p>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="text-lg font-semibold text-success">
                    {isLoading ? "--%" : `${s.taxaQualificada.toFixed(1)}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Qualificados sem no-show • base {s.totalQualificados}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Honorários Prospectados
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? "--" : formatCurrency(s.honorariosTotal)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Iniciais {formatCurrency(s.honorariosIniciais)} • Êxito{" "}
                  {formatCurrency(s.honorariosExito)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Contratos Fechados por Semana</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total acumulado:{" "}
                <span className="font-semibold text-foreground">{totalContratosChart}</span> • Média
                por semana com dados:{" "}
                <span className="font-semibold text-foreground">
                  {semanasComDados > 0 ? (totalContratosChart / semanasComDados).toFixed(1) : "0"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={showMedia ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowMedia((v) => !v)}
              >
                Média
              </Button>
              <Button
                variant={showTendencia ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowTendencia((v) => !v)}
              >
                Tendência
              </Button>
              <MultiSelect
                label="Setores"
                options={setores}
                selected={chartSetores}
                onChange={(next) => {
                  setChartSetores(next);
                  setChartProdutos([]);
                }}
                width="w-[170px]"
              />
              <MultiSelect
                label="Produtos"
                options={availableProdutos}
                selected={chartProdutos}
                onChange={setChartProdutos}
                width="w-[190px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={contratosPorSemana}
              margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(l) => `Semana ${l}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="contratos"
                name="Contratos"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="contratos"
                  position="top"
                  fontSize={9}
                  formatter={(v: number) => (v > 0 ? v : "")}
                />
              </Bar>
              {showMedia && (
                <Line
                  type="monotone"
                  dataKey="media"
                  name="Média"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                />
              )}
              {showTendencia && (
                <Line
                  type="linear"
                  dataKey="tendencia"
                  name="Tendência"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}
