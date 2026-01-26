import { useState, useMemo } from "react";
import { Users, Plus, Edit2, Trash2, ChevronRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useIaOrganograma, IaOrganograma } from "@/hooks/useIaOrganograma";
import { cn } from "@/lib/utils";

const SETORES = [
  "Direção",
  "Comercial",
  "Bancário",
  "Previdenciário",
  "Trabalhista",
  "Controladoria",
  "Marketing",
  "Administrativo",
  "TI",
];

interface MemberFormData {
  nome: string;
  cargo: string;
  setor: string;
  funcao: string;
  subordinado_a: string | null;
  ordem: number;
  ativo: boolean;
}

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: IaOrganograma;
  allMembers: IaOrganograma[];
  onSave: (data: MemberFormData) => void;
  isPending: boolean;
}

function MemberDialog({ open, onOpenChange, member, allMembers, onSave, isPending }: MemberDialogProps) {
  const [formData, setFormData] = useState<MemberFormData>({
    nome: member?.nome || "",
    cargo: member?.cargo || "",
    setor: member?.setor || "",
    funcao: member?.funcao || "",
    subordinado_a: member?.subordinado_a || null,
    ordem: member?.ordem || 0,
    ativo: member?.ativo ?? true,
  });

  const handleSave = () => {
    if (!formData.nome.trim() || !formData.cargo.trim()) return;
    onSave(formData);
  };

  const availableSuperiors = allMembers.filter(m => m.id !== member?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            {member ? "Editar Membro" : "Novo Membro"}
          </DialogTitle>
          <DialogDescription>
            {member ? "Atualize as informações do membro" : "Adicione um novo membro ao organograma"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Input
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Ex: Advogado Sênior"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select 
                value={formData.setor} 
                onValueChange={(v) => setFormData({ ...formData, setor: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {SETORES.map((setor) => (
                    <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Superior</Label>
              <Select 
                value={formData.subordinado_a || "none"} 
                onValueChange={(v) => setFormData({ ...formData, subordinado_a: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (topo)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (topo da hierarquia)</SelectItem>
                  {availableSuperiors.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} - {m.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Função e Responsabilidades</Label>
            <Textarea
              value={formData.funcao}
              onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
              placeholder="Descreva as principais responsabilidades e funções deste membro..."
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Ordem de Exibição</Label>
            <Input
              type="number"
              value={formData.ordem}
              onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="w-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !formData.nome.trim() || !formData.cargo.trim()}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OrgTreeNodeProps {
  member: IaOrganograma;
  subordinates: IaOrganograma[];
  allMembers: IaOrganograma[];
  level: number;
  onEdit: (member: IaOrganograma) => void;
  onDelete: (member: IaOrganograma) => void;
}

function OrgTreeNode({ member, subordinates, allMembers, level, onEdit, onDelete }: OrgTreeNodeProps) {
  return (
    <div className={cn("relative", level > 0 && "ml-6")}>
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border -ml-3" />
      )}
      <div className={cn(
        "flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group",
        level > 0 && "relative before:absolute before:left-0 before:top-5 before:w-3 before:h-px before:bg-border before:-ml-3"
      )}>
        <div className="p-2 rounded-lg bg-primary/10">
          <UserCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{member.nome}</span>
            {member.setor && (
              <Badge variant="outline" className="text-xs">{member.setor}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{member.cargo}</p>
          {member.funcao && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{member.funcao}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(member)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive" 
            onClick={() => onDelete(member)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {subordinates.length > 0 && (
        <div className="space-y-2 mt-2">
          {subordinates.map((sub) => {
            const subSubordinates = allMembers.filter(m => m.subordinado_a === sub.id);
            return (
              <OrgTreeNode
                key={sub.id}
                member={sub}
                subordinates={subSubordinates}
                allMembers={allMembers}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrganogramaSection() {
  const { membros, isLoading, createMembro, updateMembro, deleteMembro } = useIaOrganograma();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<IaOrganograma | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<IaOrganograma | null>(null);

  const topLevelMembers = useMemo(() => {
    return (membros || []).filter(m => !m.subordinado_a);
  }, [membros]);

  const handleOpenDialog = (member?: IaOrganograma) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(undefined);
  };

  const handleSave = async (data: MemberFormData) => {
    if (editingMember) {
      await updateMembro.mutateAsync({ id: editingMember.id, ...data });
    } else {
      await createMembro.mutateAsync(data);
    }
    handleCloseDialog();
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMembro.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Organograma do Escritório</CardTitle>
                <CardDescription>
                  Defina a estrutura organizacional para que a IA entenda funções e responsabilidades
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!membros || membros.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum membro cadastrado no organograma
              </p>
              <Button variant="outline" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {topLevelMembers.map((member) => {
                const subordinates = (membros || []).filter(m => m.subordinado_a === member.id);
                return (
                  <OrgTreeNode
                    key={member.id}
                    member={member}
                    subordinates={subordinates}
                    allMembers={membros || []}
                    level={0}
                    onEdit={handleOpenDialog}
                    onDelete={setDeleteConfirm}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MemberDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        member={editingMember}
        allMembers={membros || []}
        onSave={handleSave}
        isPending={createMembro.isPending || updateMembro.isPending}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteConfirm?.nome}</strong> do organograma?
              {deleteConfirm && (membros || []).some(m => m.subordinado_a === deleteConfirm.id) && (
                <span className="block mt-2 text-destructive">
                  Atenção: Este membro possui subordinados que ficarão sem superior.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
