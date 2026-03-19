import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const FUNIS: Record<string, string[]> = {
  previdenciario: ['Inbound', 'Auxílio Acidente', 'Aposentadoria PCD', 'Aposentadoria Autônomos'],
  trabalhista: ['Inbound', 'Caminhoneiros', 'Drogarias', 'Bancários', 'Acidente de Trabalho'],
};

export interface NodeFormData {
  node_type: string;
  label: string;
  setor: string | null;
  funil: string | null;
  pessoa_nome: string | null;
  precisa_contratar: boolean;
  observacoes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: NodeFormData) => void;
  defaultValues?: Partial<NodeFormData>;
  title?: string;
}

export default function NodeFormDialog({ open, onOpenChange, onSubmit, defaultValues, title }: Props) {
  const { register, handleSubmit, watch, setValue, reset } = useForm<NodeFormData>({
    defaultValues: {
      node_type: 'posicao',
      label: '',
      setor: null,
      funil: null,
      pessoa_nome: null,
      precisa_contratar: true,
      observacoes: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) reset({ node_type: 'posicao', label: '', setor: null, funil: null, pessoa_nome: null, precisa_contratar: true, observacoes: '', ...defaultValues });
  }, [open, defaultValues, reset]);

  const setor = watch('setor');
  const precisa = watch('precisa_contratar');
  const nodeType = watch('node_type');
  const funisOptions = setor ? FUNIS[setor] || [] : [];

  const doSubmit = (data: NodeFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || 'Novo Card'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(doSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={nodeType} onValueChange={v => setValue('node_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="setor">Setor</SelectItem>
                <SelectItem value="funil">Funil</SelectItem>
                <SelectItem value="posicao">Posição / Cargo</SelectItem>
                <SelectItem value="grupo">Grupo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Nome / Cargo</Label>
            <Input {...register('label', { required: true })} placeholder="Ex: SDR Inbound" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Setor</Label>
              <Select value={setor || '__none__'} onValueChange={v => { setValue('setor', v === '__none__' ? null : v); setValue('funil', null); }}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  <SelectItem value="previdenciario">Previdenciário</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Funil</Label>
              <Select value={watch('funil') || '__none__'} onValueChange={v => setValue('funil', v === '__none__' ? null : v)} disabled={!setor}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {funisOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Pessoa contratada</Label>
            <Input {...register('pessoa_nome')} placeholder="Nome da pessoa (vazio se não contratado)" />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={precisa} onCheckedChange={v => setValue('precisa_contratar', v)} />
            <Label>Precisa contratar</Label>
          </div>

          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea {...register('observacoes')} rows={2} placeholder="Notas sobre esta posição..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
