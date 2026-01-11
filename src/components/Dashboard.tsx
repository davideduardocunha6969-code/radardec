import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Hash,
  Layers,
  Calendar,
  FileText,
  CheckCircle,
} from "lucide-react";
import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";

interface SheetData {
  headers: string[];
  rows: Record<string, string | number>[];
  summary: {
    totalRows: number;
    totalColumns: number;
    numericColumns: string[];
    textColumns: string[];
  };
}

interface DashboardProps {
  data: SheetData;
}

const CHART_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(172, 66%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
];

const Dashboard = ({ data }: DashboardProps) => {
  const statistics = useMemo(() => {
    const stats: Record<string, { min: number; max: number; avg: number; sum: number }> = {};

    data.summary.numericColumns.forEach((col) => {
      const values = data.rows
        .map((row) => Number(row[col]))
        .filter((v) => !isNaN(v));

      if (values.length > 0) {
        stats[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          sum: values.reduce((a, b) => a + b, 0),
        };
      }
    });

    return stats;
  }, [data]);

  const barChartData = useMemo(() => {
    const firstNumericCol = data.summary.numericColumns[0];
    const firstTextCol = data.summary.textColumns[0];

    if (!firstNumericCol || !firstTextCol) return [];

    return data.rows.slice(0, 10).map((row) => ({
      name: String(row[firstTextCol]).slice(0, 15),
      value: Number(row[firstNumericCol]) || 0,
    }));
  }, [data]);

  const pieChartData = useMemo(() => {
    const firstTextCol = data.summary.textColumns[0];
    if (!firstTextCol) return [];

    const counts: Record<string, number> = {};
    data.rows.forEach((row) => {
      const value = String(row[firstTextCol]);
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.slice(0, 20), value }));
  }, [data]);

  const lineChartData = useMemo(() => {
    if (data.summary.numericColumns.length < 2) return [];

    return data.rows.slice(0, 15).map((row, index) => {
      const point: Record<string, number | string> = { index: index + 1 };
      data.summary.numericColumns.slice(0, 3).forEach((col) => {
        point[col] = Number(row[col]) || 0;
      });
      return point;
    });
  }, [data]);

  const firstNumericStats = Object.entries(statistics)[0];

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Linhas"
          value={data.summary.totalRows.toLocaleString()}
          icon={<Layers className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-1"
        />
        <MetricCard
          title="Total de Colunas"
          value={data.summary.totalColumns}
          icon={<Hash className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-2"
        />
        <MetricCard
          title="Colunas Numéricas"
          value={data.summary.numericColumns.length}
          subtitle="Disponíveis para análise"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-3"
        />
        <MetricCard
          title="Colunas de Texto"
          value={data.summary.textColumns.length}
          subtitle="Categorias identificadas"
          icon={<FileText className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-4"
        />
      </div>

      {/* Statistics Cards */}
      {firstNumericStats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title={`Soma (${firstNumericStats[0]})`}
            value={firstNumericStats[1].sum.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })}
            variant="primary"
            className="animate-slide-up"
          />
          <MetricCard
            title={`Média (${firstNumericStats[0]})`}
            value={firstNumericStats[1].avg.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })}
            variant="accent"
            className="animate-slide-up stagger-1"
          />
          <MetricCard
            title={`Mínimo (${firstNumericStats[0]})`}
            value={firstNumericStats[1].min.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })}
            icon={<CheckCircle className="h-5 w-5" />}
            className="animate-slide-up stagger-2"
          />
          <MetricCard
            title={`Máximo (${firstNumericStats[0]})`}
            value={firstNumericStats[1].max.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })}
            icon={<Calendar className="h-5 w-5 text-primary" />}
            className="animate-slide-up stagger-3"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {barChartData.length > 0 && (
          <ChartCard
            title="Distribuição por Categoria"
            subtitle="Top 10 registros"
            className="animate-slide-up"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {pieChartData.length > 0 && (
          <ChartCard
            title="Proporção das Categorias"
            subtitle="Distribuição percentual"
            className="animate-slide-up stagger-1"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Line Chart */}
      {lineChartData.length > 0 && data.summary.numericColumns.length >= 2 && (
        <ChartCard
          title="Tendência de Valores"
          subtitle="Comparação entre colunas numéricas"
          className="animate-slide-up"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {data.summary.numericColumns.slice(0, 3).map((col, index) => (
                  <Line
                    key={col}
                    type="monotone"
                    dataKey={col}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Data Preview */}
      <ChartCard
        title="Prévia dos Dados"
        subtitle={`Exibindo as primeiras ${Math.min(5, data.rows.length)} linhas`}
        className="animate-slide-up"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {data.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left font-semibold text-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 5).map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border/50 transition-colors hover:bg-muted/50"
                >
                  {data.headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-3 text-muted-foreground"
                    >
                      {String(row[header] ?? "-").slice(0, 50)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

export default Dashboard;
