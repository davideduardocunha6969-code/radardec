import { useMemo, useState } from "react";
import { RefreshCw, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { TaskDashboard } from "@/components/TaskDashboard";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { HolidayManager } from "@/components/HolidayManager";
import { ControllerFilter } from "@/components/ControllerFilter";
import { useSheetData } from "@/hooks/useSheetData";
import { useHolidays } from "@/hooks/useHolidays";

const Index = () => {
  const { sheets, tasks, conformityErrors, isLoading, error, lastUpdated, refetch } = useSheetData();
  const { 
    holidays, 
    loading: holidaysLoading, 
    addHoliday, 
    addHolidayRange, 
    removeHoliday, 
    clearAllHolidays 
  } = useHolidays();
  
  // Filtros
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedControllers, setSelectedControllers] = useState<string[]>([]);

  // Lista de controllers únicos
  const controllers = useMemo(() => {
    return [...new Set(tasks.map(t => t.controller))].sort();
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados da planilha...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Buscando todas as abas da planilha...
          </p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header lastUpdate={lastUpdated} isLive={true} />

      <main className="container mx-auto px-4 py-8">
        {/* Filtros e Ações */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
              <ControllerFilter
                controllers={controllers}
                selectedControllers={selectedControllers}
                onSelectionChange={setSelectedControllers}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <HolidayManager
                holidays={holidays}
                loading={holidaysLoading}
                onAddHoliday={addHoliday}
                onAddHolidayRange={addHolidayRange}
                onRemoveHoliday={removeHoliday}
                onClearAll={clearAllHolidays}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          
          {/* Info das abas carregadas */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>
              {sheets.length} aba(s) carregada(s) • {tasks.length} tarefa(s) • {conformityErrors.length} erro(s) de conformidade
            </span>
          </div>
        </div>

        {/* Dashboard */}
        <TaskDashboard
          tasks={tasks}
          conformityErrors={conformityErrors}
          holidays={holidays}
          startDate={startDate}
          endDate={endDate}
          selectedControllers={selectedControllers}
        />
      </main>
    </div>
  );
};

export default Index;
