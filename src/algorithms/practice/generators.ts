import { buildGraph } from '@/algorithms/graph/examples';
import { circleLayout } from '@/algorithms/graph/layout';
import type { Graph } from '@/types/graph';
import type { BinaryTree, TreeNodeId } from '@/types/tree';
import type { Rng } from './random';
import { pick, randInt, shuffle } from './random';

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export interface RandomGraphOptions {
  n: number;
  /** Aristas que se agregan además del árbol generador (que garantiza la conexidad). */
  extra: number;
  directed?: boolean;
  weighted?: boolean;
  minWeight?: number;
  maxWeight?: number;
  /** Número de aristas paralelas adicionales. */
  parallel?: number;
  /** Si es falso, no se agrega el árbol generador (el grafo puede quedar desconexo). */
  connected?: boolean;
}

type EdgeSpec = [string, string, number?];

const key = (a: string, b: string, directed: boolean) => (directed || a < b ? `${a}|${b}` : `${b}|${a}`);

/** Construye un grafo con vértices A, B, C… dispuestos en círculo. */
export function graphFromEdges(labels: string[], edges: EdgeSpec[], directed: boolean, weighted: boolean): Graph {
  const points = circleLayout(labels.length, { x: 230, y: 210 }, labels.length <= 5 ? 150 : 170);
  return buildGraph({
    directed,
    weighted,
    vertices: labels.map((l, i): [string, number, number] => [l, points[i]?.x ?? 0, points[i]?.y ?? 0]),
    edges,
  });
}

/**
 * Grafo aleatorio. Por defecto es conexo (ignorando la dirección): primero se forma un árbol
 * generador aleatorio y luego se agregan aristas sin lazos ni repeticiones.
 */
export function randomGraph(rng: Rng, options: RandomGraphOptions): Graph {
  const { n, extra, directed = false, weighted = false, minWeight = 1, maxWeight = 9, parallel = 0, connected = true } = options;
  const labels = LETTERS.slice(0, n);
  const edges: EdgeSpec[] = [];
  const used = new Set<string>();
  const weight = () => (weighted ? randInt(rng, minWeight, maxWeight) : 1);
  const add = (a: string, b: string) => {
    const [s, t] = directed && rng() < 0.5 ? [b, a] : [a, b];
    used.add(key(s, t, directed));
    edges.push([s, t, weight()]);
  };
  if (connected) {
    const order = shuffle(rng, labels);
    for (let i = 1; i < order.length; i++) {
      const a = order[i];
      const b = order[randInt(rng, 0, i - 1)];
      if (a && b) add(a, b);
    }
  }
  let attempts = 0;
  let added = 0;
  while (added < extra && attempts++ < extra * 60) {
    const a = pick(rng, labels);
    const b = pick(rng, labels);
    if (a === b || used.has(key(a, b, directed)) || (directed && used.has(key(b, a, directed)))) continue;
    add(a, b);
    added++;
  }
  for (let i = 0; i < parallel && edges.length > 0; i++) {
    const [s, t] = pick(rng, edges);
    edges.push([s, t, weight()]);
  }
  return graphFromEdges(labels, edges, directed, weighted);
}

/** Grafo con un ciclo que recorre todos los vértices (hamiltoniano) más aristas extra. */
export function hamiltonianGraph(rng: Rng, n: number, extra: number): { graph: Graph; cycle: string[] } {
  const labels = LETTERS.slice(0, n);
  const cycle = shuffle(rng, labels);
  const edges: EdgeSpec[] = [];
  const used = new Set<string>();
  const add = (a: string, b: string) => {
    if (a === b || used.has(key(a, b, false))) return false;
    used.add(key(a, b, false));
    edges.push([a, b]);
    return true;
  };
  cycle.forEach((v, i) => add(v, cycle[(i + 1) % n] ?? v));
  let added = 0;
  let attempts = 0;
  while (added < extra && attempts++ < extra * 60) if (add(pick(rng, labels), pick(rng, labels))) added++;
  return { graph: graphFromEdges(labels, edges, false, false), cycle };
}

/**
 * Grafo simple, conexo y con todos los grados pares (euleriano): un ciclo por todos los vértices
 * más triángulos formados con aristas nuevas.
 */
export function eulerianGraph(rng: Rng, n: number, triangles: number): Graph {
  const labels = LETTERS.slice(0, n);
  const order = shuffle(rng, labels);
  const edges: EdgeSpec[] = [];
  const used = new Set<string>();
  order.forEach((v, i) => {
    const w = order[(i + 1) % n] ?? v;
    used.add(key(v, w, false));
    edges.push([v, w]);
  });
  let added = 0;
  let attempts = 0;
  while (added < triangles && attempts++ < 200) {
    const [a, b, c] = shuffle(rng, labels);
    if (!a || !b || !c) break;
    const pairs: Array<[string, string]> = [
      [a, b],
      [b, c],
      [c, a],
    ];
    if (pairs.some(([x, y]) => used.has(key(x, y, false)))) continue;
    for (const [x, y] of pairs) {
      used.add(key(x, y, false));
      edges.push([x, y]);
    }
    added++;
  }
  return graphFromEdges(labels, edges, false, false);
}

/** Árbol binario aleatorio de `n` nodos con etiquetas mezcladas (para que el orden alfabético no delate el recorrido). */
export function randomBinaryTree(rng: Rng, n: number): BinaryTree {
  const labels = shuffle(rng, LETTERS.slice(0, n));
  const nodes: BinaryTree['nodes'] = {};
  const free: Array<{ parent: TreeNodeId; side: 'left' | 'right' }> = [];
  labels.forEach((label, i) => {
    const id = `n${i + 1}`;
    nodes[id] = { id, label, left: null, right: null };
    if (i > 0) {
      const slotIndex = randInt(rng, 0, free.length - 1);
      const slot = free[slotIndex];
      if (slot) {
        const parent = nodes[slot.parent];
        if (parent) nodes[slot.parent] = { ...parent, [slot.side]: id };
        free.splice(slotIndex, 1);
      }
    }
    free.push({ parent: id, side: 'left' }, { parent: id, side: 'right' });
  });
  return { rootId: n > 0 ? 'n1' : null, nodes };
}

/** Copia de `graph` con vértices renombrados 1, 2, … según una permutación aleatoria (y otra disposición). */
export function relabeledCopy(rng: Rng, graph: Graph): Graph {
  const n = graph.vertices.length;
  const names = shuffle(rng, Array.from({ length: n }, (_, i) => String(i + 1)));
  const nameOf = new Map(graph.vertices.map((v, i) => [v.id, names[i] ?? String(i + 1)]));
  const labels = Array.from({ length: n }, (_, i) => String(i + 1));
  const edges: EdgeSpec[] = graph.edges.map((e) => [nameOf.get(e.source) ?? '', nameOf.get(e.target) ?? '']);
  return graphFromEdges(labels, edges, graph.directed, false);
}
