import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, useInternalNode } from '@xyflow/react';
import type { EdgeProps, InternalNode } from '@xyflow/react';
import { cn } from '@/utils/cn';
import type { GraphFlowEdge } from './flowTypes';
import { EDGE_STYLES } from './flowTypes';
import { ARROW_GAP, edgeGeometry, VERTEX_RADIUS } from './geometry';

function centerOf(node: InternalNode) {
  const { x, y } = node.internals.positionAbsolute;
  return { x: x + (node.measured.width ?? VERTEX_RADIUS * 2) / 2, y: y + (node.measured.height ?? VERTEX_RADIUS * 2) / 2 };
}

/**
 * Arista de centro a centro. Las paralelas se curvan con un desplazamiento propio y el peso
 * se muestra como un botón que selecciona la arista. Dos aristas que se cruzan no comparten
 * ningún punto en el modelo: el cruce es solo visual y no crea un vértice.
 */
function GraphEdgeView({ id, source, target, data, selected, markerEnd }: EdgeProps<GraphFlowEdge>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode || !data) return null;

  const geo = edgeGeometry(centerOf(sourceNode), centerOf(targetNode), data.offset, VERTEX_RADIUS, data.directed ? ARROW_GAP : 0);
  const look = EDGE_STYLES[data.tone ?? (selected ? 'selected' : 'default')];
  const badgeY = data.weightLabel !== null ? geo.labelY - 20 : geo.labelY;
  return (
    <>
      <BaseEdge
        id={id}
        path={geo.path}
        interactionWidth={20}
        style={{ stroke: look.stroke, strokeWidth: look.width, ...(look.dash ? { strokeDasharray: look.dash } : {}) }}
        {...(markerEnd ? { markerEnd } : {})}
      />
      {(data.weightLabel !== null || data.badge !== null) && (
        <EdgeLabelRenderer>
          {data.weightLabel !== null && (
            <button
              type="button"
              className={cn(
                'nodrag nopan absolute min-w-6 rounded-md border bg-white px-1.5 text-xs leading-5 font-bold text-ink shadow-sm',
                selected ? 'border-purple-strong ring-2 ring-purple-strong/40' : 'border-purple/60 hover:border-purple',
              )}
              style={{ transform: `translate(-50%, -50%) translate(${geo.labelX}px, ${geo.labelY}px)`, pointerEvents: 'all' }}
              aria-label={`Peso ${data.weightLabel} de la arista ${data.description}`}
              onClick={() => data.onSelect(id)}
            >
              {data.weightLabel}
            </button>
          )}
          {data.badge !== null && (
            <span
              aria-hidden
              className="absolute rounded-full bg-cyan px-1.5 text-[11px] leading-4 font-bold text-navy shadow"
              style={{ transform: `translate(-50%, -50%) translate(${geo.labelX}px, ${badgeY}px)`, pointerEvents: 'none' }}
            >
              {data.badge}
            </span>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const GraphEdge = memo(GraphEdgeView);
