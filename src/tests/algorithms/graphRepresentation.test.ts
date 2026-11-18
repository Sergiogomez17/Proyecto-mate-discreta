import { describe, expect, it } from 'vitest';
import { connectedComponents, stronglyConnectedComponents } from '@/algorithms/graph/components';
import { computeDegrees, degreeSum } from '@/algorithms/graph/degrees';
import { buildGraph, GRAPH_EXAMPLES } from '@/algorithms/graph/examples';
import { compareLabels } from '@/algorithms/graph/order';
import { adjacencyList, adjacencyMatrix, countParallelEdges } from '@/algorithms/graph/representation';
import { validateGraph } from '@/algorithms/graph/validate';
import type { Graph } from '@/types/graph';

const example = (id: string): Graph => {
  const found = GRAPH_EXAMPLES.find((e) => e.id === id);
  if (!found) throw new Error(`Falta el ejemplo ${id}`);
  return found.graph;
};
const labels = (groups: Array<Array<{ label: string }>>) => groups.map((g) => g.map((v) => v.label));
const degreeOf = (g: Graph) => {
  const d = computeDegrees(g);
  return Object.fromEntries(g.vertices.map((v) => [v.label, d.get(v.id)]));
};

describe('ejemplos de grafos', () => {
  it.each(GRAPH_EXAMPLES.map((e) => [e.id, e.graph] as const))('el ejemplo «%s» cumple la política', (_, graph) => {
    expect(validateGraph(graph)).toEqual([]);
    expect(degreeSum(computeDegrees(graph))).toBe(2 * graph.edges.length);
  });

  it('Königsberg: multigrafo con todos los grados impares', () => {
    const g = example('konigsberg');
    const d = degreeOf(g);
    expect([d.A?.degree, d.B?.degree, d.C?.degree, d.D?.degree]).toEqual([5, 3, 3, 3]);
    expect(countParallelEdges(g)).toBe(4);
  });

  it('K5: diez aristas y grado 4 en cada vértice', () => {
    const g = example('completo');
    expect(g.edges).toHaveLength(10);
    expect(Object.values(degreeOf(g)).every((d) => d?.degree === 4)).toBe(true);
  });
});

describe('matriz de adyacencia', () => {
  it('es simétrica en un grafo no dirigido y cuenta la multiplicidad', () => {
    const m = adjacencyMatrix(example('konigsberg'));
    expect(m.order.map((v) => v.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(m.counts).toEqual([
      [0, 2, 2, 1],
      [2, 0, 0, 1],
      [2, 0, 0, 1],
      [1, 1, 1, 0],
    ]);
  });

  it('en un grafo dirigido la fila es el origen y la columna el destino', () => {
    const g = example('dirigido');
    const m = adjacencyMatrix(g);
    const at = (a: string, b: string) => {
      const i = m.order.findIndex((v) => v.label === a);
      const j = m.order.findIndex((v) => v.label === b);
      return { count: m.counts[i]?.[j], weights: m.weights[i]?.[j] };
    };
    expect(at('A', 'B')).toEqual({ count: 1, weights: [3] });
    expect(at('B', 'A')).toEqual({ count: 0, weights: [] });
    expect(at('E', 'D')).toEqual({ count: 1, weights: [1] });
  });

  it('usa peso 1 si el grafo no es ponderado', () => {
    const g = { ...example('ciudades'), weighted: false };
    const m = adjacencyMatrix(g);
    expect(m.weights.flat(2).every((w) => w === 1)).toBe(true);
  });
});

describe('lista de adyacencia', () => {
  it('ordena vértices y vecinos por nombre (alfabético y numérico)', () => {
    const g = buildGraph({
      directed: false,
      weighted: true,
      vertices: [
        ['v10', 0, 0],
        ['v2', 0, 0],
        ['v1', 0, 0],
      ],
      edges: [
        ['v2', 'v10', 5],
        ['v2', 'v1', 1],
        ['v2', 'v1', 0.5],
      ],
    });
    const list = adjacencyList(g);
    expect(list.map((r) => r.vertex.label)).toEqual(['v1', 'v2', 'v10']);
    const v2 = list[1];
    expect(v2?.neighbors.map((n) => `${n.vertex.label}:${n.weight}`)).toEqual(['v1:0.5', 'v1:1', 'v10:5']);
    expect(compareLabels('B', 'a')).toBeGreaterThan(0);
  });

  it('en un grafo dirigido solo lista los sucesores', () => {
    const list = adjacencyList(example('dirigido'));
    const row = (label: string) => list.find((r) => r.vertex.label === label)?.neighbors.map((n) => n.vertex.label);
    expect(row('C')).toEqual(['A', 'D']);
    expect(row('F')).toEqual([]);
  });
});

describe('componentes conexas', () => {
  it('detecta un grafo desconexo con un vértice aislado', () => {
    expect(labels(connectedComponents(example('desconexo')))).toEqual([['A', 'B', 'C'], ['D', 'E'], ['F']]);
  });

  it('un grafo conexo tiene una sola componente', () => {
    expect(connectedComponents(example('ciudades'))).toHaveLength(1);
  });

  it('en un grafo dirigido distingue componentes débil y fuertemente conexas', () => {
    const g = example('dirigido');
    expect(labels(connectedComponents(g))).toEqual([['A', 'B', 'C', 'D', 'E', 'F']]);
    expect(labels(stronglyConnectedComponents(g))).toEqual([['A', 'B', 'C'], ['D', 'E'], ['F']]);
  });

  it('un ciclo dirigido es fuertemente conexo y un camino dirigido no', () => {
    const vertices: Array<[string, number, number]> = [
      ['A', 0, 0],
      ['B', 0, 0],
      ['C', 0, 0],
    ];
    const cycle = buildGraph({ directed: true, weighted: false, vertices, edges: [['A', 'B'], ['B', 'C'], ['C', 'A']] });
    const path = buildGraph({ directed: true, weighted: false, vertices, edges: [['A', 'B'], ['B', 'C']] });
    expect(stronglyConnectedComponents(cycle)).toHaveLength(1);
    expect(stronglyConnectedComponents(path)).toHaveLength(3);
  });

  it('el grafo vacío no tiene componentes', () => {
    expect(connectedComponents({ directed: false, weighted: false, vertices: [], edges: [] })).toEqual([]);
  });
});
