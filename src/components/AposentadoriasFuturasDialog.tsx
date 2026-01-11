import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CommercialRecord } from "@/hooks/useCommercialData";
import { Calendar, User, Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AposentadoriasFuturasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CommercialRecord[];
}

export const AposentadoriasFuturasDialog = ({
  open,
  onOpenChange,
  data,
}: AposentadoriasFuturasDialogProps) => {
  const [copied, setCopied] = useState(false);

  // Filtra apenas aposentadorias futuras
  const aposentadoriasFuturas = data.filter(r => 
    r.resultado?.toLowerCase().includes('aposentadoria futura')
  );

  // Agrupa por ano de aposentadoria
  const porAno = aposentadoriasFuturas.reduce((acc, record) => {
    const ano = record.anoAposentadoriaFutura || 'Não informado';
    if (!acc[ano]) {
      acc[ano] = [];
    }
    acc[ano].push(record);
    return acc;
  }, {} as Record<string, CommercialRecord[]>);

  const anosOrdenados = Object.keys(porAno).sort((a, b) => {
    if (a === 'Não informado') return 1;
    if (b === 'Não informado') return -1;
    return a.localeCompare(b);
  });

  const handleCopyToClipboard = () => {
    // Ordena os dados
    const dadosOrdenados = [...aposentadoriasFuturas].sort((a, b) => {
      const anoA = a.anoAposentadoriaFutura || 'zzzz';
      const anoB = b.anoAposentadoriaFutura || 'zzzz';
      return anoA.localeCompare(anoB);
    });

    // Cria o conteúdo em formato TSV (Tab-Separated Values)
    const header = "Responsável\tCliente\tAno Aposentadoria";
    const rows = dadosOrdenados.map(record => 
      `${record.responsavel || '-'}\t${record.cliente || '-'}\t${record.anoAposentadoriaFutura || 'Não informado'}`
    );
    
    const tsvContent = [header, ...rows].join('\n');
    
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      toast.success("Dados copiados! Cole em uma planilha (Excel, Google Sheets)");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Erro ao copiar dados");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              Aposentadorias Futuras
            </DialogTitle>
            {aposentadoriasFuturas.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar para planilha
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {aposentadoriasFuturas.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nenhuma aposentadoria futura encontrada
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo por ano */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {anosOrdenados.map(ano => (
                  <div 
                    key={ano} 
                    className="bg-muted/30 rounded-lg p-3 text-center"
                  >
                    <div className="text-lg font-bold text-amber-600">{porAno[ano].length}</div>
                    <div className="text-xs text-muted-foreground">{ano}</div>
                  </div>
                ))}
              </div>

              {/* Tabela de detalhes */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Responsável
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Cliente
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Ano
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aposentadoriasFuturas
                    .sort((a, b) => {
                      const anoA = a.anoAposentadoriaFutura || 'zzzz';
                      const anoB = b.anoAposentadoriaFutura || 'zzzz';
                      return anoA.localeCompare(anoB);
                    })
                    .map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {record.responsavel || '-'}
                        </TableCell>
                        <TableCell>{record.cliente || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.anoAposentadoriaFutura 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {record.anoAposentadoriaFutura || 'Não informado'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="pt-4 border-t text-sm text-muted-foreground text-center">
          Total: {aposentadoriasFuturas.length} aposentadorias futuras
        </div>
      </DialogContent>
    </Dialog>
  );
};
