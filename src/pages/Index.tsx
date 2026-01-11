import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { Scale, FileText, Users, TrendingUp, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SheetData {
  headers: string[];
  rows: Record<string, string | number>[];
  summary: {
    totalRows: number;
    [key: string]: number;
  };
}

const Index = () => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSheetData = useCallback(async () => {
    try {
      console.log('Fetching sheet data...');
      
      const { data, error } = await supabase.functions.invoke('fetch-sheet');
      
      if (error) {
        console.error('Error invoking function:', error);
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar dados');
      }
      
      console.log('Sheet data received:', data.data);
      
      // Converte as linhas para o formato esperado
      const headers = data.data.headers;
      const rows = data.data.rows.map((row: string[]) => {
        const rowObj: Record<string, string | number> = {};
        headers.forEach((header: string, index: number) => {
          rowObj[header] = row[index] || '';
        });
        return rowObj;
      });
      
      setSheetData({
        headers,
        rows,
        summary: data.data.summary
      });
      
      setLastUpdate(new Date(data.data.lastUpdated));
      setError(null);
      
    } catch (err) {
      console.error('Error fetching sheet:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar dados da planilha');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Busca dados iniciais e atualiza periodicamente
  useEffect(() => {
    fetchSheetData();
    
    // Atualiza a cada 5 minutos
    const interval = setInterval(() => {
      fetchSheetData();
    }, 300000);

    return () => clearInterval(interval);
  }, [fetchSheetData]);

  // Calcula estatísticas resumidas
  const totalCausas = sheetData?.rows.reduce((acc, row) => {
    const value = parseFloat(
      String(row["Valor da Causa"] || row["Valor Causa"] || 0)
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );
    return acc + (isNaN(value) ? 0 : value);
  }, 0) || 0;

  const totalHonorarios = sheetData?.rows.reduce((acc, row) => {
    const value = parseFloat(
      String(row["Honorários"] || row["Honorario"] || 0)
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );
    return acc + (isNaN(value) ? 0 : value);
  }, 0) || 0;

  const processosAtivos = sheetData?.rows.filter(row => {
    const status = String(row.Status || row.status || '').toLowerCase();
    return !status.includes('encerrado') && !status.includes('arquivado') && !status.includes('baixado');
  }).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados da planilha...</p>
        </div>
      </div>
    );
  }

  if (error && !sheetData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar dados: {error}</p>
          <button 
            onClick={fetchSheetData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

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
                  <p className="text-sm opacity-80">Total de Processos</p>
                  <p className="text-2xl font-bold">{sheetData?.rows.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {sheetData && <Dashboard data={sheetData} />}

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
