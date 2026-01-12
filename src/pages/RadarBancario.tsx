import { Loader2 } from "lucide-react";
import { useCommercialData } from "@/hooks/useCommercialData";

const RadarBancario = () => {
  const { data, weeks, bancarioAgendamentosData, isLoading, error } = useCommercialData();

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Radar Bancário
            </h1>
            <p className="text-muted-foreground mt-1">
              Dashboard de métricas do setor bancário
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando dados...</span>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo será construído aqui */}
      <div className="text-center py-12 text-muted-foreground">
        <p>Vamos construir o conteúdo juntos!</p>
      </div>
    </div>
  );
};

export default RadarBancario;
