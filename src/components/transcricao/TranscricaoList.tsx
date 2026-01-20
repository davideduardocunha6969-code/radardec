import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Transcricao } from "@/hooks/useTranscricao";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TranscricaoListProps {
  transcricoes: Transcricao[];
  onSelect: (transcricao: Transcricao) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

interface StatusConfig {
  label: string;
  icon: typeof Clock;
  variant: "default" | "secondary" | "destructive" | "outline";
  animate?: boolean;
  className?: string;
}

const statusConfig: Record<string, StatusConfig> = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    variant: "secondary",
  },
  processando: {
    label: "Processando",
    icon: Loader2,
    variant: "default",
    animate: true,
  },
  concluido: {
    label: "Concluído",
    icon: CheckCircle,
    variant: "default",
    className: "bg-green-500",
  },
  erro: {
    label: "Erro",
    icon: XCircle,
    variant: "destructive",
  },
};

export function TranscricaoList({
  transcricoes,
  onSelect,
  onDelete,
  isLoading,
}: TranscricaoListProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (transcricoes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg">Nenhuma transcrição ainda</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload de um vídeo para começar a transcrever.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Suas Transcrições</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transcricoes.map((t) => {
              const status = statusConfig[t.status];
              const StatusIcon = status.icon;

              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.titulo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {t.arquivo_nome}
                  </TableCell>
                  <TableCell>{formatDuration(t.duracao_segundos)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={status.variant}
                      className={status.className}
                    >
                      <StatusIcon
                        className={`h-3 w-3 mr-1 ${
                          status.animate ? "animate-spin" : ""
                        }`}
                      />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(t.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {t.status === "concluido" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onSelect(t)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Deletar transcrição?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A transcrição
                              será permanentemente removida.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(t.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
