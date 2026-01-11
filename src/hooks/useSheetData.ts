import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface SheetData {
  name: string;
  headers: string[];
  rows: string[][];
}

export interface TaskData {
  colaborador: string;
  tarefa: string;
  dataDistribuicao: Date | null;
  dataCumprimento: Date | null;
  status: string;
  rawRow: string[];
}

export interface SheetResponse {
  sheets: SheetData[];
  totalSheets: number;
  totalTasks: number;
  lastUpdated: string;
}

// Função para parsear datas em formato brasileiro (dd/mm/yyyy)
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Tenta formato dd/mm/yyyy
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Tenta formato ISO
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  return null;
}

export function useSheetData() {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const processSheets = useCallback((sheetsData: SheetData[]): TaskData[] => {
    const allTasks: TaskData[] = [];
    
    sheetsData.forEach(sheet => {
      // Usando índices fixos conforme especificado:
      // Coluna A (0) = Tarefa/Atividade
      // Coluna B (1) = Data de Distribuição
      // Coluna C (2) = (não usado)
      // Coluna D (3) = Data de Cumprimento/Término
      const tarefaIdx = 0;      // Coluna A
      const dataDistIdx = 1;    // Coluna B - Data de distribuição
      const dataCumpIdx = 3;    // Coluna D - Data de cumprimento/término
      
      sheet.rows.forEach(row => {
        const task: TaskData = {
          colaborador: sheet.name,
          tarefa: row[tarefaIdx] || '',
          dataDistribuicao: parseDate(row[dataDistIdx]),
          dataCumprimento: parseDate(row[dataCumpIdx]),
          status: '', // Status será inferido pela presença ou não de dataCumprimento
          rawRow: row
        };
        
        // Só adiciona se tiver algum conteúdo relevante
        if (task.tarefa || task.dataDistribuicao) {
          allTasks.push(task);
        }
      });
    });
    
    return allTasks;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching sheet data...');
      setIsLoading(true);
      
      const { data, error: invokeError } = await supabase.functions.invoke('fetch-sheet');
      
      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar dados');
      }
      
      console.log('Sheet data received:', data.data);
      
      setSheets(data.data.sheets);
      setTasks(processSheets(data.data.sheets));
      setLastUpdated(new Date(data.data.lastUpdated));
      setError(null);
      
    } catch (err) {
      console.error('Error fetching sheet:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast.error('Erro ao carregar dados da planilha');
    } finally {
      setIsLoading(false);
    }
  }, [processSheets]);

  useEffect(() => {
    fetchData();
    
    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    sheets,
    tasks,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData
  };
}
