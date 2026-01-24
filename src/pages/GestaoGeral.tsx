import { Loader2, AlertTriangle, Database } from "lucide-react";
import { useCommercialData } from "@/hooks/useCommercialData";
import { useBancarioData } from "@/hooks/useBancarioData";
import { useSheetData } from "@/hooks/useSheetData";
import { usePrevidenciarioData } from "@/hooks/usePrevidenciarioData";
import { useTrabalhistaData } from "@/hooks/useTrabalhistaData";
import { AnalysisChat } from "@/components/gestao/AnalysisChat";

const GestaoGeral = () => {
  // Hooks de dados
  const { 
    data: commercialRecords, 
    sdrData,
    indicacoesData,
    indicacoesRecebidasData,
    saneamentoData: saneamentoComercialData,
    administrativoData,
    testemunhasData,
    administrativo2Data,
    documentosFisicosData,
    bancarioAgendamentosData,
    isLoading: commercialLoading, 
    error: commercialError 
  } = useCommercialData();
  
  const { 
    iniciaisData, 
    saneamentoData: saneamentoBancarioData, 
    transitoData, 
    isLoading: bancarioLoading, 
    error: bancarioError 
  } = useBancarioData();

  const { 
    tasks, 
    conformityErrors, 
    deadlineErrors, 
    isLoading: controladoriaLoading, 
    error: controladoriaError 
  } = useSheetData();

  const { 
    data: previdenciarioData, 
    isLoading: previdenciarioLoading, 
    error: previdenciarioError 
  } = usePrevidenciarioData();

  const { 
    data: trabalhistaData, 
    isLoading: trabalhistaLoading, 
    error: trabalhistaError 
  } = useTrabalhistaData();

  // Loading state
  const isLoading = commercialLoading || bancarioLoading || controladoriaLoading || previdenciarioLoading || trabalhistaLoading;
  const hasError = commercialError || bancarioError || controladoriaError || previdenciarioError || trabalhistaError;

  // Prepare context for AI
  const contextData = {
    commercial: {
      records: commercialRecords,
      sdrData,
      indicacoesData,
      indicacoesRecebidasData,
      saneamentoData: saneamentoComercialData,
      administrativoData,
      testemunhasData,
      administrativo2Data,
      documentosFisicosData,
      bancarioAgendamentosData,
    },
    bancario: {
      iniciaisData,
      saneamentoData: saneamentoBancarioData,
      transitoData,
    },
    controladoria: {
      tasks,
      conformityErrors,
      deadlineErrors,
    },
    previdenciario: previdenciarioData || {},
    trabalhista: trabalhistaData || {},
  };

  // Data loaded summary
  const dataSummary = {
    comercial: commercialRecords.length,
    bancarioIniciais: iniciaisData.length,
    controladoriaTarefas: tasks.length,
    previdenciario: previdenciarioData?.peticoesIniciais?.length || 0,
    trabalhista: trabalhistaData?.iniciais?.length || 0,
  };

  if (hasError) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <p>Erro ao carregar dados</p>
          <p className="text-sm text-muted-foreground">
            {commercialError || bancarioError || controladoriaError || 
             (previdenciarioError instanceof Error ? previdenciarioError.message : '') ||
             (trabalhistaError instanceof Error ? trabalhistaError.message : '')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Gestão Geral
            </h1>
            <p className="text-muted-foreground mt-1">
              Assistente de análise inteligente com dados de todos os setores
            </p>
          </div>
          
          {/* Data status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Carregando dados...</span>
              </>
            ) : (
              <>
                <Database className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {dataSummary.comercial} comercial • {dataSummary.bancarioIniciais} bancário • {dataSummary.controladoriaTarefas} controladoria • {dataSummary.previdenciario} previdenciário • {dataSummary.trabalhista} trabalhista
                </span>
                <span className="sm:hidden">
                  {Object.values(dataSummary).reduce((a, b) => a + b, 0)} registros
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <AnalysisChat contextData={contextData} isLoadingData={isLoading} />
      </div>
    </div>
  );
};

export default GestaoGeral;
