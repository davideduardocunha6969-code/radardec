import { useMemo } from "react";
import { Lightbulb, TrendingUp, Users, AlertTriangle, Target, BarChart3 } from "lucide-react";

interface ContextualSuggestionsProps {
  contextData: {
    commercial: {
      records?: unknown[];
      sdrData?: unknown[];
      [key: string]: unknown;
    };
    bancario: {
      iniciaisData?: unknown[];
      saneamentoData?: unknown[];
      transitoData?: unknown[];
    };
    controladoria: {
      tasks?: unknown[];
      conformityErrors?: unknown[];
      deadlineErrors?: unknown[];
    };
    previdenciario: {
      peticoesIniciais?: unknown[];
      aposentadorias?: unknown[];
      [key: string]: unknown;
    };
    trabalhista: {
      iniciais?: unknown[];
      atividades?: unknown[];
      [key: string]: unknown;
    };
  };
  onSelectQuery: (query: string) => void;
  disabled?: boolean;
}

interface Suggestion {
  query: string;
  icon: React.ReactNode;
  category: string;
  priority: number;
}

export function ContextualSuggestions({ contextData, onSelectQuery, disabled }: ContextualSuggestionsProps) {
  const suggestions = useMemo(() => {
    const result: Suggestion[] = [];

    // ===== COMMERCIAL SUGGESTIONS =====
    const commercialRecords = contextData.commercial?.records as Array<{ responsavel?: string; resultado?: string; setor?: string }> || [];
    
    if (commercialRecords.length > 0) {
      // Find top closers
      const closerCounts: Record<string, number> = {};
      const closerContracts: Record<string, number> = {};
      
      commercialRecords.forEach(record => {
        const closer = record.responsavel;
        if (closer) {
          closerCounts[closer] = (closerCounts[closer] || 0) + 1;
          if (record.resultado?.toLowerCase().includes("contrato fechado")) {
            closerContracts[closer] = (closerContracts[closer] || 0) + 1;
          }
        }
      });

      const topCloser = Object.entries(closerCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name && name !== "Não identificado")[0];
      
      if (topCloser) {
        result.push({
          query: `Como está a produtividade do closer ${topCloser[0]}?`,
          icon: <Users className="h-4 w-4" />,
          category: "Comercial",
          priority: 1,
        });
      }

      // Find sectors with most contracts
      const sectorCounts: Record<string, number> = {};
      commercialRecords.forEach(record => {
        const setor = record.setor;
        if (setor && record.resultado?.toLowerCase().includes("contrato fechado")) {
          sectorCounts[setor] = (sectorCounts[setor] || 0) + 1;
        }
      });

      const topSector = Object.entries(sectorCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name && name !== "Não identificado")[0];

      if (topSector) {
        result.push({
          query: `Qual o panorama de contratos fechados no setor ${topSector[0]}?`,
          icon: <BarChart3 className="h-4 w-4" />,
          category: "Comercial",
          priority: 2,
        });
      }

      result.push({
        query: "Compare a taxa de conversão de todos os closers",
        icon: <TrendingUp className="h-4 w-4" />,
        category: "Comercial",
        priority: 3,
      });
    }

    // ===== BANCARIO SUGGESTIONS =====
    const bancarioIniciais = contextData.bancario?.iniciaisData as Array<{ responsavel?: string; reu?: string }> || [];
    
    if (bancarioIniciais.length > 0) {
      // Find responsible with most petitions
      const respCounts: Record<string, number> = {};
      bancarioIniciais.forEach(record => {
        const resp = record.responsavel;
        if (resp) {
          respCounts[resp] = (respCounts[resp] || 0) + 1;
        }
      });

      const topResp = Object.entries(respCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name && name !== "Não identificado")[0];

      if (topResp) {
        result.push({
          query: `Qual a produção de petições iniciais de ${topResp[0]} no bancário?`,
          icon: <Target className="h-4 w-4" />,
          category: "Bancário",
          priority: 2,
        });
      }

      // Find top defendant (réu)
      const reuCounts: Record<string, number> = {};
      bancarioIniciais.forEach(record => {
        const reu = record.reu;
        if (reu) {
          reuCounts[reu] = (reuCounts[reu] || 0) + 1;
        }
      });

      const topReu = Object.entries(reuCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name)[0];

      if (topReu) {
        result.push({
          query: `Quantas ações temos contra ${topReu[0]} no setor bancário?`,
          icon: <BarChart3 className="h-4 w-4" />,
          category: "Bancário",
          priority: 3,
        });
      }
    }

    // ===== CONTROLADORIA SUGGESTIONS =====
    const tasks = contextData.controladoria?.tasks as Array<{ controller?: string }> || [];
    const conformityErrors = contextData.controladoria?.conformityErrors as unknown[] || [];
    const deadlineErrors = contextData.controladoria?.deadlineErrors as unknown[] || [];

    if (tasks.length > 0) {
      const controllerCounts: Record<string, number> = {};
      tasks.forEach(task => {
        const controller = task.controller;
        if (controller) {
          controllerCounts[controller] = (controllerCounts[controller] || 0) + 1;
        }
      });

      const topController = Object.entries(controllerCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name && name !== "Não identificado")[0];

      if (topController) {
        result.push({
          query: `Como está a performance do controller ${topController[0]}?`,
          icon: <Users className="h-4 w-4" />,
          category: "Controladoria",
          priority: 2,
        });
      }
    }

    if (conformityErrors.length > 0 || deadlineErrors.length > 0) {
      result.push({
        query: `Quais são os principais problemas de conformidade e prazo na controladoria?`,
        icon: <AlertTriangle className="h-4 w-4" />,
        category: "Controladoria",
        priority: 1,
      });
    }

    // ===== PREVIDENCIARIO SUGGESTIONS =====
    const peticoesPrevidenciario = contextData.previdenciario?.peticoesIniciais as Array<{ responsavel?: string; tipoBeneficio?: string; situacao?: string }> || [];

    if (peticoesPrevidenciario.length > 0) {
      const respCounts: Record<string, number> = {};
      const beneficioCounts: Record<string, number> = {};
      
      peticoesPrevidenciario.forEach(record => {
        const resp = record.responsavel;
        const beneficio = record.tipoBeneficio;
        if (resp) respCounts[resp] = (respCounts[resp] || 0) + 1;
        if (beneficio) beneficioCounts[beneficio] = (beneficioCounts[beneficio] || 0) + 1;
      });

      const topResp = Object.entries(respCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name && name !== "Não identificado")[0];

      if (topResp) {
        result.push({
          query: `Qual a produtividade de ${topResp[0]} no previdenciário?`,
          icon: <Users className="h-4 w-4" />,
          category: "Previdenciário",
          priority: 2,
        });
      }

      const topBeneficio = Object.entries(beneficioCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name)[0];

      if (topBeneficio) {
        result.push({
          query: `Quantas petições de ${topBeneficio[0]} temos em andamento?`,
          icon: <Target className="h-4 w-4" />,
          category: "Previdenciário",
          priority: 3,
        });
      }

      // Check for pending corrections
      const aguardaCorrecao = peticoesPrevidenciario.filter(p => 
        p.situacao?.toLowerCase().includes("aguarda correção")
      ).length;

      if (aguardaCorrecao > 0) {
        result.push({
          query: `Quais petições previdenciárias estão aguardando correção?`,
          icon: <AlertTriangle className="h-4 w-4" />,
          category: "Previdenciário",
          priority: 1,
        });
      }
    }

    // ===== TRABALHISTA SUGGESTIONS =====
    const iniciaisTrabalhista = contextData.trabalhista?.iniciais as Array<{ responsavel?: string; profissao?: string }> || [];

    if (iniciaisTrabalhista.length > 0) {
      const respCounts: Record<string, number> = {};
      iniciaisTrabalhista.forEach(record => {
        const resp = record.responsavel;
        if (resp) respCounts[resp] = (respCounts[resp] || 0) + 1;
      });

      const topResp = Object.entries(respCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([name]) => name && name !== "Não identificado")[0];

      if (topResp) {
        result.push({
          query: `Como está a produção de ${topResp[0]} no trabalhista?`,
          icon: <Users className="h-4 w-4" />,
          category: "Trabalhista",
          priority: 2,
        });
      }
    }

    // ===== CROSS-SECTOR SUGGESTIONS =====
    result.push({
      query: "Faça uma análise geral da produtividade de todos os setores",
      icon: <TrendingUp className="h-4 w-4" />,
      category: "Geral",
      priority: 4,
    });

    result.push({
      query: "Quais setores estão abaixo da meta e precisam de atenção?",
      icon: <AlertTriangle className="h-4 w-4" />,
      category: "Geral",
      priority: 5,
    });

    // Sort by priority and limit
    return result
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 6);
  }, [contextData]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        <Lightbulb className="h-3.5 w-3.5" />
        <span>Sugestões baseadas nos dados atuais</span>
      </div>
      
      <div className="grid gap-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelectQuery(suggestion.query)}
            disabled={disabled}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm text-foreground transition-colors group"
          >
            <div className="shrink-0 p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              {suggestion.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{suggestion.query}</p>
            </div>
            <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-background text-muted-foreground">
              {suggestion.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
