import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  MarkerType,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PosicaoNode from './PosicaoNode';
import NodeFormDialog, { type NodeFormData } from './NodeFormDialog';
import FunilChecklistDialog from './FunilChecklistDialog';
import { usePlanoComercial, type PlanoNode } from '@/hooks/usePlanoComercial';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const nodeTypes = { posicao: PosicaoNode };

function getStatusColor(
  node: PlanoNode,
  childNodeIds: string[],
  allNodes: PlanoNode[],
  checklistByNode: Record<string, { total: number; done: number }>
): string | undefined {
  if (node.node_type === 'funil') {
    const children = childNodeIds.map(id => allNodes.find(n => n.id === id)).filter(Boolean) as PlanoNode[];
    const allChildrenOccupied = children.length > 0 && children.every(c => c.pessoa_nome && !c.precisa_contratar);
    const cl = checklistByNode[node.id];
    const allChecklistDone = cl && cl.total > 0 && cl.done === cl.total;
    return (allChildrenOccupied && allChecklistDone) ? 'green' : 'red';
  }
  if (node.precisa_contratar) return 'red';
  if (node.pessoa_nome) return 'yellow';
  return undefined;
}

function FlowCanvasInner() {
  const { fitView } = useReactFlow();

  const {
    nodes: dbNodes, edges: dbEdges, checklist, loading,
    addNode, updateNode, deleteNode, addEdge, deleteEdge, updateNodePosition,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
  } = usePlanoComercial();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const [checklistNodeId, setChecklistNodeId] = useState<string | null>(null);

  const handleEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setDialogOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((nodeId: string) => {
    setDeletingNodeId(nodeId);
  }, []);

  const handleOpenChecklist = useCallback((nodeId: string) => {
    setChecklistNodeId(nodeId);
  }, []);

  // Pre-compute checklist stats per node
  const checklistByNode = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const item of checklist) {
      if (!map[item.node_id]) map[item.node_id] = { total: 0, done: 0 };
      map[item.node_id].total++;
      if (item.concluido) map[item.node_id].done++;
    }
    return map;
  }, [checklist]);

  // Pre-compute children per node (edges where source = node)
  const childrenByNode = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const e of dbEdges) {
      if (!map[e.source_node_id]) map[e.source_node_id] = [];
      map[e.source_node_id].push(e.target_node_id);
    }
    return map;
  }, [dbEdges]);

  const flowNodes: Node[] = useMemo(() =>
    dbNodes.map(n => {
      const cl = checklistByNode[n.id];
      return {
        id: n.id,
        type: 'posicao',
        position: { x: n.position_x, y: n.position_y },
        data: {
          ...n,
          nodeId: n.id,
          onEdit: handleEdit,
          onDelete: handleDeleteRequest,
          onOpenChecklist: handleOpenChecklist,
          statusColor: getStatusColor(n, childrenByNode[n.id] || [], dbNodes, checklistByNode),
          checklistTotal: cl?.total ?? null,
          checklistDone: cl?.done ?? 0,
        },
      };
    }),
    [dbNodes, handleEdit, handleDeleteRequest, handleOpenChecklist, checklistByNode, childrenByNode]
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
  const checklistNode = checklistNodeId ? dbNodes.find(n => n.id === checklistNodeId) : null;

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

      {checklistNode && (
        <FunilChecklistDialog
          open={!!checklistNodeId}
          onOpenChange={v => !v && setChecklistNodeId(null)}
          nodeId={checklistNode.id}
          nodeLabel={checklistNode.label}
          items={checklist.filter(c => c.node_id === checklistNode.id)}
          onAdd={addChecklistItem}
          onToggle={toggleChecklistItem}
          onDelete={deleteChecklistItem}
        />
      )}

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
