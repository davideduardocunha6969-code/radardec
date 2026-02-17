import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain } from "lucide-react";
import type { PsychStateData } from "@/hooks/useRadarOutbound";

interface PsychStateSectionProps {
  psychData: PsychStateData[];
}

export default function PsychStateSection({ psychData }: PsychStateSectionProps) {
  if (psychData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" />
          Conversão por Estado Psicológico do Lead
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Estado emocional identificado pela IA e taxa de agendamento associada
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado Psicológico</TableHead>
              <TableHead className="text-center">Ligações</TableHead>
              <TableHead className="text-center">Agendamentos</TableHead>
              <TableHead className="text-center">Taxa Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {psychData.map((p) => (
              <TableRow key={p.estado}>
                <TableCell className="font-medium">{p.estado}</TableCell>
                <TableCell className="text-center">{p.total}</TableCell>
                <TableCell className="text-center">{p.convertidos}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={p.taxa >= 30 ? "default" : "secondary"}>
                    {p.taxa}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
