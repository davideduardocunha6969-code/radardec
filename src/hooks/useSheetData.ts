import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface SheetData {
  name: string;
  headers: string[];
  rows: string[][];
}

export interface SectorMapping {
  tipoAcao: string;
  setor: string;
}

export interface TaskData {
  controller: string;
  tarefa: string;
  numeroProcesso: string;
  tipoAcao: string;
  setor: string;
  dataDistribuicao: Date | null;
  dataCumprimento: Date | null;
  status: string;
  rawRow: string[];
}

export interface ConformityError {
  date: Date | null;
  recipient: string;
  rawRow: string[];
}

export interface DeadlineError {
  date: Date | null;
  controller: string;
  processNumber: string;
  rawRow: string[];
}

export interface IntimacaoPrevidenciario {
  dataCumprimento: Date | null;
  prazoFatal: Date | null;
  tipoCompromisso: string;
  destinatario: string;
  numeroProcesso: string;
  rawRow: string[];
}

export interface SheetResponse {
  sheets: SheetData[];
  sectorMapping: SectorMapping[];
  conformityErrors: { date: string; recipient: string; rawRow: string[] }[];
  deadlineErrors: { date: string; controller: string; processNumber: string; rawRow: string[] }[];
  intimacoesPrevidenciario: { dataCumprimento: string; prazoFatal: string; tipoCompromisso: string; destinatario: string; numeroProcesso: string; rawRow: string[] }[];
  totalSheets: number;
  totalTasks: number;
  totalConformityErrors: number;
  totalDeadlineErrors: number;
  totalIntimacoesPrevidenciario: number;
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
  const [conformityErrors, setConformityErrors] = useState<ConformityError[]>([]);
  const [deadlineErrors, setDeadlineErrors] = useState<DeadlineError[]>([]);
  const [intimacoesPrevidenciario, setIntimacoesPrevidenciario] = useState<IntimacaoPrevidenciario[]>([]);
  const [sectorMapping, setSectorMapping] = useState<SectorMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const processSheets = useCallback((sheetsData: SheetData[], mappings: SectorMapping[]): TaskData[] => {
    const allTasks: TaskData[] = [];
    
    // Cria um mapa para busca rápida de setor por tipo de ação
    const sectorMap = new Map<string, string>();
    mappings.forEach(m => {
      // Normaliza removendo espaços extras e convertendo para uppercase
      const normalizedKey = m.tipoAcao.toUpperCase().trim().replace(/\s+/g, ' ');
      sectorMap.set(normalizedKey, m.setor);
    });
    
    // Função para encontrar o setor correspondente
    const findSector = (tipoAcao: string): string => {
      if (!tipoAcao) return 'Não classificado';
      
      const normalized = tipoAcao.toUpperCase().trim().replace(/\s+/g, ' ');
      
      // Busca exata primeiro
      if (sectorMap.has(normalized)) {
        return sectorMap.get(normalized)!;
      }
      
      // Busca parcial - verifica se algum mapeamento está contido no tipo de ação
      for (const [key, value] of sectorMap.entries()) {
        if (normalized.includes(key) || key.includes(normalized)) {
          return value;
        }
      }
      
      return 'Não classificado';
    };
    
    sheetsData.forEach(sheet => {
      // Usando índices fixos conforme especificado:
      // Coluna A (0) = Tarefa/Atividade
      // Coluna B (1) = Data de Distribuição
      // Coluna D (3) = Data de Cumprimento/Término
      // Coluna K (10) = Controller
      // Coluna M (12) = Número do Processo
      // Coluna O (14) = Tipo de Ação
      const tarefaIdx = 0;       // Coluna A
      const dataDistIdx = 1;     // Coluna B - Data de distribuição
      const dataCumpIdx = 3;     // Coluna D - Data de cumprimento/término
      const controllerIdx = 10;  // Coluna K - Controller
      const numProcessoIdx = 12; // Coluna M - Número do processo
      const tipoAcaoIdx = 14;    // Coluna O - Tipo de ação
      
      sheet.rows.forEach(row => {
        const tipoAcao = (row[tipoAcaoIdx] || '').trim();
        const setor = findSector(tipoAcao);
        const controller = (row[controllerIdx] || '').trim();
        
        const task: TaskData = {
          controller: controller || 'Não atribuído',
          tarefa: row[tarefaIdx] || '',
          numeroProcesso: row[numProcessoIdx] || '',
          tipoAcao: row[tipoAcaoIdx] || '',
          setor,
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
      console.log('Conformity errors from API:', data.data.conformityErrors);
      
      const mappings = data.data.sectorMapping || [];
      const rawConformityErrors = data.data.conformityErrors || [];
      const rawDeadlineErrors = data.data.deadlineErrors || [];
      const rawIntimacoesPrevidenciario = data.data.intimacoesPrevidenciario || [];
      
      // Processa erros de conformidade
      const processedConformityErrors: ConformityError[] = rawConformityErrors.map((err: { date: string; recipient: string; rawRow: string[] }) => ({
        date: parseDate(err.date),
        recipient: err.recipient || 'Não identificado',
        rawRow: err.rawRow
      }));
      
      // Processa erros de prazo
      const processedDeadlineErrors: DeadlineError[] = rawDeadlineErrors.map((err: { date: string; controller: string; processNumber: string; rawRow: string[] }) => ({
        date: parseDate(err.date),
        controller: err.controller || 'Não identificado',
        processNumber: err.processNumber || '',
        rawRow: err.rawRow
      }));
      
      // Processa intimações previdenciário
      const processedIntimacoesPrevidenciario: IntimacaoPrevidenciario[] = rawIntimacoesPrevidenciario.map((item: { dataCumprimento: string; prazoFatal: string; tipoCompromisso: string; destinatario: string; numeroProcesso: string; rawRow: string[] }) => ({
        dataCumprimento: parseDate(item.dataCumprimento),
        prazoFatal: parseDate(item.prazoFatal),
        tipoCompromisso: item.tipoCompromisso || '',
        destinatario: item.destinatario || 'Não identificado',
        numeroProcesso: item.numeroProcesso || '',
        rawRow: item.rawRow
      }));
      
      console.log('Processed conformity errors:', processedConformityErrors);
      console.log('Processed deadline errors:', processedDeadlineErrors);
      console.log('Processed intimações previdenciário:', processedIntimacoesPrevidenciario);
      
      setSheets(data.data.sheets);
      setSectorMapping(mappings);
      setTasks(processSheets(data.data.sheets, mappings));
      setConformityErrors(processedConformityErrors);
      setDeadlineErrors(processedDeadlineErrors);
      setIntimacoesPrevidenciario(processedIntimacoesPrevidenciario);
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
    conformityErrors,
    deadlineErrors,
    intimacoesPrevidenciario,
    sectorMapping,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData
  };
}
