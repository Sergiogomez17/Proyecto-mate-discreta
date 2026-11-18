import { describe, expect, it } from 'vitest';
import { countShortestPaths, dijkstra, negativeEdges, pathEdgeIds, shortestPaths } from '@/algorithms/graph/dijkstra';
import { buildGraph, findExample } from '@/algorithms/graph/examples';
import { graphTraversalSteps, traversalOrder } from '@/algorithms/graph/traversal';
import type { Graph } from '@/types/graph';

const example = (id: string): Graph => {
  const g = findExample(id)?.graph;
  if (!g) throw new Error(id);
  return g;
};
const id = (g: Graph, label: string) => g.vertices.find((v) => v.label === label)?.id ?? `?${label}`;
const lab = (g: Graph) => (vid: string) => g.vertices.find((v) => v.id === vid)?.label ?? vid;
const distances = (g: Graph, source: string) => {
  const run = dijkstra(g, id(g, source));
  return Object.fromEntries(g.vertices.map((v) => [v.label, run.dist[v.id]]));
};

/** Bellman-Ford de referencia (para comparar resultados, pesos no negativos). */
function reference(g: Graph, source: string): Record<string, number> {
  const d: Record<string, number> = Object.fromEntries(g.vertices.map((v) => [v.id, Infinity]));
  d[source] = 0;
  for (let i = 0; i < g.vertices.length; i++) {
    for (const e of g.edges) {
      const w = g.weighted ? e.weight : 1;
      const relax = (a: string, b: string) => {
        if ((d[a] ?? Infinity) + w < (d[b] ?? Infinity)) d[b] = (d[a] ?? Infinity) + w;
      };
      relax(e.source, e.target);
      if (!g.directed) relax(e.target, e.source);
    }
  }
  return d;
}

describe('Dijkstra', () => {
  it('calcula las distancias de la red de ciudades', () => {
    expect(distances(example('ciudades'), 'A')).toEqual({ A: 0, B: 3, C: 2, D: 8, E: 10, F: 12 });
  });

  it.each(['ciudades', 'dirigido', 'empates', 'konigsberg', 'petersen'])('coincide con Bellman-Ford desde cada origen (%s)', (exampleId) => {
    const g = example(exampleId);
    for (const v of g.vertices) expect(dijkstra(g, v.id).dist).toEqual(reference(g, v.id));
  });

  it('registra la inicialización, las selecciones y cada relajación', () => {
    const g = example('ciudades');
    const run = dijkstra(g, id(g, 'A'));
    expect(run.steps[0]?.action).toBe('init');
    expect(run.steps.filter((s) => s.action === 'select')).toHaveLength(6);
    expect(run.steps.at(-1)?.action).toBe('finish');
    expect(run.definitive.map(lab(g))).toEqual(['A', 'C', 'B', 'D', 'E', 'F']);
    // Relajación de C–B desde C: d(B) = min(4, 2 + 1) = 3.
    const cb = run.steps.find((s) => s.action === 'improve' && s.current === id(g, 'C') && s.neighbor === id(g, 'B'));
    expect(cb?.formula).toBe('d(B) = min(4, 2 + 1) = 3');
    expect(cb?.dist[id(g, 'B')]).toBe(3);
    // Las relajaciones solo miran vértices no definitivos.
    for (const s of run.steps) if (s.neighbor) expect(s.definitive).not.toContain(s.neighbor);
  });

  it('maneja empates, pesos cero y vértices inalcanzables', () => {
    const g = example('empates');
    const run = dijkstra(g, id(g, 'A'));
    expect(run.dist[id(g, 'D')]).toBe(5);
    expect(run.dist[id(g, 'E')]).toBe(5); // arista D–E de peso 0
    expect(run.dist[id(g, 'G')]).toBe(Infinity);
    expect(run.pred[id(g, 'D')]?.map(lab(g)).sort()).toEqual(['B', 'C']);
    expect(run.steps.some((s) => s.action === 'tie')).toBe(true);
    expect(run.steps.find((s) => s.action === 'unreachable')?.explanation).toMatch(/G es inalcanzable/);
    expect(countShortestPaths(run, id(g, 'F'))).toBe(2);
    expect(shortestPaths(run, id(g, 'F'), lab(g)).map((p) => p.map(lab(g)).join(''))).toEqual(['ABDEF', 'ACDEF']);
    expect(countShortestPaths(run, id(g, 'G'))).toBe(0);
  });

  it('respeta el sentido de los arcos', () => {
    const g = example('dirigido');
    const d = distances(g, 'D');
    expect(d).toMatchObject({ D: 0, E: 5, F: 9, A: Infinity });
  });

  it('elige la arista paralela de menor peso para el camino', () => {
    const g = buildGraph({ directed: false, weighted: true, vertices: [['A', 0, 0], ['B', 0, 0]], edges: [['A', 'B', 5], ['B', 'A', 2]] });
    const run = dijkstra(g, id(g, 'A'));
    expect(run.dist[id(g, 'B')]).toBe(2);
    expect(pathEdgeIds(g, [id(g, 'A'), id(g, 'B')])).toEqual(['e2']);
  });

  it('detecta pesos negativos (no se ejecuta en ese caso)', () => {
    const g = buildGraph({ directed: false, weighted: true, vertices: [['A', 0, 0], ['B', 0, 0]], edges: [['A', 'B', -1]] });
    expect(negativeEdges(g).map((e) => e.id)).toEqual(['e1']);
    expect(negativeEdges({ ...g, weighted: false })).toEqual([]);
  });
});

