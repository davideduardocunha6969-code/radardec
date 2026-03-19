import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlanoNode {
  id: string;
  user_id: string;
  node_type: string;
  label: string;
  setor: string | null;
  funil: string | null;
  pessoa_nome: string | null;
  precisa_contratar: boolean;
  position_x: number;
  position_y: number;
  dados_extras: Record<string, unknown>;
}

export interface PlanoEdge {
  id: string;
  user_id: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
}

export interface ChecklistItem {
  id: string;
  node_id: string;
  user_id: string;
  texto: string;
  concluido: boolean;
  ordem: number;
  created_at: string;
}

export function usePlanoComercial() {
  const { user } = useAuthContext();
  const [nodes, setNodes] = useState<PlanoNode[]>([]);
  const [edges, setEdges] = useState<PlanoEdge[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [nodesRes, edgesRes, checklistRes] = await Promise.all([
      supabase.from('plano_comercial_nodes').select('*').eq('user_id', user.id),
      supabase.from('plano_comercial_edges').select('*').eq('user_id', user.id),
      supabase.from('plano_comercial_checklist').select('*').eq('user_id', user.id).order('ordem'),
    ]);
    if (nodesRes.data) setNodes(nodesRes.data as unknown as PlanoNode[]);
    if (edgesRes.data) setEdges(edgesRes.data as unknown as PlanoEdge[]);
    if (checklistRes.data) setChecklist(checklistRes.data as unknown as ChecklistItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addNode = async (data: Omit<PlanoNode, 'id' | 'user_id'>) => {
    if (!user) return null;
    const { data: inserted, error } = await supabase
      .from('plano_comercial_nodes')
      .insert({ ...data, user_id: user.id } as any)
      .select()
      .single();
    if (error) { toast.error('Erro ao criar card'); return null; }
    const node = inserted as unknown as PlanoNode;
    setNodes(prev => [...prev, node]);
    return node;
  };

  const updateNode = async (id: string, data: Partial<PlanoNode>) => {
    const { error } = await supabase
      .from('plano_comercial_nodes')
      .update(data as any)
      .eq('id', id);
    if (error) { toast.error('Erro ao atualizar card'); return; }
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n));
  };

  const deleteNode = async (id: string) => {
    const { error } = await supabase
      .from('plano_comercial_nodes')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Erro ao excluir card'); return; }
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source_node_id !== id && e.target_node_id !== id));
    setChecklist(prev => prev.filter(c => c.node_id !== id));
  };

  const addEdge = async (source: string, target: string) => {
    if (!user) return null;
    const exists = edges.some(e => e.source_node_id === source && e.target_node_id === target);
    if (exists) return null;
    const { data: inserted, error } = await supabase
      .from('plano_comercial_edges')
      .insert({ user_id: user.id, source_node_id: source, target_node_id: target } as any)
      .select()
      .single();
    if (error) { toast.error('Erro ao criar conexão'); return null; }
    const edge = inserted as unknown as PlanoEdge;
    setEdges(prev => [...prev, edge]);
    return edge;
  };

  const deleteEdge = async (id: string) => {
    await supabase.from('plano_comercial_edges').delete().eq('id', id);
    setEdges(prev => prev.filter(e => e.id !== id));
  };

  const updateNodePosition = async (id: string, x: number, y: number) => {
    await supabase
      .from('plano_comercial_nodes')
      .update({ position_x: x, position_y: y } as any)
      .eq('id', id);
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position_x: x, position_y: y } : n));
  };

  // Checklist CRUD
  const addChecklistItem = async (nodeId: string, texto: string) => {
    if (!user) return null;
    const maxOrdem = checklist.filter(c => c.node_id === nodeId).reduce((max, c) => Math.max(max, c.ordem), -1);
    const { data: inserted, error } = await supabase
      .from('plano_comercial_checklist')
      .insert({ node_id: nodeId, user_id: user.id, texto, ordem: maxOrdem + 1 } as any)
      .select()
      .single();
    if (error) { toast.error('Erro ao adicionar requisito'); return null; }
    const item = inserted as unknown as ChecklistItem;
    setChecklist(prev => [...prev, item]);
    return item;
  };

  const toggleChecklistItem = async (id: string, concluido: boolean) => {
    const { error } = await supabase
      .from('plano_comercial_checklist')
      .update({ concluido } as any)
      .eq('id', id);
    if (error) { toast.error('Erro ao atualizar requisito'); return; }
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, concluido } : c));
  };

  const deleteChecklistItem = async (id: string) => {
    const { error } = await supabase
      .from('plano_comercial_checklist')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Erro ao excluir requisito'); return; }
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  return {
    nodes, edges, checklist, loading,
    addNode, updateNode, deleteNode,
    addEdge, deleteEdge, updateNodePosition,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
    refetch: fetchData,
  };
}
