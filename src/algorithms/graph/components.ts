import type { Graph, Vertex, VertexId } from '@/types/graph';
import { compareLabels, sortVerticesByLabel } from './order';

/** Ordena cada componente por nombre y las componentes por su primer vértice. */
function normalize(groups: Vertex[][]): Vertex[][] {
  return groups
    .map((g) => sortVerticesByLabel(g))
    .sort((a, b) => compareLabels(a[0]?.label ?? '', b[0]?.label ?? ''));
}

/**
 * Componentes conexas. En un grafo dirigido se ignora la dirección (componentes débilmente
 * conexas). Un vértice aislado forma su propia componente. Se usa búsqueda en anchura: O(V + E).
 */
export function connectedComponents(graph: Graph): Vertex[][] {
  const neighbors = new Map<VertexId, VertexId[]>(graph.vertices.map((v) => [v.id, []]));
  for (const e of graph.edges) {
    neighbors.get(e.source)?.push(e.target);
    neighbors.get(e.target)?.push(e.source);
  }
  const byId = new Map(graph.vertices.map((v) => [v.id, v]));
  const seen = new Set<VertexId>();
  const groups: Vertex[][] = [];

  for (const start of sortVerticesByLabel(graph.vertices)) {
    if (seen.has(start.id)) continue;
    const group: Vertex[] = [];
    const queue: VertexId[] = [start.id];
    seen.add(start.id);
    for (let head = 0; head < queue.length; head++) {
      const id = queue[head];
      if (id === undefined) break;
      const vertex = byId.get(id);
      if (vertex) group.push(vertex);
      for (const next of neighbors.get(id) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    groups.push(group);
  }
  return normalize(groups);
}

/**
 * Componentes fuertemente conexas de un grafo dirigido (algoritmo de Kosaraju, iterativo para no
 * depender de la pila de llamadas). En un grafo no dirigido coinciden con las componentes conexas.
 */
export function stronglyConnectedComponents(graph: Graph): Vertex[][] {
  if (!graph.directed) return connectedComponents(graph);

  const out = new Map<VertexId, VertexId[]>(graph.vertices.map((v) => [v.id, []]));
  const inc = new Map<VertexId, VertexId[]>(graph.vertices.map((v) => [v.id, []]));
  for (const e of graph.edges) {
    out.get(e.source)?.push(e.target);
    inc.get(e.target)?.push(e.source);
  }
  const ordered = sortVerticesByLabel(graph.vertices);

  // 1) Orden de finalización de un DFS sobre el grafo original.
  const finished: VertexId[] = [];
  const visited = new Set<VertexId>();
  for (const root of ordered) {
    if (visited.has(root.id)) continue;
    visited.add(root.id);
    const stack: Array<{ id: VertexId; next: number }> = [{ id: root.id, next: 0 }];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (!frame) break;
      const succ = out.get(frame.id) ?? [];
      if (frame.next < succ.length) {
        const w = succ[frame.next++];
        if (w !== undefined && !visited.has(w)) {
          visited.add(w);
          stack.push({ id: w, next: 0 });
        }
      } else {
        finished.push(frame.id);
        stack.pop();
      }
    }
  }

  // 2) DFS sobre el grafo transpuesto en orden inverso de finalización.
  const byId = new Map(graph.vertices.map((v) => [v.id, v]));
  const assigned = new Set<VertexId>();
  const groups: Vertex[][] = [];
  for (let i = finished.length - 1; i >= 0; i--) {
    const root = finished[i];
    if (root === undefined || assigned.has(root)) continue;
    const group: Vertex[] = [];
    const stack: VertexId[] = [root];
    assigned.add(root);
    while (stack.length > 0) {
      const id = stack.pop();
      if (id === undefined) break;
      const vertex = byId.get(id);
      if (vertex) group.push(vertex);
      for (const w of inc.get(id) ?? []) {
        if (!assigned.has(w)) {
          assigned.add(w);
          stack.push(w);
        }
      }
    }
    groups.push(group);
  }
  return normalize(groups);
}
