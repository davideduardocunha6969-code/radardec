import { useState, forwardRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2, Circle, Trash2, Database, ChevronDown } from "lucide-react";
import type { ScriptItem } from "@/hooks/useScriptsSdr";
import type { LucideIcon } from "lucide-react";

interface ScriptChecklistCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  items: ScriptItem[];
  completedIds: string[];
  discardedIds: Set<string>;
  className?: string;
  onCheck?: (id: string) => void;
  onDiscard?: (id: string) => void;
}

/**
 * Renders script items with collapsible conditional sub-items.
 * - sim_nao: shows Sim/Não buttons; expands matching sub-items
 * - selecao: shows option buttons from opcoes_campo
 * - other types: check marks the item done and expands all sub-items
 */
export const ScriptChecklistCard = forwardRef<HTMLDivElement, ScriptChecklistCardProps>(
  function ScriptChecklistCard(
    { title, icon: Icon, iconColor = "text-primary", items, completedIds, discardedIds, className, onCheck, onDiscard },
    ref
  ) {
    // answers: parent id → chosen answer string
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswer = useCallback((itemId: string, answer: string) => {
      setAnswers(prev => ({ ...prev, [itemId]: answer }));
      onCheck?.(itemId);
    }, [onCheck]);

    // Count total visible done items recursively
    const countItems = useCallback((itemList: ScriptItem[], parentPrefix = ""): { total: number; done: number } => {
      let total = 0;
      let done = 0;
      for (const item of itemList) {
        if (discardedIds.has(parentPrefix ? `${parentPrefix}__${item.id}` : item.id)) continue;
        const fullId = parentPrefix ? `${parentPrefix}__${item.id}` : item.id;
        total++;
        if (completedIds.includes(fullId) || answers[fullId]) done++;
        // Count visible sub-items
        if (item.sub_items?.length && answers[fullId]) {
          const visibleSubs = filterSubItems(item.sub_items, answers[fullId]);
          const subCounts = countItems(visibleSubs, fullId);
          total += subCounts.total;
          done += subCounts.done;
        }
      }
      return { total, done };
    }, [completedIds, discardedIds, answers]);

    // Check if item AND all visible sub-items are completed/discarded
    const isFullyCompleted = useCallback((item: ScriptItem, idPrefix = ""): boolean => {
      const fullId = idPrefix ? `${idPrefix}__${item.id}` : item.id;
      const done = completedIds.includes(fullId) || !!answers[fullId];
      if (!done) return false;
      const answer = answers[fullId];
      if (!item.sub_items?.length || !answer) return true;
      const visibleSubs = filterSubItems(item.sub_items, answer);
      return visibleSubs.every(sub =>
        discardedIds.has(`${fullId}__${sub.id}`) || isFullyCompleted(sub, fullId)
      );
    }, [completedIds, answers, discardedIds]);

    const { total, done: doneCount } = countItems(items);

    return (
      <Card ref={ref} className={`border-border/60 flex flex-col ${className || ""}`}>
        <CardHeader className="pb-1 px-2.5 pt-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
              {title}
            </CardTitle>
            <span className="text-[10px] font-medium text-muted-foreground">
              {doneCount}/{total}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-2.5 pb-2">
          <div className="space-y-0.5">
            {items
              .filter(item => !discardedIds.has(item.id))
              .sort((a, b) => {
                const aFull = isFullyCompleted(a);
                const bFull = isFullyCompleted(b);
                if (aFull === bFull) return 0;
                return aFull ? 1 : -1;
              })
              .map(item => (
                <ScriptItemRow
                  key={item.id}
                  item={item}
                  idPrefix=""
                  completedIds={completedIds}
                  discardedIds={discardedIds}
                  answers={answers}
                  onAnswer={handleAnswer}
                  onCheck={onCheck}
                  onDiscard={onDiscard}
                  depth={0}
                />
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);

/** Filter sub-items based on parent answer and sub-item label prefixes */
function filterSubItems(subItems: ScriptItem[], answer: string): ScriptItem[] {
  if (!answer) return [];
  
  const answerLower = answer.toLowerCase();
  
  // Check if any sub-item has conditional prefix
  const hasConditionalPrefixes = subItems.some(s => {
    const l = s.label.toUpperCase();
    return l.includes("SE SIM") || l.includes("SE NÃO") || l.includes("SE NAO");
  });
  
  if (!hasConditionalPrefixes) {
    // No conditional prefixes — show all sub-items when parent is answered
    return subItems;
  }
  
  return subItems.filter(sub => {
    const label = sub.label.toUpperCase();
    
    if (answerLower === "sim") {
      // Show items with "SE SIM" or without any conditional prefix
      return label.includes("SE SIM") || (!label.includes("SE NÃO") && !label.includes("SE NAO"));
    }
    if (answerLower === "não" || answerLower === "nao") {
      return label.includes("SE NÃO") || label.includes("SE NAO") || (!label.includes("SE SIM"));
    }
    
    // For selecao answers: show sub-items that contain the answer in their label, or have no conditional prefix
    const hasAnyPrefix = label.includes("SE ");
    if (!hasAnyPrefix) return true;
    return label.includes(answer.toUpperCase());
  });
}

interface ScriptItemRowProps {
  item: ScriptItem;
  idPrefix: string;
  completedIds: string[];
  discardedIds: Set<string>;
  answers: Record<string, string>;
  onAnswer: (id: string, answer: string) => void;
  onCheck?: (id: string) => void;
  onDiscard?: (id: string) => void;
  depth: number;
}

function ScriptItemRow({ item, idPrefix, completedIds, discardedIds, answers, onAnswer, onCheck, onDiscard, depth }: ScriptItemRowProps) {
  const fullId = idPrefix ? `${idPrefix}__${item.id}` : item.id;
  const done = completedIds.includes(fullId) || !!answers[fullId];
  const answer = answers[fullId];
  const hasSubs = !!item.sub_items?.length;
  const isSimNao = item.tipo_campo === "sim_nao";
  const isSelecao = item.tipo_campo === "selecao";
  const hasConditionalUI = hasSubs && (isSimNao || isSelecao);
  
  // Determine visible sub-items
  const visibleSubs = hasSubs && answer ? filterSubItems(item.sub_items!, answer) : [];
  
  return (
    <>
      <div
        className={`flex items-start gap-1.5 rounded px-1.5 py-1 text-xs transition-colors ${
          done ? "bg-primary/8 text-foreground" : "text-muted-foreground"
        }`}
        style={{ paddingLeft: depth ? `${depth * 16 + 6}px` : undefined }}
      >
        {/* Icon */}
        {done ? (
          <CheckCircle2 className={`${depth ? "h-3 w-3" : "h-3.5 w-3.5"} text-green-500 shrink-0 mt-0.5`} />
        ) : (
          <Circle className={`${depth ? "h-3 w-3 opacity-30" : "h-3.5 w-3.5 opacity-40"} shrink-0 mt-0.5`} />
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <span className={`font-medium ${done ? "line-through opacity-70" : ""} ${depth ? "text-[11px]" : ""}`}>
            {item.label}
            {done && answer && <span className="ml-1.5 text-[10px] font-normal text-primary no-underline inline-block" style={{ textDecoration: 'none' }}>→ {answer}</span>}
          </span>
          {item.campo_lead_key && !done && (
            <Badge variant="outline" className="text-[8px] h-3.5 px-1 ml-1.5 gap-0.5 align-middle">
              <Database className="h-2 w-2" />
              {item.campo_lead_key}
            </Badge>
          )}
          {item.description && !done && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
              {item.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!done && (
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            {hasConditionalUI && isSimNao && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-green-600 hover:bg-green-500/20 hover:text-green-700"
                  onClick={() => onAnswer(fullId, "Sim")}
                >
                  Sim
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-red-600 hover:bg-red-500/20 hover:text-red-700"
                  onClick={() => onAnswer(fullId, "Não")}
                >
                  Não
                </Button>
              </>
            )}
            {hasConditionalUI && isSelecao && item.opcoes_campo?.length && (
              <>
                {item.opcoes_campo.map(opcao => (
                  <Button
                    key={opcao}
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] hover:bg-accent"
                    onClick={() => onAnswer(fullId, opcao)}
                  >
                    {opcao}
                  </Button>
                ))}
              </>
            )}
            {!hasConditionalUI && onCheck && (
              <button
                onClick={() => {
                  if (hasSubs) {
                    onAnswer(fullId, "✓");
                  } else {
                    onCheck(fullId);
                  }
                }}
                className="p-0.5 rounded hover:bg-green-500/20 text-green-600 transition-colors"
                title="Marcar como feito"
              >
                <Check className="h-3 w-3" />
              </button>
            )}
            {onDiscard && (
              <button
                onClick={() => onDiscard(fullId)}
                className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                title="Descartar"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded sub-items */}
      {visibleSubs.length > 0 && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-200">
          {visibleSubs
            .filter(sub => !discardedIds.has(`${fullId}__${sub.id}`))
            .map(sub => (
              <ScriptItemRow
                key={sub.id}
                item={sub}
                idPrefix={fullId}
                completedIds={completedIds}
                discardedIds={discardedIds}
                answers={answers}
                onAnswer={onAnswer}
                onCheck={onCheck}
                onDiscard={onDiscard}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </>
  );
}
