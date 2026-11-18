import type { Edge, EdgeId, Graph, VertexId } from '@/types/graph';
import { otherEnd } from './adjacency';
import { compareLabels, sortVerticesByLabel } from './order';

/**
 * Algoritmo de Dijkstra con registro de cada operación.
 *
 * Implementación: en cada iteración se elige, entre los vértices no definitivos con distancia finita,
 * el de menor distancia provisional (empates: orden alfabético). Se marca como definitivo y se relajan
 * sus aristas hacia vértices no definitivos: d(v) = min(d(v), d(u) + w(u,v)).
 * Cada paso registrado corresponde exactamente a una de esas operaciones.
 *
 * - Pesos negativos: el algoritmo no es válido y no se ejecuta (ver `negativeEdges`).
 * - Grafo no ponderado: cada arista pesa 1.
 * - Empates en la relajación (d(u) + w = d(v)): se guarda u como predecesor adicional, lo que permite
 *   mostrar todos los caminos mínimos.
 */

export type DijkstraAction = 'init' | 'select' | 'improve' | 'tie' | 'keep' | 'unreachable' | 'finish';

export interface DijkstraStep {
  action: DijkstraAction;
  /** Vértice elegido en esta iteración (el que se vuelve definitivo). */
  current: VertexId | null;
  /** Arista que se está relajando y su otro extremo. */
  edgeId: EdgeId | null;
  neighbor: VertexId | null;
  dist: Record<VertexId, number>;
  pred: Record<VertexId, VertexId[]>;
  /** Vértices definitivos, en el orden en que se fijaron. */
  definitive: VertexId[];
  /** Fórmula de la relajación, por ejemplo «d(C) = min(5, 2 + 1) = 3». */
  formula: string | null;
  explanation: string;
}

export interface DijkstraRun {
  source: VertexId;
  steps: DijkstraStep[];
  dist: Record<VertexId, number>;
  pred: Record<VertexId, VertexId[]>;
  definitive: VertexId[];
}

export function edgeWeight(graph: Graph, edge: Edge): number {
  return graph.weighted ? edge.weight : 1;
}

export function negativeEdges(graph: Graph): Edge[] {
  return graph.weighted ? graph.edges.filter((e) => e.weight < 0) : [];
}

export const formatDistance = (d: number | undefined) => (d === undefined || d === Infinity ? '∞' : Number(d.toFixed(3)).toLocaleString('es', { maximumFractionDigits: 3, useGrouping: false }));

