import type { Edge as FlowEdge, Node as FlowNode } from '@xyflow/react';
import type { EdgeId, VertexId } from '@/types/graph';

export type CanvasMode = 'select' | 'add-vertex' | 'add-edge';

/** Estados visuales que los simuladores asignan a vértices y aristas. */
export type VertexTone = 'current' | 'visited' | 'path' | 'start' | 'target' | 'frontier' | 'muted' | 'error';
export type EdgeTone = 'active' | 'used' | 'path' | 'candidate' | 'warning' | 'tree' | 'explored' | 'muted' | 'error';

export interface VertexMark {
  tone?: VertexTone;
  /** Texto breve bajo el vértice (por ejemplo, una distancia o un número de orden). */
  badge?: string;
}

export interface EdgeMark {
  tone?: EdgeTone;
  /** Texto breve junto a la arista (por ejemplo, su orden de uso). */
  badge?: string;
}

export interface CanvasHighlight {
  vertices?: ReadonlyMap<VertexId, VertexMark>;
  edges?: ReadonlyMap<EdgeId, EdgeMark>;
}

export type VertexNodeData = {
  label: string;
  /** Vértice elegido como origen de la arista que se está creando. */
  pendingSource: boolean;
  /** Modo de creación de aristas: los vértices se muestran como destinos posibles. */
  connectable: boolean;
  tone: VertexTone | null;
  badge: string | null;
};

export type VertexFlowNode = FlowNode<VertexNodeData, 'vertex'>;

export type GraphEdgeData = {
  offset: number;
  directed: boolean;
  /** Texto del peso, o null si el grafo no es ponderado. */
  weightLabel: string | null;
  description: string;
  tone: EdgeTone | null;
  badge: string | null;
  onSelect: (edgeId: string) => void;
};

export type GraphFlowEdge = FlowEdge<GraphEdgeData, 'graph'>;

/** Trazo de cada estado de arista (también se usa para el color de la flecha). */
export const EDGE_STYLES: Record<EdgeTone | 'default' | 'selected', { stroke: string; width: number; dash?: string }> = {
  default: { stroke: '#475569', width: 2 },
  selected: { stroke: '#7C3AED', width: 3.5 },
  active: { stroke: '#00B8D4', width: 4.5 },
  used: { stroke: '#7C3AED', width: 3.5 },
  path: { stroke: '#5B21B6', width: 5 },
  candidate: { stroke: '#00B8D4', width: 3, dash: '7 5' },
  warning: { stroke: '#D97706', width: 3.5, dash: '7 5' },
  tree: { stroke: '#7C3AED', width: 3.5 },
  explored: { stroke: '#94A3B8', width: 2, dash: '3 5' },
  muted: { stroke: '#CBD5E1', width: 1.5 },
  error: { stroke: '#DC2626', width: 3.5 },
};
