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
  Scale,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";

interface SheetData {
  headers: string[];
  rows: Record<string, string | number>[];
  summary: {
    totalRows: number;
    [key: string]: number;
  };
}

interface DashboardProps {
  data: SheetData;
}

const CHART_COLORS = [
  "hsl(220, 65%, 25%)",
  "hsl(38, 70%, 50%)",
  "hsl(160, 50%, 40%)",
  "hsl(200, 60%, 45%)",
  "hsl(0, 65%, 48%)",
];

const Dashboard = ({ data }: DashboardProps) => {
  // Análise por Status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.rows.forEach((row) => {
      const status = String(row.Status || "Outros");
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Análise por Responsável
  const responsavelData = useMemo(() => {
    const totals: Record<string, number> = {};
    data.rows.forEach((row) => {
      const resp = String(row.Responsável || "Outros");
      totals[resp] = (totals[resp] || 0) + Number(row["Valor Causa"] || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Análise por Comarca
  const comarcaData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.rows.forEach((row) => {
      const comarca = String(row.Comarca || "Outros");
      counts[comarca] = (counts[comarca] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [data]);

  // Honorários por processo
  const honorariosData = useMemo(() => {
    return data.rows
      .map((row) => ({
        cliente: String(row.Cliente || "").slice(0, 15),
        honorarios: Number(row.Honorários || 0),
        causa: Number(row["Valor Causa"] || 0),
      }))
      .sort((a, b) => b.honorarios - a.honorarios)
      .slice(0, 8);
  }, [data]);

  // Métricas calculadas
  const avgHonorarios = useMemo(() => {
    const values = data.rows.map((r) => Number(r.Honorários || 0)).filter((v) => v > 0);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }, [data]);

  const maiorCausa = useMemo(() => {
    return Math.max(...data.rows.map((r) => Number(r["Valor Causa"] || 0)));
  }, [data]);

  const taxaSucesso = useMemo(() => {
    const favoraveis = data.rows.filter(
      (r) => r.Status === "Sentença Favorável" || r.Status === "Encerrado"
    ).length;
    return data.rows.length > 0 ? (favoraveis / data.rows.length) * 100 : 0;
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Métricas Secundárias */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Média de Honorários"
          value={avgHonorarios.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          })}
          subtitle="Por processo"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-1"
        />
        <MetricCard
          title="Maior Causa"
          value={maiorCausa.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          })}
          subtitle="Valor da causa"
          icon={<Scale className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-2"
        />
        <MetricCard
          title="Taxa de Êxito"
          value={`${taxaSucesso.toFixed(0)}%`}
          subtitle="Casos encerrados/favoráveis"
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          variant="success"
          className="animate-slide-up stagger-3"
        />
        <MetricCard
          title="Comarcas Ativas"
          value={comarcaData.length}
          subtitle="Distribuição geográfica"
          icon={<MapPin className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-4"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Honorários por Cliente */}
        <ChartCard
          title="Honorários por Cliente"
          subtitle="Top 8 maiores contratos"
          className="animate-slide-up"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={honorariosData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) =>
                    v.toLocaleString("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                    })
                  }
                />
                <YAxis
                  type="category"
                  dataKey="cliente"
                  width={100}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) =>
                    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  }
                />
                <Bar dataKey="honorarios" name="Honorários" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Status dos Processos */}
        <ChartCard
          title="Status dos Processos"
          subtitle="Distribuição por fase processual"
          className="animate-slide-up stagger-1"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                >
                  {statusData.map((_, index) => (
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

        {/* Distribuição por Comarca */}
        <ChartCard
          title="Distribuição por Comarca"
          subtitle="Número de processos por localidade"
          className="animate-slide-up"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comarcaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" name="Processos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Carteira por Advogado */}
        <ChartCard
          title="Carteira por Advogado"
          subtitle="Valor total das causas sob responsabilidade"
          className="animate-slide-up stagger-1"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responsavelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) =>
                    v.toLocaleString("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                    })
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) =>
                    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  }
                />
                <Bar dataKey="value" name="Valor Total" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Tabela de Processos */}
      <ChartCard
        title="Carteira de Processos"
        subtitle="Visão detalhada de todos os processos ativos"
        className="animate-slide-up"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {data.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border/50 transition-colors hover:bg-muted/50"
                >
                  {data.headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-3 text-muted-foreground whitespace-nowrap"
                    >
                      {header === "Valor Causa" || header === "Honorários"
                        ? Number(row[header]).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : header === "Status"
                        ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              row[header] === "Sentença Favorável"
                                ? "bg-success/10 text-success"
                                : row[header] === "Encerrado"
                                ? "bg-muted text-muted-foreground"
                                : row[header] === "Recurso" || row[header] === "Perícia"
                                ? "bg-warning/10 text-warning"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {String(row[header])}
                          </span>
                        )
                        : String(row[header] ?? "-")}
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
