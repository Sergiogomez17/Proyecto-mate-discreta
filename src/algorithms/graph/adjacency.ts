import type { Edge, EdgeId, Graph, Vertex, VertexId } from '@/types/graph';
import { compareLabels, sortVerticesByLabel } from './order';

export interface Neighbor {
  vertex: Vertex;
  /** Aristas que llevan a ese vecino (más de una si son paralelas), ordenadas por identificador. */
  edgeIds: EdgeId[];
}

/**
 * Vecinos de cada vértice sin duplicados, en orden alfabético por nombre (orden determinista que
 * usan BFS, DFS y Hamilton). En un grafo dirigido son los sucesores: se respeta el sentido del arco.
 */
export function neighborLists(graph: Graph): Map<VertexId, Neighbor[]> {
  const byId = new Map(graph.vertices.map((v) => [v.id, v]));
  const raw = new Map<VertexId, Map<VertexId, EdgeId[]>>(graph.vertices.map((v) => [v.id, new Map()]));
  const link = (from: VertexId, to: VertexId, edgeId: EdgeId) => {
    const row = raw.get(from);
    if (!row) return;
    const list = row.get(to) ?? [];
    list.push(edgeId);
    row.set(to, list);
  };
  for (const e of graph.edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    link(e.source, e.target, e.id);
    if (!graph.directed) link(e.target, e.source, e.id);
  }
  const result = new Map<VertexId, Neighbor[]>();
  for (const [id, row] of raw) {
    const neighbors: Neighbor[] = [];
    for (const [to, edgeIds] of row) {
      const vertex = byId.get(to);
      if (vertex) neighbors.push({ vertex, edgeIds: [...edgeIds].sort(compareLabels) });
    }
    neighbors.sort((a, b) => compareLabels(a.vertex.label, b.vertex.label));
    result.set(id, neighbors);
  }
  return result;
}

/** Otro extremo de una arista respecto de `from`. */
export function otherEnd(edge: Edge, from: VertexId): VertexId {
  return edge.source === from ? edge.target : edge.source;
}

/**
 * Componente conexa (ignorando la dirección) de cada vértice, considerando solo las aristas dadas.
 * Devuelve un identificador de componente por vértice.
 */
export function componentIndex(vertices: readonly Vertex[], edges: readonly Edge[]): Map<VertexId, number> {
  const adjacency = new Map<VertexId, VertexId[]>(vertices.map((v) => [v.id, []]));
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target);
    adjacency.get(e.target)?.push(e.source);
  }
  const index = new Map<VertexId, number>();
  let next = 0;
  for (const start of sortVerticesByLabel(vertices)) {
    if (index.has(start.id)) continue;
    const stack = [start.id];
    index.set(start.id, next);
    while (stack.length > 0) {
      const id = stack.pop();
      if (id === undefined) break;
      for (const w of adjacency.get(id) ?? []) {
        if (!index.has(w)) {
          index.set(w, next);
          stack.push(w);
        }
      }
    }
    next++;
  }
  return index;
}

/** Arista de menor peso (y luego menor id) de `from` a `to`, respetando la dirección. */
export function lightestEdge(graph: Graph, from: VertexId, to: VertexId): Edge | undefined {
  let best: Edge | undefined;
  for (const e of graph.edges) {
    const matches = (e.source === from && e.target === to) || (!graph.directed && e.source === to && e.target === from);
    if (!matches) continue;
    const w = graph.weighted ? e.weight : 1;
    const bw = best ? (graph.weighted ? best.weight : 1) : Infinity;
    if (!best || w < bw || (w === bw && compareLabels(e.id, best.id) < 0)) best = e;
  }
  return best;
}
