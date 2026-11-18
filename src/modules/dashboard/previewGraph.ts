import type { Graph } from '@/types/graph';

/** Grafo de ejemplo de la portada. Sus grados se calculan con el módulo de algoritmos, no se escriben a mano. */
export const PREVIEW_GRAPH: Graph = {
  directed: false,
  weighted: false,
  vertices: [
    { id: 'A', label: 'A', position: { x: 60, y: 48 } },
    { id: 'B', label: 'B', position: { x: 170, y: 30 } },
    { id: 'C', label: 'C', position: { x: 130, y: 128 } },
    { id: 'D', label: 'D', position: { x: 262, y: 100 } },
    { id: 'E', label: 'E', position: { x: 240, y: 186 } },
  ],
  edges: [
    { id: 'e1', source: 'A', target: 'B', weight: 1 },
    { id: 'e2', source: 'A', target: 'C', weight: 1 },
    { id: 'e3', source: 'B', target: 'C', weight: 1 },
    { id: 'e4', source: 'B', target: 'D', weight: 1 },
    { id: 'e5', source: 'C', target: 'D', weight: 1 },
    { id: 'e6', source: 'C', target: 'E', weight: 1 },
    { id: 'e7', source: 'D', target: 'E', weight: 1 },
  ],
};
