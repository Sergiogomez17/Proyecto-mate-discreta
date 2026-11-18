import type { Edge, EdgeId, Graph, Vertex } from '@/types/graph';
import { compareLabels, sortVerticesByLabel } from './order';

/** Peso que usan los algoritmos: el de la arista si el grafo es ponderado y 1 en caso contrario. */
export function effectiveWeight(graph: Graph, edge: Edge): number {
  return graph.weighted ? edge.weight : 1;
}

export interface AdjacencyMatrix {
  /** Vértices en el orden de filas y columnas (alfabético por nombre). */
  order: Vertex[];
  /** counts[i][j]: número de aristas de order[i] a order[j] (multiplicidad). */
  counts: number[][];
  /** weights[i][j]: pesos de esas aristas, de menor a mayor. */
  weights: number[][][];
}

/**
 * Matriz de adyacencia. En un grafo no dirigido es simétrica; en un dirigido la fila es el origen
 * y la columna el destino. Las aristas paralelas se cuentan (multiplicidad), según la política.
 */
export function adjacencyMatrix(graph: Graph): AdjacencyMatrix {
  const order = sortVerticesByLabel(graph.vertices);
  const index = new Map(order.map((v, i) => [v.id, i]));
  const n = order.length;
  const counts = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const weights = Array.from({ length: n }, () => Array.from({ length: n }, (): number[] => []));

  const add = (i: number, j: number, w: number) => {
    const row = counts[i];
    const cell = weights[i]?.[j];
    if (row === undefined || cell === undefined) return;
    row[j] = (row[j] ?? 0) + 1;
    cell.push(w);
  };

  for (const edge of graph.edges) {
    const i = index.get(edge.source);
    const j = index.get(edge.target);
    if (i === undefined || j === undefined) continue;
    const w = effectiveWeight(graph, edge);
    add(i, j, w);
    if (!graph.directed) add(j, i, w);
  }
  for (const row of weights) for (const cell of row) cell.sort((a, b) => a - b);
  return { order, counts, weights };
}

export interface AdjacencyEntry {
  vertex: Vertex;
  edgeId: EdgeId;
  weight: number;
}

export interface AdjacencyRow {
  vertex: Vertex;
  /** Vecinos (sucesores en un grafo dirigido), ordenados por nombre; una entrada por arista. */
  neighbors: AdjacencyEntry[];
}

/** Lista de adyacencia con orden determinista: vértices y vecinos por nombre, luego por peso. */
export function adjacencyList(graph: Graph): AdjacencyRow[] {
  const byId = new Map(graph.vertices.map((v) => [v.id, v]));
  const rows = new Map<string, AdjacencyEntry[]>(graph.vertices.map((v) => [v.id, []]));

  for (const edge of graph.edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    const weight = effectiveWeight(graph, edge);
    rows.get(source.id)?.push({ vertex: target, edgeId: edge.id, weight });
    if (!graph.directed) rows.get(target.id)?.push({ vertex: source, edgeId: edge.id, weight });
  }

  return sortVerticesByLabel(graph.vertices).map((vertex) => ({
    vertex,
    neighbors: (rows.get(vertex.id) ?? []).sort(
      (a, b) => compareLabels(a.vertex.label, b.vertex.label) || a.weight - b.weight || compareLabels(a.edgeId, b.edgeId),
    ),
  }));
}

/** Número de aristas que comparten extremos con otra (paralelas). En dirigidos, u→v y v→u no lo son. */
export function countParallelEdges(graph: Graph): number {
  const groups = new Map<string, number>();
  for (const e of graph.edges) {
    const key = graph.directed || e.source < e.target ? `${e.source}\u0000${e.target}` : `${e.target}\u0000${e.source}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  let parallel = 0;
  for (const count of groups.values()) if (count > 1) parallel += count;
  return parallel;
}
