import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}
      <div className="prose prose-base dark:prose-invert max-w-none 
        prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
        prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
        prose-strong:text-foreground prose-strong:font-semibold
        prose-li:text-foreground prose-li:leading-relaxed
        prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc
        prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal
        prose-li:my-1
        prose-img:rounded-lg prose-img:max-w-full prose-img:my-6
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg
        prose-hr:my-6 prose-hr:border-border
      ">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, ...props }) => (
              <img 
                {...props} 
                className="rounded-lg max-w-full h-auto shadow-md" 
                loading="lazy"
              />
            ),
            a: ({ node, ...props }) => (
              <a 
                {...props} 
                className="text-primary hover:underline font-medium" 
                target="_blank" 
                rel="noopener noreferrer"
              />
            ),
            p: ({ node, ...props }) => (
              <p {...props} className="mb-4 leading-relaxed" />
            ),
            ul: ({ node, ...props }) => (
              <ul {...props} className="my-4 pl-6 space-y-2 list-disc" />
            ),
            ol: ({ node, ...props }) => (
              <ol {...props} className="my-4 pl-6 space-y-2 list-decimal" />
            ),
            li: ({ node, ...props }) => (
              <li {...props} className="leading-relaxed" />
            ),
            h1: ({ node, ...props }) => (
              <h1 {...props} className="text-2xl font-bold mt-6 mb-4" />
            ),
            h2: ({ node, ...props }) => (
              <h2 {...props} className="text-xl font-semibold mt-5 mb-3" />
            ),
            h3: ({ node, ...props }) => (
              <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />
            ),
            strong: ({ node, ...props }) => (
              <strong {...props} className="font-semibold text-foreground" />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote {...props} className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" />
            ),
          }}
        >
          {data.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
