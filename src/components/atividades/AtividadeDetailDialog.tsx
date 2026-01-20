import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, Paperclip, Trash2, Upload, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Atividade, Responsavel, Coluna, Comentario, Anexo } from "@/hooks/useAtividadesMarketing";

interface AtividadeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividade: Atividade | null;
  responsaveis: Responsavel[];
  colunas: Coluna[];
  comentarios: Comentario[];
  anexos: Anexo[];
  onUpdate: (data: Partial<Atividade> & { id: string }) => void;
  onDelete: (id: string) => void;
  onAddComentario: (atividade_id: string, texto: string) => void;
  onAddAnexo: (atividade_id: string, file: File) => void;
  onDeleteAnexo: (id: string) => void;
  isUpdating?: boolean;
}

export function AtividadeDetailDialog({
  open,
  onOpenChange,
  atividade,
  responsaveis,
  colunas,
  comentarios,
  anexos,
  onUpdate,
  onDelete,
  onAddComentario,
  onAddAnexo,
  onDeleteAnexo,
  isUpdating,
}: AtividadeDetailDialogProps) {
  const [editMode, setEditMode] = useState(false);
  const [atividadeText, setAtividadeText] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [prazoFatal, setPrazoFatal] = useState("");
  const [colunaId, setColunaId] = useState("");
  const [novoComentario, setNovoComentario] = useState("");

  useEffect(() => {
    if (atividade) {
      setAtividadeText(atividade.atividade);
      setResponsavelId(atividade.responsavel_id || "");
      setPrazoFatal(atividade.prazo_fatal || "");
      setColunaId(atividade.coluna_id || "");
    }
  }, [atividade]);

  if (!atividade) return null;

  const handleSave = () => {
    onUpdate({
      id: atividade.id,
      atividade: atividadeText,
      responsavel_id: responsavelId || null,
      prazo_fatal: prazoFatal || null,
      coluna_id: colunaId || null,
    });
    setEditMode(false);
  };

  const handleAddComentario = () => {
    if (novoComentario.trim()) {
      onAddComentario(atividade.id, novoComentario.trim());
      setNovoComentario("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddAnexo(atividade.id, file);
      e.target.value = "";
    }
  };

  const isPastDue = atividade.prazo_fatal && new Date(atividade.prazo_fatal) < new Date();
  const currentColuna = colunas.find((c) => c.id === atividade.coluna_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Detalhes da Atividade</DialogTitle>
            <div className="flex gap-2">
              {currentColuna && (
                <Badge variant="outline">{currentColuna.nome}</Badge>
              )}
              {isPastDue && <Badge variant="destructive">Atrasado</Badge>}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Main Info */}
            <div className="space-y-4">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <Label>Atividade</Label>
                    <Textarea
                      value={atividadeText}
                      onChange={(e) => setAtividadeText(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Select value={responsavelId} onValueChange={setResponsavelId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsaveis.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo Fatal</Label>
                    <Input
                      type="date"
                      value={prazoFatal}
                      onChange={(e) => setPrazoFatal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coluna</Label>
                    <Select value={colunaId} onValueChange={setColunaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {colunas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isUpdating}>
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{atividade.atividade}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {atividade.responsavel && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {atividade.responsavel.nome}
                      </div>
                    )}
                    {atividade.prazo_fatal && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(atividade.prazo_fatal), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        onDelete(atividade.id);
                        onOpenChange(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Anexos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexos ({anexos.length})
                </h4>
                <label>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1" />
                      Adicionar
                    </span>
                  </Button>
                </label>
              </div>
              {anexos.length > 0 && (
                <div className="space-y-2">
                  {anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate flex-1"
                      >
                        {anexo.nome_arquivo}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDeleteAnexo(anexo.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Comentários */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comentarios.length})
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar comentário..."
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComentario()}
                />
                <Button onClick={handleAddComentario} disabled={!novoComentario.trim()}>
                  Enviar
                </Button>
              </div>
              {comentarios.length > 0 && (
                <div className="space-y-2">
                  {comentarios.map((comentario) => (
                    <div key={comentario.id} className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{comentario.texto}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(comentario.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
