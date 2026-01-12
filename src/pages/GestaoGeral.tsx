import { useMemo, useState } from "react";
import { 
  Target, 
  Briefcase, 
  Scale, 
  Landmark, 
  Clock, 
  Percent,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommercialData } from "@/hooks/useCommercialData";
import { useBancarioData } from "@/hooks/useBancarioData";
import { useSheetData } from "@/hooks/useSheetData";
import { useHolidays } from "@/hooks/useHolidays";
import { calculateBusinessDays } from "@/utils/businessDays";
import { getWeek } from "date-fns";
import MetricCard from "@/components/MetricCard";

const GestaoGeral = () => {
  // Hooks de dados
  const { 
    data: commercialData, 
    saneamentoData: saneamentoComercialData, 
    indicacoesRecebidasData, 
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

  const { holidays } = useHolidays();

  // Semana atual do ano
  const semanaAtualDoAno = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }, []);

  const semanaAtual = getWeek(new Date()) - 1;

  // ===================== METAS COMERCIAIS =====================
  
  // Meta High Ticket
  const metaHighTicket = useMemo(() => {
    const beneficiosHighTicket = [
      'aposentadoria (pcd)',
      'aposentadoria (tc)',
      'aposentadoria (idade)',
      'revisão de aposentadoria',
      'aposentadoria especial',
      'pensão por morte'
    ];
    
    const contratosHighTicket = commercialData.filter(r => {
      const produto = r.produto?.toLowerCase().trim() || '';
      const resultado = r.resultado?.toLowerCase().trim() || '';
      const isHighTicket = beneficiosHighTicket.some(b => produto.includes(b));
      const isContratoFechado = resultado.includes('contrato fechado');
      return isHighTicket && isContratoFechado;
    });
    
    return { meta: 500, alcancado: contratosHighTicket.length };
  }, [commercialData]);

  // Meta Incapacidade
  const metaIncapacidade = useMemo(() => {
    const beneficiosIncapacidade = [
      'auxílio-acidente', 'auxilio-acidente', 'auxílio-doença', 
      'auxilio-doença', 'auxílio doença', 'auxilio doenca', 'bpc'
    ];
    
    const contratosIncapacidade = commercialData.filter(r => {
      const produto = r.produto?.toLowerCase().trim() || '';
      const resultado = r.resultado?.toLowerCase().trim() || '';
      const isIncapacidade = beneficiosIncapacidade.some(b => produto.includes(b));
      const isContratoFechado = resultado.includes('contrato fechado');
      return isIncapacidade && isContratoFechado;
    });
    
    return { meta: 750, alcancado: contratosIncapacidade.length };
  }, [commercialData]);

  // Meta Saneamento Comercial
  const metaSaneamentoComercial = useMemo(() => {
    const totalPastas = saneamentoComercialData.length;
    const pastasSaneadas = saneamentoComercialData.filter(r => {
      const status = r.colI?.toLowerCase().trim() || '';
      return status === 'saneado';
    }).length;
    
    return { meta: totalPastas, alcancado: pastasSaneadas };
  }, [saneamentoComercialData]);

  // Meta Indicações
  const metaIndicacoes = useMemo(() => {
    const indicacoesValidas = indicacoesRecebidasData.filter(r => {
      const colunaA = r.responsavel?.trim() || '';
      return colunaA !== '';
    });
    
    return { meta: 250, alcancado: indicacoesValidas.length };
  }, [indicacoesRecebidasData]);

  // Meta Geral Previdenciário
  const metaGeralPrevidenciario = useMemo(() => {
    const pesos = { highTicket: 0.63, incapacidade: 0.32, saneamento: 0.025, indicacoes: 0.025 };
    const percentHighTicket = Math.min((metaHighTicket.alcancado / metaHighTicket.meta) * 100, 100);
    const percentIncapacidade = Math.min((metaIncapacidade.alcancado / metaIncapacidade.meta) * 100, 100);
    const percentSaneamento = metaSaneamentoComercial.meta > 0 ? Math.min((metaSaneamentoComercial.alcancado / metaSaneamentoComercial.meta) * 100, 100) : 0;
    const percentIndicacoes = Math.min((metaIndicacoes.alcancado / metaIndicacoes.meta) * 100, 100);

    const percentualTotal = (percentHighTicket * pesos.highTicket) + (percentIncapacidade * pesos.incapacidade) + (percentSaneamento * pesos.saneamento) + (percentIndicacoes * pesos.indicacoes);
    const esperadoSemana = (semanaAtualDoAno / 53) * 100;
    const diferencaEsperado = percentualTotal - esperadoSemana;

    return {
      percentualTotal,
      esperadoSemana,
      diferencaEsperado,
      metas: [
        { nome: 'Contratos High Ticket', peso: 63, alcancado: metaHighTicket.alcancado, meta: metaHighTicket.meta, percentual: percentHighTicket, contribuicao: percentHighTicket * pesos.highTicket },
        { nome: 'Benefícios por Incapacidade', peso: 32, alcancado: metaIncapacidade.alcancado, meta: metaIncapacidade.meta, percentual: percentIncapacidade, contribuicao: percentIncapacidade * pesos.incapacidade },
        { nome: 'Saneamento de Pastas', peso: 2.5, alcancado: metaSaneamentoComercial.alcancado, meta: metaSaneamentoComercial.meta, percentual: percentSaneamento, contribuicao: percentSaneamento * pesos.saneamento },
        { nome: 'Indicações de Clientes', peso: 2.5, alcancado: metaIndicacoes.alcancado, meta: metaIndicacoes.meta, percentual: percentIndicacoes, contribuicao: percentIndicacoes * pesos.indicacoes },
      ],
    };
  }, [metaHighTicket, metaIncapacidade, metaSaneamentoComercial, metaIndicacoes, semanaAtualDoAno]);

  // Meta Trabalhista
  const metaTrabalhista = useMemo(() => {
    const contratosTrabalhistas = commercialData.filter(r => {
      const setor = r.setor?.toLowerCase().trim() || '';
      const resultado = r.resultado?.toLowerCase().trim() || '';
      return setor.includes('trabalhista') && resultado.includes('contrato fechado');
    });
    return { meta: 220, alcancado: contratosTrabalhistas.length };
  }, [commercialData]);

  // Meta Bancário Comercial (Contratos)
  const metaBancarioContratos = useMemo(() => {
    const contratosBancarios = commercialData.filter(r => {
      const setor = r.setor?.toLowerCase().trim() || '';
      const resultado = r.resultado?.toLowerCase().trim() || '';
      return (setor.includes('bancário') || setor.includes('bancario')) && resultado.includes('contrato fechado');
    });
    return { meta: 3000, alcancado: contratosBancarios.length };
  }, [commercialData]);

  // Meta Bancário Agendamentos
  const metaBancarioAgendamentos = useMemo(() => {
    const clientesAgendados = bancarioAgendamentosData.filter(r => {
      const colunaA = r.colA?.trim() || '';
      const colunaE = r.colE?.toLowerCase().trim() || '';
      return colunaA !== '' && colunaE === 'agendado';
    });
    return { meta: 50, alcancado: clientesAgendados.length };
  }, [bancarioAgendamentosData]);

  // Meta Geral Bancário Comercial
  const metaGeralBancarioComercial = useMemo(() => {
    const pesos = { contratos: 0.90, agendamentos: 0.10 };
    const percentContratos = Math.min((metaBancarioContratos.alcancado / metaBancarioContratos.meta) * 100, 100);
    const percentAgendamentos = Math.min((metaBancarioAgendamentos.alcancado / metaBancarioAgendamentos.meta) * 100, 100);
    const percentualTotal = (percentContratos * pesos.contratos) + (percentAgendamentos * pesos.agendamentos);
    const esperadoSemana = (semanaAtualDoAno / 53) * 100;
    const diferencaEsperado = percentualTotal - esperadoSemana;

    return {
      percentualTotal,
      esperadoSemana,
      diferencaEsperado,
      metas: [
        { nome: 'Contratos Bancários', peso: 90, alcancado: metaBancarioContratos.alcancado, meta: metaBancarioContratos.meta, percentual: percentContratos, contribuicao: percentContratos * pesos.contratos },
        { nome: 'Agendamentos Bancários', peso: 10, alcancado: metaBancarioAgendamentos.alcancado, meta: metaBancarioAgendamentos.meta, percentual: percentAgendamentos, contribuicao: percentAgendamentos * pesos.agendamentos },
      ],
    };
  }, [metaBancarioContratos, metaBancarioAgendamentos, semanaAtualDoAno]);

  // Metas Administrativo
  const metaAvaliacoes5Estrelas = useMemo(() => {
    const avaliacoesValidas = administrativoData.filter(r => r.colD?.trim() === '5');
    return { meta: 1000, alcancado: avaliacoesValidas.length };
  }, [administrativoData]);

  const metaTestemunhasAgendadas = useMemo(() => {
    const agendamentosValidos = testemunhasData.filter(r => r.colK?.toLowerCase().trim() === 'sim');
    return { meta: 100, alcancado: agendamentosValidos.length };
  }, [testemunhasData]);

  const metaTransferenciaAdvbox = useMemo(() => {
    const totalArquivos = administrativo2Data.length;
    const arquivosTransferidos = administrativo2Data.filter(r => r.colD?.toLowerCase().trim() === 'feito');
    return { meta: totalArquivos, alcancado: arquivosTransferidos.length };
  }, [administrativo2Data]);

  const metaDocumentosFisicos = useMemo(() => {
    const totalDocumentos = documentosFisicosData.length;
    const documentosDevolvidos = documentosFisicosData.filter(r => {
      const colunaF = r.colF?.toUpperCase().trim() || '';
      const colunaG = r.colG?.toUpperCase().trim() || '';
      return colunaF === 'SIM' || colunaG === 'SIM';
    });
    const metaAlvo = Math.ceil(totalDocumentos * 0.9);
    return { meta: metaAlvo, alcancado: documentosDevolvidos.length, totalDocumentos };
  }, [documentosFisicosData]);

  const metaGeralAdministrativo = useMemo(() => {
    const pesos = { avaliacoes: 0.70, testemunhas: 0.10, transferencia: 0.10, documentos: 0.10 };
    const percentAvaliacoes = Math.min((metaAvaliacoes5Estrelas.alcancado / metaAvaliacoes5Estrelas.meta) * 100, 100);
    const percentTestemunhas = Math.min((metaTestemunhasAgendadas.alcancado / metaTestemunhasAgendadas.meta) * 100, 100);
    const percentTransferencia = metaTransferenciaAdvbox.meta > 0 ? Math.min((metaTransferenciaAdvbox.alcancado / metaTransferenciaAdvbox.meta) * 100, 100) : 0;
    const percentDocumentos = metaDocumentosFisicos.meta > 0 ? Math.min((metaDocumentosFisicos.alcancado / metaDocumentosFisicos.meta) * 100, 100) : 0;

    const percentualTotal = (percentAvaliacoes * pesos.avaliacoes) + (percentTestemunhas * pesos.testemunhas) + (percentTransferencia * pesos.transferencia) + (percentDocumentos * pesos.documentos);
    const esperadoSemana = (semanaAtualDoAno / 53) * 100;
    const diferencaEsperado = percentualTotal - esperadoSemana;

    return {
      percentualTotal,
      esperadoSemana,
      diferencaEsperado,
      metas: [
        { nome: 'Avaliações 5 Estrelas', peso: 70, alcancado: metaAvaliacoes5Estrelas.alcancado, meta: metaAvaliacoes5Estrelas.meta, percentual: percentAvaliacoes, contribuicao: percentAvaliacoes * pesos.avaliacoes },
        { nome: 'Testemunhas Agendadas', peso: 10, alcancado: metaTestemunhasAgendadas.alcancado, meta: metaTestemunhasAgendadas.meta, percentual: percentTestemunhas, contribuicao: percentTestemunhas * pesos.testemunhas },
        { nome: 'Transferência ADVBOX', peso: 10, alcancado: metaTransferenciaAdvbox.alcancado, meta: metaTransferenciaAdvbox.meta, percentual: percentTransferencia, contribuicao: percentTransferencia * pesos.transferencia },
        { nome: 'Documentos Devolvidos', peso: 10, alcancado: metaDocumentosFisicos.alcancado, meta: metaDocumentosFisicos.meta, percentual: percentDocumentos, contribuicao: percentDocumentos * pesos.documentos },
      ],
    };
  }, [metaAvaliacoes5Estrelas, metaTestemunhasAgendadas, metaTransferenciaAdvbox, metaDocumentosFisicos, semanaAtualDoAno]);

  // Meta Cível
  const metaCivel = useMemo(() => {
    const contratosCiveis = commercialData.filter(r => {
      const setor = r.setor?.toLowerCase().trim() || '';
      const resultado = r.resultado?.toLowerCase().trim() || '';
      return (setor.includes('cível') || setor.includes('civel')) && resultado.includes('contrato fechado');
    });
    return { meta: 50, alcancado: contratosCiveis.length };
  }, [commercialData]);

  // ===================== METAS BANCÁRIO =====================
  const metaAnualIniciais = 10000;
  const metaAnualTransito = 1700;

  const saneamentoBancarioMetricas = useMemo(() => {
    const saneadas = saneamentoBancarioData.filter(r => r.status?.toLowerCase().trim() === 'saneado').length;
    return { total: saneamentoBancarioData.length, saneadas };
  }, [saneamentoBancarioData]);

  const transitoMetricas = useMemo(() => {
    const acordosRealizados = transitoData.filter(r => {
      const dataAcordo = r.dataAcordo?.trim();
      return dataAcordo && /\d/.test(dataAcordo);
    });
    const cumprimentosAjuizados = transitoData.filter(r => r.statusCumprimentoSentenca?.toLowerCase().trim() === 'ajuizado');
    return { totalAcordosCumprimentos: acordosRealizados.length + cumprimentosAjuizados.length };
  }, [transitoData]);

  const metaGeralBancario = useMemo(() => {
    const protocolosMeta = metaAnualIniciais;
    const protocolosAlcancado = iniciaisData.length;
    const protocolosPercent = protocolosMeta > 0 ? (protocolosAlcancado / protocolosMeta) * 100 : 0;
    const protocolosEsperado = (protocolosMeta / 52) * semanaAtual;
    const protocolosEsperadoPercent = protocolosMeta > 0 ? (protocolosEsperado / protocolosMeta) * 100 : 0;
    const protocolosDiffPP = protocolosPercent - protocolosEsperadoPercent;

    const saneamentoMeta = saneamentoBancarioData.length;
    const saneamentoAlcancado = saneamentoBancarioMetricas.saneadas;
    const saneamentoPercent = saneamentoMeta > 0 ? (saneamentoAlcancado / saneamentoMeta) * 100 : 0;
    const saneamentoEsperado = (saneamentoMeta / 52) * semanaAtual;
    const saneamentoEsperadoPercent = saneamentoMeta > 0 ? (saneamentoEsperado / saneamentoMeta) * 100 : 0;
    const saneamentoDiffPP = saneamentoPercent - saneamentoEsperadoPercent;

    const transitoMeta = metaAnualTransito;
    const transitoAlcancado = transitoMetricas.totalAcordosCumprimentos;
    const transitoPercent = transitoMeta > 0 ? (transitoAlcancado / transitoMeta) * 100 : 0;
    const transitoEsperado = (transitoMeta / 52) * semanaAtual;
    const transitoEsperadoPercent = transitoMeta > 0 ? (transitoEsperado / transitoMeta) * 100 : 0;
    const transitoDiffPP = transitoPercent - transitoEsperadoPercent;

    const pesoProtocolos = 0.45;
    const pesoSaneamento = 0.10;
    const pesoTransito = 0.45;

    const progressoPonderado = (protocolosPercent * pesoProtocolos) + (saneamentoPercent * pesoSaneamento) + (transitoPercent * pesoTransito);
    const esperadoPonderado = (protocolosEsperadoPercent * pesoProtocolos) + (saneamentoEsperadoPercent * pesoSaneamento) + (transitoEsperadoPercent * pesoTransito);
    const diffPonderado = progressoPonderado - esperadoPonderado;

    return {
      progressoPonderado,
      esperadoPonderado,
      diffPonderado,
      metas: [
        { nome: 'Protocolos', peso: 45, alcancado: protocolosAlcancado, meta: protocolosMeta, percentual: protocolosPercent, diffPP: protocolosDiffPP, color: 'blue' },
        { nome: 'Saneamento de Pastas', peso: 10, alcancado: saneamentoAlcancado, meta: saneamentoMeta, percentual: saneamentoPercent, diffPP: saneamentoDiffPP, color: 'emerald' },
        { nome: 'Execuções e Acordos', peso: 45, alcancado: transitoAlcancado, meta: transitoMeta, percentual: transitoPercent, diffPP: transitoDiffPP, color: 'purple' },
      ],
    };
  }, [iniciaisData, saneamentoBancarioData, saneamentoBancarioMetricas, transitoMetricas, semanaAtual]);

  // ===================== MÉTRICAS CONTROLADORIA =====================
  const avgCompletionDays = useMemo(() => {
    const completedTasks = tasks.filter(task => task.dataDistribuicao && task.dataCumprimento);
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((acc, task) => {
      const businessDays = calculateBusinessDays(task.dataDistribuicao!, task.dataCumprimento!, holidays);
      const adjustedDays = Math.max(0, businessDays - 1);
      return acc + adjustedDays;
    }, 0);
    
    return totalDays / completedTasks.length;
  }, [tasks, holidays]);

  const conformityAccuracyRate = useMemo(() => {
    return tasks.length > 0 ? ((tasks.length - conformityErrors.length) / tasks.length) * 100 : 100;
  }, [tasks, conformityErrors]);

  const deadlineAccuracyRate = useMemo(() => {
    return tasks.length > 0 ? ((tasks.length - deadlineErrors.length) / tasks.length) * 100 : 100;
  }, [tasks, deadlineErrors]);

  // Loading state
  const isLoading = commercialLoading || bancarioLoading || controladoriaLoading;
  const hasError = commercialError || bancarioError || controladoriaError;

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <p>Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  // Componente para renderizar card de meta geral
  const MetaGeralCard = ({ 
    title, 
    icon: Icon, 
    iconColor, 
    borderColor, 
    bgGradient, 
    metaData 
  }: {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    borderColor: string;
    bgGradient: string;
    metaData: {
      percentualTotal: number;
      esperadoSemana: number;
      diferencaEsperado: number;
      metas: Array<{
        nome: string;
        peso: number;
        alcancado: number;
        meta: number;
        percentual: number;
        contribuicao: number;
      }>;
    };
  }) => (
    <Card className={`border-2 ${borderColor} ${bgGradient}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor.replace('text-', 'bg-').replace('-500', '-500/20')}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">Progresso ponderado de todas as metas</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`flex flex-col items-center justify-center p-6 rounded-xl ${bgGradient} border ${borderColor.replace('/50', '/20')}`}>
            <span className={`text-5xl font-bold ${metaData.diferencaEsperado >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {metaData.percentualTotal.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground mt-2">da meta geral atingida</span>
            <div className="mt-4 text-center">
              <span className="text-xs text-muted-foreground">Esperado: </span>
              <span className="text-sm font-semibold text-foreground">{metaData.esperadoSemana.toFixed(1)}%</span>
              <span className={`ml-2 text-sm font-semibold ${metaData.diferencaEsperado >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ({metaData.diferencaEsperado >= 0 ? '+' : ''}{metaData.diferencaEsperado.toFixed(1)} p.p.)
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Detalhamento por Meta</h4>
            {metaData.metas.map((meta, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{meta.nome}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Peso: {meta.peso}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{meta.alcancado}/{meta.meta}</span>
                    <span className={`font-semibold ${meta.percentual >= (semanaAtualDoAno / 53) * 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {meta.percentual.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      → {meta.contribuicao.toFixed(1)} p.p.
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${meta.percentual >= (semanaAtualDoAno / 53) * 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(meta.percentual, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso Geral Ponderado</span>
            <span className="text-sm text-muted-foreground">Semana {semanaAtualDoAno} de 53</span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 z-10"
              style={{ left: `${metaData.esperadoSemana}%` }}
            />
            <div 
              className={`h-full rounded-full transition-all ${metaData.diferencaEsperado >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(metaData.percentualTotal, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>0%</span>
            <span>Meta: 100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 p-8">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display">
          Gestão Geral
        </h1>
        <p className="text-muted-foreground mt-2">
          Painel consolidado de metas do escritório David Eduardo Cunha Advogados
        </p>
      </div>

      {/* ===================== MÉTRICAS COMERCIAL ===================== */}
      <div className="mb-8">
        <div className="flex items-center gap-3 pb-4 border-b border-border mb-6">
          <Briefcase className="h-6 w-6 text-rose-500" />
          <h2 className="text-xl font-bold text-foreground">Métricas Comercial</h2>
        </div>

        <div className="space-y-6">
          {/* Meta Geral do Comercial Previdenciário */}
          <MetaGeralCard
            title="Meta Geral do Comercial Previdenciário"
            icon={Target}
            iconColor="text-rose-500"
            borderColor="border-rose-500/50"
            bgGradient="bg-gradient-to-br from-rose-500/5 to-pink-500/5"
            metaData={metaGeralPrevidenciario}
          />

          {/* Meta Contratos Trabalhistas */}
          <Card className="border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Briefcase className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Meta Contratos Trabalhistas</CardTitle>
                  <p className="text-sm text-muted-foreground">Progresso da meta de contratos trabalhistas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                  <span className={`text-5xl font-bold ${metaTrabalhista.alcancado >= (metaTrabalhista.meta / 53 * semanaAtualDoAno) ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {((metaTrabalhista.alcancado / metaTrabalhista.meta) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">da meta alcançada</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground">Alcançado</p>
                  <p className="text-3xl font-bold text-foreground">{metaTrabalhista.alcancado}</p>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <p className="text-3xl font-bold text-foreground">{metaTrabalhista.meta}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Geral do Comercial Bancário */}
          <MetaGeralCard
            title="Meta Geral do Comercial Bancário"
            icon={Target}
            iconColor="text-emerald-500"
            borderColor="border-emerald-500/50"
            bgGradient="bg-gradient-to-br from-emerald-500/5 to-teal-500/5"
            metaData={metaGeralBancarioComercial}
          />

          {/* Meta Geral Administrativo */}
          <MetaGeralCard
            title="Meta Geral Administrativo"
            icon={Target}
            iconColor="text-purple-500"
            borderColor="border-purple-500/50"
            bgGradient="bg-gradient-to-br from-purple-500/5 to-violet-500/5"
            metaData={metaGeralAdministrativo}
          />

          {/* Metas Comercial Cível */}
          <Card className="border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-500/5 to-sky-500/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Scale className="h-6 w-6 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Metas Comercial Cível</CardTitle>
                  <p className="text-sm text-muted-foreground">Progresso da meta de contratos cíveis</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-sky-500/10 border border-cyan-500/20">
                  <span className={`text-5xl font-bold ${metaCivel.alcancado >= (metaCivel.meta / 53 * semanaAtualDoAno) ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {((metaCivel.alcancado / metaCivel.meta) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">da meta alcançada</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground">Alcançado</p>
                  <p className="text-3xl font-bold text-foreground">{metaCivel.alcancado}</p>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <p className="text-3xl font-bold text-foreground">{metaCivel.meta}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===================== MÉTRICAS BANCÁRIO ===================== */}
      <div className="mb-8">
        <div className="flex items-center gap-3 pb-4 border-b border-border mb-6">
          <Landmark className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-bold text-foreground">Métricas Bancário</h2>
        </div>

        <div className="space-y-6">
          {/* Meta Geral do Bancário */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-lg font-semibold">Meta Geral do Bancário</CardTitle>
                  <p className="text-sm text-muted-foreground">Progresso ponderado de todas as metas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                <div className={`rounded-lg p-6 text-center ${metaGeralBancario.diffPonderado >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <p className={`text-5xl font-bold ${metaGeralBancario.diffPonderado >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {metaGeralBancario.progressoPonderado.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">da meta geral atingida</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Esperado: </span>
                      <span className="font-medium">{metaGeralBancario.esperadoPonderado.toFixed(1)}%</span>
                      <span className={`ml-2 font-medium ${metaGeralBancario.diffPonderado >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ({metaGeralBancario.diffPonderado >= 0 ? '+' : ''}{metaGeralBancario.diffPonderado.toFixed(1)} p.p.)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Detalhamento por Meta</p>
                  
                  {metaGeralBancario.metas.map((meta, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{meta.nome}</span>
                          <span className={`text-xs px-2 py-0.5 ${meta.color === 'blue' ? 'bg-blue-500/20 text-blue-500' : meta.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-purple-500/20 text-purple-500'} rounded-full`}>
                            Peso: {meta.peso}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${meta.color === 'blue' ? 'bg-blue-500' : meta.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'} transition-all duration-500`}
                            style={{ width: `${Math.min(meta.percentual, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap">
                        <span className="text-muted-foreground">{meta.alcancado}/{meta.meta}</span>
                        <span className="ml-2 font-medium">{meta.percentual.toFixed(1)}%</span>
                        <span className={`ml-2 ${meta.diffPP >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          → {meta.diffPP.toFixed(1)} p.p.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso Geral Ponderado</span>
                  <span className="text-sm text-muted-foreground">Semana {semanaAtual} de 52</span>
                </div>
                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 z-10"
                    style={{ left: `${Math.min(metaGeralBancario.esperadoPonderado, 100)}%` }}
                  />
                  <div 
                    className={`h-full transition-all duration-500 ${metaGeralBancario.diffPonderado >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(metaGeralBancario.progressoPonderado, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>Meta: 100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===================== MÉTRICAS CONTROLADORIA ===================== */}
      <div className="mb-8">
        <div className="flex items-center gap-3 pb-4 border-b border-border mb-6">
          <Clock className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold text-foreground">Métricas Controladoria</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Média Cumprimento"
            value={`${avgCompletionDays.toFixed(1)} dias`}
            subtitle={avgCompletionDays > 2 ? "Fora da Meta" : avgCompletionDays === 2 ? "Atenção, Limite da Meta" : "Dentro da Meta"}
            icon={<Clock className={`h-5 w-5 ${avgCompletionDays > 2 ? "text-destructive" : avgCompletionDays === 2 ? "text-warning" : "text-success"}`} />}
            variant={avgCompletionDays > 2 ? "warning" : avgCompletionDays === 2 ? "warning" : "success"}
          />
          <MetricCard
            title="Taxa de Acerto Conformidade"
            value={`${conformityAccuracyRate.toFixed(2)}%`}
            subtitle={conformityAccuracyRate < 98 ? "Fora da Meta" : conformityAccuracyRate === 98 ? "Atenção, Limite da Meta" : "Dentro da Meta"}
            icon={<Percent className={`h-5 w-5 ${conformityAccuracyRate < 98 ? "text-destructive" : conformityAccuracyRate === 98 ? "text-warning" : "text-success"}`} />}
            variant={conformityAccuracyRate < 98 ? "warning" : conformityAccuracyRate === 98 ? "warning" : "success"}
          />
          <MetricCard
            title="Taxa de Acerto Prazo"
            value={`${deadlineAccuracyRate.toFixed(2)}%`}
            subtitle={deadlineAccuracyRate < 99.80 ? "Fora da Meta" : deadlineAccuracyRate === 99.80 ? "Atenção, Limite da Meta" : "Dentro da Meta"}
            icon={<Percent className={`h-5 w-5 ${deadlineAccuracyRate < 99.80 ? "text-destructive" : deadlineAccuracyRate === 99.80 ? "text-warning" : "text-success"}`} />}
            variant={deadlineAccuracyRate < 99.80 ? "warning" : deadlineAccuracyRate === 99.80 ? "warning" : "success"}
          />
        </div>
      </div>
    </div>
  );
};

export default GestaoGeral;
