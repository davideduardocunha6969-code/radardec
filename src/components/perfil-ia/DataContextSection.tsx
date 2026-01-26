import { useState, useMemo } from "react";
import { Database, ChevronDown, ChevronRight, Plus, Edit2, Trash2, Save, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useIaDataContext, ColunaDescricao } from "@/hooks/useIaDataContext";
import { spreadsheetSources, SpreadsheetInfo, SpreadsheetTab } from "@/components/gestao/DataSourceSelector";
import { cn } from "@/lib/utils";

interface ColumnEditorProps {
  colunas: ColunaDescricao[];
  onChange: (colunas: ColunaDescricao[]) => void;
}

function ColumnEditor({ colunas, onChange }: ColumnEditorProps) {
  const addColumn = () => {
    onChange([...colunas, { letra: "", nome: "", descricao: "" }]);
  };

  const updateColumn = (index: number, field: keyof ColunaDescricao, value: string) => {
    const updated = [...colunas];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeColumn = (index: number) => {
    onChange(colunas.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Mapeamento de Colunas</Label>
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-3 w-3 mr-1" />
          Adicionar Coluna
        </Button>
      </div>
      
      {colunas.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nenhuma coluna mapeada</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {colunas.map((col, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
              <Input
                value={col.letra}
                onChange={(e) => updateColumn(index, "letra", e.target.value.toUpperCase())}
                placeholder="A"
                className="w-14 font-mono text-center"
              />
              <Input
                value={col.nome}
                onChange={(e) => updateColumn(index, "nome", e.target.value)}
                placeholder="Nome da coluna"
                className="w-40"
              />
              <Input
                value={col.descricao}
                onChange={(e) => updateColumn(index, "descricao", e.target.value)}
                placeholder="O que essa coluna representa..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 text-destructive hover:text-destructive"
                onClick={() => removeColumn(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TabEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheet: SpreadsheetInfo;
  tab: SpreadsheetTab;
  existingContext?: {
    descricao: string | null;
    colunas: ColunaDescricao[];
  };
  onSave: (data: { descricao: string; colunas: ColunaDescricao[] }) => void;
  isPending: boolean;
}

function TabEditorDialog({ open, onOpenChange, sheet, tab, existingContext, onSave, isPending }: TabEditorDialogProps) {
  const [descricao, setDescricao] = useState(existingContext?.descricao || "");
  const [colunas, setColunas] = useState<ColunaDescricao[]>(existingContext?.colunas || []);

  const handleSave = () => {
    onSave({ descricao, colunas });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editar Aba: {tab.name}
          </DialogTitle>
          <DialogDescription>
            Planilha: {sheet.name} | GID: {tab.gid}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Descrição da Aba</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Explique o que essa aba contém, qual seu propósito e como os dados são organizados..."
              className="min-h-[100px]"
            />
          </div>

          <ColumnEditor colunas={colunas} onChange={setColunas} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DataContextSection() {
  const { contexts, isLoading, upsertContext } = useIaDataContext();
  const [expandedSheets, setExpandedSheets] = useState<string[]>([]);
  const [editingTab, setEditingTab] = useState<{ sheet: SpreadsheetInfo; tab: SpreadsheetTab } | null>(null);

  // Create a map for quick lookup
  const contextMap = useMemo(() => {
    const map: Record<string, { descricao: string | null; colunas: ColunaDescricao[] }> = {};
    contexts?.forEach((ctx) => {
      const key = `${ctx.planilha_key}-${ctx.gid || "planilha"}`;
      map[key] = { descricao: ctx.descricao, colunas: ctx.colunas };
    });
    return map;
  }, [contexts]);

  const toggleSheet = (sheetKey: string) => {
    setExpandedSheets(prev => 
      prev.includes(sheetKey) 
        ? prev.filter(k => k !== sheetKey) 
        : [...prev, sheetKey]
    );
  };

  const handleSaveTab = async (sheet: SpreadsheetInfo, tab: SpreadsheetTab, data: { descricao: string; colunas: ColunaDescricao[] }) => {
    await upsertContext.mutateAsync({
      tipo: "aba",
      planilha_key: sheet.key,
      gid: tab.gid,
      nome: tab.name,
      descricao: data.descricao || null,
      colunas: data.colunas,
    });
    setEditingTab(null);
  };

  const getTabContext = (sheetKey: string, gid: string) => {
    return contextMap[`${sheetKey}-${gid}`];
  };

  const hasContext = (sheetKey: string, gid: string) => {
    const ctx = getTabContext(sheetKey, gid);
    return ctx && (ctx.descricao || ctx.colunas.length > 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Base de Conhecimento - Planilhas</CardTitle>
              <CardDescription>
                Descreva cada planilha e aba para que a IA entenda melhor o contexto dos dados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {spreadsheetSources.map((sheet) => {
            const isExpanded = expandedSheets.includes(sheet.key);
            const contextedTabs = sheet.tabs.filter(t => hasContext(sheet.key, t.gid)).length;
            
            return (
              <Collapsible 
                key={sheet.id} 
                open={isExpanded} 
                onOpenChange={() => toggleSheet(sheet.key)}
              >
                <CollapsibleTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    isExpanded && "bg-muted/30"
                  )}>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium flex-1">{sheet.name}</span>
                    <Badge variant={contextedTabs > 0 ? "default" : "outline"}>
                      {contextedTabs}/{sheet.tabs.length} abas documentadas
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-7 mt-2 space-y-1 border-l-2 border-border pl-4">
                    {sheet.tabs.map((tab) => {
                      const ctx = getTabContext(sheet.key, tab.gid);
                      const documented = ctx && (ctx.descricao || ctx.colunas.length > 0);
                      
                      return (
                        <div
                          key={tab.gid}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group",
                            documented && "bg-primary/5"
                          )}
                        >
                          <FileText className={cn(
                            "h-4 w-4",
                            documented ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{tab.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">GID {tab.gid}</span>
                            </div>
                            {ctx?.descricao && (
                              <p className="text-xs text-muted-foreground truncate">
                                {ctx.descricao}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {ctx?.colunas && ctx.colunas.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {ctx.colunas.length} colunas
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setEditingTab({ sheet, tab })}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {editingTab && (
        <TabEditorDialog
          open={!!editingTab}
          onOpenChange={(open) => !open && setEditingTab(null)}
          sheet={editingTab.sheet}
          tab={editingTab.tab}
          existingContext={getTabContext(editingTab.sheet.key, editingTab.tab.gid)}
          onSave={(data) => handleSaveTab(editingTab.sheet, editingTab.tab, data)}
          isPending={upsertContext.isPending}
        />
      )}
    </>
  );
}
