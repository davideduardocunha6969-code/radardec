import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommercialRecord {
  responsavel: string;
  sdr: string;
  dataAtendimento: string;
  dataFechamento: string;
  semana: number;
  cliente: string;
  modalidade: string;
  setor: string;
  produto: string;
  possuiDireito: string;
  origemCliente: string;
  honorariosExito: number;
  honorariosIniciais: number;
  tempoFechamento: number;
  resultado: string;
  cadencia: string;
  rawRow: string[];
}

export interface CommercialDataResponse {
  records: CommercialRecord[];
  weeks: number[];
  totalRecords: number;
  headers: string[];
  lastUpdated: string;
}

export const useCommercialData = () => {
  const [data, setData] = useState<CommercialRecord[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching commercial data...');
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('fetch-commercial');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erro ao buscar dados comerciais');
      }

      const commercialData = responseData.data as CommercialDataResponse;
      
      console.log(`Loaded ${commercialData.records.length} commercial records`);
      console.log(`Available weeks: ${commercialData.weeks.join(', ')}`);

      setData(commercialData.records);
      setWeeks(commercialData.weeks);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Error fetching commercial data:', err);
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
    data,
    weeks,
    isLoading,
    error,
    refetch: fetchData,
  };
};
