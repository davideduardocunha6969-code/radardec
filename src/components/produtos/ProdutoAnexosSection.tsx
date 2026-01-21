import { useState, useRef } from "react";
import { FileText, Trash2, Upload, Download, File, Image, FileSpreadsheet, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useTiposProdutosAnexos,
  TipoProdutoAnexo,
} from "@/hooks/useTiposProdutosAnexos";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ProdutoAnexosSectionProps {
  tipoProdutoId: string | null;
  readOnly?: boolean;
}

function getFileIcon(tipo: string | null) {
  if (!tipo) return <File className="h-4 w-4" />;
  
  if (tipo.startsWith("image/")) return <Image className="h-4 w-4 text-blue-400" />;
  if (tipo.includes("pdf")) return <FileText className="h-4 w-4 text-red-400" />;
  if (tipo.includes("spreadsheet") || tipo.includes("excel") || tipo.includes("csv")) 
    return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
  if (tipo.includes("zip") || tipo.includes("rar") || tipo.includes("archive")) 
    return <FileArchive className="h-4 w-4 text-yellow-400" />;
  if (tipo.includes("word") || tipo.includes("document")) 
    return <FileText className="h-4 w-4 text-blue-400" />;
  
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProdutoAnexosSection({
  tipoProdutoId,
  readOnly = false,
}: ProdutoAnexosSectionProps) {
  const { anexos, isLoading, uploadAnexo, deleteAnexo } = useTiposProdutosAnexos(tipoProdutoId);
  const [deleteTarget, setDeleteTarget] = useState<TipoProdutoAnexo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !tipoProdutoId) return;
    
    for (const file of Array.from(files)) {
      await uploadAnexo.mutateAsync({ tipoProdutoId, file });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteAnexo.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (!tipoProdutoId) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Arquivos de Referência
        </Label>
        <p className="text-xs text-muted-foreground italic">
          Salve o produto primeiro para poder anexar arquivos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Arquivos de Referência
        {anexos.length > 0 && (
          <span className="text-xs text-muted-foreground">({anexos.length})</span>
        )}
      </Label>
      
      <p className="text-xs text-muted-foreground">
        Anexe documentos, artigos, PDFs ou outros materiais que servirão de base de conhecimento para a IA gerar conteúdos sobre este produto.
      </p>

      {!readOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arraste arquivos ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOC, XLS, imagens, etc.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-2">
          Carregando anexos...
        </div>
      ) : anexos.length === 0 ? (
        <div className="text-sm text-muted-foreground italic py-2">
          Nenhum arquivo anexado.
        </div>
      ) : (
        <div className="space-y-2">
          {anexos.map((anexo) => (
            <div
              key={anexo.id}
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(anexo.tipo_arquivo)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{anexo.nome_arquivo}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(anexo.tamanho_bytes)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <a href={anexo.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(anexo)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Arquivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteTarget?.nome_arquivo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
