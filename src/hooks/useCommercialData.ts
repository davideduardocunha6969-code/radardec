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
  anoAposentadoriaFutura: string;
  rawRow: string[];
}

export interface SDRRecord {
  colA: string;
  colB: string;
  colC: string;
  colD: string;
  colE: string;
  colF: string;
  colG: string;
  colH: string;
  colI: string;
  colJ: string;
  colK: string;
  colL: string;
  colM: string;
  colN: string;
  colO: string;
  colP: string;
  colQ: string;
  colR: string;
  colS: string;
  colT: string;
  rawRow: string[];
}

export interface SDRMessageRecord {
  semana: string;
  [sdrName: string]: string | number; // Propriedades dinâmicas para cada SDR
}

export interface IndicacaoRecord {
  clienteIndicador: string;
  acaoGanha: string;
  responsavel: string;
  semana: string;
}

export interface IndicacaoRecebidaRecord {
  responsavel: string;
  semana: string;
  resultado: string;
}

export interface SaneamentoRecord {
  [key: string]: string;
}

export interface AdministrativoRecord {
  [key: string]: string;
}

export interface Administrativo2Record {
  [key: string]: string;
}

export interface TestemunhaRecord {
  [key: string]: string;
}

export interface DocumentoFisicoRecord {
  [key: string]: string;
}

export interface CommercialDataResponse {
  records: CommercialRecord[];
  weeks: number[];
  totalRecords: number;
  headers: string[];
  sdrRecords: SDRRecord[];
  sdrHeaders: string[];
  sdrWeeks: number[];
  sdrTotalRecords: number;
  sdrMessagesData: SDRMessageRecord[];
  sdrMessagesSdrNames: string[];
  indicacoesData: IndicacaoRecord[];
  indicacoesRecebidasData: IndicacaoRecebidaRecord[];
  saneamentoData: SaneamentoRecord[];
  saneamentoHeaders: string[];
  administrativoData: AdministrativoRecord[];
  administrativoHeaders: string[];
  administrativo2Data: Administrativo2Record[];
  administrativo2Headers: string[];
  testemunhasData: TestemunhaRecord[];
  testemunhasHeaders: string[];
  documentosFisicosData: DocumentoFisicoRecord[];
  documentosFisicosHeaders: string[];
  lastUpdated: string;
}

export const useCommercialData = () => {
  const [data, setData] = useState<CommercialRecord[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [sdrData, setSdrData] = useState<SDRRecord[]>([]);
  const [sdrHeaders, setSdrHeaders] = useState<string[]>([]);
  const [sdrWeeks, setSdrWeeks] = useState<number[]>([]);
  const [sdrMessagesData, setSdrMessagesData] = useState<SDRMessageRecord[]>([]);
  const [sdrMessagesSdrNames, setSdrMessagesSdrNames] = useState<string[]>([]);
  const [indicacoesData, setIndicacoesData] = useState<IndicacaoRecord[]>([]);
  const [indicacoesRecebidasData, setIndicacoesRecebidasData] = useState<IndicacaoRecebidaRecord[]>([]);
  const [saneamentoData, setSaneamentoData] = useState<SaneamentoRecord[]>([]);
  const [saneamentoHeaders, setSaneamentoHeaders] = useState<string[]>([]);
  const [administrativoData, setAdministrativoData] = useState<AdministrativoRecord[]>([]);
  const [administrativoHeaders, setAdministrativoHeaders] = useState<string[]>([]);
  const [administrativo2Data, setAdministrativo2Data] = useState<Administrativo2Record[]>([]);
  const [administrativo2Headers, setAdministrativo2Headers] = useState<string[]>([]);
  const [testemunhasData, setTestemunhasData] = useState<TestemunhaRecord[]>([]);
  const [testemunhasHeaders, setTestemunhasHeaders] = useState<string[]>([]);
  const [documentosFisicosData, setDocumentosFisicosData] = useState<DocumentoFisicoRecord[]>([]);
  const [documentosFisicosHeaders, setDocumentosFisicosHeaders] = useState<string[]>([]);
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
      console.log(`Loaded ${commercialData.sdrRecords?.length || 0} SDR records`);
      console.log(`SDR Headers: ${commercialData.sdrHeaders?.join(', ') || 'none'}`);
      console.log(`Loaded ${commercialData.sdrMessagesData?.length || 0} SDR Messages records`);
      console.log(`SDR Messages Names: ${commercialData.sdrMessagesSdrNames?.join(', ') || 'none'}`);
      console.log(`Loaded ${commercialData.indicacoesData?.length || 0} Indicações records`);
      console.log(`Loaded ${commercialData.indicacoesRecebidasData?.length || 0} Indicações Recebidas records`);
      console.log(`Loaded ${commercialData.saneamentoData?.length || 0} Saneamento records`);
      console.log(`Saneamento Headers: ${commercialData.saneamentoHeaders?.join(', ') || 'none'}`);
      console.log(`Loaded ${commercialData.administrativoData?.length || 0} Administrativo records`);
      console.log(`Administrativo Headers: ${commercialData.administrativoHeaders?.join(', ') || 'none'}`);
      console.log(`Loaded ${commercialData.administrativo2Data?.length || 0} Administrativo 2 records`);
      console.log(`Administrativo 2 Headers: ${commercialData.administrativo2Headers?.join(', ') || 'none'}`);
      console.log(`Loaded ${commercialData.testemunhasData?.length || 0} Testemunhas records`);
      console.log(`Testemunhas Headers: ${commercialData.testemunhasHeaders?.join(', ') || 'none'}`);
      console.log(`Loaded ${commercialData.documentosFisicosData?.length || 0} Documentos Fisicos records`);
      console.log(`Documentos Fisicos Headers: ${commercialData.documentosFisicosHeaders?.join(', ') || 'none'}`);

      setData(commercialData.records);
      setWeeks(commercialData.weeks);
      setSdrData(commercialData.sdrRecords || []);
      setSdrHeaders(commercialData.sdrHeaders || []);
      setSdrMessagesData(commercialData.sdrMessagesData || []);
      setSdrMessagesSdrNames(commercialData.sdrMessagesSdrNames || []);
      setSdrWeeks(commercialData.sdrWeeks || []);
      setIndicacoesData(commercialData.indicacoesData || []);
      setIndicacoesRecebidasData(commercialData.indicacoesRecebidasData || []);
      setSaneamentoData(commercialData.saneamentoData || []);
      setSaneamentoHeaders(commercialData.saneamentoHeaders || []);
      setAdministrativoData(commercialData.administrativoData || []);
      setAdministrativoHeaders(commercialData.administrativoHeaders || []);
      setAdministrativo2Data(commercialData.administrativo2Data || []);
      setAdministrativo2Headers(commercialData.administrativo2Headers || []);
      setTestemunhasData(commercialData.testemunhasData || []);
      setTestemunhasHeaders(commercialData.testemunhasHeaders || []);
      setDocumentosFisicosData(commercialData.documentosFisicosData || []);
      setDocumentosFisicosHeaders(commercialData.documentosFisicosHeaders || []);
      
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
    sdrData,
    sdrHeaders,
    sdrWeeks,
    sdrMessagesData,
    sdrMessagesSdrNames,
    indicacoesData,
    indicacoesRecebidasData,
    saneamentoData,
    saneamentoHeaders,
    administrativoData,
    administrativoHeaders,
    administrativo2Data,
    administrativo2Headers,
    testemunhasData,
    testemunhasHeaders,
    documentosFisicosData,
    documentosFisicosHeaders,
    isLoading,
    error,
    refetch: fetchData,
  };
};
