import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge as rfAddEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PosicaoNode from './PosicaoNode';
import NodeFormDialog, { type NodeFormData } from './NodeFormDialog';
import { usePlanoComercial, type PlanoNode } from '@/hooks/usePlanoComercial';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const nodeTypes = { posicao: PosicaoNode };

export default function FlowCanvas() {
  const { nodes: dbNodes, edges: dbEdges, loading, addNode, updateNode, deleteNode, addEdge, deleteEdge, updateNodePosition } = usePlanoComercial();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);

  const handleEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setDialogOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((nodeId: string) => {
    setDeletingNodeId(nodeId);
  }, []);

  const flowNodes: Node[] = useMemo(() =>
    dbNodes.map(n => ({
      id: n.id,
      type: 'posicao',
      position: { x: n.position_x, y: n.position_y },
      data: {
        ...n,
        nodeId: n.id,
        onEdit: handleEdit,
        onDelete: handleDeleteRequest,
      },
    })),
    [dbNodes, handleEdit, handleDeleteRequest]
  );

  const flowEdges: Edge[] = useMemo(() =>
    dbEdges.map(e => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      label: e.label || undefined,
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
    })),
    [dbEdges]
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync DB data → RF state
  useMemo(() => { setRfNodes(flowNodes); }, [flowNodes]);
  useMemo(() => { setRfEdges(flowEdges); }, [flowEdges]);

  const onConnect = useCallback(async (params: Connection) => {
    if (params.source && params.target) {
      await addEdge(params.source, params.target);
    }
  }, [addEdge]);

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    updateNodePosition(node.id, node.position.x, node.position.y);
  }, [updateNodePosition]);

  const onEdgeDelete = useCallback(async (edges: Edge[]) => {
    for (const e of edges) await deleteEdge(e.id);
  }, [deleteEdge]);

  const handleCreate = () => {
    setEditingNodeId(null);
    setDialogOpen(true);
  };

  const editingNode = editingNodeId ? dbNodes.find(n => n.id === editingNodeId) : null;

  const handleFormSubmit = async (data: NodeFormData) => {
    if (editingNodeId) {
      await updateNode(editingNodeId, {
        node_type: data.node_type,
        label: data.label,
        setor: data.setor,
        funil: data.funil,
        pessoa_nome: data.pessoa_nome || null,
        precisa_contratar: data.precisa_contratar,
        dados_extras: data.observacoes ? { observacoes: data.observacoes } : {},
      });
    } else {
      await addNode({
        node_type: data.node_type,
        label: data.label,
        setor: data.setor,
        funil: data.funil,
        pessoa_nome: data.pessoa_nome || null,
        precisa_contratar: data.precisa_contratar,
        position_x: 250 + Math.random() * 200,
        position_y: 100 + Math.random() * 200,
        dados_extras: data.observacoes ? { observacoes: data.observacoes } : {},
      });
    }
  };

  const confirmDelete = async () => {
    if (deletingNodeId) {
      await deleteNode(deletingNodeId);
      setDeletingNodeId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[70vh] text-muted-foreground">Carregando fluxograma...</div>;
  }

  return (
    <div className="relative h-[calc(100vh-120px)] w-full border border-border rounded-lg overflow-hidden bg-background">
      <div className="absolute top-3 left-3 z-10">
        <Button onClick={handleCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Novo Card
        </Button>
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgeDelete}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
        <MiniMap className="!bg-card !border-border" nodeColor="hsl(var(--primary))" />
      </ReactFlow>

      <NodeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleFormSubmit}
        title={editingNodeId ? 'Editar Card' : 'Novo Card'}
        defaultValues={editingNode ? {
          node_type: editingNode.node_type,
          label: editingNode.label,
          setor: editingNode.setor,
          funil: editingNode.funil,
          pessoa_nome: editingNode.pessoa_nome,
          precisa_contratar: editingNode.precisa_contratar,
          observacoes: (editingNode.dados_extras as any)?.observacoes || '',
        } : undefined}
      />

      <AlertDialog open={!!deletingNodeId} onOpenChange={v => !v && setDeletingNodeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir card?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá o card e todas as conexões associadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
