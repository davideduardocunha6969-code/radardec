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

export function usePlanoComercial() {
  const { user } = useAuthContext();
  const [nodes, setNodes] = useState<PlanoNode[]>([]);
  const [edges, setEdges] = useState<PlanoEdge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [nodesRes, edgesRes] = await Promise.all([
      supabase.from('plano_comercial_nodes').select('*').eq('user_id', user.id),
      supabase.from('plano_comercial_edges').select('*').eq('user_id', user.id),
    ]);
    if (nodesRes.data) setNodes(nodesRes.data as unknown as PlanoNode[]);
    if (edgesRes.data) setEdges(edgesRes.data as unknown as PlanoEdge[]);
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

  return { nodes, edges, loading, addNode, updateNode, deleteNode, addEdge, deleteEdge, updateNodePosition, refetch: fetchData };
}
