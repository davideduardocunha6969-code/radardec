import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ClipboardList, Heart, Brain, ShieldAlert, CalendarCheck, TrendingUp, TrendingDown, Copy } from "lucide-react";
import { toast } from "sonner";
import type { ChecklistItem, DynamicItem, Objection, ShowRateAnalysis } from "./coachingData";

// ─── Shared click-to-copy ───
function copyText(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado!", { duration: 1500 });
}

// ─── Sort: pending first, done at bottom ───
function sortItems<T extends { done?: boolean; addressed?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDone = "done" in a ? a.done : (a as any).addressed;
    const bDone = "done" in b ? b.done : (b as any).addressed;
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1;
  });
}

// ═══════════════════════════════════════
// 1️⃣ SCRIPT CARD
// ═══════════════════════════════════════
interface ScriptCardProps {
  apresentacaoItems: ChecklistItem[];
  qualificationItems: ChecklistItem[];
  apresentacaoDone: string[];
  qualificationDone: string[];
}

export function ScriptCard({ apresentacaoItems, qualificationItems, apresentacaoDone, qualificationDone }: ScriptCardProps) {
  const allItems = [
    ...apresentacaoItems.map(i => ({ ...i, type: "apresentacao" as const })),
    ...qualificationItems.map(i => ({ ...i, type: "qualificacao" as const })),
  ];
  const pending = allItems.filter(i => {
    const doneList = i.type === "apresentacao" ? apresentacaoDone : qualificationDone;
    return !doneList.includes(i.id);
  });
  const done = allItems.filter(i => {
    const doneList = i.type === "apresentacao" ? apresentacaoDone : qualificationDone;
    return doneList.includes(i.id);
  });
  const total = allItems.length;
  const doneCount = done.length;

  return (
    <Card className="border-border/60 flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-1 px-3 pt-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-semibold">
            <ClipboardList className="h-4 w-4 text-primary" />
            Script
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {doneCount}/{total}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 flex-1 min-h-0">
        <ScrollArea className="h-full">
          {pending.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">📌 Próximas</p>
              <div className="space-y-1">
                {pending.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${
                      idx === 0 ? "bg-primary/10 border border-primary/20" : "bg-background"
                    }`}
                    onClick={() => item.description && copyText(item.description)}
                    title="Clique para copiar"
                  >
                    <Circle className="h-4 w-4 shrink-0 mt-0.5 opacity-40" />
                    <div className="min-w-0">
                      <span className="font-medium">{item.label}</span>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">✅ Já falado</p>
              <div className="space-y-0.5">
                {done.map(item => (
                  <div key={item.id} className="flex items-start gap-2 rounded px-2 py-1 text-sm opacity-50">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="line-through">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════
// 2️⃣ RECA CARD (Âncoras Emocionais)
// ═══════════════════════════════════════
interface AnchorCardProps {
  items: DynamicItem[];
  title: string;
  icon: typeof Heart;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  emptyMessage: string;
  emptyEmoji: string;
}

export function AnchorCard({ items, title, icon: Icon, iconColor, borderColor, bgColor, emptyMessage, emptyEmoji }: AnchorCardProps) {
  const sorted = sortItems(items);
  const pending = sorted.filter(i => !i.done);
  const done = sorted.filter(i => i.done);
  const total = items.length;
  const doneCount = done.length;

  return (
    <Card className={`flex flex-col h-full overflow-hidden border-border/60 ${pending.length > 0 ? borderColor : ""}`}>
      <CardHeader className="pb-1 px-3 pt-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-semibold">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            {title}
          </CardTitle>
          {total > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono">
              {doneCount}/{total}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 flex-1 min-h-0">
        <ScrollArea className="h-full">
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">{emptyEmoji} {emptyMessage}</p>
          )}
          <div className="space-y-1.5">
            {pending.map(item => (
              <div
                key={item.id}
                className={`rounded-md border px-2.5 py-2 text-sm ${bgColor} cursor-pointer hover:brightness-95 transition-all`}
                onClick={() => item.description && copyText(item.description)}
                title="Clique para copiar sugestão"
              >
                {item.lead_phrase && (
                  <p className="text-xs font-semibold mb-1 text-foreground">🗣️ "{item.lead_phrase}"</p>
                )}
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug italic">💬 {item.description}</p>
              </div>
            ))}
            {done.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">✅ Já utilizadas</p>
                {done.map(item => (
                  <div key={item.id} className="flex items-start gap-2 rounded px-2 py-1 text-xs opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span className="line-through">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function RecaCard({ items }: { items: DynamicItem[] }) {
  return (
    <AnchorCard
      items={items}
      title="RECA — Emocionais"
      icon={Heart}
      iconColor="text-red-500"
      borderColor="border-green-500/30"
      bgColor="bg-green-500/5 border-green-500/20"
      emptyMessage="Sem âncora emocional detectada"
      emptyEmoji="❤️"
    />
  );
}

export function RalocaCard({ items }: { items: DynamicItem[] }) {
  return (
    <AnchorCard
      items={items}
      title="RALOCA — Lógicos"
      icon={Brain}
      iconColor="text-blue-500"
      borderColor="border-blue-500/30"
      bgColor="bg-blue-500/5 border-blue-500/20"
      emptyMessage="Sem âncora lógica detectada"
      emptyEmoji="🧠"
    />
  );
}

// ═══════════════════════════════════════
// 4️⃣ RADOVECA CARD (Objeções)
// ═══════════════════════════════════════
export function RadovecaCard({ objections }: { objections: Objection[] }) {
  const pending = objections.filter(o => !o.addressed);
  const done = objections.filter(o => o.addressed);

  return (
    <Card className={`flex flex-col h-full overflow-hidden border-border/60 ${
      pending.some(o => o.intensity === "alta") ? "border-red-500/50 shadow-red-500/10 shadow-md" : ""
    }`}>
      <CardHeader className="pb-1 px-3 pt-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            RADOVECA — Objeções
          </CardTitle>
          {objections.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono">
              {done.length}/{objections.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 flex-1 min-h-0">
        <ScrollArea className="h-full">
          {objections.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">⚖️ Sem objeção ativa</p>
          )}
          <div className="space-y-1.5">
            {pending.map(obj => (
              <div
                key={obj.id}
                className={`rounded-md border px-2.5 py-2 text-sm cursor-pointer hover:brightness-95 transition-all ${
                  obj.intensity === "alta"
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-orange-500/20 bg-orange-500/5"
                }`}
                onClick={() => copyText(obj.suggested_response)}
                title="Clique para copiar resposta"
              >
                <p className="text-xs font-semibold mb-1 text-foreground">🗣️ "{obj.objection}"</p>
                <p className="text-xs text-muted-foreground leading-snug italic">💬 {obj.suggested_response}</p>
              </div>
            ))}
            {done.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">✅ Contornadas</p>
                {done.map(obj => (
                  <div key={obj.id} className="flex items-start gap-2 rounded px-2 py-1 text-xs opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span className="line-through">{obj.objection}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════
// 5️⃣ SHOW RATE CARD
// ═══════════════════════════════════════
interface ShowRateCardProps {
  showRate: ShowRateAnalysis | null;
  prevScore: number | null;
}

function getScoreColor(score: number) {
  if (score >= 75) return { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", label: "Alta" };
  if (score >= 55) return { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "Média" };
  if (score >= 35) return { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "Baixa" };
  return { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", label: "Crítica" };
}

export function ShowRateCard({ showRate, prevScore }: ShowRateCardProps) {
  const score = showRate?.score ?? 0;
  const colors = getScoreColor(score);
  const delta = prevScore !== null ? score - prevScore : null;

  return (
    <Card className={`flex flex-col overflow-hidden border-border/60 ${
      score < 55 ? `${colors.border} shadow-md` : ""
    }`}>
      <CardHeader className="pb-1 px-3 pt-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-semibold">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Show Rate
          </CardTitle>
          {showRate && (
            <Badge className={`${colors.bg} ${colors.text} border-0 text-[10px] font-semibold`}>
              {colors.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {!showRate ? (
          <p className="text-xs text-muted-foreground text-center py-4">📊 Aguardando análise...</p>
        ) : (
          <div className="flex items-start gap-4">
            {/* Score big */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className={`text-4xl font-bold ${colors.text} transition-all duration-500`}>
                {score}%
              </span>
              {delta !== null && delta !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  delta > 0 ? "text-green-500" : "text-red-500"
                } animate-fade-in`}>
                  {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {delta > 0 ? "+" : ""}{delta}%
                </div>
              )}
            </div>
            {/* Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">⚠️ Risco dominante</p>
                <p className="text-sm font-medium">{showRate.dominant_risk}</p>
              </div>
              <div
                className={`rounded-md border px-2.5 py-2 ${colors.bg} ${colors.border} cursor-pointer hover:brightness-95`}
                onClick={() => copyText(showRate.suggested_phrase)}
                title="Clique para copiar"
              >
                <p className="text-xs font-medium">💬 Fala sugerida</p>
                <p className="text-sm mt-0.5">{showRate.suggested_phrase}</p>
              </div>
              {showRate.confirmation_question && (
                <div
                  className="rounded-md border border-border/60 px-2.5 py-2 bg-background cursor-pointer hover:bg-accent/30"
                  onClick={() => copyText(showRate.confirmation_question)}
                  title="Clique para copiar"
                >
                  <p className="text-xs font-medium">❓ Pergunta de confirmação</p>
                  <p className="text-sm mt-0.5">{showRate.confirmation_question}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
