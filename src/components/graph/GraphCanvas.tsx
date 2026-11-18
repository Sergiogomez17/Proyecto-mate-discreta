import '@xyflow/react/dist/style.css';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Background, Controls, MarkerType, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import type { AriaLabelConfig, Dimensions, EdgeChange, NodeChange, XYPosition } from '@xyflow/react';
import { describeEdge } from '@/algorithms/graph/editing';
import type { GraphSelection } from '@/stores/graphStore';
import type { EdgeId, Graph, Point, VertexId } from '@/types/graph';
import { cn } from '@/utils/cn';
import type { CanvasHighlight, CanvasMode, GraphFlowEdge, VertexFlowNode } from './flowTypes';
import { EDGE_STYLES } from './flowTypes';
import { GraphEdge } from './GraphEdge';
import { edgeOffsets, formatWeight, VERTEX_RADIUS } from './geometry';
import { VertexNode } from './VertexNode';

const NODE_TYPES = { vertex: VertexNode };
const EDGE_TYPES = { graph: GraphEdge };

const ARIA_LABELS: Partial<AriaLabelConfig> = {
  'node.a11yDescription.default': 'Pulse Enter o Espacio para seleccionar el vértice. Si está seleccionado, las flechas lo mueven.',
  'node.a11yDescription.keyboardDisabled': 'Pulse Enter o Espacio para seleccionar el vértice.',
  'node.a11yDescription.ariaLiveMessage': ({ direction, x, y }) => `Vértice movido hacia ${direction}. Nueva posición: x ${x}, y ${y}.`,
  'edge.a11yDescription.default': 'Pulse Enter o Espacio para seleccionar la arista.',
  'controls.ariaLabel': 'Controles del lienzo',
  'controls.zoomIn.ariaLabel': 'Acercar',
  'controls.zoomOut.ariaLabel': 'Alejar',
  'controls.fitView.ariaLabel': 'Ajustar la vista al grafo',
  'controls.interactive.ariaLabel': 'Bloquear o desbloquear el lienzo',
  'minimap.ariaLabel': 'Minimapa',
  'handle.ariaLabel': 'Punto de conexión',
};

export interface GraphCanvasProps {
  graph: Graph;
  selection: GraphSelection;
  mode: CanvasMode;
  pendingSourceId: VertexId | null;
  /** Clic en una zona vacía, con la posición en coordenadas del grafo. */
  onPaneClick: (position: Point) => void;
  onVertexClick: (id: VertexId) => void;
  onEdgeSelect: (id: EdgeId) => void;
  /** Fin de un arrastre (o de un movimiento con teclado): nueva posición del centro. */
  onVertexMoved: (id: VertexId, position: Point) => void;
  onDeleteSelection: () => void;
  onCancel: () => void;
  /** Estados visuales asignados por un simulador (vértice actual, camino, puentes…). */
  highlight?: CanvasHighlight | undefined;
  /** Durante una simulación los clics no seleccionan elementos para editarlos. */
  locked?: boolean;
}

/** Lienzo interactivo del editor de grafos (React Flow). El grafo del modelo es la única fuente de verdad. */
export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

const R = VERTEX_RADIUS;

