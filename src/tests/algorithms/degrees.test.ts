import { describe, expect, it } from 'vitest';
import { computeDegrees, degreeSum } from '@/algorithms/graph/degrees';
import type { Edge, Graph } from '@/types/graph';

const vertex = (id: string) => ({ id, label: id, position: { x: 0, y: 0 } });
const edge = (id: string, source: string, target: string, weight = 1): Edge => ({ id, source, target, weight });

describe('computeDegrees', () => {
  it('calcula grados en un grafo no dirigido y cumple el lema del apretón de manos', () => {
    const graph: Graph = {
      directed: false,
      weighted: false,
      vertices: ['A', 'B', 'C', 'D'].map(vertex),
      edges: [edge('1', 'A', 'B'), edge('2', 'A', 'C'), edge('3', 'B', 'C'), edge('4', 'C', 'D')],
    };
    const d = computeDegrees(graph);
    expect([...d.entries()].map(([id, v]) => [id, v.degree])).toEqual([
      ['A', 2],
      ['B', 2],
      ['C', 3],
      ['D', 1],
    ]);
    expect(degreeSum(d)).toBe(2 * graph.edges.length);
    // Sin orientación, entrada y salida coinciden con el grado.
    expect(d.get('C')).toEqual({ degree: 3, inDegree: 3, outDegree: 3 });
  });

  it('distingue grado de entrada y de salida en un grafo dirigido', () => {
    const graph: Graph = {
      directed: true,
      weighted: false,
      vertices: ['A', 'B', 'C'].map(vertex),
      edges: [edge('1', 'A', 'B'), edge('2', 'A', 'C'), edge('3', 'B', 'A')],
    };
    const d = computeDegrees(graph);
    expect(d.get('A')).toEqual({ degree: 3, inDegree: 1, outDegree: 2 });
    expect(d.get('B')).toEqual({ degree: 2, inDegree: 1, outDegree: 1 });
    expect(d.get('C')).toEqual({ degree: 1, inDegree: 1, outDegree: 0 });
  });

  it('cuenta por separado las aristas paralelas (puentes de Königsberg)', () => {
    // Masas de tierra: A (isla), B, C, D. Siete puentes.
    const graph: Graph = {
      directed: false,
      weighted: false,
      vertices: ['A', 'B', 'C', 'D'].map(vertex),
      edges: [edge('1', 'A', 'B'), edge('2', 'A', 'B'), edge('3', 'A', 'C'), edge('4', 'A', 'C'), edge('5', 'A', 'D'), edge('6', 'B', 'D'), edge('7', 'C', 'D')],
    };
    const d = computeDegrees(graph);
    expect(d.get('A')?.degree).toBe(5);
    expect(d.get('B')?.degree).toBe(3);
    expect(d.get('C')?.degree).toBe(3);
    expect(d.get('D')?.degree).toBe(3);
    expect(degreeSum(d)).toBe(14);
  });

  it('asigna grado 0 a los vértices aislados y funciona con el grafo vacío', () => {
    const isolated = computeDegrees({ directed: false, weighted: false, vertices: [vertex('A')], edges: [] });
    expect(isolated.get('A')).toEqual({ degree: 0, inDegree: 0, outDegree: 0 });
    expect(computeDegrees({ directed: false, weighted: false, vertices: [], edges: [] }).size).toBe(0);
  });

  it('rechaza aristas con extremos inexistentes', () => {
    expect(() => computeDegrees({ directed: false, weighted: false, vertices: [vertex('A')], edges: [edge('1', 'A', 'Z')] })).toThrow(/inexistente/);
  });
});
