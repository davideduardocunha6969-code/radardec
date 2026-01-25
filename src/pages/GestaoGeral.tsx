import { Loader2, AlertTriangle, Database, ChevronDown } from "lucide-react";
import { useGestaoData } from "@/hooks/useGestaoData";
import { AnalysisChat } from "@/components/gestao/AnalysisChat";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const spreadsheetInfo = [
  {
    name: "📊 Comercial",
    id: "1...",
    tabs: [
      { gid: "0", name: "Principal", desc: "Atendimentos e contratos" },
      { gid: "1631515229", name: "SDR Agendamentos", desc: "Agendamentos por SDR" },
      { gid: "686842485", name: "SDR Mensagens", desc: "Volume de mensagens" },
      { gid: "290508236", name: "Contatos Indicação", desc: "Contatos para indicação" },
      { gid: "2087539342", name: "Indicações Recebidas", desc: "Indicações captadas" },
      { gid: "1874749978", name: "Saneamento", desc: "Saneamento de pastas" },
      { gid: "651337262", name: "Avaliações Google", desc: "Reviews do Google" },
      { gid: "1905290884", name: "Documentação ADVBOX", desc: "Docs salvos no ADVBOX" },
      { gid: "774111166", name: "Testemunhas", desc: "Abordagem de testemunhas" },
      { gid: "186802545", name: "Docs Físicos", desc: "Documentos físicos" },
      { gid: "199327118", name: "Agendamentos Bancários", desc: "Agendamentos bancário" },
    ],
  },
  {
    name: "🏦 Bancário",
    id: "1EcJfg5-xr8YMMRVlnGgT8nKk0S3gE7RQvlnt58ErVHU",
    tabs: [
      { gid: "0", name: "Iniciais", desc: "Petições iniciais bancárias" },
      { gid: "325813835", name: "Saneamento", desc: "Revisão de pastas" },
      { gid: "642720152", name: "Trânsito em Julgado", desc: "Acordos e cumprimentos" },
    ],
  },
  {
    name: "📋 Controladoria",
    id: "1...",
    tabs: [
      { gid: "0", name: "Tarefas", desc: "Intimações e tarefas" },
      { gid: "1319762905", name: "Setores", desc: "Mapeamento de setores" },
      { gid: "1590941680", name: "Erros Conformidade", desc: "Erros de conformidade" },
      { gid: "1397357779", name: "Erros Prazo", desc: "Erros de prazo" },
      { gid: "154449292", name: "Pendências", desc: "Tarefas pendentes" },
    ],
  },
  {
    name: "🏥 Previdenciário",
    id: "1cjBtkZ4HCYKsvmQ7UGcEwQhYb_egmmnBhqP6GMxeVkQ",
    tabs: [
      { gid: "1358203598", name: "Petições Iniciais", desc: "Novas petições" },
      { gid: "306675231", name: "Evolução Incapacidade", desc: "Pendências semanais" },
      { gid: "1379612642", name: "Tarefas", desc: "Tarefas do setor" },
      { gid: "0", name: "Aposentadorias", desc: "Análises de aposentadoria" },
      { gid: "731526977", name: "Pastas Correção", desc: "Pastas para correção" },
    ],
  },
  {
    name: "⚖️ Trabalhista",
    id: "1c3yi6NQL4Jw6X0EVpHFwnbbExBl-9MLV08GmWdiu-9U",
    tabs: [
      { gid: "1523237863", name: "Iniciais", desc: "Petições iniciais" },
      { gid: "52177345", name: "Atividades", desc: "Tarefas e prazos" },
    ],
  },
];

const GestaoGeral = () => {
  const { contextData, dataSummary, isLoading, hasError, errorMessage } = useGestaoData();

  // Calculate total records
  const totalRecords = Object.values(dataSummary).reduce((a, b) => a + b, 0);
  const totalTabs = spreadsheetInfo.reduce((acc, sheet) => acc + sheet.tabs.length, 0);

  if (hasError) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <p>Erro ao carregar dados</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Gestão Geral
            </h1>
            <p className="text-muted-foreground mt-1">
              Assistente de análise inteligente com dados de todos os setores
            </p>
          </div>

          {/* Data status with popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Carregando dados...</span>
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3" />
                    <span>
                      {spreadsheetInfo.length} planilhas • {totalTabs} abas • {totalRecords.toLocaleString()} registros
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="end">
              <div className="p-3 border-b border-border bg-muted/30">
                <h4 className="font-semibold text-sm">Base de Dados - Google Sheets</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {spreadsheetInfo.length} planilhas com {totalTabs} abas integradas
                </p>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {spreadsheetInfo.map((sheet, idx) => (
                  <div key={idx} className="border-b border-border last:border-b-0">
                    <div className="px-3 py-2 bg-muted/20">
                      <span className="font-medium text-sm">{sheet.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({sheet.tabs.length} abas)
                      </span>
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      {sheet.tabs.map((tab, tabIdx) => (
                        <div key={tabIdx} className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-muted-foreground w-24 shrink-0">
                            GID {tab.gid}
                          </span>
                          <span className="font-medium">{tab.name}</span>
                          <span className="text-muted-foreground">— {tab.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  <strong>+ Supabase:</strong> Atividades Marketing, Conteúdos, Ideias, Atendimentos Closers, Tipos de Produtos, Transcrições
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <AnalysisChat contextData={contextData} isLoadingData={isLoading} />
      </div>
    </div>
  );
};

export default GestaoGeral;
