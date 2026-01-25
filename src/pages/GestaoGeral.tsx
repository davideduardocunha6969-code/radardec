import { Loader2, AlertTriangle, Database } from "lucide-react";
import { useGestaoData } from "@/hooks/useGestaoData";
import { AnalysisChat } from "@/components/gestao/AnalysisChat";

const GestaoGeral = () => {
  const { contextData, dataSummary, isLoading, hasError, errorMessage } = useGestaoData();

  // Calculate total records
  const totalRecords = Object.values(dataSummary).reduce((a, b) => a + b, 0);

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
                <span className="hidden lg:inline">
                  {dataSummary.comercialAtendimentos} comercial • {dataSummary.bancarioIniciais} bancário • {dataSummary.controladoriaTarefas} controladoria • {dataSummary.previdenciarioPeticoes} previdenciário • {dataSummary.trabalhistaIniciais} trabalhista • {dataSummary.marketingAtividades} atividades • {dataSummary.marketingConteudos} conteúdos • {dataSummary.closersAtendimentos} atendimentos
                </span>
                <span className="lg:hidden">
                  {totalRecords} registros
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
