import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import SheetInput from "@/components/SheetInput";
import Dashboard from "@/components/Dashboard";
import { BarChart3, Sparkles, Shield, Zap } from "lucide-react";

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

// Demo data for preview
const DEMO_DATA: SheetData = {
  headers: ["Produto", "Vendas", "Receita", "Região", "Trimestre"],
  rows: [
    { Produto: "Notebook Pro", Vendas: 245, Receita: 489500, Região: "Sudeste", Trimestre: "Q1" },
    { Produto: "Smartphone X", Vendas: 532, Receita: 425600, Região: "Sul", Trimestre: "Q1" },
    { Produto: "Tablet Plus", Vendas: 178, Receita: 142400, Região: "Nordeste", Trimestre: "Q2" },
    { Produto: "Monitor 4K", Vendas: 312, Receita: 343200, Região: "Sudeste", Trimestre: "Q2" },
    { Produto: "Teclado RGB", Vendas: 856, Receita: 171200, Região: "Norte", Trimestre: "Q3" },
    { Produto: "Mouse Gamer", Vendas: 943, Receita: 188600, Região: "Centro-Oeste", Trimestre: "Q3" },
    { Produto: "Webcam HD", Vendas: 421, Receita: 168400, Região: "Sul", Trimestre: "Q4" },
    { Produto: "Headset Pro", Vendas: 687, Receita: 343500, Região: "Sudeste", Trimestre: "Q4" },
    { Produto: "SSD 1TB", Vendas: 534, Receita: 267000, Região: "Nordeste", Trimestre: "Q1" },
    { Produto: "RAM 32GB", Vendas: 289, Receita: 231200, Região: "Sul", Trimestre: "Q2" },
  ],
  summary: {
    totalRows: 10,
    totalColumns: 5,
    numericColumns: ["Vendas", "Receita"],
    textColumns: ["Produto", "Região", "Trimestre"],
  },
};

const Index = () => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);

    // Simulate API call - replace with actual Google Sheets API integration
    setTimeout(() => {
      toast.success("Planilha analisada com sucesso!");
      setSheetData(DEMO_DATA);
      setIsLoading(false);
    }, 2000);
  };

  const handleDemoClick = () => {
    setSheetData(DEMO_DATA);
    toast.success("Dados de demonstração carregados!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {!sheetData ? (
          <div className="mx-auto max-w-4xl">
            {/* Hero Section */}
            <div className="mb-12 text-center animate-fade-in">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Análise inteligente de dados
              </div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Transforme seus dados em{" "}
                <span className="text-primary">insights valiosos</span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Conecte sua planilha do Google Sheets e obtenha análises
                instantâneas com gráficos interativos, estatísticas detalhadas e
                visualizações poderosas.
              </p>
            </div>

            {/* Input Section */}
            <div className="mb-12 animate-slide-up">
              <SheetInput onSubmit={handleAnalyze} isLoading={isLoading} />

              <div className="mt-6 text-center">
                <button
                  onClick={handleDemoClick}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Ou veja uma demonstração com dados de exemplo →
                </button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid gap-6 sm:grid-cols-3 animate-slide-up stagger-2">
              <div className="rounded-xl bg-card p-6 shadow-card">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-card-foreground">
                  Visualizações Ricas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gráficos de barras, pizza e linha gerados automaticamente a
                  partir dos seus dados.
                </p>
              </div>

              <div className="rounded-xl bg-card p-6 shadow-card">
                <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-3">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold text-card-foreground">
                  Análise Instantânea
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estatísticas como soma, média, mínimo e máximo calculadas em
                  segundos.
                </p>
              </div>

              <div className="rounded-xl bg-card p-6 shadow-card">
                <div className="mb-4 inline-flex rounded-lg bg-success/10 p-3">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <h3 className="mb-2 font-semibold text-card-foreground">
                  Seguro e Privado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Seus dados são processados com segurança e nunca armazenados
                  em nossos servidores.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Dashboard de Análise
                </h2>
                <p className="text-muted-foreground">
                  Visualização completa dos dados da planilha
                </p>
              </div>
              <button
                onClick={() => setSheetData(null)}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                Analisar outra planilha
              </button>
            </div>

            <Dashboard data={sheetData} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
