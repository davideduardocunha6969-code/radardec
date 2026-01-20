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
  SETOR_LABELS,
  FORMATO_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/hooks/useConteudosMidia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  if (conteudos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum conteúdo encontrado.</p>
        <p className="text-sm mt-1">
          Clique em "Novo Conteúdo" para adicionar o primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Setor</TableHead>
            <TableHead className="w-[120px]">Formato</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[100px]">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conteudos.map((conteudo) => (
            <TableRow
              key={conteudo.id}
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => onSelectConteudo(conteudo)}
            >
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {SETOR_LABELS[conteudo.setor]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {FORMATO_LABELS[conteudo.formato]}
                </Badge>
              </TableCell>
              <TableCell className="font-medium max-w-[300px] truncate">
                {conteudo.titulo}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  value={conteudo.status}
                  onValueChange={(value: Status) =>
                    onStatusChange(conteudo.id, value)
                  }
                >
                  <SelectTrigger
                    className={`w-[130px] h-8 text-xs border ${
                      STATUS_COLORS[conteudo.status]
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(conteudo.created_at), "dd/MM/yy", {
                  locale: ptBR,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
