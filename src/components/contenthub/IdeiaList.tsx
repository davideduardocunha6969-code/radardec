import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Flame } from "lucide-react";
import {
  SETOR_LABELS,
  FORMATO_LABELS,
  PRIORIDADE_LABELS,
  PRIORIDADE_COLORS,
  Setor,
  Formato,
  Prioridade,
} from "@/hooks/useConteudosMidia";
import { IdeiaConteudo, SITUACAO_COLORS } from "@/hooks/useIdeiasConteudo";

interface IdeiaListProps {
  ideias: IdeiaConteudo[];
  onItemClick: (ideia: IdeiaConteudo) => void;
  onValidar: (ideia: IdeiaConteudo) => void;
  isAdmin?: boolean;
}

export function IdeiaList({ ideias, onItemClick, onValidar, isAdmin }: IdeiaListProps) {
  // Sort ideias with "hot" first
  const sortedIdeias = [...ideias].sort((a, b) => {
    if (a.prioridade === "hot" && b.prioridade !== "hot") return -1;
    if (a.prioridade !== "hot" && b.prioridade === "hot") return 1;
    return 0;
  });

  if (sortedIdeias.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma ideia encontrada.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Setor</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Formato</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Título</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Semana</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Prioridade</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Data</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Situação</th>
            {isAdmin && <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ação</th>}
          </tr>
        </thead>
        <tbody>
          {sortedIdeias.map((ideia) => {
            const isHot = ideia.prioridade === "hot";
            return (
              <tr
                key={ideia.id}
                className={`border-t cursor-pointer transition-colors ${
                  isHot 
                    ? "bg-red-500/10 hover:bg-red-500/20 border-l-4 border-l-red-500" 
                    : "hover:bg-muted/30"
                }`}
                onClick={() => onItemClick(ideia)}
              >
                <td className="p-3">
                  <Badge variant="outline" className="text-xs">
                    {SETOR_LABELS[ideia.setor as Setor]}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {FORMATO_LABELS[ideia.formato as Formato]}
                  </Badge>
                </td>
                <td className="p-3">
                  <span className={`font-medium text-sm line-clamp-1 ${isHot ? "text-red-400" : ""}`}>
                    {isHot && <Flame className="inline h-4 w-4 mr-1 text-red-500" />}
                    {ideia.titulo}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {ideia.semana_publicacao ? `Semana ${ideia.semana_publicacao}` : "—"}
                </td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${PRIORIDADE_COLORS[ideia.prioridade as Prioridade]}`}
                  >
                    {isHot && <Flame className="h-3 w-3 mr-1" />}
                    {PRIORIDADE_LABELS[ideia.prioridade as Prioridade]}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {format(new Date(ideia.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${SITUACAO_COLORS[ideia.validado ? "validado" : "pendente"]}`}
                  >
                    {ideia.validado ? "Validado" : "Pendente"}
                  </Badge>
                </td>
                {isAdmin && (
                  <td className="p-3">
                    {!ideia.validado && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onValidar(ideia);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Validar
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
