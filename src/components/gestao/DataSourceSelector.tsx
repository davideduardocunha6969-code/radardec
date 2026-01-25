import { useState } from "react";
import { Check, ChevronDown, Database, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SpreadsheetTab {
  gid: string;
  name: string;
  desc: string;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  key: string;
  tabs: SpreadsheetTab[];
}

export const spreadsheetSources: SpreadsheetInfo[] = [
  {
    id: "commercial",
    name: "📊 Comercial",
    key: "commercial",
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
    id: "bancario",
    name: "🏦 Bancário",
    key: "bancario",
    tabs: [
      { gid: "0", name: "Iniciais", desc: "Petições iniciais bancárias" },
      { gid: "325813835", name: "Saneamento", desc: "Revisão de pastas" },
      { gid: "642720152", name: "Trânsito em Julgado", desc: "Acordos e cumprimentos" },
    ],
  },
  {
    id: "controladoria",
    name: "📋 Controladoria",
    key: "controladoria",
    tabs: [
      { gid: "0", name: "Tarefas", desc: "Intimações e tarefas" },
      { gid: "1319762905", name: "Setores", desc: "Mapeamento de setores" },
      { gid: "1590941680", name: "Erros Conformidade", desc: "Erros de conformidade" },
      { gid: "1397357779", name: "Erros Prazo", desc: "Erros de prazo" },
      { gid: "154449292", name: "Pendências", desc: "Tarefas pendentes" },
    ],
  },
  {
    id: "previdenciario",
    name: "🏥 Previdenciário",
    key: "previdenciario",
    tabs: [
      { gid: "1358203598", name: "Petições Iniciais", desc: "Novas petições" },
      { gid: "306675231", name: "Evolução Incapacidade", desc: "Pendências semanais" },
      { gid: "1379612642", name: "Tarefas", desc: "Tarefas do setor" },
      { gid: "0", name: "Aposentadorias", desc: "Análises de aposentadoria" },
      { gid: "731526977", name: "Pastas Correção", desc: "Pastas para correção" },
    ],
  },
  {
    id: "trabalhista",
    name: "⚖️ Trabalhista",
    key: "trabalhista",
    tabs: [
      { gid: "1523237863", name: "Iniciais", desc: "Petições iniciais" },
      { gid: "52177345", name: "Atividades", desc: "Tarefas e prazos" },
    ],
  },
];

export const supabaseSources = [
  { id: "marketing", name: "🎯 Marketing", desc: "Atividades e Kanban" },
  { id: "conteudos", name: "📱 Mídia Social", desc: "Conteúdos e ideias" },
  { id: "closers", name: "📞 Atendimentos Closers", desc: "Gravações e transcrições" },
  { id: "robos", name: "🤖 Robôs", desc: "Tipos de produtos e modelagens" },
];

export interface SelectedSources {
  spreadsheets: { [sheetKey: string]: string[] }; // key -> array of GIDs
  supabase: string[]; // array of supabase source ids
}

interface DataSourceSelectorProps {
  selectedSources: SelectedSources;
  onSelectionChange: (sources: SelectedSources) => void;
}

export function DataSourceSelector({ selectedSources, onSelectionChange }: DataSourceSelectorProps) {
  const [open, setOpen] = useState(false);

  const isAllSelected = () => {
    const allSheetsSelected = spreadsheetSources.every(sheet => 
      selectedSources.spreadsheets[sheet.key]?.length === sheet.tabs.length
    );
    const allSupabaseSelected = supabaseSources.every(source =>
      selectedSources.supabase.includes(source.id)
    );
    return allSheetsSelected && allSupabaseSelected;
  };

  const getSelectedCount = () => {
    let count = 0;
    Object.values(selectedSources.spreadsheets).forEach(tabs => {
      count += tabs.length;
    });
    count += selectedSources.supabase.length;
    return count;
  };

  const toggleAllSources = () => {
    if (isAllSelected()) {
      // Deselect all
      onSelectionChange({ spreadsheets: {}, supabase: [] });
    } else {
      // Select all
      const allSpreadsheets: { [key: string]: string[] } = {};
      spreadsheetSources.forEach(sheet => {
        allSpreadsheets[sheet.key] = sheet.tabs.map(t => t.gid);
      });
      onSelectionChange({
        spreadsheets: allSpreadsheets,
        supabase: supabaseSources.map(s => s.id),
      });
    }
  };

  const toggleSheet = (sheetKey: string, tabs: SpreadsheetTab[]) => {
    const current = selectedSources.spreadsheets[sheetKey] || [];
    const allSelected = current.length === tabs.length;
    
    const newSpreadsheets = { ...selectedSources.spreadsheets };
    if (allSelected) {
      delete newSpreadsheets[sheetKey];
    } else {
      newSpreadsheets[sheetKey] = tabs.map(t => t.gid);
    }
    onSelectionChange({ ...selectedSources, spreadsheets: newSpreadsheets });
  };

  const toggleTab = (sheetKey: string, gid: string) => {
    const current = selectedSources.spreadsheets[sheetKey] || [];
    const newTabs = current.includes(gid)
      ? current.filter(t => t !== gid)
      : [...current, gid];
    
    const newSpreadsheets = { ...selectedSources.spreadsheets };
    if (newTabs.length === 0) {
      delete newSpreadsheets[sheetKey];
    } else {
      newSpreadsheets[sheetKey] = newTabs;
    }
    onSelectionChange({ ...selectedSources, spreadsheets: newSpreadsheets });
  };

  const toggleSupabaseSource = (sourceId: string) => {
    const newSupabase = selectedSources.supabase.includes(sourceId)
      ? selectedSources.supabase.filter(s => s !== sourceId)
      : [...selectedSources.supabase, sourceId];
    onSelectionChange({ ...selectedSources, supabase: newSupabase });
  };

  const selectedCount = getSelectedCount();
  const totalCount = spreadsheetSources.reduce((acc, s) => acc + s.tabs.length, 0) + supabaseSources.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Fontes de Dados</span>
          <Badge variant={selectedCount === totalCount ? "default" : "secondary"} className="ml-1">
            {selectedCount === totalCount ? "Todas" : `${selectedCount}/${totalCount}`}
          </Badge>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-0 bg-popover" align="start">
        <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Selecionar Fontes de Dados</h4>
            <p className="text-xs text-muted-foreground">
              A IA usará apenas os dados das fontes selecionadas
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleAllSources}
            className="text-xs"
          >
            {isAllSelected() ? "Desmarcar Tudo" : "Selecionar Tudo"}
          </Button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {/* Google Sheets */}
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
              <Database className="h-3 w-3" />
              Google Sheets ({spreadsheetSources.length} planilhas)
            </div>
            
            {spreadsheetSources.map((sheet) => {
              const selectedTabs = selectedSources.spreadsheets[sheet.key] || [];
              const allSelected = selectedTabs.length === sheet.tabs.length;
              const someSelected = selectedTabs.length > 0 && !allSelected;
              
              return (
                <div key={sheet.id} className="mb-1">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-muted/50",
                      allSelected && "bg-primary/5"
                    )}
                    onClick={() => toggleSheet(sheet.key, sheet.tabs)}
                  >
                    <Checkbox 
                      checked={allSelected}
                      className={cn(someSelected && "data-[state=unchecked]:bg-primary/30")}
                    />
                    <span className="font-medium text-sm flex-1">{sheet.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedTabs.length}/{sheet.tabs.length}
                    </Badge>
                  </div>
                  
                  <div className="ml-6 pl-2 border-l border-border/50 space-y-0.5">
                    {sheet.tabs.map((tab) => (
                      <div
                        key={tab.gid}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 text-sm",
                          selectedTabs.includes(tab.gid) && "bg-primary/5"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTab(sheet.key, tab.gid);
                        }}
                      >
                        <Checkbox checked={selectedTabs.includes(tab.gid)} />
                        <span className="flex-1">{tab.name}</span>
                        <span className="text-xs text-muted-foreground">{tab.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Supabase Sources */}
          <div className="p-2 border-t border-border">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
              <Database className="h-3 w-3" />
              Sistema (Supabase)
            </div>
            
            {supabaseSources.map((source) => {
              const isSelected = selectedSources.supabase.includes(source.id);
              
              return (
                <div
                  key={source.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => toggleSupabaseSource(source.id)}
                >
                  <Checkbox checked={isSelected} />
                  <span className="font-medium text-sm flex-1">{source.name}</span>
                  <span className="text-xs text-muted-foreground">{source.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {selectedCount === 0 
              ? "⚠️ Nenhuma fonte selecionada. A IA não terá dados para análise."
              : `✓ ${selectedCount} fonte${selectedCount > 1 ? 's' : ''} selecionada${selectedCount > 1 ? 's' : ''}`
            }
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
