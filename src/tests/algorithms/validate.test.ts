import { describe, expect, it } from 'vitest';
import { validateGraph } from '@/algorithms/graph/validate';
import type { Graph } from '@/types/graph';

const base = (): Graph => ({
  directed: false,
  weighted: true,
  vertices: [
    { id: 'a', label: 'A', position: { x: 0, y: 0 } },
    { id: 'b', label: 'B', position: { x: 1, y: 0 } },
  ],
  edges: [{ id: 'e1', source: 'a', target: 'b', weight: 3 }],
});

const codes = (g: Graph) => validateGraph(g).map((i) => i.code);

describe('validateGraph (política de grafos)', () => {
  it('acepta un grafo válido', () => {
    expect(validateGraph(base())).toEqual([]);
  });

  it('permite aristas paralelas', () => {
    const g = base();
    g.edges.push({ id: 'e2', source: 'b', target: 'a', weight: 5 });
    expect(validateGraph(g)).toEqual([]);
  });

  it('rechaza lazos', () => {
    const g = base();
    g.edges.push({ id: 'e2', source: 'a', target: 'a', weight: 1 });
    expect(codes(g)).toEqual(['self-loop']);
  });

  it('rechaza nombres vacíos o repetidos', () => {
    const g = base();
    g.vertices.push({ id: 'c', label: ' A ', position: { x: 0, y: 1 } }, { id: 'd', label: '  ', position: { x: 0, y: 2 } });
    expect(codes(g)).toEqual(['duplicate-label', 'empty-label']);
  });

  it('rechaza extremos inexistentes, identificadores repetidos y pesos no finitos', () => {
    const g = base();
    g.vertices.push({ id: 'a', label: 'Z', position: { x: 0, y: 0 } });
    g.edges.push({ id: 'e1', source: 'a', target: 'x', weight: Number.NaN });
    expect(codes(g)).toEqual(['duplicate-vertex-id', 'duplicate-edge-id', 'missing-endpoint', 'invalid-weight']);
  });
});
