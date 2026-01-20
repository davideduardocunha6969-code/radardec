import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAiPrompts, AiPrompt } from "@/hooks/useAiPrompts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function AiPromptsPage() {
  const { prompts, isLoading, fetchPrompts, createPrompt, updatePrompt, deletePrompt } = useAiPrompts();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AiPrompt | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<AiPrompt | null>(null);
  
  const [nome, setNome] = useState("");
  const [prompt, setPrompt] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const resetForm = () => {
    setNome("");
    setPrompt("");
    setDescricao("");
    setEditingPrompt(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: AiPrompt) => {
    setEditingPrompt(p);
    setNome(p.nome);
    setPrompt(p.prompt);
    setDescricao(p.descricao || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim() || !prompt.trim()) return;
    
    setSaving(true);
    try {
      if (editingPrompt) {
        await updatePrompt(editingPrompt.id, nome, prompt, descricao);
      } else {
        await createPrompt(nome, prompt, descricao);
      }
      setDialogOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (p: AiPrompt) => {
    setPromptToDelete(p);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (promptToDelete) {
      await deletePrompt(promptToDelete.id);
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Prompts de IA</h1>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Prompt
        </Button>
      </div>

      <p className="text-muted-foreground">
        Crie prompts personalizados para analisar transcrições de audiências com IA.
      </p>

      {/* Prompts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : prompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum prompt criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie prompts para analisar transcrições automaticamente.
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{p.nome}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(p)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {p.descricao && (
                  <CardDescription>{p.descricao}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground line-clamp-4">
                  {p.prompt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
            </DialogTitle>
            <DialogDescription>
              {editingPrompt
                ? "Edite o prompt para análise de transcrições."
                : "Crie um prompt para analisar transcrições de audiências."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Prompt</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Resumo da Audiência"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Gera um resumo dos principais pontos da audiência"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Analise a transcrição abaixo e forneça um resumo detalhado..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                A transcrição será adicionada automaticamente ao final do prompt.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !nome.trim() || !prompt.trim()}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o prompt "{promptToDelete?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