function CanvasInner({ graph, selection, mode, pendingSourceId, onPaneClick, onVertexClick, onEdgeSelect, onVertexMoved, onDeleteSelection, onCancel, highlight, locked = false }: GraphCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  // React Flow mide cada nodo; esas medidas y las posiciones durante un arrastre son estado
  // visual local. La posición definitiva se guarda en el modelo al soltar el vértice.
  const [dimensions, setDimensions] = useState<Record<string, Dimensions>>({});
  const [dragPositions, setDragPositions] = useState<Record<string, XYPosition>>({});
  const dragRef = useRef<Record<string, XYPosition>>({});

  const nodes = useMemo<VertexFlowNode[]>(
    () =>
      graph.vertices.map((v) => {
        const measured = dimensions[v.id];
        const drag = dragPositions[v.id];
        return {
          id: v.id,
          type: 'vertex',
          // El modelo guarda el centro del vértice; React Flow usa la esquina superior izquierda.
          position: drag ?? { x: v.position.x - R, y: v.position.y - R },
          data: {
            label: v.label,
            pendingSource: v.id === pendingSourceId,
            connectable: mode === 'add-edge' && !locked,
            tone: highlight?.vertices?.get(v.id)?.tone ?? null,
            badge: highlight?.vertices?.get(v.id)?.badge ?? null,
          },
          selected: !locked && selection?.kind === 'vertex' && selection.id === v.id,
          ariaLabel: `Vértice ${v.label}${highlight?.vertices?.get(v.id)?.badge ? ` (${highlight.vertices.get(v.id)?.badge ?? ''})` : ''}`,
          ...(measured ? { measured } : {}),
          ...(drag ? { dragging: true } : {}),
        };
      }),
    [graph.vertices, dimensions, dragPositions, pendingSourceId, mode, selection, highlight, locked],
  );

  const edges = useMemo<GraphFlowEdge[]>(() => {
    const offsets = edgeOffsets(graph);
    return graph.edges.map((e) => {
      const selected = !locked && selection?.kind === 'edge' && selection.id === e.id;
      const description = describeEdge(graph, e);
      const weightLabel = graph.weighted ? formatWeight(e.weight) : null;
      const mark = highlight?.edges?.get(e.id);
      const arrowColor = EDGE_STYLES[mark?.tone ?? (selected ? 'selected' : 'default')].stroke;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'graph',
        selected,
        ariaLabel: `Arista ${description}${weightLabel !== null ? `, peso ${weightLabel}` : ''}`,
        data: {
          offset: offsets.get(e.id) ?? 0,
          directed: graph.directed,
          weightLabel,
          description,
          tone: mark?.tone ?? null,
          badge: mark?.badge ?? null,
          onSelect: onEdgeSelect,
        },
        ...(graph.directed ? { markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: arrowColor } } : {}),
      };
    });
  }, [graph, selection, onEdgeSelect, highlight, locked]);

  const onNodesChange = useCallback(
    (changes: NodeChange<VertexFlowNode>[]) => {
      const measured: Record<string, Dimensions> = {};
      const drag = new Map(Object.entries(dragRef.current));
      let dragChanged = false;
      for (const change of changes) {
        if (change.type === 'dimensions' && change.dimensions) {
          measured[change.id] = change.dimensions;
        } else if (change.type === 'position') {
          if (change.dragging && change.position) {
            drag.set(change.id, change.position);
            dragChanged = true;
          } else {
            const final = change.position ?? drag.get(change.id);
            if (final) onVertexMoved(change.id, { x: final.x + R, y: final.y + R });
            if (drag.delete(change.id)) dragChanged = true;
          }
        } else if (change.type === 'select' && change.selected) {
          onVertexClick(change.id);
        }
      }
      if (Object.keys(measured).length > 0) setDimensions((prev) => ({ ...prev, ...measured }));
      if (dragChanged) {
        dragRef.current = Object.fromEntries(drag);
        setDragPositions(dragRef.current);
      }
    },
    [onVertexMoved, onVertexClick],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<GraphFlowEdge>[]) => {
      for (const change of changes) if (change.type === 'select' && change.selected) onEdgeSelect(change.id);
    },
    [onEdgeSelect],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select')) return;
    if (event.key === 'Escape') onCancel();
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onDeleteSelection();
    }
  };

  return (
    <div className={cn('graph-canvas h-full w-full', `graph-mode-${mode}`)} onKeyDown={onKeyDown}>
      <ReactFlow<VertexFlowNode, GraphFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onVertexClick(node.id)}
        onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
        onPaneClick={(event) => onPaneClick(screenToFlowPosition({ x: event.clientX, y: event.clientY }))}
        nodesConnectable={false}
        elementsSelectable={mode === 'select' && !locked}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        // La rueda del ratón desplaza la página; el zoom se controla con los botones o el gesto de pellizco.
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={false}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
        minZoom={0.3}
        maxZoom={2.5}
        ariaLabelConfig={ARIA_LABELS}
      >
        <Background gap={24} size={1.4} color="#A9B9D6" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}