describe('BFS y DFS', () => {
  const g = buildGraph({
    directed: false,
    weighted: false,
    vertices: [
      ['A', 0, 0],
      ['B', 0, 0],
      ['C', 0, 0],
      ['D', 0, 0],
      ['E', 0, 0],
      ['F', 0, 0],
    ],
    edges: [
      ['A', 'C'],
      ['A', 'B'],
      ['B', 'D'],
      ['C', 'D'],
      ['D', 'E'],
      ['B', 'D'],
    ],
  });

  it('BFS visita por niveles con vecinos en orden alfabético', () => {
    expect(traversalOrder(g, id(g, 'A'), 'bfs').map(lab(g))).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('DFS profundiza antes de retroceder', () => {
    expect(traversalOrder(g, id(g, 'A'), 'dfs').map(lab(g))).toEqual(['A', 'B', 'D', 'C', 'E']);
  });

  it('la cola y la pila de cada paso son coherentes', () => {
    const bfs = graphTraversalSteps(g, id(g, 'A'), 'bfs');
    const firstVisitB = bfs.find((s) => s.action === 'visit' && s.current === id(g, 'B'));
    expect(firstVisitB?.queue.map(lab(g))).toEqual(['C']);
    const dfs = graphTraversalSteps(g, id(g, 'A'), 'dfs');
    const atC = dfs.find((s) => s.action === 'discover' && s.neighbor === id(g, 'C'));
    expect(atC?.stack.map(lab(g))).toEqual(['A', 'B', 'D', 'C']);
    // Árbol de recorrido: n − 1 aristas para los vértices alcanzados.
    expect(dfs.at(-1)?.treeEdges).toHaveLength(4);
    expect(bfs.at(-1)?.treeEdges).toHaveLength(4);
  });

  it('informa los vértices no alcanzables y puede continuar como bosque', () => {
    const last = graphTraversalSteps(g, id(g, 'A'), 'bfs').at(-1);
    expect(last?.explanation).toMatch(/F no es alcanzable desde A/);
    const forest = graphTraversalSteps(g, id(g, 'A'), 'dfs', { forest: true });
    expect(forest.some((s) => s.action === 'restart')).toBe(true);
    expect(forest.at(-1)?.order.map(lab(g))).toEqual(['A', 'B', 'D', 'C', 'E', 'F']);
  });

  it('en grafos dirigidos sigue el sentido de los arcos', () => {
    const d = buildGraph({ directed: true, weighted: false, vertices: [['A', 0, 0], ['B', 0, 0], ['C', 0, 0]], edges: [['B', 'A'], ['B', 'C']] });
    expect(traversalOrder(d, id(d, 'A'), 'bfs').map(lab(d))).toEqual(['A']);
    expect(traversalOrder(d, id(d, 'B'), 'dfs').map(lab(d))).toEqual(['B', 'A', 'C']);
  });

  it('cada vértice se visita una sola vez', () => {
    for (const kind of ['bfs', 'dfs'] as const) {
      const order = traversalOrder(example('petersen'), id(example('petersen'), '1'), kind);
      expect(new Set(order).size).toBe(10);
      expect(order).toHaveLength(10);
    }
  });
});
