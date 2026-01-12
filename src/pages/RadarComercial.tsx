import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Trophy,
  Award,
  FolderCheck,
  ClipboardList,
  Goal,
  Settings2,
  Star,
  AlertTriangle,
  FileText,
  FolderOpen,
  CheckCircle2,
  Briefcase,
  HeartPulse,
  FolderSync,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekFilter } from "@/components/WeekFilter";
import { useCommercialData } from "@/hooks/useCommercialData";
import { AposentadoriasFuturasDialog } from "@/components/AposentadoriasFuturasDialog";
import { GoalProgressCard } from "@/components/GoalProgressCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  YAxis,
  PieChart as RechartsPieChart,
  Pie,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";

const RadarComercial = () => {
  const { data, weeks, sdrData, sdrHeaders, sdrMessagesData, sdrMessagesSdrNames, indicacoesData, indicacoesRecebidasData, saneamentoData, saneamentoHeaders, administrativoData, administrativoHeaders, administrativo2Data, administrativo2Headers, testemunhasData, testemunhasHeaders, documentosFisicosData, documentosFisicosHeaders, isLoading, error } = useCommercialData();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null);
  const [selectedResultado, setSelectedResultado] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [aposentadoriasFuturasDialogOpen, setAposentadoriasFuturasDialogOpen] = useState(false);
  const [rankingPossuiDireito, setRankingPossuiDireito] = useState<string | null>(null);
  const [rankingWeekFilter, setRankingWeekFilter] = useState<number | null>(null);
  const [sdrRankingWeek, setSdrRankingWeek] = useState<number | null>(null);
  const [sdrEvolutionFilter, setSdrEvolutionFilter] = useState<string | null>(null);
  const [selectedSdrsForChart, setSelectedSdrsForChart] = useState<string[]>([]);
  const [adminRankingWeek, setAdminRankingWeek] = useState<number | null>(null);
  const [testemunhasWeekFilter, setTestemunhasWeekFilter] = useState<number | null>(null);

  // Handlers para abrir/fechar seções (comportamento accordion)
  const handleSectionToggle = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Extrai opções únicas para os filtros
  const filterOptions = useMemo(() => {
    const setores = [...new Set(data.map(r => r.setor).filter(Boolean))].sort();
    const responsaveis = [...new Set(data.map(r => r.responsavel).filter(Boolean))].sort();
    const resultados = [...new Set(data.map(r => r.resultado).filter(Boolean))].sort();
    return { setores, responsaveis, resultados };
  }, [data]);

  // Filtra os dados pelos filtros selecionados
  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (selectedWeek && record.semana !== selectedWeek) return false;
      if (selectedSetor && record.setor !== selectedSetor) return false;
      if (selectedResponsavel && record.responsavel !== selectedResponsavel) return false;
      if (selectedResultado && record.resultado !== selectedResultado) return false;
      return true;
    });
  }, [data, selectedWeek, selectedSetor, selectedResponsavel, selectedResultado]);

  // Calcula total de aposentadorias futuras (baseado no resultado - coluna O)
  const totalAposentadoriasFuturas = useMemo(() => {
    return data.filter(r => 
      r.resultado?.toLowerCase().includes('aposentadoria futura')
    ).length;
  }, [data]);

  // Calcula semana atual do ano
  const semanaAtualDoAno = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }, []);

  // ===================== METAS =====================
  // Meta 1: Contratos High Ticket (500)
  // Benefícios: aposentadoria (PCD), Aposentadoria (TC), Aposentadoria (idade), 
  // revisão de aposentadoria, aposentadoria especial, pensão por morte
  const metaHighTicket = useMemo(() => {
    const beneficiosHighTicket = [
      'aposentadoria (pcd)',
      'aposentadoria (tc)',
      'aposentadoria (idade)',
      'revisão de aposentadoria',
      'aposentadoria especial',
      'pensão por morte'
    ];
    
    const contratosHighTicket = data.filter(r => {
      const produto = r.produto?.toLowerCase().trim() || '';
      const resultado = r.resultado?.toLowerCase().trim() || '';
      const isHighTicket = beneficiosHighTicket.some(b => produto.includes(b));
      const isContratoFechado = resultado.includes('contrato fechado');
      return isHighTicket && isContratoFechado;
    });
    
    return {
      meta: 500,
      alcancado: contratosHighTicket.length,
    };
  }, [data]);

  // Meta 2: Contratos por Incapacidade (750)
  // Benefícios: auxílio-acidente, auxílio-doença, BPC
  const metaIncapacidade = useMemo(() => {
    const beneficiosIncapacidade = [
      'auxílio-acidente',
      'auxilio-acidente',
      'auxílio-doença',
      'auxilio-doença',
      'auxílio doença',
      'auxilio doenca',
      'bpc'
    ];
    
    const contratosIncapacidade = data.filter(r => {
      const produto = r.produto?.toLowerCase().trim() || '';
      const resultado = r.resultado?.toLowerCase().trim() || '';
      const isIncapacidade = beneficiosIncapacidade.some(b => produto.includes(b));
      const isContratoFechado = resultado.includes('contrato fechado');
      return isIncapacidade && isContratoFechado;
    });
    
    return {
      meta: 750,
      alcancado: contratosIncapacidade.length,
    };
  }, [data]);

  // Meta 3: Saneamento de Pastas (sanear todas)
  const metaSaneamento = useMemo(() => {
    const totalPastas = saneamentoData.length;
    const pastasSaneadas = saneamentoData.filter(r => {
      const status = r.colI?.toLowerCase().trim() || '';
      return status === 'saneado';
    }).length;
    
    return {
      meta: totalPastas,
      alcancado: pastasSaneadas,
    };
  }, [saneamentoData]);

  // Meta 4: Indicações de Novos Clientes (250)
  // Usa a aba GID=2087539342 (indicacoesRecebidasData)
  // Considera como indicação válida somente se a coluna A estiver preenchida
  const metaIndicacoes = useMemo(() => {
    // A coluna A é mapeada como 'responsavel' na edge function
    // Só conta registros onde a coluna A está preenchida
    const indicacoesValidas = indicacoesRecebidasData.filter(r => {
      const colunaA = r.responsavel?.trim() || '';
      return colunaA !== '';
    });
    
    return {
      meta: 250,
      alcancado: indicacoesValidas.length,
    };
  }, [indicacoesRecebidasData]);

  // Meta Geral do Comercial Previdenciário (ponderada)
  const metaGeral = useMemo(() => {
    const pesos = {
      highTicket: 0.63,
      incapacidade: 0.32,
      saneamento: 0.025,
      indicacoes: 0.025,
    };

    // Percentual de cada meta individual (limitado a 100%)
    const percentHighTicket = Math.min((metaHighTicket.alcancado / metaHighTicket.meta) * 100, 100);
    const percentIncapacidade = Math.min((metaIncapacidade.alcancado / metaIncapacidade.meta) * 100, 100);
    const percentSaneamento = metaSaneamento.meta > 0 
      ? Math.min((metaSaneamento.alcancado / metaSaneamento.meta) * 100, 100) 
      : 0;
    const percentIndicacoes = Math.min((metaIndicacoes.alcancado / metaIndicacoes.meta) * 100, 100);

    // Contribuição ponderada de cada meta
    const contribuicaoHighTicket = percentHighTicket * pesos.highTicket;
    const contribuicaoIncapacidade = percentIncapacidade * pesos.incapacidade;
    const contribuicaoSaneamento = percentSaneamento * pesos.saneamento;
    const contribuicaoIndicacoes = percentIndicacoes * pesos.indicacoes;

    // Percentual total ponderado
    const percentualTotal = contribuicaoHighTicket + contribuicaoIncapacidade + contribuicaoSaneamento + contribuicaoIndicacoes;

    // Esperado para a semana atual
    const esperadoSemana = (semanaAtualDoAno / 53) * 100;
    const diferencaEsperado = percentualTotal - esperadoSemana;

    return {
      percentualTotal,
      esperadoSemana,
      diferencaEsperado,
      metas: [
        {
          nome: 'Contratos High Ticket',
          peso: pesos.highTicket * 100,
          alcancado: metaHighTicket.alcancado,
          meta: metaHighTicket.meta,
          percentual: percentHighTicket,
          contribuicao: contribuicaoHighTicket,
        },
        {
          nome: 'Benefícios por Incapacidade',
          peso: pesos.incapacidade * 100,
          alcancado: metaIncapacidade.alcancado,
          meta: metaIncapacidade.meta,
          percentual: percentIncapacidade,
          contribuicao: contribuicaoIncapacidade,
        },
        {
          nome: 'Saneamento de Pastas',
          peso: pesos.saneamento * 100,
          alcancado: metaSaneamento.alcancado,
          meta: metaSaneamento.meta,
          percentual: percentSaneamento,
          contribuicao: contribuicaoSaneamento,
        },
        {
          nome: 'Indicações de Clientes',
          peso: pesos.indicacoes * 100,
          alcancado: metaIndicacoes.alcancado,
          meta: metaIndicacoes.meta,
          percentual: percentIndicacoes,
          contribuicao: contribuicaoIndicacoes,
        },
      ],
    };
  }, [metaHighTicket, metaIncapacidade, metaSaneamento, metaIndicacoes, semanaAtualDoAno]);

  // Calcula métricas baseadas nos dados filtrados
  const metrics = useMemo(() => {
    const contratosFechados = filteredData.filter(
      r => r.resultado.toLowerCase().includes('contrato fechado')
    );
    
    const totalAtendimentos = filteredData.length;
    const novosClientes = contratosFechados.length;
    const taxaConversao = totalAtendimentos > 0 
      ? ((novosClientes / totalAtendimentos) * 100).toFixed(1) 
      : '0';
    
    const honorariosExitoTotal = filteredData.reduce(
      (sum, r) => sum + r.honorariosExito, 0
    );
    const honorariosIniciaisTotal = filteredData.reduce(
      (sum, r) => sum + r.honorariosIniciais, 0
    );

    return {
      totalAtendimentos,
      novosClientes,
      taxaConversao,
      honorariosExitoTotal,
      honorariosIniciaisTotal,
    };
  }, [filteredData]);

  // Dados para o gráfico de atendimentos por semana (todas as 53 semanas)
  const weeklyChartData = useMemo(() => {
    const weekCounts: Record<number, number> = {};
    
    // Inicializa todas as 53 semanas com 0
    for (let i = 1; i <= 53; i++) {
      weekCounts[i] = 0;
    }
    
    // Contabiliza os atendimentos por semana
    data.forEach(record => {
      if (record.semana > 0 && record.semana <= 53) {
        weekCounts[record.semana] = (weekCounts[record.semana] || 0) + 1;
      }
    });
    
    return Array.from({ length: 53 }, (_, i) => ({
      semana: `${i + 1}`,
      weekNumber: i + 1,
      atendimentos: weekCounts[i + 1] || 0,
    }));
  }, [data]);

  // Dados para o gráfico de agendamentos SDR por semana (todas as 53 semanas) - Total geral
  const sdrWeeklyChartData = useMemo(() => {
    const weekCounts: Record<number, number> = {};
    
    // Inicializa todas as 53 semanas com 0
    for (let i = 1; i <= 53; i++) {
      weekCounts[i] = 0;
    }
    
    // Contabiliza os agendamentos por semana (coluna D)
    sdrData.forEach(record => {
      const semana = parseInt(record.colD?.trim()) || 0;
      if (semana > 0 && semana <= 53) {
        weekCounts[semana] = (weekCounts[semana] || 0) + 1;
      }
    });
    
    return Array.from({ length: 53 }, (_, i) => ({
      semana: `${i + 1}`,
      weekNumber: i + 1,
      agendamentos: weekCounts[i + 1] || 0,
    }));
  }, [sdrData]);

  // Extrai todos os setores únicos do SDR (coluna C)
  const sdrSetores = useMemo(() => {
    const setores = new Set<string>();
    sdrData.forEach(record => {
      const setor = record.colC?.trim();
      if (setor) {
        setores.add(setor);
      }
    });
    return Array.from(setores).sort();
  }, [sdrData]);

  // Dados para gráficos de agendamentos por semana para cada setor (dinâmico)
  const sdrWeeklyBySetorChartData = useMemo(() => {
    const result: Record<string, Array<{ semana: string; weekNumber: number; agendamentos: number }>> = {};
    
    // Para cada setor, cria um array com as 53 semanas
    sdrSetores.forEach(setor => {
      const weekCounts: Record<number, number> = {};
      
      // Inicializa todas as 53 semanas com 0
      for (let i = 1; i <= 53; i++) {
        weekCounts[i] = 0;
      }
      
      // Contabiliza apenas os agendamentos deste setor
      sdrData.forEach(record => {
        const recordSetor = record.colC?.trim();
        if (recordSetor === setor) {
          const semana = parseInt(record.colD?.trim()) || 0;
          if (semana > 0 && semana <= 53) {
            weekCounts[semana] = (weekCounts[semana] || 0) + 1;
          }
        }
      });
      
      result[setor] = Array.from({ length: 53 }, (_, i) => ({
        semana: `${i + 1}`,
        weekNumber: i + 1,
        agendamentos: weekCounts[i + 1] || 0,
      }));
    });
    
    return result;
  }, [sdrData, sdrSetores]);

  // Cores para os gráficos por setor (cicla entre as cores)
  const setorColors = [
    'hsl(173, 80%, 40%)', // teal
    'hsl(199, 89%, 48%)', // cyan
    'hsl(142, 76%, 36%)', // emerald
    'hsl(221, 83%, 53%)', // blue
    'hsl(262, 83%, 58%)', // violet
    'hsl(330, 81%, 60%)', // pink
    'hsl(24, 95%, 53%)',  // orange
    'hsl(47, 96%, 53%)',  // yellow
  ];

  // Lista única de SDRs para o gráfico de evolução
  const sdrList = useMemo(() => {
    const sdrs = new Set<string>();
    sdrData.forEach(record => {
      const semana = parseInt(record.colD?.trim()) || 0;
      if (semana > 0 && semana <= 53) {
        const sdrName = record.colA?.trim();
        if (sdrName) {
          sdrs.add(sdrName);
        }
      }
    });
    return Array.from(sdrs).sort();
  }, [sdrData]);

  // Dados para o gráfico de evolução de agendamentos por SDR por semana
  const sdrEvolutionChartData = useMemo(() => {
    // Estrutura: { semana: 1, sdr1: 5, sdr2: 3, ... }
    const weekData: Record<number, Record<string, number>> = {};
    
    // Inicializa todas as 53 semanas
    for (let i = 1; i <= 53; i++) {
      weekData[i] = {};
      sdrList.forEach(sdr => {
        weekData[i][sdr] = 0;
      });
    }
    
    // Contabiliza agendamentos por SDR e semana
    sdrData.forEach(record => {
      const semana = parseInt(record.colD?.trim()) || 0;
      const sdrName = record.colA?.trim();
      if (semana > 0 && semana <= 53 && sdrName && sdrList.includes(sdrName)) {
        weekData[semana][sdrName] = (weekData[semana][sdrName] || 0) + 1;
      }
    });
    
    // Transforma em array para o gráfico
    return Array.from({ length: 53 }, (_, i) => {
      const weekNum = i + 1;
      return {
        semana: `${weekNum}`,
        weekNumber: weekNum,
        ...weekData[weekNum],
      };
    });
  }, [sdrData, sdrList]);

  // Cores para cada SDR no gráfico de evolução
  const sdrColors = [
    'hsl(173, 80%, 40%)', // teal
    'hsl(221, 83%, 53%)', // blue
    'hsl(142, 76%, 36%)', // emerald
    'hsl(262, 83%, 58%)', // violet
    'hsl(24, 95%, 53%)',  // orange
    'hsl(330, 81%, 60%)', // pink
    'hsl(199, 89%, 48%)', // cyan
    'hsl(47, 96%, 53%)',  // yellow
    'hsl(280, 70%, 50%)', // purple
    'hsl(340, 80%, 55%)', // rose
  ];

  const responsavelChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.responsavel) {
        counts[record.responsavel] = (counts[record.responsavel] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([responsavel, total]) => ({
        responsavel,
        atendimentos: total,
      }))
      .sort((a, b) => b.atendimentos - a.atendimentos);
  }, [filteredData]);

  // Dados para o gráfico de pizza - Modalidade de Atendimento
  const modalidadeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.modalidade) {
        counts[record.modalidade] = (counts[record.modalidade] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Dados para o gráfico de pizza - Possui Direito
  const possuiDireitoChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.possuiDireito) {
        const label = record.possuiDireito === 'SIM' ? 'Possui Direito' : 
                      record.possuiDireito === 'NÃO' ? 'Não Possui Direito' : record.possuiDireito;
        counts[label] = (counts[label] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Dados para o gráfico de resultado dos atendimentos qualificados (clientes com direito)
  const resultadoQualificadosChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Filtra apenas clientes que possuem direito
    filteredData
      .filter(record => record.possuiDireito === 'SIM')
      .forEach(record => {
        if (record.resultado) {
          counts[record.resultado] = (counts[record.resultado] || 0) + 1;
        }
      });
    
    return Object.entries(counts)
      .map(([resultado, total]) => ({
        resultado,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Dados para o gráfico de atendimentos por setor
  const setorChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.setor) {
        counts[record.setor] = (counts[record.setor] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([setor, total]) => ({
        setor,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Dados para o gráfico de resultado de TODOS os atendimentos
  const resultadoTodosChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.resultado) {
        counts[record.resultado] = (counts[record.resultado] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([resultado, count]) => ({
        resultado,
        total: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Dados para o gráfico de origem do cliente
  const origemClienteChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.origemCliente) {
        counts[record.origemCliente] = (counts[record.origemCliente] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([origem, count]) => ({
        origem,
        total: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Dados para o gráfico de conversão por origem do cliente (ordenado por taxa de conversão)
  const conversaoOrigemChartData = useMemo(() => {
    const stats: Record<string, { total: number; contratos: number }> = {};
    
    filteredData.forEach(record => {
      if (record.origemCliente) {
        if (!stats[record.origemCliente]) {
          stats[record.origemCliente] = { total: 0, contratos: 0 };
        }
        stats[record.origemCliente].total += 1;
        if (record.resultado?.toLowerCase().includes('contrato fechado')) {
          stats[record.origemCliente].contratos += 1;
        }
      }
    });
    
    return Object.entries(stats)
      .map(([origem, { total, contratos }]) => ({
        origem,
        contratos,
        total,
        taxaConversao: total > 0 ? ((contratos / total) * 100) : 0,
        taxaConversaoFormatted: total > 0 ? ((contratos / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.taxaConversao - a.taxaConversao)
      .map((item, index) => ({
        ...item,
        posicao: index + 1,
      }));
  }, [filteredData]);

  // Dados para o card de resultados por origem
  const resultadosPorOrigemData = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    const allResultados = new Set<string>();
    
    filteredData.forEach(record => {
      if (record.origemCliente) {
        if (!stats[record.origemCliente]) {
          stats[record.origemCliente] = {};
        }
        const resultado = record.resultado || 'Sem resultado';
        allResultados.add(resultado);
        stats[record.origemCliente][resultado] = (stats[record.origemCliente][resultado] || 0) + 1;
      }
    });
    
    const resultadosArray = Array.from(allResultados).sort();
    
    const origensData = Object.entries(stats)
      .map(([origem, resultados]) => {
        const total = Object.values(resultados).reduce((sum, val) => sum + val, 0);
        return {
          origem,
          total,
          resultados,
        };
      })
      .sort((a, b) => b.total - a.total);
    
    return { origensData, resultadosArray };
  }, [filteredData]);

  const noShowWeeklyChartData = useMemo(() => {
    const weekStats: Record<number, { total: number; noShow: number }> = {};
    
    // Inicializa todas as 53 semanas
    for (let i = 1; i <= 53; i++) {
      weekStats[i] = { total: 0, noShow: 0 };
    }
    
    // Contabiliza atendimentos e no-shows por semana
    data.forEach(record => {
      if (record.semana > 0 && record.semana <= 53) {
        weekStats[record.semana].total += 1;
        if (record.resultado?.toLowerCase().includes('no-show') || 
            record.resultado?.toLowerCase().includes('no show') ||
            record.resultado?.toLowerCase().includes('noshow')) {
          weekStats[record.semana].noShow += 1;
        }
      }
    });
    
    return Array.from({ length: 53 }, (_, i) => {
      const weekNum = i + 1;
      const stats = weekStats[weekNum];
      const percentage = stats.total > 0 
        ? parseFloat(((stats.noShow / stats.total) * 100).toFixed(1))
        : 0;
      return {
        semana: weekNum,
        percentual: percentage,
        noShows: stats.noShow,
        total: stats.total,
      };
    });
  }, [data]);

  // Dados para o gráfico de tempo médio de atendimento por setor
  const tempoMedioSetorChartData = useMemo(() => {
    const setorStats: Record<string, { totalDias: number; count: number }> = {};
    
    filteredData.forEach(record => {
      if (record.setor && record.dataAtendimento && record.dataFechamento) {
        // Parse das datas
        const dataAtendimento = new Date(record.dataAtendimento);
        const dataFechamento = new Date(record.dataFechamento);
        
        // Verifica se as datas são válidas
        if (!isNaN(dataAtendimento.getTime()) && !isNaN(dataFechamento.getTime())) {
          const diffTime = dataFechamento.getTime() - dataAtendimento.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Apenas considera diferenças positivas ou zero
          if (diffDays >= 0) {
            if (!setorStats[record.setor]) {
              setorStats[record.setor] = { totalDias: 0, count: 0 };
            }
            setorStats[record.setor].totalDias += diffDays;
            setorStats[record.setor].count += 1;
          }
        }
      }
    });
    
    return Object.entries(setorStats)
      .map(([setor, stats]) => ({
        setor,
        mediaDias: stats.count > 0 ? parseFloat((stats.totalDias / stats.count).toFixed(1)) : 0,
        totalAtendimentos: stats.count,
      }))
      .sort((a, b) => b.mediaDias - a.mediaDias);
  }, [filteredData]);

  // Dados filtrados para os rankings de responsável (com filtro de possui direito e semana de fechamento)
  const rankingFilteredData = useMemo(() => {
    return filteredData.filter(record => {
      if (rankingPossuiDireito && record.possuiDireito !== rankingPossuiDireito) return false;
      // Filtra pela semana do fechamento (baseado na data de fechamento)
      if (rankingWeekFilter) {
        // A semana já está calculada no record.semana, mas precisamos verificar se tem fechamento
        const dataFechamento = record.dataFechamento;
        if (!dataFechamento) return false;
        // Calcula a semana do fechamento
        const dateParts = dataFechamento.split('/');
        if (dateParts.length === 3) {
          const fechamentoDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
          const startOfYear = new Date(fechamentoDate.getFullYear(), 0, 1);
          const days = Math.floor((fechamentoDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          if (weekNumber !== rankingWeekFilter) return false;
        }
      }
      return true;
    });
  }, [filteredData, rankingPossuiDireito, rankingWeekFilter]);

  // Dados para ranking de conversão por responsável (contratos fechados absolutos)
  const rankingConversaoResponsavelAbsolutoData = useMemo(() => {
    const stats: Record<string, { total: number; contratos: number }> = {};
    
    rankingFilteredData.forEach(record => {
      if (record.responsavel) {
        if (!stats[record.responsavel]) {
          stats[record.responsavel] = { total: 0, contratos: 0 };
        }
        stats[record.responsavel].total += 1;
        if (record.resultado?.toLowerCase().includes('contrato fechado')) {
          stats[record.responsavel].contratos += 1;
        }
      }
    });
    
    return Object.entries(stats)
      .filter(([_, { contratos }]) => contratos > 0) // Apenas responsáveis com contratos
      .map(([responsavel, { total, contratos }]) => ({
        responsavel,
        contratos,
        total,
        taxaConversao: total > 0 ? ((contratos / total) * 100) : 0,
        taxaConversaoFormatted: total > 0 ? ((contratos / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.contratos - a.contratos) // Ordenado por contratos absolutos
      .map((item, index) => ({
        ...item,
        posicao: index + 1,
      }));
  }, [rankingFilteredData]);

  // Dados para ranking de conversão por responsável (taxa % de conversão)
  const rankingConversaoResponsavelPercentualData = useMemo(() => {
    const stats: Record<string, { total: number; contratos: number }> = {};
    
    rankingFilteredData.forEach(record => {
      if (record.responsavel) {
        if (!stats[record.responsavel]) {
          stats[record.responsavel] = { total: 0, contratos: 0 };
        }
        stats[record.responsavel].total += 1;
        if (record.resultado?.toLowerCase().includes('contrato fechado')) {
          stats[record.responsavel].contratos += 1;
        }
      }
    });
    
    return Object.entries(stats)
      .filter(([_, { total }]) => total > 0) // Apenas responsáveis com atendimentos
      .map(([responsavel, { total, contratos }]) => ({
        responsavel,
        contratos,
        total,
        taxaConversao: total > 0 ? ((contratos / total) * 100) : 0,
        taxaConversaoFormatted: total > 0 ? ((contratos / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.taxaConversao - a.taxaConversao) // Ordenado por taxa de conversão
      .map((item, index) => ({
        ...item,
        posicao: index + 1,
      }));
  }, [rankingFilteredData]);

  const PIE_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
  ];

  const chartConfig = {
    atendimentos: {
      label: "Atendimentos",
      color: "hsl(var(--primary))",
    },
  };

  // Componente customizado para o eixo X com texto rotacionado
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="end"
          fill="currentColor"
          fontSize={10}
          transform="rotate(-45)"
          className="fill-muted-foreground"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header da página */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Radar Comercial
            </h1>
            <p className="text-muted-foreground mt-1">
              Dashboard de métricas comerciais e captação de clientes
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

      {/* Cards de métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setAposentadoriasFuturasDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aposentadorias Futuras
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {isLoading ? '--' : totalAposentadoriasFuturas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total geral • Clique para detalhes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Atendimentos
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--' : metrics.totalAtendimentos}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>
                {selectedWeek ? `Semana ${selectedWeek}` : 'Todas as semanas'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Fechados
            </CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--' : metrics.novosClientes}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span>
                {selectedWeek ? `Semana ${selectedWeek}` : 'Todas as semanas'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--%' : `${metrics.taxaConversao}%`}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Contratos / Atendimentos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção: Radar Atendimentos */}
      <Collapsible 
        open={openSection === 'atendimentos'} 
        onOpenChange={() => handleSectionToggle('atendimentos')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Atendimentos</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'atendimentos' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8 mt-6">
          {/* Filtros */}
          <div className="space-y-4">
            {/* Filtro de Semanas */}
            <WeekFilter
              weeks={weeks}
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
              isLoading={isLoading}
            />

            {/* Filtros adicionais */}
            <div className="flex flex-wrap gap-4">
              {/* Filtro por Setor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Setor</label>
                <Select
                  value={selectedSetor || "all"}
                  onValueChange={(value) => setSelectedSetor(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {filterOptions.setores.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Responsável */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Responsável</label>
                <Select
                  value={selectedResponsavel || "all"}
                  onValueChange={(value) => setSelectedResponsavel(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filterOptions.responsaveis.map((responsavel) => (
                      <SelectItem key={responsavel} value={responsavel}>
                        {responsavel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Resultado */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Resultado</label>
                <Select
                  value={selectedResultado || "all"}
                  onValueChange={(value) => setSelectedResultado(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os resultados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os resultados</SelectItem>
                    {filterOptions.resultados.map((resultado) => (
                      <SelectItem key={resultado} value={resultado}>
                        {resultado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Gráfico de Atendimentos por Semana */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Atendimentos por Semana</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <XAxis 
                  dataKey="semana" 
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="atendimentos" 
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                >
                  <LabelList 
                    dataKey="atendimentos" 
                    position="top" 
                    className="fill-foreground"
                    fontSize={10}
                    formatter={(value: number) => value > 0 ? value : ''}
                  />
                  {weeklyChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      className={
                        selectedWeek === entry.weekNumber 
                          ? "fill-accent" 
                          : "fill-primary"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
          </Card>

          {/* Gráfico de Atendimentos por Responsável */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Atendimentos por Responsável</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {responsavelChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={responsavelChartData} 
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="responsavel"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="atendimentos" 
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  >
                    <LabelList 
                      dataKey="atendimentos" 
                      position="top" 
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2">
        {/* Modalidade de Atendimento - Barras Horizontais */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Modalidade de Atendimento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {modalidadeChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={modalidadeChartData} 
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
                  >
                    <XAxis 
                      type="number"
                      hide
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      className="fill-primary"
                    >
                      <LabelList 
                        dataKey="percentage" 
                        position="right" 
                        className="fill-foreground"
                        fontSize={11}
                        formatter={(value: string) => `${value}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Possui Direito */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Clientes com Direito</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {possuiDireitoChartData.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={possuiDireitoChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percentage }) => `${percentage}%`}
                      labelLine={false}
                    >
                      {possuiDireitoChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} clientes`, name]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Legenda */}
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {possuiDireitoChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>

          {/* Gráficos de Resultado dos Atendimentos Qualificados e Atendimentos por Setor */}
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Resultado dos Atendimentos Qualificados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {resultadoQualificadosChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={resultadoQualificadosChartData} 
                    margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                  >
                    <XAxis 
                      dataKey="resultado"
                      tick={<CustomXAxisTick />}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={80}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} clientes`, 'Total']}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    >
                      <LabelList 
                        dataKey="total" 
                        position="top" 
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Atendimentos por Setor</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {setorChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={setorChartData} 
                    margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                  >
                    <XAxis 
                      dataKey="setor"
                      tick={<CustomXAxisTick />}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={80}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[4, 4, 0, 0]}
                      className="fill-accent"
                    >
                      <LabelList 
                        dataKey="total" 
                        position="top" 
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>

          {/* Gráfico de Resultado de Todos os Atendimentos */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Resultado de Todos os Atendimentos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {resultadoTodosChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={resultadoTodosChartData} 
                  margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="resultado"
                    tick={<CustomXAxisTick />}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                  />
                  <Bar 
                    dataKey="total" 
                    radius={[4, 4, 0, 0]}
                  >
                    {resultadoTodosChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.resultado.toLowerCase().includes('contrato fechado') 
                          ? 'hsl(var(--success))' 
                          : 'hsl(var(--primary))'
                        }
                      />
                    ))}
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      className="fill-foreground"
                      fontSize={12}
                    />
                    <LabelList 
                      dataKey="percentage" 
                      position="center" 
                      formatter={(value: string) => `${value}%`}
                      className="fill-white"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
          </Card>

          {/* Gráfico de Linha - Percentual de No-Show por Semana */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Percentual de No-Show por Semana</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={noShowWeeklyChartData} 
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <XAxis 
                  dataKey="semana"
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  interval={3}
                />
                <YAxis 
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value}% (${props.payload.noShows}/${props.payload.total})`,
                    'No-Show'
                  ]}
                  labelFormatter={(label) => `Semana ${label}`}
                />
                <Line 
                  type="monotone"
                  dataKey="percentual"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
          </Card>

          {/* Cards de Tempo Médio para Fechamento por Setor */}
          <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Tempo Médio para Fechamento por Setor
        </h2>
        {tempoMedioSetorChartData.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tempoMedioSetorChartData.map((item) => (
              <Card key={item.setor} className="bg-card">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1 truncate" title={item.setor}>
                    {item.setor}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {item.mediaDias} <span className="text-sm font-normal text-muted-foreground">dias</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.totalAtendimentos} atendimento{item.totalAtendimentos !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
            <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
          </div>
        )}
          </div>

          {/* Ranking de Conversão por Responsável */}
          <div className="space-y-4">
            {/* Filtros de Possui Direito e Semana de Fechamento */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
              <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
              <Select
                value={rankingPossuiDireito || "all"}
                onValueChange={(value) => setRankingPossuiDireito(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Possui Direito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os atendimentos</SelectItem>
                  <SelectItem value="SIM">Possui Direito</SelectItem>
                  <SelectItem value="NÃO">Não Possui Direito</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={rankingWeekFilter?.toString() || "all"}
                onValueChange={(value) => setRankingWeekFilter(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Semana do Fechamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as semanas</SelectItem>
                  {weeks.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Semana {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {(rankingPossuiDireito || rankingWeekFilter) && (
                <button
                  onClick={() => {
                    setRankingPossuiDireito(null);
                    setRankingWeekFilter(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
            {/* Ranking por Contratos Fechados (Absoluto) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Ranking de Contratos Fechados</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Ordenado por quantidade de contratos fechados</p>
              </CardHeader>
              <CardContent>
                {rankingConversaoResponsavelAbsolutoData.length > 0 ? (
                  <div className="space-y-3">
                    {rankingConversaoResponsavelAbsolutoData.map((item) => {
                      const maxContratos = rankingConversaoResponsavelAbsolutoData[0]?.contratos || 1;
                      const barWidth = maxContratos > 0 ? (item.contratos / maxContratos) * 100 : 0;
                      
                      return (
                        <div key={item.responsavel} className="flex items-center gap-3">
                          {/* Posição no ranking com medalhas para top 3 */}
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {item.posicao === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : item.posicao === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : item.posicao === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{item.posicao}º</span>
                            )}
                          </div>
                          
                          {/* Nome do responsável */}
                          <div className="flex-shrink-0 w-28 text-sm font-medium truncate" title={item.responsavel}>
                            {item.responsavel}
                          </div>
                          
                          {/* Barra horizontal */}
                          <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-green-600 rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            {/* Quantidade de contratos no centro da barra */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-sm font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                {item.contratos}
                              </span>
                            </div>
                          </div>
                          
                          {/* Detalhes */}
                          <div className="flex-shrink-0 text-right text-xs text-muted-foreground w-20">
                            <div>{item.total} atend.</div>
                            <div>({item.taxaConversaoFormatted}%)</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking por Taxa de Conversão (Percentual) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Ranking de Taxa de Conversão</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Ordenado por taxa de conversão (%)</p>
              </CardHeader>
              <CardContent>
                {rankingConversaoResponsavelPercentualData.length > 0 ? (
                  <div className="space-y-3">
                    {rankingConversaoResponsavelPercentualData.map((item) => {
                      const maxTaxa = rankingConversaoResponsavelPercentualData[0]?.taxaConversao || 1;
                      const barWidth = maxTaxa > 0 ? (item.taxaConversao / maxTaxa) * 100 : 0;
                      
                      return (
                        <div key={item.responsavel} className="flex items-center gap-3">
                          {/* Posição no ranking com medalhas para top 3 */}
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {item.posicao === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : item.posicao === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : item.posicao === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{item.posicao}º</span>
                            )}
                          </div>
                          
                          {/* Nome do responsável */}
                          <div className="flex-shrink-0 w-28 text-sm font-medium truncate" title={item.responsavel}>
                            {item.responsavel}
                          </div>
                          
                          {/* Barra horizontal */}
                          <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-blue-600 rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            {/* Taxa de conversão no centro da barra */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-sm font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                {item.taxaConversaoFormatted}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Detalhes */}
                          <div className="flex-shrink-0 text-right text-xs text-muted-foreground w-20">
                            <div>{item.contratos} contratos</div>
                            <div>de {item.total} atend.</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção: Radar de Origens */}
      <Collapsible 
        open={openSection === 'origens'} 
        onOpenChange={() => handleSectionToggle('origens')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-foreground">Radar de Origens</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'origens' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8 mt-6">
          {/* Filtro de Semanas */}
          <WeekFilter
            weeks={weeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            isLoading={isLoading}
          />

          {/* Cards de métricas de conversão */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Atendimentos Qualificados</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '--' : filteredData.filter(r => r.possuiDireito === 'SIM').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clientes com direito
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Contratos Fechados</p>
                <p className="text-2xl font-bold text-success">
                  {isLoading ? '--' : filteredData.filter(r => r.resultado?.toLowerCase().includes('contrato fechado')).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de fechamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão Geral</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '--%' : `${metrics.taxaConversao}%`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contratos / Atendimentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão Qualificados</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '--%' : (() => {
                    const qualificados = filteredData.filter(r => r.possuiDireito === 'SIM').length;
                    const fechados = filteredData.filter(r => r.possuiDireito === 'SIM' && r.resultado?.toLowerCase().includes('contrato fechado')).length;
                    return qualificados > 0 ? `${((fechados / qualificados) * 100).toFixed(1)}%` : '0%';
                  })()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas clientes com direito
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Funil de Conversão */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Funil de Conversão</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const totalAtendimentos = filteredData.length;
                  const qualificados = filteredData.filter(r => r.possuiDireito === 'SIM').length;
                  const contratosFechados = filteredData.filter(r => r.resultado?.toLowerCase().includes('contrato fechado')).length;
                  
                  const funnelData = [
                    { label: 'Total de Atendimentos', value: totalAtendimentos, percentage: 100 },
                    { label: 'Atendimentos Qualificados', value: qualificados, percentage: totalAtendimentos > 0 ? (qualificados / totalAtendimentos) * 100 : 0 },
                    { label: 'Contratos Fechados', value: contratosFechados, percentage: totalAtendimentos > 0 ? (contratosFechados / totalAtendimentos) * 100 : 0 },
                  ];

                  return funnelData.map((item, index) => (
                    <div key={item.label} className="relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.value} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-8 bg-muted/30 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full rounded-lg transition-all ${
                            index === 0 ? 'bg-primary' : 
                            index === 1 ? 'bg-accent' : 
                            'bg-success'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Origem do Cliente */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Ranking de Origem do Cliente</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {origemClienteChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={origemClienteChartData} 
                      margin={{ top: 30, right: 10, left: 10, bottom: 60 }}
                    >
                      <XAxis 
                        dataKey="origem"
                        tick={<CustomXAxisTick />}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        height={80}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} clientes (${props.payload.percentage}%)`,
                          'Total'
                        ]}
                      />
                      <Bar 
                        dataKey="total" 
                        radius={[4, 4, 0, 0]}
                        className="fill-primary"
                      >
                        <LabelList 
                          dataKey="total" 
                          position="top" 
                          className="fill-foreground"
                          fontSize={12}
                        />
                        <LabelList 
                          dataKey="percentage" 
                          position="center" 
                          formatter={(value: string) => `${value}%`}
                          className="fill-white"
                          fontSize={11}
                          fontWeight={600}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Ranking de Conversão por Origem com barras horizontais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Ranking de Conversão por Origem</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Ordenado por taxa de conversão</p>
            </CardHeader>
            <CardContent>
              {conversaoOrigemChartData.length > 0 ? (
                <div className="space-y-3">
                  {conversaoOrigemChartData.map((item) => {
                    const maxTaxa = conversaoOrigemChartData[0]?.taxaConversao || 1;
                    const barWidth = maxTaxa > 0 ? (item.taxaConversao / maxTaxa) * 100 : 0;
                    
                    return (
                      <div key={item.origem} className="flex items-center gap-3">
                        {/* Posição no ranking */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          item.posicao === 1 ? 'bg-yellow-500 text-yellow-950' :
                          item.posicao === 2 ? 'bg-gray-300 text-gray-700' :
                          item.posicao === 3 ? 'bg-amber-600 text-amber-50' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {item.posicao}º
                        </div>
                        
                        {/* Nome da origem */}
                        <div className="flex-shrink-0 w-32 text-sm font-medium truncate" title={item.origem}>
                          {item.origem}
                        </div>
                        
                        {/* Barra horizontal */}
                        <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 bg-green-600 rounded transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                          {/* Taxa de conversão no centro da barra */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                              {item.taxaConversaoFormatted}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Detalhes */}
                        <div className="flex-shrink-0 text-right text-xs text-muted-foreground w-24">
                          <div>{item.contratos} contratos</div>
                          <div>de {item.total} atend.</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Resultados por Origem */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Resultados por Origem do Cliente</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Distribuição de resultados por cada origem de atendimento</p>
            </CardHeader>
            <CardContent>
              {resultadosPorOrigemData.origensData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-semibold text-foreground sticky left-0 bg-card">Origem</th>
                        <th className="text-center py-3 px-2 font-semibold text-foreground">Total</th>
                        {resultadosPorOrigemData.resultadosArray.map(resultado => (
                          <th key={resultado} className="text-center py-3 px-2 font-semibold text-foreground min-w-[100px]">
                            {resultado}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultadosPorOrigemData.origensData.map((item, index) => (
                        <tr key={item.origem} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                          <td className="py-2 px-2 font-medium text-foreground sticky left-0 bg-inherit">{item.origem}</td>
                          <td className="text-center py-2 px-2 font-bold text-primary">{item.total}</td>
                          {resultadosPorOrigemData.resultadosArray.map(resultado => {
                            const count = item.resultados[resultado] || 0;
                            const percentage = item.total > 0 ? ((count / item.total) * 100).toFixed(0) : '0';
                            return (
                              <td key={resultado} className="text-center py-2 px-2">
                                {count > 0 ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-medium">{count}</span>
                                    <span className="text-xs text-muted-foreground">({percentage}%)</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção: Radar de Negociações */}
      <Collapsible 
        open={openSection === 'negociacoes'} 
        onOpenChange={() => handleSectionToggle('negociacoes')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/20 to-violet-600/20 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold text-foreground">Radar de Negociações</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'negociacoes' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8 mt-6">
          {/* Cards de métricas de negociações por setor */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card de Negociação por Setor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Em Negociação</CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? '--' : filteredData.filter(r => 
                      r.resultado?.toLowerCase().includes('negociação') || 
                      r.resultado?.toLowerCase().includes('negociacao')
                    ).length}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Casos em negociação por setor</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const negociacaoPorSetor: Record<string, number> = {};
                  filteredData
                    .filter(r => 
                      r.resultado?.toLowerCase().includes('negociação') || 
                      r.resultado?.toLowerCase().includes('negociacao')
                    )
                    .forEach(r => {
                      const setor = r.setor || 'Sem setor';
                      negociacaoPorSetor[setor] = (negociacaoPorSetor[setor] || 0) + 1;
                    });
                  
                  const setoresOrdenados = Object.entries(negociacaoPorSetor)
                    .sort((a, b) => b[1] - a[1]);
                  
                  if (setoresOrdenados.length === 0) {
                    return (
                      <div className="h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Nenhum caso em negociação</p>
                      </div>
                    );
                  }
                  
                  const maxValue = setoresOrdenados[0]?.[1] || 1;
                  
                  return (
                    <div className="space-y-3">
                      {setoresOrdenados.map(([setor, count]) => {
                        const barWidth = (count / maxValue) * 100;
                        return (
                          <div key={setor} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-32 text-sm font-medium truncate" title={setor}>
                              {setor}
                            </div>
                            <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 bg-blue-500 rounded transition-all duration-300"
                                style={{ width: `${barWidth}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-xs font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                  {count}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Card de Aguarda Documentação por Setor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">Aguarda Documentação</CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoading ? '--' : filteredData.filter(r => 
                      r.resultado?.toLowerCase().includes('aguarda documentação') || 
                      r.resultado?.toLowerCase().includes('aguarda documentacao')
                    ).length}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Casos aguardando documentação por setor</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const aguardaDocPorSetor: Record<string, number> = {};
                  filteredData
                    .filter(r => 
                      r.resultado?.toLowerCase().includes('aguarda documentação') || 
                      r.resultado?.toLowerCase().includes('aguarda documentacao')
                    )
                    .forEach(r => {
                      const setor = r.setor || 'Sem setor';
                      aguardaDocPorSetor[setor] = (aguardaDocPorSetor[setor] || 0) + 1;
                    });
                  
                  const setoresOrdenados = Object.entries(aguardaDocPorSetor)
                    .sort((a, b) => b[1] - a[1]);
                  
                  if (setoresOrdenados.length === 0) {
                    return (
                      <div className="h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Nenhum caso aguardando documentação</p>
                      </div>
                    );
                  }
                  
                  const maxValue = setoresOrdenados[0]?.[1] || 1;
                  
                  return (
                    <div className="space-y-3">
                      {setoresOrdenados.map(([setor, count]) => {
                        const barWidth = (count / maxValue) * 100;
                        return (
                          <div key={setor} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-32 text-sm font-medium truncate" title={setor}>
                              {setor}
                            </div>
                            <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 bg-orange-500 rounded transition-all duration-300"
                                style={{ width: `${barWidth}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-xs font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                  {count}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Negociação e Aguarda Documentação por Responsável */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Ranking de Negociação por Responsável */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Negociações por Responsável</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Casos em negociação ordenados por responsável</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const casosNegociacao = filteredData.filter(r => 
                    r.resultado?.toLowerCase().includes('negociação') || 
                    r.resultado?.toLowerCase().includes('negociacao')
                  );
                  
                  const negociacaoPorResponsavel: Record<string, number> = {};
                  casosNegociacao.forEach(r => {
                    const responsavel = r.responsavel || 'Sem responsável';
                    negociacaoPorResponsavel[responsavel] = (negociacaoPorResponsavel[responsavel] || 0) + 1;
                  });
                  
                  const total = casosNegociacao.length;
                  const rankingData = Object.entries(negociacaoPorResponsavel)
                    .map(([responsavel, count]) => ({
                      responsavel,
                      total: count,
                      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
                    }))
                    .sort((a, b) => b.total - a.total)
                    .map((item, index) => ({
                      ...item,
                      posicao: index + 1,
                    }));
                  
                  if (rankingData.length === 0) {
                    return (
                      <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                      </div>
                    );
                  }
                  
                  const maxTotal = rankingData[0]?.total || 1;
                  
                  return (
                    <div className="space-y-3">
                      {rankingData.map((item) => {
                        const barWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                        
                        return (
                          <div key={item.responsavel} className="flex items-center gap-3">
                            {/* Posição no ranking */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              item.posicao === 1 ? 'bg-yellow-500 text-yellow-950' :
                              item.posicao === 2 ? 'bg-gray-300 text-gray-700' :
                              item.posicao === 3 ? 'bg-amber-600 text-amber-50' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {item.posicao}º
                            </div>
                            
                            {/* Nome do responsável */}
                            <div className="flex-shrink-0 w-28 text-sm font-medium truncate" title={item.responsavel}>
                              {item.responsavel}
                            </div>
                            
                            {/* Barra horizontal */}
                            <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 bg-blue-600 rounded transition-all duration-300"
                                style={{ width: `${barWidth}%` }}
                              />
                              {/* Total no centro da barra */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-sm font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                  {item.total} ({item.percentage}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Aguarda Documentação por Responsável */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Aguarda Documentação por Responsável</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Casos aguardando documentação ordenados por responsável</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const casosAguardaDoc = filteredData.filter(r => 
                    r.resultado?.toLowerCase().includes('aguarda documentação') || 
                    r.resultado?.toLowerCase().includes('aguarda documentacao')
                  );
                  
                  const aguardaDocPorResponsavel: Record<string, number> = {};
                  casosAguardaDoc.forEach(r => {
                    const responsavel = r.responsavel || 'Sem responsável';
                    aguardaDocPorResponsavel[responsavel] = (aguardaDocPorResponsavel[responsavel] || 0) + 1;
                  });
                  
                  const total = casosAguardaDoc.length;
                  const rankingData = Object.entries(aguardaDocPorResponsavel)
                    .map(([responsavel, count]) => ({
                      responsavel,
                      total: count,
                      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
                    }))
                    .sort((a, b) => b.total - a.total)
                    .map((item, index) => ({
                      ...item,
                      posicao: index + 1,
                    }));
                  
                  if (rankingData.length === 0) {
                    return (
                      <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                      </div>
                    );
                  }
                  
                  const maxTotal = Math.max(...rankingData.map(d => d.total));
                  
                  return (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {rankingData.map((item) => {
                        const barWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                        
                        return (
                          <div key={item.responsavel} className="flex items-center gap-3">
                            {/* Posição no ranking */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              item.posicao === 1 ? 'bg-yellow-500 text-yellow-950' :
                              item.posicao === 2 ? 'bg-gray-300 text-gray-700' :
                              item.posicao === 3 ? 'bg-amber-600 text-amber-50' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {item.posicao}º
                            </div>
                            
                            {/* Nome do responsável */}
                            <div className="flex-shrink-0 w-28 text-sm font-medium truncate" title={item.responsavel}>
                              {item.responsavel}
                            </div>
                            
                            {/* Barra horizontal */}
                            <div className="flex-1 relative">
                              <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                              {/* Valor e percentual */}
                              <div className="absolute inset-0 flex items-center justify-end pr-3">
                                <span className="text-xs font-semibold text-foreground">
                                  {item.total} ({item.percentage}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Card de Cadência Negociação */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-lg">Cadência Negociação</CardTitle>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {isLoading ? '--' : filteredData.filter(r => 
                    r.resultado?.toLowerCase().includes('negociação') || 
                    r.resultado?.toLowerCase().includes('negociacao')
                  ).length}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Etapas de follow-up dos casos em negociação</p>
            </CardHeader>
            <CardContent>
              {(() => {
                const casosNegociacao = filteredData.filter(r => 
                  r.resultado?.toLowerCase().includes('negociação') || 
                  r.resultado?.toLowerCase().includes('negociacao')
                );
                
                const cadenciaCounts: Record<string, number> = {};
                casosNegociacao.forEach(r => {
                  const cadencia = r.cadencia?.trim() || 'Sem follow-up';
                  cadenciaCounts[cadencia] = (cadenciaCounts[cadencia] || 0) + 1;
                });
                
                const total = casosNegociacao.length;
                const cadenciasOrdenadas = Object.entries(cadenciaCounts)
                  .map(([cadencia, count]) => ({
                    cadencia,
                    count,
                    percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
                  }))
                  .sort((a, b) => {
                    // Coloca "Sem follow-up" por último
                    if (a.cadencia === 'Sem follow-up') return 1;
                    if (b.cadencia === 'Sem follow-up') return -1;
                    return b.count - a.count;
                  });
                
                if (cadenciasOrdenadas.length === 0) {
                  return (
                    <div className="h-[150px] flex items-center justify-center bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground text-sm">Nenhum caso em negociação</p>
                    </div>
                  );
                }
                
                const maxValue = Math.max(...cadenciasOrdenadas.map(c => c.count));
                
                return (
                  <div className="space-y-3">
                    {cadenciasOrdenadas.map(({ cadencia, count, percentage }) => {
                      const barWidth = maxValue > 0 ? (count / maxValue) * 100 : 0;
                      const isSemFollowUp = cadencia === 'Sem follow-up';
                      
                      return (
                        <div key={cadencia} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-36 text-sm font-medium truncate" title={cadencia}>
                            <span className={isSemFollowUp ? 'text-destructive' : ''}>
                              {cadencia}
                            </span>
                          </div>
                          <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className={`absolute inset-y-0 left-0 rounded transition-all duration-300 ${
                                isSemFollowUp ? 'bg-destructive' : 'bg-purple-500'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-sm font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                {count} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Card de Cadência Aguarda Documentação */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Cadência Aguarda Documentação</CardTitle>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? '--' : filteredData.filter(r => 
                    r.resultado?.toLowerCase().includes('aguarda documentação') || 
                    r.resultado?.toLowerCase().includes('aguarda documentacao')
                  ).length}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Etapas de follow-up dos casos aguardando documentação</p>
            </CardHeader>
            <CardContent>
              {(() => {
                const casosAguardaDoc = filteredData.filter(r => 
                  r.resultado?.toLowerCase().includes('aguarda documentação') || 
                  r.resultado?.toLowerCase().includes('aguarda documentacao')
                );
                
                const cadenciaCounts: Record<string, number> = {};
                casosAguardaDoc.forEach(r => {
                  const cadencia = r.cadencia?.trim() || 'Sem follow-up';
                  cadenciaCounts[cadencia] = (cadenciaCounts[cadencia] || 0) + 1;
                });
                
                const total = casosAguardaDoc.length;
                const cadenciasOrdenadas = Object.entries(cadenciaCounts)
                  .map(([cadencia, count]) => ({
                    cadencia,
                    count,
                    percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
                  }))
                  .sort((a, b) => {
                    // Coloca "Sem follow-up" por último
                    if (a.cadencia === 'Sem follow-up') return 1;
                    if (b.cadencia === 'Sem follow-up') return -1;
                    return b.count - a.count;
                  });
                
                if (cadenciasOrdenadas.length === 0) {
                  return (
                    <div className="h-[150px] flex items-center justify-center bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground text-sm">Nenhum caso aguardando documentação</p>
                    </div>
                  );
                }
                
                const maxValue = Math.max(...cadenciasOrdenadas.map(c => c.count));
                
                return (
                  <div className="space-y-3">
                    {cadenciasOrdenadas.map(({ cadencia, count, percentage }) => {
                      const barWidth = maxValue > 0 ? (count / maxValue) * 100 : 0;
                      const isSemFollowUp = cadencia === 'Sem follow-up';
                      
                      return (
                        <div key={cadencia} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-36 text-sm font-medium truncate" title={cadencia}>
                            <span className={isSemFollowUp ? 'text-destructive' : ''}>
                              {cadencia}
                            </span>
                          </div>
                          <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className={`absolute inset-y-0 left-0 rounded transition-all duration-300 ${
                                isSemFollowUp ? 'bg-destructive' : 'bg-orange-500'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-sm font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                {count} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ==================== RADAR SDR ==================== */}
      <Collapsible open={openSection === 'sdr'} onOpenChange={() => handleSectionToggle('sdr')} className="mb-8">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 rounded-lg border border-teal-500/30 hover:border-teal-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-teal-500" />
              <h2 className="text-xl font-bold text-foreground">Radar SDR</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'sdr' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 mt-6">

          {/* Gráfico de Agendamentos Total por Semana - SDR (Linha) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-teal-500" />
                <CardTitle className="text-lg">Agendamentos por Semana - Total</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Evolução semanal do total de agendamentos realizados pelo time de SDR</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sdrWeeklyChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone"
                      dataKey="agendamentos" 
                      stroke="hsl(173, 80%, 40%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(173, 80%, 40%)", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    >
                      <LabelList 
                        dataKey="agendamentos" 
                        position="top" 
                        className="fill-foreground"
                        fontSize={10}
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráficos de Agendamentos por Semana - Por Setor (Dinâmico) */}
          {sdrSetores.map((setor, index) => {
            const chartData = sdrWeeklyBySetorChartData[setor];
            const color = setorColors[index % setorColors.length];
            const totalAgendamentos = chartData.reduce((sum, item) => sum + item.agendamentos, 0);
            
            return (
              <Card key={setor}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5" style={{ color }} />
                      <CardTitle className="text-lg">Agendamentos por Semana - {setor}</CardTitle>
                    </div>
                    <div className="text-2xl font-bold" style={{ color }}>
                      {totalAgendamentos}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Evolução semanal de agendamentos do setor {setor}</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                        <XAxis 
                          dataKey="semana" 
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone"
                          dataKey="agendamentos" 
                          stroke={color}
                          strokeWidth={2}
                          dot={{ fill: color, strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        >
                          <LabelList 
                            dataKey="agendamentos" 
                            position="top" 
                            className="fill-foreground"
                            fontSize={10}
                            formatter={(value: number) => value > 0 ? value : ''}
                          />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            );
          })}

          {/* Card de Ranking de Agendamentos por SDR */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-teal-500" />
                  <CardTitle className="text-lg">Ranking de Agendamentos por SDR</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {/* Filtro por Semana */}
                  <Select
                    value={sdrRankingWeek?.toString() || "all"}
                    onValueChange={(value) => setSdrRankingWeek(value === "all" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue placeholder="Semana" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          Semana {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-2xl font-bold text-teal-600">
                    {isLoading ? '--' : sdrData.filter(r => {
                      const semana = parseInt(r.colD?.trim()) || 0;
                      if (semana <= 0 || semana > 53) return false;
                      if (sdrRankingWeek && semana !== sdrRankingWeek) return false;
                      return true;
                    }).length}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Total de agendamentos realizados por cada SDR</p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Filtra apenas registros com semana preenchida (coluna D) e pelo filtro de semana
                const agendamentosValidos = sdrData.filter(record => {
                  const semana = parseInt(record.colD?.trim()) || 0;
                  if (semana <= 0 || semana > 53) return false;
                  if (sdrRankingWeek && semana !== sdrRankingWeek) return false;
                  return true;
                });
                
                const sdrCounts: Record<string, number> = {};
                
                agendamentosValidos.forEach(record => {
                  const sdrName = record.colA?.trim() || 'Não identificado';
                  if (sdrName) {
                    sdrCounts[sdrName] = (sdrCounts[sdrName] || 0) + 1;
                  }
                });
                
                const total = agendamentosValidos.length;
                const rankingData = Object.entries(sdrCounts)
                  .map(([sdr, count]) => ({
                    sdr,
                    total: count,
                    percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
                  }))
                  .sort((a, b) => b.total - a.total)
                  .map((item, index) => ({
                    ...item,
                    posicao: index + 1,
                  }));
                
                if (rankingData.length === 0) {
                  return (
                    <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                    </div>
                  );
                }
                
                const maxTotal = Math.max(...rankingData.map(d => d.total));
                
                return (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {rankingData.map((item) => {
                      const barWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                      
                      return (
                        <div key={item.sdr} className="flex items-center gap-3">
                          {/* Posição no ranking */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            item.posicao === 1 ? 'bg-yellow-500 text-yellow-950' :
                            item.posicao === 2 ? 'bg-gray-300 text-gray-700' :
                            item.posicao === 3 ? 'bg-amber-600 text-amber-50' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {item.posicao}º
                          </div>
                          
                          {/* Nome do SDR */}
                          <div className="flex-shrink-0 w-32 text-sm font-medium truncate" title={item.sdr}>
                            {item.sdr}
                          </div>
                          
                          {/* Barra horizontal */}
                          <div className="flex-1 relative">
                            <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            {/* Valor e percentual */}
                            <div className="absolute inset-0 flex items-center justify-end pr-3">
                              <span className="text-xs font-semibold text-foreground">
                                {item.total} ({item.percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Gráfico de Evolução de Agendamentos por SDR */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-teal-500" />
                  <CardTitle className="text-lg">Evolução de Agendamentos por SDR</CardTitle>
                </div>
                {/* Filtro por SDR */}
                <Select
                  value={sdrEvolutionFilter || "all"}
                  onValueChange={(value) => setSdrEvolutionFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Todos os SDRs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os SDRs</SelectItem>
                    {sdrList.map((sdr) => (
                      <SelectItem key={sdr} value={sdr}>
                        {sdr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Quantidade de agendamentos por semana de cada SDR. 
                <span className="text-destructive font-medium ml-1">Linha vermelha = Meta semanal (25 agendamentos)</span>
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={sdrEvolutionChartData} 
                    margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
                  >
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 30)]}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                    {/* Linha de meta (25 agendamentos) */}
                    <ReferenceLine 
                      y={25} 
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                    />
                    {/* Label da meta separado para garantir visibilidade */}
                    <ReferenceLine 
                      y={25} 
                      stroke="transparent"
                      label={{ 
                        value: 'Meta: 25', 
                        position: 'insideTopRight',
                        fill: '#ef4444',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    />
                    {/* Linhas para cada SDR (filtrado) */}
                    {(sdrEvolutionFilter ? sdrList.filter(s => s === sdrEvolutionFilter) : sdrList).map((sdr, index) => {
                      const originalIndex = sdrList.indexOf(sdr);
                      return (
                        <Line
                          key={sdr}
                          type="monotone"
                          dataKey={sdr}
                          name={sdr}
                          stroke={sdrColors[originalIndex % sdrColors.length]}
                          strokeWidth={2}
                          dot={{ fill: sdrColors[originalIndex % sdrColors.length], strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        >
                          <LabelList 
                            dataKey={sdr} 
                            position="top" 
                            className="fill-foreground"
                            fontSize={9}
                            formatter={(value: number) => value > 0 ? value : ''}
                          />
                        </Line>
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Cards de Média de Agendamentos por SDR */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(() => {
              // Calcula a média de agendamentos por semana para cada SDR
              const sdrStats = sdrList.map(sdr => {
                // Conta semanas com pelo menos 1 agendamento para este SDR
                const semanasComAgendamento = new Set<number>();
                let totalAgendamentos = 0;
                
                sdrData.forEach(record => {
                  const semana = parseInt(record.colD?.trim()) || 0;
                  const sdrName = record.colA?.trim();
                  if (semana > 0 && semana <= 53 && sdrName === sdr) {
                    semanasComAgendamento.add(semana);
                    totalAgendamentos++;
                  }
                });
                
                // Calcula a média considerando apenas semanas com dados
                const semanasAtivas = semanasComAgendamento.size;
                const media = semanasAtivas > 0 ? totalAgendamentos / semanasAtivas : 0;
                
                return {
                  sdr,
                  media: parseFloat(media.toFixed(1)),
                  totalAgendamentos,
                  semanasAtivas,
                };
              });
              
              return sdrStats.map((stat, index) => {
                const isAboveMeta = stat.media > 25;
                const isExactMeta = stat.media === 25;
                const isBelowMeta = stat.media < 25;
                
                let bgColor = '';
                let borderColor = '';
                let textColor = '';
                let statusText = '';
                let statusIcon = '';
                
                if (isAboveMeta) {
                  bgColor = 'bg-green-500/10';
                  borderColor = 'border-l-green-500';
                  textColor = 'text-green-600';
                  statusText = 'Acima da Meta';
                  statusIcon = '✓';
                } else if (isExactMeta) {
                  bgColor = 'bg-yellow-500/10';
                  borderColor = 'border-l-yellow-500';
                  textColor = 'text-yellow-600';
                  statusText = 'Dentro da Meta';
                  statusIcon = '●';
                } else {
                  bgColor = 'bg-red-500/10';
                  borderColor = 'border-l-red-500';
                  textColor = 'text-red-600';
                  statusText = 'Fora da Meta';
                  statusIcon = '✗';
                }
                
                return (
                  <Card key={stat.sdr} className={`${bgColor} border-l-4 ${borderColor}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium truncate" title={stat.sdr}>
                          {stat.sdr}
                        </CardTitle>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${bgColor} ${textColor}`}>
                          {statusIcon} {statusText}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${textColor}`}>
                        {stat.media}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Média semanal de agendamentos
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                        <span>Total: {stat.totalAgendamentos}</span>
                        <span>Semanas ativas: {stat.semanasAtivas}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>

          {/* Cards de Tempo Médio de Atendimento por Setor (Coluna G) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-teal-500" />
                <CardTitle className="text-lg">Tempo Médio de Atendimento por Setor</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Média de dias para atendimento (Coluna G) agrupado por setor</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(() => {
                  // Calcula o tempo médio da coluna G para cada setor (coluna C)
                  const setorStats: Record<string, { totalDias: number; count: number }> = {};
                  
                  sdrData.forEach(record => {
                    const setor = record.colC?.trim();
                    const tempoStr = record.colG?.trim();
                    
                    if (setor && tempoStr) {
                      // Tenta parsear o valor como número
                      const tempo = parseFloat(tempoStr.replace(',', '.'));
                      
                      if (!isNaN(tempo) && tempo >= 0) {
                        if (!setorStats[setor]) {
                          setorStats[setor] = { totalDias: 0, count: 0 };
                        }
                        setorStats[setor].totalDias += tempo;
                        setorStats[setor].count++;
                      }
                    }
                  });
                  
                  // Transforma em array e ordena por média
                  const setorMediaData = Object.entries(setorStats)
                    .map(([setor, { totalDias, count }]) => ({
                      setor,
                      mediaDias: count > 0 ? parseFloat((totalDias / count).toFixed(1)) : 0,
                      totalCasos: count,
                    }))
                    .sort((a, b) => a.mediaDias - b.mediaDias);
                  
                  if (setorMediaData.length === 0) {
                    return (
                      <div className="col-span-full h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Nenhum dado de tempo disponível</p>
                      </div>
                    );
                  }
                  
                  return setorMediaData.map((stat) => {
                    // Define cores baseadas em critérios fixos de tempo
                    // <= 1 dia: Super Rápido (verde escuro)
                    // 2 dias: Rápido (verde)
                    // 3 dias: Normal (amarelo)
                    // 4 dias: Demorado (laranja)
                    // >= 5 dias: Muito Demorado (vermelho)
                    
                    let bgColor = '';
                    let borderColor = '';
                    let textColor = '';
                    let statusText = '';
                    let statusIcon = '';
                    
                    if (stat.mediaDias <= 1) {
                      bgColor = 'bg-emerald-500/10';
                      borderColor = 'border-l-emerald-500';
                      textColor = 'text-emerald-600';
                      statusText = 'Super Rápido';
                      statusIcon = '⚡';
                    } else if (stat.mediaDias <= 2) {
                      bgColor = 'bg-green-500/10';
                      borderColor = 'border-l-green-500';
                      textColor = 'text-green-600';
                      statusText = 'Rápido';
                      statusIcon = '✓';
                    } else if (stat.mediaDias <= 3) {
                      bgColor = 'bg-yellow-500/10';
                      borderColor = 'border-l-yellow-500';
                      textColor = 'text-yellow-600';
                      statusText = 'Normal';
                      statusIcon = '●';
                    } else if (stat.mediaDias <= 4) {
                      bgColor = 'bg-orange-500/10';
                      borderColor = 'border-l-orange-500';
                      textColor = 'text-orange-600';
                      statusText = 'Demorado';
                      statusIcon = '⏳';
                    } else {
                      bgColor = 'bg-red-500/10';
                      borderColor = 'border-l-red-500';
                      textColor = 'text-red-600';
                      statusText = 'Muito Demorado';
                      statusIcon = '✗';
                    }
                    
                    return (
                      <Card key={stat.setor} className={`${bgColor} border-l-4 ${borderColor}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium truncate" title={stat.setor}>
                              {stat.setor}
                            </CardTitle>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${bgColor} ${textColor}`}>
                              {statusIcon} {statusText}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${textColor}`}>
                            {stat.mediaDias}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            dias em média
                          </p>
                          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                            <span>Total de casos: {stat.totalCasos}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Card de Resultados por SDR (dados da aba principal - Coluna O e B) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg">Resultados dos Atendimentos por SDR</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Distribuição de resultados (Coluna O) por SDR (Coluna B) da aba principal</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(() => {
                  // Agrupa os resultados por SDR usando os dados da aba principal
                  const sdrResultados: Record<string, Record<string, number>> = {};
                  const sdrTotais: Record<string, number> = {};
                  
                  // Aplica os mesmos filtros da seção principal
                  const filteredData = data.filter(record => {
                    if (selectedWeek && record.semana !== selectedWeek) return false;
                    if (selectedSetor && record.setor !== selectedSetor) return false;
                    return true;
                  });
                  
                  filteredData.forEach(record => {
                    const sdr = record.sdr?.trim();
                    const resultado = record.resultado?.trim()?.toLowerCase();
                    
                    if (sdr && resultado) {
                      if (!sdrResultados[sdr]) {
                        sdrResultados[sdr] = {};
                        sdrTotais[sdr] = 0;
                      }
                      
                      sdrResultados[sdr][resultado] = (sdrResultados[sdr][resultado] || 0) + 1;
                      sdrTotais[sdr]++;
                    }
                  });
                  
                  // Transforma em array e ordena por total de atendimentos
                  const sdrArray = Object.entries(sdrResultados)
                    .map(([sdr, resultados]) => ({
                      sdr,
                      resultados,
                      total: sdrTotais[sdr]
                    }))
                    .sort((a, b) => b.total - a.total);
                  
                  if (sdrArray.length === 0) {
                    return (
                      <div className="h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Nenhum dado de SDR disponível na aba principal</p>
                      </div>
                    );
                  }
                  
                  // Define cores para cada tipo de resultado
                  const getResultadoStyle = (resultado: string) => {
                    const r = resultado.toLowerCase();
                    if (r === 'contrato fechado') return { bg: 'bg-green-500', text: 'text-green-700' };
                    if (r === 'negociação' || r === 'negociacao') return { bg: 'bg-blue-500', text: 'text-blue-700' };
                    if (r === 'aguarda documentação' || r === 'aguarda documentacao') return { bg: 'bg-amber-500', text: 'text-amber-700' };
                    if (r === 'sem direito') return { bg: 'bg-red-500', text: 'text-red-700' };
                    if (r === 'não fechou' || r === 'nao fechou') return { bg: 'bg-gray-500', text: 'text-gray-700' };
                    if (r === 'aposentadoria futura') return { bg: 'bg-purple-500', text: 'text-purple-700' };
                    return { bg: 'bg-slate-500', text: 'text-slate-700' };
                  };
                  
                  return sdrArray.map(({ sdr, resultados, total }) => {
                    // Ordena resultados por quantidade
                    const resultadosOrdenados = Object.entries(resultados)
                      .sort((a, b) => b[1] - a[1]);
                    
                    return (
                      <div key={sdr} className="p-4 border rounded-lg bg-muted/10">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-base">{sdr}</h4>
                          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                            Total: {total} atendimentos
                          </span>
                        </div>
                        
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {resultadosOrdenados.map(([resultado, count]) => {
                            const pct = ((count / total) * 100).toFixed(1);
                            const style = getResultadoStyle(resultado);
                            
                            return (
                              <div key={resultado} className="flex items-center gap-2 p-2 bg-background rounded border">
                                <div className={`w-3 h-3 rounded-full ${style.bg}`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate capitalize" title={resultado}>
                                    {resultado}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-sm font-bold">{count}</span>
                                  <span className="text-xs text-muted-foreground ml-1">({pct}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Rankings de SDR - Conversões e Qualificação */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Ranking de Conversões (Contratos Fechados) por SDR */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Ranking de Conversões por SDR</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Total de contratos fechados (Coluna O) por SDR</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    // Conta contratos fechados por SDR
                    const sdrConversoes: Record<string, number> = {};
                    
                    const filteredData = data.filter(record => {
                      if (selectedWeek && record.semana !== selectedWeek) return false;
                      if (selectedSetor && record.setor !== selectedSetor) return false;
                      return true;
                    });
                    
                    filteredData.forEach(record => {
                      const sdr = record.sdr?.trim();
                      const resultado = record.resultado?.trim()?.toLowerCase();
                      
                      if (sdr) {
                        if (!sdrConversoes[sdr]) {
                          sdrConversoes[sdr] = 0;
                        }
                        if (resultado === 'contrato fechado') {
                          sdrConversoes[sdr]++;
                        }
                      }
                    });
                    
                    // Transforma em array e ordena por conversões
                    const ranking = Object.entries(sdrConversoes)
                      .filter(([_, count]) => count > 0)
                      .sort((a, b) => b[1] - a[1]);
                    
                    if (ranking.length === 0) {
                      return (
                        <div className="h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground text-sm">Nenhuma conversão registrada</p>
                        </div>
                      );
                    }
                    
                    const maxConversoes = ranking[0][1];
                    
                    return ranking.map(([sdr, count], index) => {
                      const pct = (count / maxConversoes) * 100;
                      const posicao = index + 1;
                      
                      let medalha = '';
                      let medalhaColor = '';
                      if (posicao === 1) { medalha = '🥇'; medalhaColor = 'text-yellow-500'; }
                      else if (posicao === 2) { medalha = '🥈'; medalhaColor = 'text-gray-400'; }
                      else if (posicao === 3) { medalha = '🥉'; medalhaColor = 'text-amber-600'; }
                      
                      return (
                        <div key={sdr} className="flex items-center gap-3">
                          <div className="w-8 text-center">
                            {medalha ? (
                              <span className="text-lg">{medalha}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground font-medium">{posicao}º</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate" title={sdr}>{sdr}</span>
                              <span className="text-sm font-bold text-green-600">{count}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Ranking de Qualificação (Com Direito) por SDR */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Ranking de Qualificação por SDR</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Percentual de clientes com direito (Coluna J) por SDR</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    // Conta clientes com direito e total por SDR
                    const sdrStats: Record<string, { comDireito: number; total: number }> = {};
                    
                    const filteredData = data.filter(record => {
                      if (selectedWeek && record.semana !== selectedWeek) return false;
                      if (selectedSetor && record.setor !== selectedSetor) return false;
                      return true;
                    });
                    
                    filteredData.forEach(record => {
                      const sdr = record.sdr?.trim();
                      const possuiDireito = record.possuiDireito?.trim()?.toLowerCase();
                      
                      if (sdr) {
                        if (!sdrStats[sdr]) {
                          sdrStats[sdr] = { comDireito: 0, total: 0 };
                        }
                        sdrStats[sdr].total++;
                        if (possuiDireito === 'sim' || possuiDireito === 'com direito') {
                          sdrStats[sdr].comDireito++;
                        }
                      }
                    });
                    
                    // Transforma em array e calcula percentual
                    const ranking = Object.entries(sdrStats)
                      .filter(([_, stats]) => stats.total > 0)
                      .map(([sdr, stats]) => ({
                        sdr,
                        pct: (stats.comDireito / stats.total) * 100,
                        comDireito: stats.comDireito,
                        total: stats.total
                      }))
                      .sort((a, b) => b.pct - a.pct);
                    
                    if (ranking.length === 0) {
                      return (
                        <div className="h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground text-sm">Nenhum dado de qualificação disponível</p>
                        </div>
                      );
                    }
                    
                    return ranking.map(({ sdr, pct, comDireito, total }, index) => {
                      const posicao = index + 1;
                      
                      let medalha = '';
                      if (posicao === 1) { medalha = '🥇'; }
                      else if (posicao === 2) { medalha = '🥈'; }
                      else if (posicao === 3) { medalha = '🥉'; }
                      
                      return (
                        <div key={sdr} className="flex items-center gap-3">
                          <div className="w-8 text-center">
                            {medalha ? (
                              <span className="text-lg">{medalha}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground font-medium">{posicao}º</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate" title={sdr}>{sdr}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">({comDireito}/{total})</span>
                                <span className="text-sm font-bold text-blue-600">{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Linha - Evolução % de Clientes com Direito por SDR ao longo das Semanas */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-lg">Evolução da Taxa de Qualificação por SDR</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Percentual de clientes com direito (Coluna J) por SDR ao longo das semanas (Coluna E)</p>
                
                {/* Filtro de SDRs */}
                {(() => {
                  // Calcula todos os SDRs disponíveis para o filtro
                  const allAvailableSdrs = new Set<string>();
                  data.filter(record => {
                    if (selectedSetor && record.setor !== selectedSetor) return false;
                    return true;
                  }).forEach(record => {
                    const sdr = record.sdr?.trim();
                    if (sdr) allAvailableSdrs.add(sdr);
                  });
                  const sdrOptions = Array.from(allAvailableSdrs).sort();
                  
                  if (sdrOptions.length === 0) return null;
                  
                  return (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-muted-foreground self-center">Filtrar SDRs:</span>
                      <button
                        onClick={() => setSelectedSdrsForChart([])}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedSdrsForChart.length === 0
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        Todos
                      </button>
                      {sdrOptions.map(sdr => (
                        <button
                          key={sdr}
                          onClick={() => {
                            setSelectedSdrsForChart(prev => 
                              prev.includes(sdr) 
                                ? prev.filter(s => s !== sdr)
                                : [...prev, sdr]
                            );
                          }}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            selectedSdrsForChart.includes(sdr)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                        >
                          {sdr}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupa dados por semana (Coluna E) e SDR (Coluna B)
                const weekSdrStats: Record<number, Record<string, { comDireito: number; total: number }>> = {};
                const allSdrs = new Set<string>();
                
                // Usa todos os dados da aba principal (não filtra por semana para mostrar evolução completa)
                const filteredDataForChart = data.filter(record => {
                  if (selectedSetor && record.setor !== selectedSetor) return false;
                  return true;
                });
                
                filteredDataForChart.forEach(record => {
                  const sdr = record.sdr?.trim();
                  const semana = record.semana; // Coluna E
                  const possuiDireito = record.possuiDireito?.trim()?.toLowerCase();
                  
                  if (sdr && semana && semana >= 1 && semana <= 53) {
                    allSdrs.add(sdr);
                    
                    if (!weekSdrStats[semana]) {
                      weekSdrStats[semana] = {};
                    }
                    if (!weekSdrStats[semana][sdr]) {
                      weekSdrStats[semana][sdr] = { comDireito: 0, total: 0 };
                    }
                    weekSdrStats[semana][sdr].total++;
                    if (possuiDireito === 'sim' || possuiDireito === 'com direito') {
                      weekSdrStats[semana][sdr].comDireito++;
                    }
                  }
                });
                
                // Filtra SDRs com base na seleção do usuário
                const allSdrsArray = Array.from(allSdrs).sort();
                const sdrArray = selectedSdrsForChart.length > 0 
                  ? allSdrsArray.filter(sdr => selectedSdrsForChart.includes(sdr))
                  : allSdrsArray;
                
                if (sdrArray.length === 0) {
                  return (
                    <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                    </div>
                  );
                }
                
                // Cria array com TODAS as semanas de 1 a 53
                const chartData = [];
                for (let semana = 1; semana <= 53; semana++) {
                  const weekData: Record<string, any> = { semana };
                  
                  sdrArray.forEach(sdr => {
                    const stats = weekSdrStats[semana]?.[sdr];
                    if (stats && stats.total > 0) {
                      weekData[sdr] = parseFloat(((stats.comDireito / stats.total) * 100).toFixed(1));
                    } else {
                      weekData[sdr] = null; // Sem dados para essa semana
                    }
                  });
                  
                  chartData.push(weekData);
                }
                
                // Paleta (tokens) para garantir cores distintas por SDR
                const SDR_COLORS = [
                  'hsl(var(--chart-1))',
                  'hsl(var(--chart-2))',
                  'hsl(var(--chart-3))',
                  'hsl(var(--chart-4))',
                  'hsl(var(--chart-5))',
                ];

                // Padrões de traço (fallback quando exceder a paleta)
                const SDR_DASH = ['0', '6 3', '3 3', '10 4', '2 2'];
                
                return (
                  <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 120, left: 20, bottom: 20 }}>
                        <XAxis 
                          dataKey="semana" 
                          tick={{ fontSize: 9 }}
                          interval={1}
                          label={{ value: 'Semana (Coluna E)', position: 'insideBottom', offset: -5, fontSize: 11 }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fontSize: 11 }}
                          label={{ value: '% Com Direito', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <Tooltip 
                          formatter={(value: number | null, name: string) => [
                            value !== null ? `${value}%` : 'Sem dados', 
                            name
                          ]}
                          labelFormatter={(label) => `Semana ${label}`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend 
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          wrapperStyle={{ paddingLeft: '20px' }}
                          iconType="line"
                        />
                        {sdrArray.map((sdr, index) => {
                          const color = SDR_COLORS[index % SDR_COLORS.length];
                          const dash = SDR_DASH[index % SDR_DASH.length];

                          return (
                            <Line
                              key={sdr}
                              type="monotone"
                              dataKey={sdr}
                              name={sdr}
                              stroke={color}
                              strokeDasharray={dash === '0' ? undefined : dash}
                              strokeWidth={3}
                              style={{ stroke: color }}
                              dot={{ fill: color, stroke: color, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 7, stroke: color, fill: color, strokeWidth: 2 }}
                              connectNulls={true}
                              isAnimationActive={false}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Mensagem de configuração */}
          {sdrData.length === 0 && !isLoading && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-700">Aba SDR não encontrada ou vazia</p>
                    <p className="text-sm text-muted-foreground">
                      Verifique se a aba com GID 1631515229 existe e contém dados na planilha.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráficos de Mensagens Enviadas por SDR - Dinâmico */}
          <div className="flex flex-col gap-6">
            {sdrMessagesSdrNames.length > 0 ? (
              sdrMessagesSdrNames.map((sdrName, index) => {
                const chartColors = [
                  'hsl(var(--chart-1))',
                  'hsl(var(--chart-2))',
                  'hsl(var(--chart-3))',
                  'hsl(var(--chart-4))',
                  'hsl(var(--chart-5))',
                ];
                const iconColors = [
                  'text-pink-500',
                  'text-purple-500',
                  'text-blue-500',
                  'text-emerald-500',
                  'text-orange-500',
                ];
                const fillColor = chartColors[index % chartColors.length];
                const iconColor = iconColors[index % iconColors.length];
                
                return (
                  <Card key={sdrName}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <BarChart3 className={`h-5 w-5 ${iconColor}`} />
                        <CardTitle className="text-base">Mensagens - {sdrName}</CardTitle>
                      </div>
                      <p className="text-xs text-muted-foreground">Quantidade de mensagens por semana</p>
                    </CardHeader>
                    <CardContent>
                      {sdrMessagesData.length > 0 ? (
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sdrMessagesData} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
                              <XAxis 
                                dataKey="semana" 
                                tick={{ fontSize: 9 }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip 
                                formatter={(value: number) => [value, 'Mensagens']}
                                labelFormatter={(label) => `Semana ${label}`}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar dataKey={sdrName} fill={fillColor} radius={[4, 4, 0, 0]}>
                                <LabelList dataKey={sdrName} position="top" fontSize={9} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-700">Nenhum SDR encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        Verifique se a aba de mensagens (GID 686842485) possui SDRs no cabeçalho.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ===================== SEÇÃO: RADAR INDICAÇÕES CLIENTES ANTIGOS ===================== */}
      <Collapsible 
        open={openSection === 'indicacoes'} 
        onOpenChange={() => handleSectionToggle('indicacoes')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Indicações Clientes Antigos</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'indicacoes' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8 mt-6">
          
          {/* Ranking de Responsáveis por Contatos de Indicação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Ranking de Contatos para Indicação</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Responsáveis por contatar clientes antigos pedindo indicações (Coluna C)</p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupa por responsável e conta quantos contatos cada um fez
                const responsavelCounts: Record<string, number> = {};
                
                indicacoesData.forEach(record => {
                  const responsavel = record.responsavel?.trim();
                  if (responsavel) {
                    responsavelCounts[responsavel] = (responsavelCounts[responsavel] || 0) + 1;
                  }
                });
                
                // Transforma em array e ordena por quantidade
                const rankingData = Object.entries(responsavelCounts)
                  .map(([responsavel, total]) => ({ responsavel, total }))
                  .sort((a, b) => b.total - a.total)
                  .map((item, index) => ({ ...item, posicao: index + 1 }));
                
                if (rankingData.length === 0) {
                  return (
                    <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center">
                        <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">Nenhum dado disponível</p>
                        <p className="text-sm text-muted-foreground/70">Verifique se a aba de indicações (GID 290508236) contém dados</p>
                      </div>
                    </div>
                  );
                }
                
                const maxTotal = rankingData[0]?.total || 1;
                
                return (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {rankingData.map((item) => {
                      const barWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                      
                      // Medalhas para os 3 primeiros
                      let medalha = '';
                      if (item.posicao === 1) { medalha = '🥇'; }
                      else if (item.posicao === 2) { medalha = '🥈'; }
                      else if (item.posicao === 3) { medalha = '🥉'; }
                      
                      return (
                        <div key={item.responsavel} className="flex items-center gap-3">
                          {/* Posição no ranking */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                            item.posicao === 1 ? 'bg-yellow-500 text-yellow-950' :
                            item.posicao === 2 ? 'bg-gray-300 text-gray-700' :
                            item.posicao === 3 ? 'bg-amber-600 text-amber-50' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {medalha || `${item.posicao}º`}
                          </div>
                          
                          {/* Nome do responsável */}
                          <div className="flex-shrink-0 w-40 text-sm font-medium truncate" title={item.responsavel}>
                            {item.responsavel}
                          </div>
                          
                          {/* Barra horizontal */}
                          <div className="flex-1 relative">
                            <div className="h-8 bg-muted/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            {/* Valor */}
                            <div className="absolute inset-0 flex items-center justify-end pr-3">
                              <span className="text-sm font-semibold text-foreground">
                                {item.total} {item.total === 1 ? 'contato' : 'contatos'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Gráfico de Evolução Semanal de Contatos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Evolução Semanal de Contatos</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Quantidade de clientes contatados por semana. 
                <span className="text-destructive font-medium ml-1">Linha vermelha = Meta semanal (~11.87 contatos para alcançar 629 no ano)</span>
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calcula a meta semanal: 629 contatos / 53 semanas
                const metaSemanal = 629 / 53; // ≈ 11.87
                
                // Agrupa contatos por semana (Coluna D)
                const contatosPorSemana: Record<number, number> = {};
                
                indicacoesData.forEach(record => {
                  const semanaStr = record.semana?.trim();
                  const semana = parseInt(semanaStr) || 0;
                  if (semana >= 1 && semana <= 53) {
                    contatosPorSemana[semana] = (contatosPorSemana[semana] || 0) + 1;
                  }
                });
                
                // Cria array com TODAS as semanas de 1 a 53
                const chartData = [];
                for (let semana = 1; semana <= 53; semana++) {
                  chartData.push({
                    semana,
                    contatos: contatosPorSemana[semana] || 0,
                  });
                }
                
                // Calcula total para exibição
                const totalContatos = Object.values(contatosPorSemana).reduce((sum, v) => sum + v, 0);
                
                // Calcula semana atual do ano
                const hoje = new Date();
                const inicioAno = new Date(hoje.getFullYear(), 0, 1);
                const diffDias = Math.floor((hoje.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24));
                const semanaAtual = Math.ceil((diffDias + inicioAno.getDay() + 1) / 7);
                
                // Calcula média necessária para as semanas restantes
                const semanasRestantes = Math.max(53 - semanaAtual, 1);
                const contatosFaltantes = Math.max(629 - totalContatos, 0);
                const mediaNecessaria = contatosFaltantes / semanasRestantes;
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total de contatos: </span>
                          <span className="font-bold text-amber-600">{totalContatos}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Meta anual: </span>
                          <span className="font-bold text-foreground">629</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Progresso: </span>
                          <span className={`font-bold ${totalContatos >= 629 ? 'text-green-600' : 'text-amber-600'}`}>
                            {((totalContatos / 629) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm border-l pl-4 ml-2">
                          <span className="text-muted-foreground">Semanas restantes: </span>
                          <span className="font-bold text-foreground">{semanasRestantes}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Média necessária: </span>
                          <span className={`font-bold ${mediaNecessaria <= metaSemanal ? 'text-green-600' : mediaNecessaria <= metaSemanal * 1.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {mediaNecessaria.toFixed(1)}/semana
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 20 }}>
                          <XAxis 
                            dataKey="semana" 
                            tick={{ fontSize: 9 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                            className="text-muted-foreground"
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value: number) => [`${value} contatos`, 'Contatos']}
                            labelFormatter={(label) => `Semana ${label}`}
                          />
                          {/* Linha de meta (629/53 ≈ 11.87) */}
                          <ReferenceLine 
                            y={metaSemanal} 
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                          />
                          <ReferenceLine 
                            y={metaSemanal} 
                            stroke="transparent"
                            label={{ 
                              value: `Meta: ${metaSemanal.toFixed(1)}`, 
                              position: 'insideTopRight',
                              fill: '#ef4444',
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          />
                          <Bar 
                            dataKey="contatos" 
                            fill="hsl(var(--chart-3))"
                            radius={[4, 4, 0, 0]}
                          >
                            <LabelList 
                              dataKey="contatos" 
                              position="top" 
                              className="fill-foreground"
                              fontSize={9}
                              formatter={(value: number) => value > 0 ? value : ''}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* === Cards de Indicações Recebidas (GID 2087539342) === */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Ranking de Indicações */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Ranking de Indicações</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Responsáveis por conseguir mais indicações (aba GID 2087539342)
                </p>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Agrupa por responsável e conta indicações
                  const responsavelCounts: Record<string, number> = {};
                  
                  indicacoesRecebidasData.forEach(record => {
                    const responsavel = record.responsavel?.trim();
                    if (responsavel) {
                      responsavelCounts[responsavel] = (responsavelCounts[responsavel] || 0) + 1;
                    }
                  });
                  
                  // Transforma em array e ordena
                  const rankingData = Object.entries(responsavelCounts)
                    .map(([responsavel, total]) => ({ responsavel, total }))
                    .sort((a, b) => b.total - a.total)
                    .map((item, index) => ({ ...item, posicao: index + 1 }));
                  
                  if (rankingData.length === 0) {
                    return (
                      <div className="h-[150px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                        <div className="text-center">
                          <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                        </div>
                      </div>
                    );
                  }
                  
                  const maxTotal = rankingData[0]?.total || 1;
                  
                  return (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {rankingData.map((item) => {
                        const barWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                        
                        let medalha = '';
                        if (item.posicao === 1) { medalha = '🥇'; }
                        else if (item.posicao === 2) { medalha = '🥈'; }
                        else if (item.posicao === 3) { medalha = '🥉'; }
                        
                        return (
                          <div key={item.responsavel} className="flex items-center gap-2">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              item.posicao === 1 ? 'bg-yellow-500 text-yellow-950' :
                              item.posicao === 2 ? 'bg-gray-300 text-gray-700' :
                              item.posicao === 3 ? 'bg-amber-600 text-amber-50' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {medalha || `${item.posicao}º`}
                            </div>
                            <div className="flex-shrink-0 w-28 text-xs font-medium truncate" title={item.responsavel}>
                              {item.responsavel}
                            </div>
                            <div className="flex-1 relative">
                              <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-end pr-2">
                                <span className="text-xs font-semibold text-foreground">
                                  {item.total}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Card 2: Total de Indicações */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Total de Indicações</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-5xl font-bold text-blue-600">
                    {indicacoesRecebidasData.length}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">
                    indicações recebidas
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Atingimento da Meta */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Atingimento da Meta</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const META_INDICACOES = 750;
                  const total = indicacoesRecebidasData.length;
                  const percentual = (total / META_INDICACOES) * 100;
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-4">
                      <span className={`text-5xl font-bold ${
                        percentual >= 100 ? 'text-green-600' :
                        percentual >= 75 ? 'text-yellow-600' :
                        'text-amber-600'
                      }`}>
                        {percentual.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground mt-2">
                        da meta de {META_INDICACOES}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({total} de {META_INDICACOES})
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Card 4: Resultado por Indicação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <PieChart className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Resultado das Indicações</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Distribuição dos resultados de cada indicação (Coluna E - GID 2087539342)
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupa por resultado
                const resultadoCounts: Record<string, number> = {};
                
                indicacoesRecebidasData.forEach(record => {
                  const resultado = record.resultado?.trim() || 'Sem resultado';
                  resultadoCounts[resultado] = (resultadoCounts[resultado] || 0) + 1;
                });
                
                // Transforma em array e ordena por quantidade
                const resultadoData = Object.entries(resultadoCounts)
                  .map(([resultado, total]) => ({ resultado, total }))
                  .sort((a, b) => b.total - a.total);
                
                const total = indicacoesRecebidasData.length;
                
                if (resultadoData.length === 0) {
                  return (
                    <div className="h-[150px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center">
                        <PieChart className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                      </div>
                    </div>
                  );
                }
                
                // Cores para os diferentes resultados
                const coresResultado: Record<string, string> = {
                  'contrato fechado': 'bg-green-500',
                  'negociação': 'bg-blue-500',
                  'aguarda documentação': 'bg-yellow-500',
                  'não possui direito': 'bg-red-500',
                  'desistiu': 'bg-gray-500',
                  'não atende': 'bg-orange-500',
                };
                
                const getCor = (resultado: string) => {
                  const key = resultado.toLowerCase();
                  for (const [pattern, cor] of Object.entries(coresResultado)) {
                    if (key.includes(pattern)) return cor;
                  }
                  return 'bg-purple-500';
                };
                
                return (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {resultadoData.map((item) => {
                      const percentual = total > 0 ? ((item.total / total) * 100).toFixed(1) : '0';
                      
                      return (
                        <div 
                          key={item.resultado} 
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          <div className={`w-3 h-3 rounded-full ${getCor(item.resultado)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={item.resultado}>
                              {item.resultado}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.total} ({percentual}%)
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Gráfico de Evolução Acumulada de Indicações vs Meta */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Evolução Acumulada vs Meta</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Comparativo entre indicações acumuladas e a meta de 750 indicações no ano
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                const META_INDICACOES = 750;
                const metaPorSemana = META_INDICACOES / 53; // ~14.15 por semana
                
                // Agrupa indicações por semana
                const indicacoesPorSemana: Record<number, number> = {};
                
                indicacoesRecebidasData.forEach(record => {
                  const semanaStr = record.semana?.trim();
                  const semana = parseInt(semanaStr) || 0;
                  if (semana >= 1 && semana <= 53) {
                    indicacoesPorSemana[semana] = (indicacoesPorSemana[semana] || 0) + 1;
                  }
                });
                
                // Cria array com TODAS as semanas de 1 a 53 com valores acumulados
                const chartData = [];
                let acumulado = 0;
                
                for (let semana = 1; semana <= 53; semana++) {
                  acumulado += indicacoesPorSemana[semana] || 0;
                  const metaAcumulada = Math.round(metaPorSemana * semana);
                  
                  chartData.push({
                    semana,
                    acumulado,
                    meta: metaAcumulada,
                  });
                }
                
                const totalIndicacoes = indicacoesRecebidasData.length;
                const percentualMeta = ((totalIndicacoes / META_INDICACOES) * 100).toFixed(1);
                
                // Encontra a semana atual
                const hoje = new Date();
                const inicioAno = new Date(hoje.getFullYear(), 0, 1);
                const diffDias = Math.floor((hoje.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24));
                const semanaAtual = Math.min(Math.ceil((diffDias + inicioAno.getDay() + 1) / 7), 53);
                
                // Meta esperada até a semana atual
                const metaEsperada = Math.round(metaPorSemana * semanaAtual);
                const diferencaMeta = totalIndicacoes - metaEsperada;
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Semana atual: </span>
                        <span className="font-bold text-foreground">{semanaAtual}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total acumulado: </span>
                        <span className="font-bold text-blue-600">{totalIndicacoes}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Meta esperada (S{semanaAtual}): </span>
                        <span className="font-bold text-green-600">{metaEsperada}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Diferença: </span>
                        <span className={`font-bold ${diferencaMeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diferencaMeta >= 0 ? '+' : ''}{diferencaMeta}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Atingimento: </span>
                        <span className={`font-bold ${parseFloat(percentualMeta) >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {percentualMeta}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-blue-500 rounded" />
                        <span className="text-muted-foreground">Indicações Acumuladas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-green-500 rounded" style={{ opacity: 0.7 }} />
                        <span className="text-muted-foreground">Meta Sustentável (750/ano)</span>
                      </div>
                    </div>
                    
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <XAxis 
                            dataKey="semana" 
                            tick={{ fontSize: 9 }}
                            interval={3}
                            className="text-muted-foreground"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            className="text-muted-foreground"
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 'auto']}
                          />
                          <Tooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value: number, name: string) => [
                              value, 
                              name === 'acumulado' ? 'Indicações' : 'Meta'
                            ]}
                            labelFormatter={(label) => `Semana ${label}`}
                          />
                          {/* Linha de meta sustentável */}
                          <Line 
                            type="monotone"
                            dataKey="meta" 
                            stroke="hsl(var(--success))"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            dot={false}
                            opacity={0.7}
                          />
                          {/* Linha de indicações acumuladas */}
                          <Line 
                            type="monotone"
                            dataKey="acumulado" 
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={3}
                            dot={false}
                          />
                          {/* Linha vertical na semana atual */}
                          <ReferenceLine 
                            x={semanaAtual} 
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            label={{ 
                              value: 'Hoje', 
                              position: 'top',
                              fill: 'hsl(var(--muted-foreground))',
                              fontSize: 10
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ===================== SEÇÃO: RADAR SANEAMENTO DE PASTAS ===================== */}
      <Collapsible 
        open={openSection === 'saneamento'} 
        onOpenChange={() => handleSectionToggle('saneamento')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 rounded-lg border border-teal-500/30 hover:border-teal-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <FolderCheck className="h-6 w-6 text-teal-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Saneamento de Pastas</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'saneamento' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8 mt-6">
          
          {/* Cards de métricas principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total de Pastas */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <FolderCheck className="h-5 w-5 text-teal-500" />
                  <CardTitle className="text-lg">Total de Pastas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-5xl font-bold text-teal-600">
                    {saneamentoData.length}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">
                    pastas para sanear
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Pastas Saneadas */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Pastas Saneadas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const saneadas = saneamentoData.filter(r => {
                    const status = (r.colI || '').toLowerCase().trim();
                    return status === 'saneado';
                  }).length;
                  const percentual = saneamentoData.length > 0 ? ((saneadas / saneamentoData.length) * 100).toFixed(1) : '0';
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-4">
                      <span className="text-5xl font-bold text-green-600">
                        {saneadas}
                      </span>
                      <span className="text-sm text-muted-foreground mt-2">
                        saneadas ({percentual}%)
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Card 3: Pastas Pendentes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Pastas Pendentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const saneadas = saneamentoData.filter(r => {
                    const status = (r.colI || '').toLowerCase().trim();
                    return status === 'saneado';
                  }).length;
                  const pendentes = saneamentoData.length - saneadas;
                  const percentual = saneamentoData.length > 0 ? ((pendentes / saneamentoData.length) * 100).toFixed(1) : '0';
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-4">
                      <span className="text-5xl font-bold text-amber-600">
                        {pendentes}
                      </span>
                      <span className="text-sm text-muted-foreground mt-2">
                        pendentes ({percentual}%)
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Card 4: Taxa de Conclusão e Meta */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Evolução do Saneamento</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totalPastas = saneamentoData.length;
                  const saneadas = saneamentoData.filter(r => {
                    const status = (r.colI || '').toLowerCase().trim();
                    return status === 'saneado';
                  }).length;
                  
                  // Calcula a semana atual baseada nas pastas saneadas
                  const semanasComDados = saneamentoData
                    .filter(r => (r.colI || '').toLowerCase().trim() === 'saneado')
                    .map(r => parseInt((r.colJ || '').trim()) || 0)
                    .filter(s => s >= 1 && s <= 53);
                  
                  const semanaAtual = semanasComDados.length > 0 ? Math.max(...semanasComDados) : 1;
                  const totalSemanas = 53;
                  
                  // Taxa atual
                  const taxaAtual = totalPastas > 0 ? ((saneadas / totalPastas) * 100) : 0;
                  
                  // Taxa esperada (proporcional à semana do ano)
                  const taxaEsperada = (semanaAtual / totalSemanas) * 100;
                  
                  // Pastas esperadas até agora
                  const pastasEsperadas = Math.ceil((semanaAtual / totalSemanas) * totalPastas);
                  
                  // Gap: quantas pastas faltam para atingir a meta
                  const gap = pastasEsperadas - saneadas;
                  
                  // Status: acima, dentro ou abaixo da meta
                  const diferencaTaxa = taxaAtual - taxaEsperada;
                  const statusCor = diferencaTaxa >= 0 ? 'text-green-600' : diferencaTaxa >= -5 ? 'text-yellow-600' : 'text-red-600';
                  const statusBg = diferencaTaxa >= 0 ? 'bg-green-100' : diferencaTaxa >= -5 ? 'bg-yellow-100' : 'bg-red-100';
                  const statusLabel = diferencaTaxa >= 0 ? 'Dentro da Meta' : diferencaTaxa >= -5 ? 'Atenção' : 'Abaixo da Meta';
                  
                  return (
                    <div className="space-y-4">
                      {/* Taxa Atual vs Esperada */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col items-center flex-1">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Atual</span>
                          <span className={`text-3xl font-bold ${statusCor}`}>
                            {taxaAtual.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xl">vs</div>
                        <div className="flex flex-col items-center flex-1">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Esperada</span>
                          <span className="text-3xl font-bold text-blue-600">
                            {taxaEsperada.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Barra de progresso visual */}
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-blue-300 rounded-full"
                          style={{ width: `${Math.min(taxaEsperada, 100)}%` }}
                        />
                        <div 
                          className={`absolute h-full rounded-full ${diferencaTaxa >= 0 ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(taxaAtual, 100)}%` }}
                        />
                      </div>
                      
                      {/* Status e Gap */}
                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBg} ${statusCor}`}>
                          {statusLabel}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Semana {semanaAtual} de {totalSemanas}
                        </span>
                      </div>
                      
                      {/* Gap de pastas */}
                      {gap > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                          <span className="text-amber-800 text-sm font-medium">
                            ⚠️ Faltam <strong>{gap}</strong> pasta{gap !== 1 ? 's' : ''} para atingir a meta
                          </span>
                          <p className="text-amber-600 text-xs mt-1">
                            ({saneadas} saneadas / {pastasEsperadas} esperadas até a semana {semanaAtual})
                          </p>
                        </div>
                      )}
                      
                      {gap <= 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <span className="text-green-800 text-sm font-medium">
                            ✅ {Math.abs(gap)} pasta{Math.abs(gap) !== 1 ? 's' : ''} à frente da meta!
                          </span>
                          <p className="text-green-600 text-xs mt-1">
                            ({saneadas} saneadas / {pastasEsperadas} esperadas até a semana {semanaAtual})
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Responsáveis */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-teal-500" />
                <CardTitle className="text-lg">Ranking de Saneamento por Responsável</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Responsáveis com mais pastas saneadas (Coluna H)
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Filtra apenas pastas saneadas e agrupa por responsável
                const saneadasPorResponsavel: Record<string, number> = {};
                const totalPorResponsavel: Record<string, number> = {};
                
                saneamentoData.forEach(record => {
                  const responsavel = (record.colH || '').trim();
                  if (!responsavel) return;
                  
                  totalPorResponsavel[responsavel] = (totalPorResponsavel[responsavel] || 0) + 1;
                  
                  const status = (record.colI || '').toLowerCase().trim();
                  const isSaneada = status === 'saneado';
                  
                  if (isSaneada) {
                    saneadasPorResponsavel[responsavel] = (saneadasPorResponsavel[responsavel] || 0) + 1;
                  }
                });
                
                // Transforma em array e ordena por quantidade saneada
                const rankingData = Object.entries(totalPorResponsavel)
                  .map(([responsavel, total]) => ({
                    responsavel,
                    total,
                    saneadas: saneadasPorResponsavel[responsavel] || 0,
                    percentual: total > 0 ? ((saneadasPorResponsavel[responsavel] || 0) / total) * 100 : 0
                  }))
                  .sort((a, b) => b.saneadas - a.saneadas)
                  .map((item, index) => ({ ...item, posicao: index + 1 }));
                
                if (rankingData.length === 0) {
                  return (
                    <div className="h-[150px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center">
                        <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                      </div>
                    </div>
                  );
                }
                
                const maxSaneadas = rankingData[0]?.saneadas || 1;
                
                return (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {rankingData.map((item) => {
                      const barWidth = maxSaneadas > 0 ? (item.saneadas / maxSaneadas) * 100 : 0;
                      
                      let medalha = '';
                      if (item.posicao === 1) { medalha = '🥇'; }
                      else if (item.posicao === 2) { medalha = '🥈'; }
                      else if (item.posicao === 3) { medalha = '🥉'; }
                      
                      return (
                        <div key={item.responsavel} className="flex items-center gap-2">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            item.posicao === 1 ? 'bg-yellow-500 text-yellow-950' :
                            item.posicao === 2 ? 'bg-gray-300 text-gray-700' :
                            item.posicao === 3 ? 'bg-amber-600 text-amber-50' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {medalha || `${item.posicao}º`}
                          </div>
                          <div className="flex-shrink-0 w-32 text-xs font-medium truncate" title={item.responsavel}>
                            {item.responsavel}
                          </div>
                          <div className="flex-1 relative">
                            <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-end pr-2">
                              <span className="text-xs font-semibold text-foreground">
                                {item.saneadas}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Gráfico de Evolução Semanal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-teal-500" />
                <CardTitle className="text-lg">Evolução Semanal de Saneamento</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Quantidade de pastas saneadas por semana (Coluna J)
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupa saneamentos por semana
                const saneamentosPorSemana: Record<number, number> = {};
                
                saneamentoData.forEach(record => {
                  const status = (record.colI || '').toLowerCase().trim();
                  const isSaneada = status === 'saneado';
                  
                  if (isSaneada) {
                    const semanaStr = (record.colJ || '').trim();
                    const semana = parseInt(semanaStr) || 0;
                    if (semana >= 1 && semana <= 53) {
                      saneamentosPorSemana[semana] = (saneamentosPorSemana[semana] || 0) + 1;
                    }
                  }
                });
                
                // Encontra a primeira e última semana com dados
                const semanasComDados = Object.keys(saneamentosPorSemana).map(Number).filter(s => s > 0);
                const primeiraSemanaDados = semanasComDados.length > 0 ? Math.min(...semanasComDados) : 1;
                const ultimaSemanaDados = semanasComDados.length > 0 ? Math.max(...semanasComDados) : 53;
                
                // Cria array com semanas do intervalo
                const chartData = [];
                for (let semana = Math.max(1, primeiraSemanaDados - 2); semana <= Math.min(53, ultimaSemanaDados + 2); semana++) {
                  chartData.push({
                    semana,
                    saneadas: saneamentosPorSemana[semana] || 0,
                  });
                }
                
                const totalSaneadas = Object.values(saneamentosPorSemana).reduce((sum, v) => sum + v, 0);
                
                if (totalSaneadas === 0) {
                  return (
                    <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center">
                        <BarChart3 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum saneamento registrado com semana</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total saneadas com semana registrada: </span>
                      <span className="font-bold text-teal-600">{totalSaneadas}</span>
                    </div>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 20 }}>
                          <XAxis 
                            dataKey="semana" 
                            tick={{ fontSize: 10 }}
                            className="text-muted-foreground"
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value: number) => [`${value} pastas`, 'Saneadas']}
                            labelFormatter={(label) => `Semana ${label}`}
                          />
                          <Bar 
                            dataKey="saneadas" 
                            fill="hsl(var(--chart-4))"
                            radius={[4, 4, 0, 0]}
                          >
                            <LabelList 
                              dataKey="saneadas" 
                              position="top" 
                              className="fill-foreground"
                              fontSize={10}
                              formatter={(value: number) => value > 0 ? value : ''}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>


      {/* ===================== SEÇÃO: RADAR ADMINISTRATIVO ===================== */}
      <Collapsible 
        open={openSection === 'administrativo'} 
        onOpenChange={() => handleSectionToggle('administrativo')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-indigo-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Administrativo</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'administrativo' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8 mt-6">
          
          {/* Cards de métricas principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total de Avaliações */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg">Total de Avaliações</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-5xl font-bold text-indigo-600">
                    {administrativoData.length}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">
                    avaliações recebidas
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Média de Estrelas */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <CardTitle className="text-lg">Média de Estrelas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const avaliacoes = administrativoData
                    .map(r => parseInt((r.colD || '0').trim()) || 0)
                    .filter(e => e >= 1 && e <= 5);
                  const media = avaliacoes.length > 0 
                    ? avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length 
                    : 0;
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-5xl font-bold text-yellow-600">
                          {media.toFixed(1)}
                        </span>
                        <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div className="flex gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= Math.round(media) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Card 3: Avaliações 5 Estrelas */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">5 Estrelas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const cincoEstrelas = administrativoData.filter(r => {
                    const estrelas = parseInt((r.colD || '0').trim()) || 0;
                    return estrelas === 5;
                  }).length;
                  const percentual = administrativoData.length > 0 
                    ? ((cincoEstrelas / administrativoData.length) * 100) 
                    : 0;
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-4">
                      <span className="text-5xl font-bold text-green-600">
                        {cincoEstrelas}
                      </span>
                      <span className="text-sm text-muted-foreground mt-2">
                        ({percentual.toFixed(1)}% do total)
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Card 4: Avaliações Negativas (1-3 estrelas) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg">Avaliações Críticas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const criticas = administrativoData.filter(r => {
                    const estrelas = parseInt((r.colD || '0').trim()) || 0;
                    return estrelas >= 1 && estrelas <= 3;
                  }).length;
                  const percentual = administrativoData.length > 0 
                    ? ((criticas / administrativoData.length) * 100) 
                    : 0;
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-4">
                      <span className={`text-5xl font-bold ${criticas > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {criticas}
                      </span>
                      <span className="text-sm text-muted-foreground mt-2">
                        de 1 a 3 estrelas ({percentual.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por Estrelas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg">Distribuição por Estrelas</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Quantidade de avaliações por nota (Coluna D)
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Conta avaliações por estrela
                const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                
                administrativoData.forEach(record => {
                  const estrelas = parseInt((record.colD || '0').trim()) || 0;
                  if (estrelas >= 1 && estrelas <= 5) {
                    distribuicao[estrelas]++;
                  }
                });
                
                const total = Object.values(distribuicao).reduce((a, b) => a + b, 0);
                const maxCount = Math.max(...Object.values(distribuicao), 1);
                
                if (total === 0) {
                  return (
                    <div className="h-[150px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center">
                        <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhuma avaliação disponível</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(estrela => {
                      const count = distribuicao[estrela];
                      const percentual = total > 0 ? (count / total) * 100 : 0;
                      const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      const barColor = estrela >= 4 ? 'bg-green-500' : estrela === 3 ? 'bg-yellow-500' : 'bg-red-500';
                      
                      return (
                        <div key={estrela} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-20">
                            <span className="text-sm font-medium">{estrela}</span>
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          </div>
                          <div className="flex-1 relative">
                            <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-sm font-semibold">{count}</span>
                            <span className="text-xs text-muted-foreground ml-1">({percentual.toFixed(0)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Gráfico de Evolução Semanal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg">Evolução Semanal de Avaliações</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Quantidade de avaliações por semana (Coluna B)
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Agrupa avaliações por semana
                const avaliacoesPorSemana: Record<number, { total: number; soma: number }> = {};
                
                administrativoData.forEach(record => {
                  const semanaStr = (record.colB || '').trim();
                  const semana = parseInt(semanaStr) || 0;
                  const estrelas = parseInt((record.colD || '0').trim()) || 0;
                  
                  if (semana >= 1 && semana <= 53 && estrelas >= 1 && estrelas <= 5) {
                    if (!avaliacoesPorSemana[semana]) {
                      avaliacoesPorSemana[semana] = { total: 0, soma: 0 };
                    }
                    avaliacoesPorSemana[semana].total++;
                    avaliacoesPorSemana[semana].soma += estrelas;
                  }
                });
                
                // Encontra a primeira e última semana com dados
                const semanasComDados = Object.keys(avaliacoesPorSemana).map(Number).filter(s => s > 0);
                
                if (semanasComDados.length === 0) {
                  return (
                    <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center">
                        <BarChart3 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum dado semanal disponível</p>
                      </div>
                    </div>
                  );
                }
                
                const primeiraSemanaDados = Math.min(...semanasComDados);
                const ultimaSemanaDados = Math.max(...semanasComDados);
                
                // Cria array com semanas do intervalo
                const chartData = [];
                for (let semana = Math.max(1, primeiraSemanaDados); semana <= Math.min(53, ultimaSemanaDados); semana++) {
                  const dados = avaliacoesPorSemana[semana] || { total: 0, soma: 0 };
                  const media = dados.total > 0 ? (dados.soma / dados.total) : 0;
                  chartData.push({
                    semana: `S${semana}`,
                    avaliacoes: dados.total,
                    media: parseFloat(media.toFixed(1))
                  });
                }
                
                return (
                  <ChartContainer config={{ avaliacoes: { label: "Avaliações", color: "hsl(var(--chart-1))" } }} className="h-[300px] w-full">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3">
                                <p className="font-medium">{data.semana}</p>
                                <p className="text-sm text-muted-foreground">{data.avaliacoes} avaliações</p>
                                <p className="text-sm text-yellow-600">Média: {data.media} ⭐</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="avaliacoes" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="avaliacoes" position="top" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* ===== SEÇÃO: TAREFAS DE DOCUMENTAÇÃO (GID 1905290884) ===== */}
          <div className="col-span-full mt-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-violet-500" />
              <h3 className="text-lg font-semibold text-violet-300">Tarefas de Documentação no Sistema</h3>
            </div>
          </div>

          {(() => {
            // Processa dados da aba de documentação
            const totalTarefas = administrativo2Data.length;
            
            // Detecta "feito" na coluna D
            const tarefasFinalizadas = administrativo2Data.filter(r => {
              const status = (r.colD || '').toLowerCase().trim();
              return status === 'feito' || status.includes('feito');
            }).length;
            const tarefasPendentes = totalTarefas - tarefasFinalizadas;
            const taxaConclusao = totalTarefas > 0 ? ((tarefasFinalizadas / totalTarefas) * 100).toFixed(1) : '0';

            // Calcula semana atual do ano (usando getWeek do date-fns seria mais preciso, mas vamos usar cálculo manual)
            const hoje = new Date();
            const inicioAno = new Date(hoje.getFullYear(), 0, 1);
            const diffDias = Math.floor((hoje.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24));
            const semanaAtual = Math.ceil((diffDias + inicioAno.getDay() + 1) / 7);

            // Identifica todas as semanas disponíveis nos dados para encontrar a mais recente
            const semanasDisponiveis = administrativo2Data
              .map(r => parseInt((r.colA || '0').trim()) || 0)
              .filter(s => s >= 1 && s <= 53);
            
            // Se não há dados da semana atual, usa a última semana com dados
            const semanaParaExibir = semanasDisponiveis.includes(semanaAtual) 
              ? semanaAtual 
              : Math.max(...semanasDisponiveis, 1);

            // Conta pastas esperadas da semana vs realizadas na semana
            const pastasSemanaAtual = administrativo2Data.filter(r => {
              const semana = parseInt((r.colA || '0').trim()) || 0;
              return semana === semanaParaExibir;
            });
            const esperadoSemanaAtual = pastasSemanaAtual.length;
            const realizadoSemanaAtual = pastasSemanaAtual.filter(r => {
              const status = (r.colD || '').toLowerCase().trim();
              return status === 'feito' || status.includes('feito');
            }).length;
            const percentualSemanaAtual = esperadoSemanaAtual > 0 ? ((realizadoSemanaAtual / esperadoSemanaAtual) * 100).toFixed(1) : '0';
            
            // Flag para indicar se estamos mostrando semana atual ou a última disponível
            const mostrandoSemanaAtual = semanaParaExibir === semanaAtual;

            // Semanas únicas disponíveis para o filtro do ranking
            const semanasUnicasAdmin = [...new Set(semanasDisponiveis)].sort((a, b) => a - b);

            // Filtra dados para o ranking baseado na semana selecionada
            const dadosParaRanking = adminRankingWeek 
              ? administrativo2Data.filter(r => {
                  const semana = parseInt((r.colA || '0').trim()) || 0;
                  return semana === adminRankingWeek;
                })
              : administrativo2Data;

            // Ranking por responsável (Coluna C)
            const porResponsavel: Record<string, { total: number; finalizadas: number }> = {};
            dadosParaRanking.forEach(r => {
              const resp = (r.colC || 'Não informado').trim();
              const status = (r.colD || '').toLowerCase().trim();
              const finalizado = status === 'feito' || status.includes('feito');
              
              if (!porResponsavel[resp]) porResponsavel[resp] = { total: 0, finalizadas: 0 };
              porResponsavel[resp].total++;
              if (finalizado) porResponsavel[resp].finalizadas++;
            });

            const rankingResponsavel = Object.entries(porResponsavel)
              .map(([nome, dados]) => ({
                nome,
                total: dados.total,
                finalizadas: dados.finalizadas,
                pendentes: dados.total - dados.finalizadas,
                taxa: dados.total > 0 ? ((dados.finalizadas / dados.total) * 100).toFixed(1) : '0'
              }))
              .filter(r => r.finalizadas > 0) // Considera apenas quem tem pelo menos 1 finalizada
              .sort((a, b) => b.finalizadas - a.finalizadas); // Ordena por finalizadas

            const maxFinalizadas = Math.max(...rankingResponsavel.map(r => r.finalizadas), 1);

            // Evolução por semana (Coluna A)
            const porSemana: Record<string, { total: number; finalizadas: number }> = {};
            administrativo2Data.forEach(r => {
              const semana = (r.colA || 'N/A').trim();
              const status = (r.colD || '').toLowerCase().trim();
              const finalizado = status === 'feito' || status.includes('feito');
              
              if (!porSemana[semana]) porSemana[semana] = { total: 0, finalizadas: 0 };
              porSemana[semana].total++;
              if (finalizado) porSemana[semana].finalizadas++;
            });

            const evolucaoSemanal = Object.entries(porSemana)
              .map(([semana, dados]) => ({
                semana,
                total: dados.total,
                finalizadas: dados.finalizadas,
                pendentes: dados.total - dados.finalizadas
              }))
              .sort((a, b) => {
                const numA = parseInt(a.semana) || 0;
                const numB = parseInt(b.semana) || 0;
                return numA - numB;
              });

            if (totalTarefas === 0) {
              return (
                <Card className="col-span-full">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhum dado encontrado na aba de documentação</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <>
                {/* Cards de métricas */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 col-span-full">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Total de Pastas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalTarefas}</div>
                      <p className="text-xs text-muted-foreground mt-1">pastas cadastradas</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Finalizadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-500">{tarefasFinalizadas}</div>
                      <p className="text-xs text-muted-foreground mt-1">{taxaConclusao}% do total</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Pendentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-amber-500">{tarefasPendentes}</div>
                      <p className="text-xs text-muted-foreground mt-1">aguardando finalização</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Ranking por Responsável */}
                <Card className="col-span-full md:col-span-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">Ranking por Responsável</CardTitle>
                      </div>
                      <Select 
                        value={adminRankingWeek?.toString() || "all"} 
                        onValueChange={(v) => setAdminRankingWeek(v === "all" ? null : parseInt(v))}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue placeholder="Semana" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {semanasUnicasAdmin.map(s => (
                            <SelectItem key={s} value={s.toString()}>Semana {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Documentações salvas no Advbox (marcadas como "feito")
                      {adminRankingWeek && ` - Semana ${adminRankingWeek}`}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {rankingResponsavel.length > 0 ? (
                      <div className="space-y-3">
                        {rankingResponsavel.slice(0, 10).map((resp, index) => (
                          <div key={resp.nome} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-lg w-8">
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                                </span>
                                <span className="font-medium truncate max-w-[150px]">{resp.nome}</span>
                              </div>
                              <span className="font-bold text-green-500">{resp.finalizadas}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all"
                                style={{ width: `${(resp.finalizadas / maxFinalizadas) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                        Nenhuma finalização encontrada {adminRankingWeek && `na semana ${adminRankingWeek}`}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gráfico de Evolução Semanal */}
                <Card className="col-span-full md:col-span-1">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">Evolução Semanal de Documentos Salvos no ADVBOX</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pastas com documentos salvos no ADVBOX por semana
                    </p>
                  </CardHeader>
                  <CardContent>
                    {evolucaoSemanal.length > 0 ? (
                      <ChartContainer config={{ finalizadas: { label: "Finalizadas", color: "hsl(239, 84%, 67%)" } }} className="h-[300px] w-full">
                        <BarChart data={evolucaoSemanal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semana" tick={{ fontSize: 11 }} tickFormatter={(value) => `S${value}`} />
                          <YAxis allowDecimals={false} />
                          <ChartTooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg shadow-lg p-3">
                                    <p className="font-medium">Semana {data.semana}</p>
                                    <p className="text-sm text-muted-foreground">{data.finalizadas} finalizadas</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="finalizadas" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="finalizadas" position="top" fontSize={11} />
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm">Nenhum dado semanal disponível</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {/* ===== SEÇÃO: ABORDAGEM DE TESTEMUNHAS (GID 774111166) ===== */}
          <div className="col-span-full mt-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-cyan-300">Abordagem de Testemunhas</h3>
            </div>
          </div>

          {(() => {
            // Processa dados da aba de testemunhas (GID 774111166)
            // Coluna A = Semana, F = Status Aposentadoria, G = Tempo Contribuição
            // H = Agricultura, I = Lead Qualificado, J = SDR, K = Resultado
            
            const totalTestemunhas = testemunhasData.length;
            
            // Status de aposentadoria (Coluna F)
            const aposentados10Anos = testemunhasData.filter(r => {
              const status = (r.colF || '').toLowerCase().trim();
              return status.includes('mais de 10') || status.includes('+ 10') || status.includes('>10');
            }).length;
            
            const aposentadosMenos10Anos = testemunhasData.filter(r => {
              const status = (r.colF || '').toLowerCase().trim();
              return status.includes('menos de 10') || status.includes('< 10') || status.includes('-10') || (status.includes('aposentad') && !status.includes('mais') && !status.includes('não'));
            }).length;
            
            const naoAposentados = testemunhasData.filter(r => {
              const status = (r.colF || '').toLowerCase().trim();
              return status.includes('não') || status.includes('nao') || status === '';
            }).length;
            
            // Leads qualificados (Coluna I)
            const leadsQualificados = testemunhasData.filter(r => {
              const qualificado = (r.colI || '').toLowerCase().trim();
              return qualificado === 'sim' || qualificado === 's' || qualificado === 'yes' || qualificado === 'x';
            }).length;
            
            const taxaQualificacao = totalTestemunhas > 0 ? ((leadsQualificados / totalTestemunhas) * 100).toFixed(1) : '0';
            
            // Trabalhou na agricultura (Coluna H)
            const trabalhouAgricultura = testemunhasData.filter(r => {
              const agri = (r.colH || '').toLowerCase().trim();
              return agri === 'sim' || agri === 's' || agri === 'yes' || agri === 'x';
            }).length;
            
            // Agendamentos realizados (Coluna K)
            const agendamentos = testemunhasData.filter(r => {
              const resultado = (r.colK || '').toLowerCase().trim();
              return resultado.includes('agendado') || resultado.includes('agendamento') || resultado === 'sim';
            }).length;
            
            const taxaConversao = totalTestemunhas > 0 ? ((agendamentos / totalTestemunhas) * 100).toFixed(1) : '0';

            // Meta de agendamentos
            const META_AGENDAMENTOS = 100;
            const TOTAL_SEMANAS = 53;
            
            // Calcula semana atual do ano
            const hoje = new Date();
            const inicioAno = new Date(hoje.getFullYear(), 0, 1);
            const diffDias = Math.floor((hoje.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24));
            const semanaAtual = Math.ceil((diffDias + inicioAno.getDay() + 1) / 7);
            
            // Percentual alcançado da meta
            const percentualAlcancado = ((agendamentos / META_AGENDAMENTOS) * 100);
            
            // Percentual esperado baseado na semana atual
            const percentualEsperado = ((semanaAtual / TOTAL_SEMANAS) * 100);
            
            // Diferença entre esperado e alcançado
            const diferencaPercentual = percentualAlcancado - percentualEsperado;
            const metaEsperadaAtual = Math.round((semanaAtual / TOTAL_SEMANAS) * META_AGENDAMENTOS);
            const diferencaAbsoluta = agendamentos - metaEsperadaAtual;

            // Semanas disponíveis
            const semanasDisponiveis = testemunhasData
              .map(r => parseInt((r.colA || '0').trim()) || 0)
              .filter(s => s >= 1 && s <= 53);
            const semanasUnicas = [...new Set(semanasDisponiveis)].sort((a, b) => a - b);

            // Dados filtrados por semana
            const dadosFiltrados = testemunhasWeekFilter
              ? testemunhasData.filter(r => {
                  const semana = parseInt((r.colA || '0').trim()) || 0;
                  return semana === testemunhasWeekFilter;
                })
              : testemunhasData;

            // Distribuição por Status de Aposentadoria (para gráfico pizza)
            const statusAposentadoriaData = [
              { name: 'Aposentado +10 anos', value: aposentados10Anos, color: 'hsl(0, 70%, 50%)' },
              { name: 'Aposentado -10 anos', value: aposentadosMenos10Anos, color: 'hsl(45, 90%, 50%)' },
              { name: 'Não aposentado', value: naoAposentados, color: 'hsl(142, 70%, 45%)' },
            ].filter(d => d.value > 0);

            // Evolução semanal de abordagens
            const evolucaoSemanal = semanasUnicas.map(semana => {
              const dadosSemana = testemunhasData.filter(r => {
                const s = parseInt((r.colA || '0').trim()) || 0;
                return s === semana;
              });
              const qualificadosSemana = dadosSemana.filter(r => {
                const qualificado = (r.colI || '').toLowerCase().trim();
                return qualificado === 'sim' || qualificado === 's' || qualificado === 'yes' || qualificado === 'x';
              }).length;
              const agendadosSemana = dadosSemana.filter(r => {
                const resultado = (r.colK || '').toLowerCase().trim();
                return resultado.includes('agendado') || resultado.includes('agendamento') || resultado === 'sim';
              }).length;
              
              return {
                semana,
                abordagens: dadosSemana.length,
                qualificados: qualificadosSemana,
                agendados: agendadosSemana,
              };
            });

            // Ranking por SDR (Coluna J)
            const porSdr: Record<string, { abordagens: number; qualificados: number; agendados: number }> = {};
            dadosFiltrados.forEach(r => {
              const sdr = (r.colJ || 'Não informado').trim();
              if (!sdr) return;
              
              if (!porSdr[sdr]) {
                porSdr[sdr] = { abordagens: 0, qualificados: 0, agendados: 0 };
              }
              porSdr[sdr].abordagens++;
              
              const qualificado = (r.colI || '').toLowerCase().trim();
              if (qualificado === 'sim' || qualificado === 's' || qualificado === 'yes' || qualificado === 'x') {
                porSdr[sdr].qualificados++;
              }
              
              const resultado = (r.colK || '').toLowerCase().trim();
              if (resultado.includes('agendado') || resultado.includes('agendamento') || resultado === 'sim') {
                porSdr[sdr].agendados++;
              }
            });
            
            const rankingSdr = Object.entries(porSdr)
              .map(([sdr, stats]) => ({
                sdr,
                ...stats,
                taxaQualificacao: stats.abordagens > 0 ? ((stats.qualificados / stats.abordagens) * 100) : 0,
                taxaConversao: stats.abordagens > 0 ? ((stats.agendados / stats.abordagens) * 100) : 0,
              }))
              .filter(r => r.sdr !== 'Não informado' && r.abordagens > 0)
              .sort((a, b) => b.agendados - a.agendados);
            
            const maxAgendados = Math.max(...rankingSdr.map(r => r.agendados), 1);

            return (
              <>
                {/* Cards de métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-full">
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Abordagens</p>
                          <p className="text-3xl font-bold text-cyan-400">{totalTestemunhas}</p>
                        </div>
                        <Users className="h-10 w-10 text-cyan-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Leads Qualificados</p>
                          <p className="text-3xl font-bold text-green-400">{leadsQualificados}</p>
                          <p className="text-xs text-muted-foreground mt-1">{taxaQualificacao}% do total</p>
                        </div>
                        <CheckCircle2 className="h-10 w-10 text-green-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Agendamentos</p>
                          <p className="text-3xl font-bold text-blue-400">{agendamentos}</p>
                          <p className="text-xs text-muted-foreground mt-1">{taxaConversao}% conversão</p>
                        </div>
                        <Calendar className="h-10 w-10 text-blue-500/50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Card de Meta de Agendamentos */}
                <Card className="col-span-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Goal className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-lg">Meta Anual de Agendamentos via Testemunhas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Progresso da Meta */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Progresso da Meta</span>
                          <span className="text-sm font-medium">{agendamentos} / {META_AGENDAMENTOS}</span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${Math.min(percentualAlcancado, 100)}%` }}
                          />
                        </div>
                        <p className="text-2xl font-bold text-purple-400">{percentualAlcancado.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">da meta anual alcançada</p>
                      </div>

                      {/* Esperado vs Alcançado */}
                      <div className="space-y-3">
                        <span className="text-sm text-muted-foreground">Semana {semanaAtual} de {TOTAL_SEMANAS}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Esperado até agora</p>
                            <p className="text-xl font-semibold text-muted-foreground">{metaEsperadaAtual} agend.</p>
                            <p className="text-xs text-muted-foreground">({percentualEsperado.toFixed(1)}%)</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Alcançado</p>
                            <p className="text-xl font-semibold text-purple-400">{agendamentos} agend.</p>
                            <p className="text-xs text-muted-foreground">({percentualAlcancado.toFixed(1)}%)</p>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-center justify-center">
                        <div className={`px-4 py-2 rounded-lg ${diferencaAbsoluta >= 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                          <p className={`text-2xl font-bold ${diferencaAbsoluta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {diferencaAbsoluta >= 0 ? '+' : ''}{diferencaAbsoluta}
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            {diferencaAbsoluta >= 0 ? 'acima' : 'abaixo'} do esperado
                          </p>
                        </div>
                        <p className={`text-sm mt-2 ${diferencaPercentual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diferencaPercentual >= 0 ? '+' : ''}{diferencaPercentual.toFixed(1)} p.p.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 col-span-full">
                  {/* Gráfico Pizza - Status de Aposentadoria */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <PieChart className="h-5 w-5 text-cyan-500" />
                        <CardTitle className="text-lg">Distribuição por Status de Aposentadoria</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Classificação das testemunhas por situação previdenciária
                      </p>
                    </CardHeader>
                    <CardContent>
                      {statusAposentadoriaData.length > 0 ? (
                        <ChartContainer config={{}} className="h-[300px] w-full">
                          <RechartsPieChart>
                            <Pie
                              data={statusAposentadoriaData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {statusAposentadoriaData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-background border rounded-lg p-2 shadow-lg">
                                      <p className="font-medium">{data.name}</p>
                                      <p className="text-sm text-muted-foreground">{data.value} testemunhas</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </RechartsPieChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Sem dados de status de aposentadoria
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Gráfico de Evolução Semanal */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-cyan-500" />
                        <CardTitle className="text-lg">Evolução Semanal de Abordagens</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Volume de testemunhas abordadas por semana
                      </p>
                    </CardHeader>
                    <CardContent>
                      {evolucaoSemanal.length > 0 ? (
                        <ChartContainer config={{ abordagens: { label: "Abordagens", color: "hsl(187, 85%, 53%)" } }} className="h-[300px] w-full">
                          <BarChart data={evolucaoSemanal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="semana" tick={{ fontSize: 11 }} tickFormatter={(value) => `S${value}`} />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-background border rounded-lg p-2 shadow-lg">
                                      <p className="font-medium">Semana {data.semana}</p>
                                      <p className="text-sm text-cyan-400">{data.abordagens} abordagens</p>
                                      <p className="text-sm text-green-400">{data.qualificados} qualificados</p>
                                      <p className="text-sm text-blue-400">{data.agendados} agendados</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="abordagens" fill="hsl(187, 85%, 53%)" radius={[4, 4, 0, 0]}>
                              <LabelList dataKey="abordagens" position="top" className="fill-foreground text-xs" />
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Sem dados de evolução semanal
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ===================== SUBSEÇÃO: DOCUMENTOS FÍSICOS ===================== */}
                {(() => {
                  const TOTAL_SEMANAS_DOCS = 53;
                  const agoraDocs = new Date();
                  const inicioAnoDocs = new Date(agoraDocs.getFullYear(), 0, 1);
                  const diasPassadosDocs = Math.floor((agoraDocs.getTime() - inicioAnoDocs.getTime()) / (1000 * 60 * 60 * 24));
                  const semanaAtualDocs = Math.min(Math.ceil((diasPassadosDocs + 1) / 7), TOTAL_SEMANAS_DOCS);

                  // Processa dados de documentos físicos
                  const totalDocumentos = documentosFisicosData.filter(r => (r.colA || '').trim() !== '').length;
                  
                  // Resolvido se F=SIM ou G=SIM
                  const resolvidosDocs = documentosFisicosData.filter(r => {
                    const cliente = (r.colA || '').trim();
                    if (!cliente) return false;
                    const digitalizadoDescartado = (r.colF || '').toUpperCase().trim();
                    const entregueCliente = (r.colG || '').toUpperCase().trim();
                    return digitalizadoDescartado === 'SIM' || entregueCliente === 'SIM';
                  }).length;
                  
                  // Pendentes = não tem SIM em F nem G
                  const pendentesDocs = totalDocumentos - resolvidosDocs;
                  
                  // Conta por tipo de resolução
                  const digitalizadosDescartados = documentosFisicosData.filter(r => {
                    const cliente = (r.colA || '').trim();
                    if (!cliente) return false;
                    return (r.colF || '').toUpperCase().trim() === 'SIM';
                  }).length;
                  
                  const entreguesCliente = documentosFisicosData.filter(r => {
                    const cliente = (r.colA || '').trim();
                    if (!cliente) return false;
                    return (r.colG || '').toUpperCase().trim() === 'SIM';
                  }).length;
                  
                  // Métricas da meta
                  const metaTotalDocs = totalDocumentos; // Meta = resolver todos
                  const percentualResolvidoDocs = metaTotalDocs > 0 ? (resolvidosDocs / metaTotalDocs) * 100 : 0;
                  const percentualEsperadoDocs = (semanaAtualDocs / TOTAL_SEMANAS_DOCS) * 100;
                  const metaEsperadaAtualDocs = Math.round((semanaAtualDocs / TOTAL_SEMANAS_DOCS) * metaTotalDocs);
                  const diferencaAbsolutaDocs = resolvidosDocs - metaEsperadaAtualDocs;
                  const diferencaPercentualDocs = percentualResolvidoDocs - percentualEsperadoDocs;
                  
                  // Média necessária por semana restante para completar a meta
                  const semanasRestantesDocs = TOTAL_SEMANAS_DOCS - semanaAtualDocs;
                  const faltamResolverDocs = pendentesDocs;
                  const mediaNecessariaDocs = semanasRestantesDocs > 0 ? Math.ceil(faltamResolverDocs / semanasRestantesDocs) : faltamResolverDocs;
                  
                  // Dados para gráfico de pizza
                  const statusDistribuicaoData = [
                    { name: 'Digitalizado/Descartado', value: digitalizadosDescartados, color: 'hsl(142, 70%, 45%)' },
                    { name: 'Entregue ao Cliente', value: entreguesCliente, color: 'hsl(199, 89%, 48%)' },
                    { name: 'Pendente', value: pendentesDocs, color: 'hsl(0, 70%, 50%)' },
                  ].filter(d => d.value > 0);

                  return (
                    <>
                      {/* Separador visual */}
                      <div className="col-span-full border-t border-amber-500/30 pt-6 mt-4">
                        <div className="flex items-center gap-3 mb-6">
                          <FolderOpen className="h-5 w-5 text-amber-500" />
                          <h3 className="text-lg font-semibold text-foreground">Documentos Físicos</h3>
                          <span className="text-sm text-muted-foreground">- Meta: resolver todos os casos até o fim do ano</span>
                        </div>
                      </div>

                      {/* Cards de métricas de documentos */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 col-span-full">
                        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Total de Casos</p>
                                <p className="text-3xl font-bold text-amber-400">{totalDocumentos}</p>
                                <p className="text-xs text-muted-foreground mt-1">documentos físicos</p>
                              </div>
                              <FolderOpen className="h-10 w-10 text-amber-500/50" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Casos Resolvidos</p>
                                <p className="text-3xl font-bold text-green-400">{resolvidosDocs}</p>
                                <p className="text-xs text-muted-foreground mt-1">{percentualResolvidoDocs.toFixed(1)}% do total</p>
                              </div>
                              <CheckCircle2 className="h-10 w-10 text-green-500/50" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Casos Pendentes</p>
                                <p className="text-3xl font-bold text-red-400">{pendentesDocs}</p>
                                <p className="text-xs text-muted-foreground mt-1">{(100 - percentualResolvidoDocs).toFixed(1)}% do total</p>
                              </div>
                              <AlertTriangle className="h-10 w-10 text-red-500/50" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Média Necessária/Semana</p>
                                <p className="text-3xl font-bold text-blue-400">{mediaNecessariaDocs}</p>
                                <p className="text-xs text-muted-foreground mt-1">para cumprir meta até fim do ano</p>
                              </div>
                              <Target className="h-10 w-10 text-blue-500/50" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Card de Progresso da Meta */}
                      <Card className="col-span-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <Goal className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-lg">Meta Anual - Documentos Físicos</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Progresso da Meta */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Progresso</span>
                                <span className="text-sm font-medium">{resolvidosDocs} / {metaTotalDocs}</span>
                              </div>
                              <div className="h-4 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(percentualResolvidoDocs, 100)}%` }}
                                />
                              </div>
                              <p className="text-2xl font-bold text-amber-400">{percentualResolvidoDocs.toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">dos documentos resolvidos</p>
                            </div>

                            {/* Esperado vs Alcançado */}
                            <div className="space-y-3">
                              <span className="text-sm text-muted-foreground">Semana {semanaAtualDocs} de {TOTAL_SEMANAS_DOCS}</span>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground mb-1">Esperado até agora</p>
                                  <p className="text-xl font-semibold text-muted-foreground">{metaEsperadaAtualDocs} docs</p>
                                  <p className="text-xs text-muted-foreground">({percentualEsperadoDocs.toFixed(1)}%)</p>
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground mb-1">Resolvidos</p>
                                  <p className="text-xl font-semibold text-amber-400">{resolvidosDocs} docs</p>
                                  <p className="text-xs text-muted-foreground">({percentualResolvidoDocs.toFixed(1)}%)</p>
                                </div>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col items-center justify-center">
                              <div className={`px-4 py-2 rounded-lg ${diferencaAbsolutaDocs >= 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                                <p className={`text-2xl font-bold ${diferencaAbsolutaDocs >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {diferencaAbsolutaDocs >= 0 ? '+' : ''}{diferencaAbsolutaDocs}
                                </p>
                                <p className="text-xs text-muted-foreground text-center">
                                  {diferencaAbsolutaDocs >= 0 ? 'acima' : 'abaixo'} do esperado
                                </p>
                              </div>
                              <p className={`text-sm mt-2 ${diferencaPercentualDocs >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {diferencaPercentualDocs >= 0 ? '+' : ''}{diferencaPercentualDocs.toFixed(1)} p.p.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Gráficos */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 col-span-full">
                        {/* Gráfico Pizza - Distribuição de Status */}
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <PieChart className="h-5 w-5 text-amber-500" />
                              <CardTitle className="text-lg">Distribuição por Status</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Status dos documentos físicos no escritório
                            </p>
                          </CardHeader>
                          <CardContent>
                            {statusDistribuicaoData.length > 0 ? (
                              <ChartContainer config={{}} className="h-[300px] w-full">
                                <RechartsPieChart>
                                  <Pie
                                    data={statusDistribuicaoData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                  >
                                    {statusDistribuicaoData.map((entry, index) => (
                                      <Cell key={`cell-docs-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const dataDocs = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                                            <p className="font-medium">{dataDocs.name}</p>
                                            <p className="text-sm text-muted-foreground">{dataDocs.value} documentos</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </RechartsPieChart>
                              </ChartContainer>
                            ) : (
                              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Sem dados de documentos físicos
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Card de Detalhamento */}
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-amber-500" />
                              <CardTitle className="text-lg">Detalhamento de Resoluções</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Como os documentos foram resolvidos
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              {/* Digitalizados e Descartados */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm">Digitalizados e Descartados</span>
                                  </div>
                                  <span className="font-semibold text-emerald-400">{digitalizadosDescartados}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${totalDocumentos > 0 ? (digitalizadosDescartados / totalDocumentos) * 100 : 0}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {totalDocumentos > 0 ? ((digitalizadosDescartados / totalDocumentos) * 100).toFixed(1) : 0}% do total
                                </p>
                              </div>

                              {/* Entregues ao Cliente */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                                    <span className="text-sm">Entregues ao Cliente</span>
                                  </div>
                                  <span className="font-semibold text-cyan-400">{entreguesCliente}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-cyan-500 rounded-full transition-all"
                                    style={{ width: `${totalDocumentos > 0 ? (entreguesCliente / totalDocumentos) * 100 : 0}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {totalDocumentos > 0 ? ((entreguesCliente / totalDocumentos) * 100).toFixed(1) : 0}% do total
                                </p>
                              </div>

                              {/* Pendentes */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm">Pendentes</span>
                                  </div>
                                  <span className="font-semibold text-red-400">{pendentesDocs}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-red-500 rounded-full transition-all"
                                    style={{ width: `${totalDocumentos > 0 ? (pendentesDocs / totalDocumentos) * 100 : 0}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {totalDocumentos > 0 ? ((pendentesDocs / totalDocumentos) * 100).toFixed(1) : 0}% do total
                                </p>
                              </div>

                              {/* Resumo */}
                              <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Total de resoluções:</span>
                                  <span className="font-semibold text-foreground">{resolvidosDocs} de {totalDocumentos}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  );
                })()}
              </>
            );
          })()}

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ===================== SEÇÃO: RADAR METAS ===================== */}
      <Collapsible 
        open={openSection === 'metas'} 
        onOpenChange={() => handleSectionToggle('metas')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-600/20 to-pink-600/20 rounded-lg border border-rose-500/30 hover:border-rose-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Goal className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Metas</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'metas' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          
          {/* Cards de Metas */}
          <div className="grid gap-6">
            {/* Meta 1: Contratos High Ticket */}
            <GoalProgressCard
              title="Meta Contratos High Ticket"
              icon={Briefcase}
              iconColor="text-amber-500"
              meta={metaHighTicket.meta}
              alcancado={metaHighTicket.alcancado}
              semanaAtual={semanaAtualDoAno}
            />

            {/* Meta 2: Contratos por Incapacidade */}
            <GoalProgressCard
              title="Meta Benefícios por Incapacidade"
              icon={HeartPulse}
              iconColor="text-rose-500"
              meta={metaIncapacidade.meta}
              alcancado={metaIncapacidade.alcancado}
              semanaAtual={semanaAtualDoAno}
            />

            {/* Meta 3: Saneamento de Pastas */}
            <GoalProgressCard
              title="Meta Saneamento de Pastas"
              icon={FolderSync}
              iconColor="text-blue-500"
              meta={metaSaneamento.meta}
              alcancado={metaSaneamento.alcancado}
              semanaAtual={semanaAtualDoAno}
            />

            {/* Meta 4: Indicações de Novos Clientes */}
            <GoalProgressCard
              title="Meta Indicações de Novos Clientes"
              icon={UserPlus}
              iconColor="text-emerald-500"
              meta={metaIndicacoes.meta}
              alcancado={metaIndicacoes.alcancado}
              semanaAtual={semanaAtualDoAno}
            />
          </div>

          {/* Card Meta Geral do Comercial Previdenciário */}
          <Card className="border-2 border-rose-500/50 bg-gradient-to-br from-rose-500/5 to-pink-500/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/20">
                  <Target className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Meta Geral do Comercial Previdenciário</CardTitle>
                  <p className="text-sm text-muted-foreground">Progresso ponderado de todas as metas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna 1: Percentual Total */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20">
                  <span className={`text-5xl font-bold ${
                    metaGeral.diferencaEsperado >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {metaGeral.percentualTotal.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">da meta geral atingida</span>
                  <div className="mt-4 text-center">
                    <span className="text-xs text-muted-foreground">Esperado: </span>
                    <span className="text-sm font-semibold text-foreground">{metaGeral.esperadoSemana.toFixed(1)}%</span>
                    <span className={`ml-2 text-sm font-semibold ${
                      metaGeral.diferencaEsperado >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      ({metaGeral.diferencaEsperado >= 0 ? '+' : ''}{metaGeral.diferencaEsperado.toFixed(1)} p.p.)
                    </span>
                  </div>
                </div>

                {/* Coluna 2: Breakdown das metas */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Detalhamento por Meta</h4>
                  {metaGeral.metas.map((meta, index) => (
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
                          <span className={`font-semibold ${
                            meta.percentual >= (semanaAtualDoAno / 53) * 100 ? 'text-emerald-500' : 'text-amber-500'
                          }`}>
                            {meta.percentual.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            → {meta.contribuicao.toFixed(1)} p.p.
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            meta.percentual >= (semanaAtualDoAno / 53) * 100 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(meta.percentual, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barra de progresso geral */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso Geral Ponderado</span>
                  <span className="text-sm text-muted-foreground">Semana {semanaAtualDoAno} de 53</span>
                </div>
                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                  {/* Linha de referência do esperado */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 z-10"
                    style={{ left: `${metaGeral.esperadoSemana}%` }}
                  />
                  {/* Barra de progresso */}
                  <div 
                    className={`h-full rounded-full transition-all ${
                      metaGeral.diferencaEsperado >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(metaGeral.percentualTotal, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>Meta: 100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Modal de Aposentadorias Futuras */}
      <AposentadoriasFuturasDialog
        open={aposentadoriasFuturasDialogOpen}
        onOpenChange={setAposentadoriasFuturasDialogOpen}
        data={data}
      />
    </div>
  );
};

export default RadarComercial;
