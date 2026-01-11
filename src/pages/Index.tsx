import { useState, useEffect } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { Radar, Scale, FileText, Users, TrendingUp, Clock } from "lucide-react";

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

// Demo data - Dados de controladoria jurídica
const DEMO_DATA: SheetData = {
  headers: ["Cliente", "Processo", "Valor Causa", "Honorários", "Status", "Responsável", "Comarca"],
  rows: [
    { Cliente: "Empresa Alpha LTDA", Processo: "0001234-12.2024", "Valor Causa": 250000, Honorários: 37500, Status: "Em Andamento", Responsável: "Dr. Silva", Comarca: "São Paulo" },
    { Cliente: "Tech Solutions S.A.", Processo: "0002345-23.2024", "Valor Causa": 180000, Honorários: 27000, Status: "Audiência Marcada", Responsável: "Dra. Santos", Comarca: "Rio de Janeiro" },
    { Cliente: "Indústria Beta", Processo: "0003456-34.2024", "Valor Causa": 520000, Honorários: 78000, Status: "Sentença Favorável", Responsável: "Dr. Costa", Comarca: "Belo Horizonte" },
    { Cliente: "Comercial Gama", Processo: "0004567-45.2024", "Valor Causa": 95000, Honorários: 14250, Status: "Recurso", Responsável: "Dr. Silva", Comarca: "São Paulo" },
    { Cliente: "Serviços Delta EIRELI", Processo: "0005678-56.2024", "Valor Causa": 340000, Honorários: 51000, Status: "Em Andamento", Responsável: "Dra. Oliveira", Comarca: "Curitiba" },
    { Cliente: "Holding Epsilon", Processo: "0006789-67.2024", "Valor Causa": 890000, Honorários: 133500, Status: "Negociação", Responsável: "Dr. Costa", Comarca: "Brasília" },
    { Cliente: "Construtora Zeta", Processo: "0007890-78.2024", "Valor Causa": 1200000, Honorários: 180000, Status: "Em Andamento", Responsável: "Dra. Santos", Comarca: "Porto Alegre" },
    { Cliente: "Logística Eta", Processo: "0008901-89.2024", "Valor Causa": 75000, Honorários: 11250, Status: "Encerrado", Responsável: "Dr. Silva", Comarca: "Florianópolis" },
    { Cliente: "Pharma Theta", Processo: "0009012-90.2024", "Valor Causa": 430000, Honorários: 64500, Status: "Perícia", Responsável: "Dra. Oliveira", Comarca: "São Paulo" },
    { Cliente: "Agro Iota S.A.", Processo: "0010123-01.2024", "Valor Causa": 680000, Honorários: 102000, Status: "Citação", Responsável: "Dr. Costa", Comarca: "Goiânia" },
  ],
  summary: {
    totalRows: 10,
    totalColumns: 7,
    numericColumns: ["Valor Causa", "Honorários"],
    textColumns: ["Cliente", "Processo", "Status", "Responsável", "Comarca"],
  },
};

const Index = () => {
  const [sheetData, setSheetData] = useState<SheetData>(DEMO_DATA);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);

  // Simula atualizações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Atualiza timestamp a cada minuto

    return () => clearInterval(interval);
  }, []);

  // Calcula estatísticas resumidas
  const totalCausas = sheetData.rows.reduce((acc, row) => acc + Number(row["Valor Causa"] || 0), 0);
  const totalHonorarios = sheetData.rows.reduce((acc, row) => acc + Number(row["Honorários"] || 0), 0);
  const processosAtivos = sheetData.rows.filter(row => 
    row.Status !== "Encerrado" && row.Status !== "Sentença Favorável"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Header lastUpdate={lastUpdate} isLive={isLive} />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Stats */}
        <div className="mb-8 animate-fade-in">
          <div className="rounded-2xl gradient-hero p-8 text-primary-foreground shadow-elevated">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Painel de Controladoria</h1>
              <p className="text-primary-foreground/80 text-sm">
                Visão consolidada do escritório
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary-foreground/20 p-3">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Valor Total em Causas</p>
                  <p className="text-2xl font-bold">
                    {totalCausas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary-foreground/20 p-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Honorários Projetados</p>
                  <p className="text-2xl font-bold">
                    {totalHonorarios.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary-foreground/20 p-3">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Processos Ativos</p>
                  <p className="text-2xl font-bold">{processosAtivos}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary-foreground/20 p-3">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Total de Clientes</p>
                  <p className="text-2xl font-bold">{sheetData.rows.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <Dashboard data={sheetData} />

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="h-3 w-3" />
            Dados sincronizados automaticamente com Google Sheets
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
