import React, { useMemo, useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeProps,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Box, Table2, Eye, Columns2, LayoutDashboard, Globe, FileCode, Brain,
  Activity, Server, Shield, BookOpen, Database, Shapes, Package, Tag, Send,
} from 'lucide-react';
import * as dagre from 'dagre';
import type { LineageGraph, LineageGraphNode, LineageGraphEdge } from '@/types/ontology-schema';

const ICON_MAP: Record<string, React.ElementType> = {
  Table2, Eye, Columns2, LayoutDashboard, Globe, FileCode, Brain, Activity,
  Server, Shield, BookOpen, Database, Shapes, Box, Package, Tag, Send,
};

const TYPE_ROUTE_MAP: Record<string, string> = {
  DataProduct: '/governance/data-products',
  DataContract: '/governance/data-contracts',
  DataDomain: '/governance/domains',
};

const TYPE_COLOR: Record<string, { bg: string; border: string; text: string; minimap: string }> = {
  BusinessTerm:     { bg: 'bg-indigo-500/10',   border: 'border-indigo-500/50',  text: 'text-indigo-600 dark:text-indigo-400',  minimap: '#6366f1' },
  LogicalEntity:    { bg: 'bg-violet-500/10',   border: 'border-violet-500/40',  text: 'text-violet-600 dark:text-violet-400',  minimap: '#8b5cf6' },
  LogicalAttribute: { bg: 'bg-fuchsia-500/10',  border: 'border-fuchsia-500/40', text: 'text-fuchsia-600 dark:text-fuchsia-400', minimap: '#d946ef' },
  System:           { bg: 'bg-blue-500/10',     border: 'border-blue-500/40',    text: 'text-blue-600 dark:text-blue-400',      minimap: '#3b82f6' },
  DataDomain:       { bg: 'bg-purple-500/10',   border: 'border-purple-500/40',  text: 'text-purple-600 dark:text-purple-400',  minimap: '#a855f7' },
  DataProduct:      { bg: 'bg-emerald-500/10',  border: 'border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400', minimap: '#10b981' },
  Dataset:          { bg: 'bg-amber-500/10',    border: 'border-amber-500/40',   text: 'text-amber-600 dark:text-amber-400',    minimap: '#f59e0b' },
  DeliveryChannel:  { bg: 'bg-cyan-500/10',     border: 'border-cyan-500/40',    text: 'text-cyan-600 dark:text-cyan-400',      minimap: '#06b6d4' },
  Policy:           { bg: 'bg-red-500/10',      border: 'border-red-500/40',     text: 'text-red-600 dark:text-red-400',        minimap: '#ef4444' },
  PhysicalTable:    { bg: 'bg-orange-500/10',   border: 'border-orange-500/40',  text: 'text-orange-600 dark:text-orange-400',  minimap: '#f97316' },
  PhysicalView:     { bg: 'bg-teal-500/10',     border: 'border-teal-500/40',    text: 'text-teal-600 dark:text-teal-400',      minimap: '#14b8a6' },
  PhysicalColumn:   { bg: 'bg-slate-500/10',    border: 'border-slate-500/40',   text: 'text-slate-600 dark:text-slate-400',    minimap: '#64748b' },
  DataContract:     { bg: 'bg-pink-500/10',     border: 'border-pink-500/40',    text: 'text-pink-600 dark:text-pink-400',      minimap: '#ec4899' },
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  active: 'default',
  deprecated: 'secondary',
  archived: 'destructive',
};

function getEntityRoute(entityType: string, entityId: string): string {
  const base = TYPE_ROUTE_MAP[entityType];
  if (base) return `${base}/${entityId}`;
  return `/governance/assets/${entityId}`;
}

interface LineageNodeData {
  label: string;
  entityType: string;
  entityId: string;
  icon?: string | null;
  status?: string | null;
  description?: string | null;
  isCenter: boolean;
  navigate: (path: string) => void;
}

const LineageNode: React.FC<NodeProps<LineageNodeData>> = ({ data }) => {
  const Icon = (data.icon && ICON_MAP[data.icon]) || Box;
  const colors = TYPE_COLOR[data.entityType] || TYPE_COLOR.System;

  const handleClick = () => {
    data.navigate(getEntityRoute(data.entityType, data.entityId));
  };

  return (
    <>
      <Handle type="target" position={Position.Top} id="target" style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} id="target-left" style={{ visibility: 'hidden' }} />
      <Card
        onClick={handleClick}
        className={`w-56 shadow-md hover:shadow-lg transition-shadow rounded-lg cursor-pointer ${colors.bg} ${colors.border} border react-flow__node-default ${
          data.isCenter ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      >
        <CardHeader className="p-2.5 space-y-0">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${colors.text}`} />
            <span className="truncate">{data.label}</span>
          </CardTitle>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal">
              {data.entityType}
            </Badge>
            {data.status && (
              <Badge
                variant={STATUS_VARIANT[data.status] ?? 'outline'}
                className="text-[9px] h-3.5 px-1"
              >
                {data.status}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>
      <Handle type="source" position={Position.Bottom} id="source" style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ visibility: 'hidden' }} />
    </>
  );
};

