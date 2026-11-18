import { useMemo } from 'react';
import { computeDegrees, degreeSum } from '@/algorithms/graph/degrees';
import type { Graph } from '@/types/graph';
import { PREVIEW_GRAPH } from './previewGraph';

export function GraphPreview({ graph = PREVIEW_GRAPH }: { graph?: Graph }) {
  const degrees = useMemo(() => computeDegrees(graph), [graph]);
  const total = degreeSum(degrees);
  const byId = new Map(graph.vertices.map((v) => [v.id, v]));
  const sequence = graph.vertices.map((v) => `${v.label}(${degrees.get(v.id)?.degree ?? 0})`).join(', ');

  return (
    <figure className="rounded-xl border border-cyan-soft/20 bg-navy-panel/80 p-4">
      <svg
        viewBox="0 0 320 220"
        className="h-auto w-full"
        role="img"
        aria-label={`Grafo no dirigido con ${graph.vertices.length} vértices y ${graph.edges.length} aristas. Grados: ${sequence}.`}
      >
        {graph.edges.map((edge) => {
          const a = byId.get(edge.source);
          const b = byId.get(edge.target);
          if (!a || !b) return null;
          return <line key={edge.id} x1={a.position.x} y1={a.position.y} x2={b.position.x} y2={b.position.y} stroke="#22D3EE" strokeOpacity={0.75} strokeWidth={2} />;
        })}
        {graph.vertices.map((v) => {
          const degree = degrees.get(v.id)?.degree ?? 0;
          return (
            <g key={v.id}>
              <circle cx={v.position.x} cy={v.position.y} r={17} fill="#6D28D9" stroke="#00E5FF" strokeWidth={2} />
              <text x={v.position.x} y={v.position.y + 5} textAnchor="middle" fontSize="14" fontWeight={700} fill="#FFFFFF">
                {v.label}
              </text>
              <g>
                <circle cx={v.position.x + 17} cy={v.position.y - 15} r={9} fill="#EDF4FC" />
                <text x={v.position.x + 17} y={v.position.y - 11} textAnchor="middle" fontSize="11" fontWeight={700} fill="#061438">
                  {degree}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-white/75">
        <p>
          <span className="font-semibold text-white">Grados:</span> {sequence}
        </p>
        <p>
          <span className="font-semibold text-white">Lema del apretón de manos:</span> Σ grados = {total} = 2 · {graph.edges.length} aristas
        </p>
      </figcaption>
    </figure>
  );
}
