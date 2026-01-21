import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ConteudoMidia,
  Status,
  Formato,
  SETOR_LABELS,
  FORMATO_LABELS,
  STATUS_COLORS,
  PRIORIDADE_LABELS,
  PRIORIDADE_COLORS,
  getStatusLabel,
  getStatusLabelsForFormato,
} from "@/hooks/useConteudosMidia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Video, Image, FileText, Play, CalendarDays, Flame } from "lucide-react";

const FORMATO_ICONS: Record<string, React.ReactNode> = {
  video: <Play className="h-3.5 w-3.5" />,
  video_longo: <Video className="h-3.5 w-3.5" />,
  carrossel: <FileText className="h-3.5 w-3.5" />,
  estatico: <Image className="h-3.5 w-3.5" />,
};

const SETOR_COLORS: Record<string, string> = {
  trabalhista: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  previdenciario: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  civel: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  bancario: "bg-violet-500/15 text-violet-500 border-violet-500/30",
};

interface ConteudoListProps {
  conteudos: ConteudoMidia[];
  onSelectConteudo: (conteudo: ConteudoMidia) => void;
  onStatusChange: (id: string, status: Status) => void;
}

export function ConteudoList({
  conteudos,
  onSelectConteudo,
  onStatusChange,
}: ConteudoListProps) {
  // Sort conteudos with "hot" first
  const sortedConteudos = [...conteudos].sort((a, b) => {
    if (a.prioridade === "hot" && b.prioridade !== "hot") return -1;
    if (a.prioridade !== "hot" && b.prioridade === "hot") return 1;
    return 0;
  });

  if (sortedConteudos.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card/50">
        <p className="text-lg">Nenhum conteúdo encontrado.</p>
        <p className="text-sm mt-1">
          Clique em "Novo Conteúdo" para adicionar o primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[130px] font-semibold">Setor</TableHead>
            <TableHead className="w-[130px] font-semibold">Formato</TableHead>
            <TableHead className="font-semibold">Título</TableHead>
            <TableHead className="w-[100px] font-semibold text-center">Semana</TableHead>
            <TableHead className="w-[110px] font-semibold">Prioridade</TableHead>
            <TableHead className="w-[160px] font-semibold">Status</TableHead>
            <TableHead className="w-[90px] font-semibold text-right">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedConteudos.map((conteudo) => {
            const isHot = conteudo.prioridade === "hot";
            return (
              <TableRow
                key={conteudo.id}
                className={`cursor-pointer transition-colors ${
                  isHot 
                    ? "bg-red-500/10 hover:bg-red-500/20 border-l-4 border-l-red-500" 
                    : "hover:bg-accent/40"
                }`}
                onClick={() => onSelectConteudo(conteudo)}
              >
                <TableCell className="py-3">
                  <Badge 
                    variant="outline" 
                    className={`font-medium text-xs ${SETOR_COLORS[conteudo.setor]}`}
                  >
                    {SETOR_LABELS[conteudo.setor]}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {FORMATO_ICONS[conteudo.formato]}
                    <span>{FORMATO_LABELS[conteudo.formato]}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`font-medium text-foreground line-clamp-1 ${isHot ? "text-red-400" : ""}`}>
                    {isHot && <Flame className="inline h-4 w-4 mr-1 text-red-500" />}
                    {conteudo.titulo}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  {conteudo.semana_publicacao ? (
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{conteudo.semana_publicacao}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${PRIORIDADE_COLORS[conteudo.prioridade]}`}
                  >
                    {isHot && <Flame className="h-3 w-3 mr-1" />}
                    {PRIORIDADE_LABELS[conteudo.prioridade]}
                  </Badge>
                </TableCell>
                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={conteudo.status}
                    onValueChange={(value: Status) =>
                      onStatusChange(conteudo.id, value)
                    }
                  >
                    <SelectTrigger
                      className={`w-[140px] h-8 text-xs font-medium rounded-full ${
                        STATUS_COLORS[conteudo.status]
                      }`}
                    >
                      <SelectValue>
                        {getStatusLabel(conteudo.status, conteudo.formato as Formato)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(getStatusLabelsForFormato(conteudo.formato as Formato)).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-3 text-muted-foreground text-sm text-right">
                  {format(new Date(conteudo.created_at), "dd/MM/yy", {
                    locale: ptBR,
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
