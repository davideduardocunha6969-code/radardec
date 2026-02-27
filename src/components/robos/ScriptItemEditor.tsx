import { useState } from "react";
import type { ScriptItem } from "@/hooks/useScriptsSdr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, GripVertical, GitBranch, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function generateId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30) || `item_${Date.now()}`;
}

interface ScriptItemEditorProps {
  title: string;
  icon: React.ReactNode;
  items: ScriptItem[];
  onChange: (items: ScriptItem[]) => void;
}

function SubItemEditor({
  subItems,
  onChange,
}: {
  subItems: ScriptItem[];
  onChange: (items: ScriptItem[]) => void;
}) {
  const addSubItem = () => {
    onChange([...subItems, { id: `sub_${Date.now()}`, label: "", description: "" }]);
  };
  const removeSubItem = (index: number) => onChange(subItems.filter((_, i) => i !== index));
  const updateSubItem = (index: number, field: "label" | "description", value: string) => {
    const updated = subItems.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === "label") newItem.id = generateId(value) || `sub_${Date.now()}`;
      return newItem;
    });
    onChange(updated);
  };

  return (
    <div className="ml-6 mt-1.5 space-y-1.5 border-l-2 border-primary/20 pl-3">
      {subItems.map((sub, j) => (
        <div key={j} className="flex gap-2 items-start bg-primary/5 rounded-md p-2">
          <GitBranch className="h-3.5 w-3.5 text-primary/50 shrink-0 mt-2" />
          <div className="flex-1 space-y-1">
            <Input
              value={sub.label}
              onChange={(e) => updateSubItem(j, "label", e.target.value)}
              placeholder="Título condicional (ex: Justa causa)"
              className="h-7 text-xs"
            />
            <Textarea
              value={sub.description}
              onChange={(e) => updateSubItem(j, "description", e.target.value)}
              placeholder="Pergunta condicional"
              className="text-xs min-h-[40px] resize-y"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeSubItem(j)}>
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addSubItem} className="h-6 text-[10px] text-primary/70 gap-1">
        <Plus className="h-3 w-3" />Condicional
      </Button>
    </div>
  );
}

export function ScriptItemEditor({ title, icon, items, onChange }: ScriptItemEditorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const addItem = () => {
    onChange([...items, { id: `item_${Date.now()}`, label: "", description: "" }]);
  };
  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setExpandedItems(prev => { const n = new Set(prev); n.delete(index); return n; });
  };
  const updateItem = (index: number, field: "label" | "description", value: string) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === "label") newItem.id = generateId(value);
      return newItem;
    });
    onChange(updated);
  };
  const updateSubItems = (index: number, subItems: ScriptItem[]) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, sub_items: subItems } : item
    );
    onChange(updated);
  };
  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const n = new Set(prev);
      if (n.has(index)) n.delete(index); else n.add(index);
      return n;
    });
  };
  const addCondicional = (index: number) => {
    const current = items[index].sub_items || [];
    updateSubItems(index, [...current, { id: `sub_${Date.now()}`, label: "", description: "" }]);
    setExpandedItems(prev => new Set(prev).add(index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">{icon}{title}</h4>
        <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />Item
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
          Nenhum item. Clique em "+ Item" para adicionar.
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, i) => {
          const subCount = item.sub_items?.length || 0;
          const isExpanded = expandedItems.has(i);
          return (
            <div key={i}>
              <div className="flex gap-2 items-start bg-muted/30 rounded-md p-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-2 opacity-40" />
                <div className="flex-1 space-y-1">
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(i, "label", e.target.value)}
                    placeholder="Título (ex: Jornada diária)"
                    className="h-8 text-sm"
                  />
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Fala/pergunta sugerida"
                    className="text-xs min-h-[60px] resize-y"
                  />
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addCondicional(i)} title="Adicionar pergunta condicional">
                    <GitBranch className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              {subCount > 0 && (
                <div className="ml-8 mt-1">
                  <button
                    onClick={() => toggleExpand(i)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <GitBranch className="h-3 w-3 text-primary/60" />
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{subCount} condicional{subCount > 1 ? "is" : ""}</Badge>
                  </button>
                  {isExpanded && (
                    <SubItemEditor
                      subItems={item.sub_items || []}
                      onChange={(subs) => updateSubItems(i, subs)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
