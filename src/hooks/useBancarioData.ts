import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InicialRecord {
  responsavel: string;
  tipoAcao: string;
  semana: number;
  cliente: string;
  reu: string;
  estado: string;
  numeroProcesso: string;
}

export interface SaneamentoBancarioRecord {
  cliente: string;
  parteContraria: string;
  numeroProcesso: string;
  revisor: string;
  status: string;
  resultado: string;
}

export interface TransitoJulgadoRecord {
  situacaoAtual: string;
  autor: string;
  reu: string;
  tipoAcao: string;
  numeroProcesso: string;
  estado: string;
  grauTransito: string;
  dataAjuizamento: string;
  dataSentenca: string;
  dataAcordo: string;
  dataAcordao: string;
  relator: string;
  camara: string;
  resultadoAcordao: string;
  dataCumprimentoSentenca: string;
  valorLiquidacao: number;
  valorSucumbencia: number;
  valorHonorariosExito: number;
  valorTotalHonorarios: number;
  resultadoFinal: string;
  dataPagamento: string;
}

export interface BancarioDataResponse {
  iniciaisData: InicialRecord[];
  iniciaisHeaders: string[];
  saneamentoData: SaneamentoBancarioRecord[];
  saneamentoHeaders: string[];
  transitoData: TransitoJulgadoRecord[];
  transitoHeaders: string[];
  weeks: number[];
  lastUpdated: string;
}

export const useBancarioData = () => {
  const [iniciaisData, setIniciaisData] = useState<InicialRecord[]>([]);
  const [saneamentoData, setSaneamentoData] = useState<SaneamentoBancarioRecord[]>([]);
  const [transitoData, setTransitoData] = useState<TransitoJulgadoRecord[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching bancario data...');
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('fetch-bancario');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erro ao buscar dados bancários');
      }

      const bancarioData = responseData.data as BancarioDataResponse;
      
      console.log(`Loaded ${bancarioData.iniciaisData.length} iniciais records`);
      console.log(`Loaded ${bancarioData.saneamentoData.length} saneamento records`);
      console.log(`Loaded ${bancarioData.transitoData.length} transito records`);
      console.log(`Available weeks: ${bancarioData.weeks.join(', ')}`);

      setIniciaisData(bancarioData.iniciaisData);
      setSaneamentoData(bancarioData.saneamentoData);
      setTransitoData(bancarioData.transitoData);
      setWeeks(bancarioData.weeks);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Error fetching bancario data:', err);
      setError(errorMessage);
      toast({
        title: 'Erro ao carregar dados',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    
    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    iniciaisData,
    saneamentoData,
    transitoData,
    weeks,
    isLoading,
    error,
    refetch: fetchData,
  };
};