const nodeTypes = { lineageNode: LineageNode };

const NODE_WIDTH = 224;
const NODE_HEIGHT = 64;

function buildReactFlowGraph(
  data: LineageGraph,
  navigate: (path: string) => void,
  isDark: boolean,
): { nodes: Node<LineageNodeData>[]; edges: Edge[] } {
  const nodes: Node<LineageNodeData>[] = data.nodes.map((n) => ({
    id: n.id,
    type: 'lineageNode',
    position: { x: 0, y: 0 },
    data: {
      label: n.name,
      entityType: n.entity_type,
      entityId: n.entity_id,
      icon: n.icon,
      status: n.status,
      description: n.description,
      isCenter: n.is_center,
      navigate,
    },
  }));

  const edges: Edge[] = data.edges.map((e, i) => ({
    id: `e-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    label: e.label || undefined,
    labelStyle: { fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' },
    labelBgStyle: { fill: isDark ? '#1e293b' : '#f8fafc', fillOpacity: 0.9 },
    labelBgPadding: [4, 2] as [number, number],
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: isDark ? '#94a3b8' : '#333',
    },
    style: {
      stroke: isDark ? '#475569' : '#94a3b8',
      strokeWidth: 1.5,
    },
  }));

  return { nodes, edges };
}

function applyDagreLayout(
  nodes: Node<LineageNodeData>[],
  edges: Edge[],
): Node<LineageNodeData>[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 80 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

interface BusinessLineageGraphProps {
  entityType: string;
  entityId: string;
  className?: string;
  defaultIncludeTechnical?: boolean;
  mode?: 'lineage' | 'impact';
  maxDepth?: number;
}

export function BusinessLineageGraph({
  entityType,
  entityId,
  className,
  defaultIncludeTechnical = false,
  mode = 'lineage',
  maxDepth = 3,
}: BusinessLineageGraphProps) {
  const navigate = useNavigate();
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const [includeTechnical, setIncludeTechnical] = useState(defaultIncludeTechnical);
  const [graphData, setGraphData] = useState<LineageGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const suffix = mode === 'impact' ? '/impact' : '';
      const params = new URLSearchParams({
        max_depth: String(maxDepth),
        include_technical: String(includeTechnical),
      });
      const res = await fetch(
        `/api/business-lineage/${entityType}/${entityId}${suffix}?${params}`
      );
      if (!res.ok) throw new Error(`Failed to load lineage: ${res.status}`);
      const data: LineageGraph = await res.json();
      setGraphData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load lineage graph');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, includeTechnical, mode, maxDepth]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) {
      return { layoutedNodes: [], layoutedEdges: [] };
    }
    const { nodes, edges } = buildReactFlowGraph(graphData, navigate, isDark);
    const laid = applyDagreLayout(nodes, edges);
    return { layoutedNodes: laid, layoutedEdges: edges };
  }, [graphData, navigate, isDark]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className || 'h-64'}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading lineage...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${className || 'h-64'}`}>
        <AlertCircle className="w-6 h-6 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchGraph}>Retry</Button>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className || 'h-64'}`}>
        <p className="text-sm text-muted-foreground">No lineage data found for this entity.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className || 'h-[500px]'}`}>
      <div className="flex items-center gap-4 px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Switch
            id="include-technical"
            checked={includeTechnical}
            onCheckedChange={setIncludeTechnical}
          />
          <Label htmlFor="include-technical" className="text-xs">
            Show Technical Detail
          </Label>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {graphData.nodes.length} nodes, {graphData.edges.length} edges
        </span>
      </div>

      <div className="flex-1 border rounded-b-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          className="bg-background"
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable
          nodesConnectable={false}
        >
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            nodeColor={(n: Node) => {
              const type = (n.data as LineageNodeData)?.entityType;
              return TYPE_COLOR[type]?.minimap || '#6b7280';
            }}
          />
          <Background color={isDark ? '#334155' : '#e2e8f0'} gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
