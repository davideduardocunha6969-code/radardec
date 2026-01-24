import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricData {
  value: number | string;
  label: string;
  trend?: string;
  trendUp?: boolean;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

interface TextData {
  content: string;
}

export interface VisualizationSpec {
  type: "metric" | "chart" | "table" | "text";
  title?: string;
  data: MetricData | ChartData[] | TableData | TextData | unknown;
  config?: {
    chartType?: "bar" | "line" | "pie";
    [key: string]: unknown;
  };
}

interface DynamicVisualizationProps {
  visualization: VisualizationSpec;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

export function DynamicVisualization({ visualization }: DynamicVisualizationProps) {
  const { type, title, data, config } = visualization;

  switch (type) {
    case "metric":
      return <MetricCard title={title} data={data as MetricData} />;
    case "chart":
      return <ChartCard title={title} data={data as ChartData[]} config={config} />;
    case "table":
      return <TableCard title={title} data={data as TableData} />;
    case "text":
      return <TextCard title={title} data={data as TextData} />;
    default:
      return null;
  }
}

function MetricCard({ title, data }: { title?: string; data: MetricData }) {
  const TrendIcon = data.trendUp === true 
    ? TrendingUp 
    : data.trendUp === false 
      ? TrendingDown 
      : Minus;

  const trendColor = data.trendUp === true 
    ? "text-success" 
    : data.trendUp === false 
      ? "text-destructive" 
      : "text-muted-foreground";

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title || data.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">
            {typeof data.value === 'number' 
              ? data.value.toLocaleString('pt-BR') 
              : data.value}
          </span>
          {data.trend && (
            <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span>{data.trend}</span>
            </div>
          )}
        </div>
        {title && data.label && (
          <p className="text-xs text-muted-foreground mt-1">{data.label}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({ 
  title, 
  data, 
  config 
}: { 
  title?: string; 
  data: ChartData[]; 
  config?: { chartType?: string; [key: string]: unknown } 
}) {
  const chartType = config?.chartType || "bar";

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TableCard({ title, data }: { title?: string; data: TableData }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {data.headers.map((header, i) => (
                  <th key={i} className="text-left py-2 px-3 font-medium text-muted-foreground">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border/50 hover:bg-muted/50">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="py-2 px-3 text-foreground">
                      {typeof cell === 'number' ? cell.toLocaleString('pt-BR') : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TextCard({ title, data }: { title?: string; data: TextData }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {data.content}
        </p>
      </CardContent>
    </Card>
  );
}
