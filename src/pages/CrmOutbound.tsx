import { useState } from "react";
import { useCrmFunis, useCreateFunil, useDeleteFunil } from "@/hooks/useCrmOutbound";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AREAS = [
  { value: "previdenciario", label: "Previdenciário" },
  { value: "civel", label: "Cível" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "bancario", label: "Bancário" },
  { value: "outro", label: "Outro" },
];

const areaBadgeColor: Record<string, string> = {
  previdenciario: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  civel: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  trabalhista: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  bancario: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  outro: "bg-muted text-muted-foreground",
};

export default function CrmOutbound() {
  const { data: funis, isLoading } = useCrmFunis();
  const createFunil = useCreateFunil();
  const deleteFunil = useDeleteFunil();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", area_atuacao: "", tipo_acao: "", descricao: "" });

  const handleCreate = () => {
    if (!form.nome || !form.area_atuacao) return;
    createFunil.mutate(form, { onSuccess: () => { setDialogOpen(false); setForm({ nome: "", area_atuacao: "", tipo_acao: "", descricao: "" }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM Outbound</h1>
          <p className="text-muted-foreground">Gerencie seus funis de prospecção ativa</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Funil</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !funis?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">Nenhum funil criado</p>
            <p className="text-sm">Crie seu primeiro funil para começar a prospectar</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar Funil</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {funis.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/crm-outbound/${f.id}`)}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{f.nome}</CardTitle>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${areaBadgeColor[f.area_atuacao] || areaBadgeColor.outro}`}>
                    {AREAS.find((a) => a.value === f.area_atuacao)?.label || f.area_atuacao}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteFunil.mutate(f.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {f.tipo_acao && <p className="text-sm text-muted-foreground">Tipo: {f.tipo_acao}</p>}
                {f.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{f.descricao}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Funil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Aposentadorias BPC" />
            </div>
            <div>
              <label className="text-sm font-medium">Área de Atuação *</label>
              <Select value={form.area_atuacao} onValueChange={(v) => setForm({ ...form, area_atuacao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Ação</label>
              <Input value={form.tipo_acao} onChange={(e) => setForm({ ...form, tipo_acao: e.target.value })} placeholder="Ex: Prospecção ativa" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição do funil..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createFunil.isPending || !form.nome || !form.area_atuacao}>
              {createFunil.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
