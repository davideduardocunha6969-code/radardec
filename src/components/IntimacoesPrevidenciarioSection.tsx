import { useState, useMemo } from "react";
import { Scale, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntimacaoDetailDialog } from "@/components/IntimacaoDetailDialog";
import type { IntimacaoPrevidenciario } from "@/hooks/useSheetData";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface IntimacoesPrevidenciarioSectionProps {
  intimacoes: IntimacaoPrevidenciario[];
}

interface ColaboradorAtraso {
  nome: string;
  quantidade: number;
  intimacoes: IntimacaoPrevidenciario[];
}

export function IntimacoesPrevidenciarioSection({
  intimacoes,
}: IntimacoesPrevidenciarioSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedColaborador, setSelectedColaborador] = useState<ColaboradorAtraso | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filtra intimações em atraso: sem data de cumprimento E prazo fatal ultrapassado
  // Só considera se tiver tipo de compromisso cadastrado
  const intimacoesEmAtraso = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return intimacoes.filter((int) => {
      // Deve ter tipo de compromisso
      if (!int.tipoCompromisso || int.tipoCompromisso.trim() === "") {
        return false;
      }
      // Não pode ter data de cumprimento
      if (int.dataCumprimento) {
        return false;
      }
      // Deve ter prazo fatal e ele já ter passado
      if (!int.prazoFatal) {
        return false;
      }
      const prazo = new Date(int.prazoFatal);
      prazo.setHours(0, 0, 0, 0);
      return hoje > prazo;
    });
  }, [intimacoes]);

  // Agrupa por colaborador e conta
  const colaboradoresAtraso = useMemo(() => {
    const map = new Map<string, IntimacaoPrevidenciario[]>();

    intimacoesEmAtraso.forEach((int) => {
      const nome = int.destinatario || "Não identificado";
      if (!map.has(nome)) {
        map.set(nome, []);
      }
      map.get(nome)!.push(int);
    });

    const result: ColaboradorAtraso[] = [];
    map.forEach((intimacoes, nome) => {
      result.push({
        nome,
        quantidade: intimacoes.length,
        intimacoes,
      });
    });

    // Ordena por quantidade (maior primeiro)
    return result.sort((a, b) => b.quantidade - a.quantidade);
  }, [intimacoesEmAtraso]);

  const handleColaboradorClick = (colaborador: ColaboradorAtraso) => {
    setSelectedColaborador(colaborador);
    setDialogOpen(true);
  };

  const getMedalha = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return null;
    }
  };

  const totalEmAtraso = intimacoesEmAtraso.length;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <Card className="border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="h-5 w-5 text-primary" />
                  Intimações Previdenciário
                  <Badge variant="destructive" className="ml-2">
                    {totalEmAtraso} em atraso
                  </Badge>
                </CardTitle>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {colaboradoresAtraso.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma intimação em atraso encontrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {colaboradoresAtraso.map((colaborador, index) => (
                    <Card
                      key={colaborador.nome}
                      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 bg-card"
                      onClick={() => handleColaboradorClick(colaborador)}
                    >
                      <CardContent className="p-4 text-center">
                        {getMedalha(index) && (
                          <span className="text-2xl mb-1 block">
                            {getMedalha(index)}
                          </span>
                        )}
                        <p className="font-medium text-sm truncate" title={colaborador.nome}>
                          {colaborador.nome}
                        </p>
                        <p className="text-2xl font-bold text-destructive mt-1">
                          {colaborador.quantidade}
                        </p>
                        <p className="text-xs text-muted-foreground">em atraso</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <IntimacaoDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        colaborador={selectedColaborador?.nome || ""}
        intimacoes={selectedColaborador?.intimacoes || []}
      />
    </>
  );
}
