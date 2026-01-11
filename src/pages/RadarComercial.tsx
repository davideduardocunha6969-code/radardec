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
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekFilter } from "@/components/WeekFilter";
import { useCommercialData } from "@/hooks/useCommercialData";
import { AposentadoriasFuturasDialog } from "@/components/AposentadoriasFuturasDialog";
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
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const RadarComercial = () => {
  const { data, weeks, sdrData, sdrHeaders, isLoading, error } = useCommercialData();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null);
  const [selectedResultado, setSelectedResultado] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [aposentadoriasFuturasDialogOpen, setAposentadoriasFuturasDialogOpen] = useState(false);
  const [rankingPossuiDireito, setRankingPossuiDireito] = useState<string | null>(null);
  const [sdrRankingWeek, setSdrRankingWeek] = useState<number | null>(null);
  const [sdrEvolutionFilter, setSdrEvolutionFilter] = useState<string | null>(null);

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

  // Dados filtrados para os rankings de responsável (com filtro de possui direito)
  const rankingFilteredData = useMemo(() => {
    return filteredData.filter(record => {
      if (rankingPossuiDireito && record.possuiDireito !== rankingPossuiDireito) return false;
      return true;
    });
  }, [filteredData, rankingPossuiDireito]);

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
            {/* Filtro de Possui Direito */}
            <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
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
              {rankingPossuiDireito && (
                <button
                  onClick={() => setRankingPossuiDireito(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar filtro
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
            {/* Ranking por Contratos Fechados (Absoluto) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Ranking de Contratos por Responsável</CardTitle>
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
                  <Target className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Ranking de Conversão por Responsável</CardTitle>
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
      <Collapsible open={openSection === 'sdr'} onOpenChange={() => handleSectionToggle('sdr')}>
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
