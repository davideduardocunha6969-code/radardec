const GestaoGeral = () => {
  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header da página */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground font-display">
          Radar Geral
        </h1>
        <p className="text-muted-foreground mt-1">
          Dashboard consolidado de métricas e performance
        </p>
      </div>

      {/* Área para novo conteúdo */}
      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <p className="text-muted-foreground">Área disponível para reformulação</p>
      </div>
    </div>
  );
};

export default GestaoGeral;
