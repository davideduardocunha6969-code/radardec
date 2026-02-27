import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calculator, AlertTriangle, ChevronDown, Info, Scale } from "lucide-react";
import { useLeadDadosSync } from "@/hooks/useLeadDadosSync";
import { calcularTudo } from "@/utils/trabalhista/calculator";
import { getFieldValue } from "@/utils/trabalhista/types";
import type { CalculoCompleto, CategoriaResult, RubricaResult } from "@/utils/trabalhista/types";

interface ValuesEstimationPanelProps {
  leadId: string;
}

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return fmt.format(value);
}

export function ValuesEstimationPanel({ leadId }: ValuesEstimationPanelProps) {
  const { dados, loading } = useLeadDadosSync(leadId);

  const resultado: CalculoCompleto | null = useMemo(() => {
    if (!dados || Object.keys(dados).length === 0) return null;
    return calcularTudo(dados);
  }, [dados]);

  // Aviso condicional de dedução rescisória
  const modalidade = getFieldValue(dados, "modalidade_desligamento")?.valor ?? "";
  const exibirAvisoDeducao = [
    "Dispensa sem justa causa",
    "Rescisão indireta",
    "Acordo mútuo",
  ].includes(modalidade);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Estimativa de Valores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!resultado) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Estimativa de Valores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">
            Aguardando dados para cálculo de estimativa...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (resultado.erro) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Estimativa de Valores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{resultado.erro}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const categoriasComValor = resultado.categorias.filter((c) => c.totalNominal > 0);
  const defaultOpen = categoriasComValor.map((c) => c.nome);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Estimativa de Valores
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-3 text-xs">
        {/* Barra resumo */}
        <div className="rounded-md bg-muted/50 p-3 flex items-center justify-between gap-4">
          <div>
            <span className="text-muted-foreground">Nominal</span>
            <p className="font-semibold text-sm">{formatCurrency(resultado.totalGeralNominal)}</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Atualizado</span>
            <p className="font-semibold text-sm text-primary">{formatCurrency(resultado.totalGeralAtualizado)}</p>
          </div>
        </div>

        {/* Metadados colapsável */}
        {resultado.metadados && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
              <Info className="h-3 w-3" />
              <span>Parâmetros do cálculo</span>
              <ChevronDown className="h-3 w-3 ml-auto" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
                <span>Meses trabalhados</span>
                <span className="font-medium text-foreground">{resultado.metadados.mesesTrabalhados}</span>
                <span>Remuneração base</span>
                <span className="font-medium text-foreground">{formatCurrency(resultado.metadados.remuneracaoBaseCorreta)}</span>
                <span>Base c/ DSR</span>
                <span className="font-medium text-foreground">{formatCurrency(resultado.metadados.baseComDSR)}</span>
                <span>Divisor</span>
                <span className="font-medium text-foreground">{resultado.metadados.divisorUtilizado}</span>
                <span>Regime</span>
                <span className="font-medium text-foreground capitalize">{resultado.metadados.regime.replace("_", "-")}</span>
                <span>Modulação STF</span>
                <span className="font-medium text-foreground">
                  {resultado.metadados.modulacaoSTF.status === "NAO_CALCULADO"
                    ? "N/A"
                    : `${resultado.metadados.modulacaoSTF.status} (${resultado.metadados.modulacaoSTF.meses_calculados}m)`}
                </span>
                <span>Base empresa (est.)</span>
                <span className="font-medium text-foreground">{formatCurrency(resultado.metadados.baseEstimativaEmpresa)}</span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Accordion por categoria */}
        <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-1">
          {resultado.categorias.map((cat) => (
            <CategoriaAccordion key={cat.nome} categoria={cat} />
          ))}
        </Accordion>

        {/* Rodapé - Subtotais */}
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Integral</span>
            <span>
              {formatCurrency(resultado.subtotalIntegralNominal)} / {formatCurrency(resultado.subtotalIntegralAtualizado)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Scale className="h-3 w-3" /> Modulado
            </span>
            <span>
              {formatCurrency(resultado.subtotalModuladoNominal)} / {formatCurrency(resultado.subtotalModuladoAtualizado)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-sm pt-1 border-t">
            <span>Total Geral</span>
            <span className="text-primary">{formatCurrency(resultado.totalGeralAtualizado)}</span>
          </div>

          {resultado.pensaoVitalicia !== null && (
            <>
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Pensão Vitalícia</span>
                <span>{formatCurrency(resultado.pensaoVitalicia)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total c/ Pensão</span>
                <span className="text-primary">{formatCurrency(resultado.totalComPensao)}</span>
              </div>
            </>
          )}

          {/* Aviso condicional de dedução rescisória */}
          {exibirAvisoDeducao && (
            <p className="text-xs text-muted-foreground flex gap-1.5 pt-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Os valores já recebidos na rescisão foram estimados com base no salário
                registrado na CTPS e nos adicionais declarados como pagos pela empresa.
                A diferença real será apurada com precisão após análise dos documentos
                rescisórios.
              </span>
            </p>
          )}

          {/* Aviso legal do motor */}
          {resultado.metadados?.aviso && (
            <p className="text-xs text-muted-foreground italic pt-2">
              {resultado.metadados.aviso}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Subcomponente: Categoria no Accordion ───

function CategoriaAccordion({ categoria }: { categoria: CategoriaResult }) {
  return (
    <AccordionItem value={categoria.nome} className="border rounded-md px-2">
      <AccordionTrigger className="py-2 text-xs hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <span className="font-medium">{categoria.nome}</span>
          <span className="text-muted-foreground font-normal">
            {formatCurrency(categoria.totalAtualizado)}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-2">
        <div className="space-y-0.5">
          {categoria.rubricas.map((rub) => (
            <RubricaRow key={rub.id} rubrica={rub} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Subcomponente: Linha de Rubrica ───

function RubricaRow({ rubrica }: { rubrica: RubricaResult }) {
  const isZero = rubrica.valorNominal === 0;
  const isNotCalc = !rubrica.calculavel;

  if (isNotCalc) {
    return (
      <div className="flex items-start gap-1 py-1 text-xs text-muted-foreground">
        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
        <div>
          <span>{rubrica.nome}</span>
          <span className="block text-[10px]">
            Campos faltantes: {rubrica.camposFaltantes.join(", ")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between py-1 text-xs ${isZero ? "text-muted-foreground" : ""}`}>
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span className="truncate">{rubrica.nome}</span>
        {rubrica.modulado && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">
            Modulada
          </Badge>
        )}
      </div>
      <div className="flex gap-3 shrink-0 text-right">
        <span className="w-20 text-muted-foreground">{formatCurrency(rubrica.valorNominal)}</span>
        <span className="w-20 font-medium">{formatCurrency(rubrica.valorAtualizado)}</span>
      </div>
    </div>
  );
}