export function dijkstra(graph: Graph, source: VertexId): DijkstraRun {
  const label = new Map(graph.vertices.map((v) => [v.id, v.label]));
  const name = (id: VertexId) => label.get(id) ?? id;
  const ordered = sortVerticesByLabel(graph.vertices);
  const dist: Record<VertexId, number> = {};
  const pred: Record<VertexId, VertexId[]> = {};
  for (const v of ordered) {
    dist[v.id] = Infinity;
    pred[v.id] = [];
  }
  const definitive: VertexId[] = [];
  const done = new Set<VertexId>();
  const steps: DijkstraStep[] = [];
  const snapshot = (step: Omit<DijkstraStep, 'dist' | 'pred' | 'definitive'>): DijkstraStep => ({
    ...step,
    dist: { ...dist },
    pred: Object.fromEntries(Object.entries(pred).map(([k, v]) => [k, [...v]])),
    definitive: [...definitive],
  });

  if (!label.has(source)) return { source, steps, dist, pred, definitive };
  dist[source] = 0;
  steps.push(
    snapshot({
      action: 'init',
      current: null,
      edgeId: null,
      neighbor: null,
      formula: `d(${name(source)}) = 0`,
      explanation: `Inicialización: la distancia del origen ${name(source)} es 0 y la de los demás vértices es ∞. Ningún vértice es definitivo todavía.`,
    }),
  );

  // Aristas que salen de cada vértice (en no dirigidos, todas las incidentes).
  const incident = new Map<VertexId, Edge[]>(ordered.map((v) => [v.id, []]));
  for (const e of graph.edges) {
    incident.get(e.source)?.push(e);
    if (!graph.directed) incident.get(e.target)?.push(e);
  }

  for (;;) {
    let u: VertexId | null = null;
    for (const v of ordered) {
      if (done.has(v.id)) continue;
      const d = dist[v.id] ?? Infinity;
      if (d === Infinity) continue;
      if (u === null || d < (dist[u] ?? Infinity)) u = v.id;
    }
    if (u === null) break;
    const du = dist[u] ?? 0;
    done.add(u);
    definitive.push(u);
    const ties = ordered.filter((v) => !done.has(v.id) && dist[v.id] === du).map((v) => v.label);
    steps.push(
      snapshot({
        action: 'select',
        current: u,
        edgeId: null,
        neighbor: null,
        formula: null,
        explanation: `Se elige ${name(u)}: es el vértice no definitivo con menor distancia provisional (${formatDistance(du)})${ties.length ? `; empata con ${ties.join(', ')} y se desempata por orden alfabético` : ''}. Su distancia ya es definitiva.`,
      }),
    );

    const edges = (incident.get(u) ?? [])
      .map((e) => ({ e, v: graph.directed ? e.target : otherEnd(e, u) }))
      .filter(({ v }) => !done.has(v))
      .sort((a, b) => compareLabels(name(a.v), name(b.v)) || edgeWeight(graph, a.e) - edgeWeight(graph, b.e) || compareLabels(a.e.id, b.e.id));

    for (const { e, v } of edges) {
      const w = edgeWeight(graph, e);
      const before = dist[v] ?? Infinity;
      const candidate = du + w;
      const formula = `d(${name(v)}) = min(${formatDistance(before)}, ${formatDistance(du)} + ${formatDistance(w)}) = ${formatDistance(Math.min(before, candidate))}`;
      let action: DijkstraAction;
      let explanation: string;
      if (candidate < before) {
        dist[v] = candidate;
        pred[v] = [u];
        action = 'improve';
        explanation = `Relajación de ${name(u)}${graph.directed ? '→' : '–'}${name(v)} (peso ${formatDistance(w)}): pasar por ${name(u)} mejora la distancia de ${name(v)} de ${formatDistance(before)} a ${formatDistance(candidate)}. Predecesor de ${name(v)}: ${name(u)}.`;
      } else if (candidate === before) {
        const list = pred[v] ?? [];
        if (!list.includes(u)) list.push(u);
        pred[v] = list;
        action = 'tie';
        explanation = `Relajación de ${name(u)}${graph.directed ? '→' : '–'}${name(v)} (peso ${formatDistance(w)}): ${formatDistance(du)} + ${formatDistance(w)} iguala la distancia actual de ${name(v)} (${formatDistance(before)}). Hay otro camino mínimo: ${name(u)} se agrega como predecesor.`;
      } else {
        action = 'keep';
        explanation = `Relajación de ${name(u)}${graph.directed ? '→' : '–'}${name(v)} (peso ${formatDistance(w)}): ${formatDistance(du)} + ${formatDistance(w)} = ${formatDistance(candidate)} no mejora ${formatDistance(before)}. La distancia de ${name(v)} no cambia.`;
      }
      steps.push(snapshot({ action, current: u, edgeId: e.id, neighbor: v, formula, explanation }));
    }
  }

  const unreachable = ordered.filter((v) => !done.has(v.id));
  if (unreachable.length > 0) {
    steps.push(
      snapshot({
        action: 'unreachable',
        current: null,
        edgeId: null,
        neighbor: null,
        formula: null,
        explanation: `No quedan vértices con distancia finita. ${unreachable.map((v) => v.label).join(', ')} ${unreachable.length === 1 ? 'es inalcanzable' : 'son inalcanzables'} desde ${name(source)}: su distancia queda en ∞.`,
      }),
    );
  }
  steps.push(
    snapshot({
      action: 'finish',
      current: null,
      edgeId: null,
      neighbor: null,
      formula: null,
      explanation: `Fin del algoritmo: los ${definitive.length} vértices alcanzables desde ${name(source)} tienen distancia definitiva.`,
    }),
  );
  return { source, steps, dist, pred, definitive };
}

/** Número de caminos mínimos de `source` a `target` (según los predecesores con empates). */
export function countShortestPaths(run: DijkstraRun, target: VertexId): number {
  const memo = new Map<VertexId, number>();
  const visit = (v: VertexId): number => {
    if (v === run.source) return 1;
    const cached = memo.get(v);
    if (cached !== undefined) return cached;
    const total = (run.pred[v] ?? []).reduce((sum, p) => sum + visit(p), 0);
    memo.set(v, total);
    return total;
  };
  return (run.dist[target] ?? Infinity) === Infinity ? 0 : visit(target);
}

/** Hasta `max` caminos mínimos (listas de vértices desde el origen), en orden alfabético. */
export function shortestPaths(run: DijkstraRun, target: VertexId, labelOf: (id: VertexId) => string, max = 10): VertexId[][] {
  if ((run.dist[target] ?? Infinity) === Infinity) return [];
  const paths: VertexId[][] = [];
  const walk = (v: VertexId, suffix: VertexId[]) => {
    if (paths.length >= max) return;
    if (v === run.source) {
      paths.push([v, ...suffix]);
      return;
    }
    const preds = [...(run.pred[v] ?? [])].sort((a, b) => compareLabels(labelOf(a), labelOf(b)));
    for (const p of preds) walk(p, [v, ...suffix]);
  };
  walk(target, []);
  return paths.sort((a, b) => compareLabels(a.map(labelOf).join(' '), b.map(labelOf).join(' ')));
}

/** Aristas de un camino: entre vértices consecutivos, la de menor peso (respetando la dirección). */
export function pathEdgeIds(graph: Graph, path: readonly VertexId[]): EdgeId[] {
  const ids: EdgeId[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    let best: Edge | undefined;
    for (const e of graph.edges) {
      const ok = (e.source === a && e.target === b) || (!graph.directed && e.source === b && e.target === a);
      if (ok && (!best || edgeWeight(graph, e) < edgeWeight(graph, best))) best = e;
    }
    if (best) ids.push(best.id);
  }
  return ids;
}
