import { useState } from "react";
import { Loader2, AlertTriangle, Database, ChevronDown } from "lucide-react";
import { useGestaoData } from "@/hooks/useGestaoData";
import { AnalysisChat } from "@/components/gestao/AnalysisChat";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  DataSourceSelector, 
  SelectedSources, 
  spreadsheetSources, 
  supabaseSources 
} from "@/components/gestao/DataSourceSelector";

// Initialize with all sources selected
const getInitialSelection = (): SelectedSources => {
  const spreadsheets: { [key: string]: string[] } = {};
  spreadsheetSources.forEach(sheet => {
    spreadsheets[sheet.key] = sheet.tabs.map(t => t.gid);
  });
  return {
    spreadsheets,
    supabase: supabaseSources.map(s => s.id),
  };
};

const GestaoGeral = () => {
  const { contextData, dataSummary, isLoading, hasError, errorMessage } = useGestaoData();
  const [selectedSources, setSelectedSources] = useState<SelectedSources>(getInitialSelection);

  // Calculate total records
  const totalRecords = Object.values(dataSummary).reduce((a, b) => a + b, 0);
  const totalTabs = spreadsheetSources.reduce((acc, sheet) => acc + sheet.tabs.length, 0);

  if (hasError) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <p>Erro ao carregar dados</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Gestão Geral
            </h1>
            <p className="text-muted-foreground mt-1">
              Assistente de análise inteligente com dados de todos os setores
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Data source selector */}
            <DataSourceSelector 
              selectedSources={selectedSources}
              onSelectionChange={setSelectedSources}
            />

            {/* Data status with popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Carregando dados...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-3 w-3" />
                      <span>
                        {spreadsheetSources.length} planilhas • {totalTabs} abas • {totalRecords.toLocaleString()} registros
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0 bg-popover" align="end">
                <div className="p-3 border-b border-border bg-muted/30">
                  <h4 className="font-semibold text-sm">Base de Dados - Google Sheets</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {spreadsheetSources.length} planilhas com {totalTabs} abas integradas
                  </p>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {spreadsheetSources.map((sheet, idx) => (
                    <div key={idx} className="border-b border-border last:border-b-0">
                      <div className="px-3 py-2 bg-muted/20">
                        <span className="font-medium text-sm">{sheet.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({sheet.tabs.length} abas)
                        </span>
                      </div>
                      <div className="px-3 py-2 space-y-1">
                        {sheet.tabs.map((tab, tabIdx) => (
                          <div key={tabIdx} className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-muted-foreground w-24 shrink-0">
                              GID {tab.gid}
                            </span>
                            <span className="font-medium">{tab.name}</span>
                            <span className="text-muted-foreground">— {tab.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    <strong>+ Supabase:</strong> Atividades Marketing, Conteúdos, Ideias, Atendimentos Closers, Tipos de Produtos, Transcrições
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <AnalysisChat 
          contextData={contextData} 
          isLoadingData={isLoading} 
          selectedSources={selectedSources}
        />
      </div>
    </div>
  );
};

export default GestaoGeral;
