import { useState } from 'react';
import type { Figure } from '@/algorithms/practice/types';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import type { Graph, Point, VertexId } from '@/types/graph';

const noop = () => undefined;

/** Grafo del ejercicio: se puede reacomodar arrastrando y un clic en un vértice lo agrega a la respuesta. */
function PracticeGraph({ graph, label, onVertex }: { graph: Graph; label: string; onVertex?: ((label: string) => void) | undefined }) {
  const [local, setLocal] = useState(graph);
  const move = (id: VertexId, position: Point) => setLocal((g) => ({ ...g, vertices: g.vertices.map((v) => (v.id === id ? { ...v, position } : v)) }));
  return (
    <div className="relative h-[320px] rounded-lg border border-card-border bg-page sm:h-[360px]" role="region" aria-label={label}>
      <GraphCanvas
        graph={local}
        selection={null}
        mode="select"
        pendingSourceId={null}
        onPaneClick={noop}
        onVertexClick={(id) => onVertex?.(local.vertices.find((v) => v.id === id)?.label ?? '')}
        onEdgeSelect={noop}
        onVertexMoved={move}
        onDeleteSelection={noop}
        onCancel={noop}
        locked
      />
    </div>
  );
}

interface ExerciseFigureProps {
  figure: Figure;
  /** Si el ejercicio pide una secuencia, cada clic en un vértice o nodo agrega su nombre. */
  onPick?: ((label: string) => void) | undefined;
}

export function ExerciseFigure({ figure, onPick }: ExerciseFigureProps) {
  if (figure.kind === 'tree') {
    const tree = figure.tree;
    return (
      <div className="rounded-lg border border-card-border bg-page px-2 py-4" role="region" aria-label="Árbol del ejercicio">
        <TreeCanvas tree={tree} selectedId={null} onSelect={(id) => onPick?.(tree.nodes[id]?.label ?? '')} />
      </div>
    );
  }
  if (figure.kind === 'pair') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-bold text-navy-panel">G1</p>
          <PracticeGraph graph={figure.g1} label="Grafo G1 del ejercicio" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-navy-panel">G2</p>
          <PracticeGraph graph={figure.g2} label="Grafo G2 del ejercicio" />
        </div>
      </div>
    );
  }
  return <PracticeGraph graph={figure.graph} label="Grafo del ejercicio" onVertex={onPick} />;
}
