import { describe, expect, it } from 'vitest';
import {
  addEdge,
  addVertex,
  checkVertexLabel,
  countOppositeArcPairs,
  EMPTY_GRAPH,
  incidentEdges,
  MAX_VERTICES,
  moveVertex,
  nextId,
  parseWeight,
  removeEdge,
  removeVertex,
  renameVertex,
  reverseEdge,
  setDirected,
  setEdgeWeight,
  suggestPosition,
  suggestVertexLabel,
} from '@/algorithms/graph/editing';
import { buildGraph } from '@/algorithms/graph/examples';
import { validateGraph } from '@/algorithms/graph/validate';
import type { Graph } from '@/types/graph';

const triangle = (): Graph =>
  buildGraph({
    directed: false,
    weighted: true,
    vertices: [
      ['A', 0, 0],
      ['B', 100, 0],
      ['C', 50, 80],
    ],
    edges: [
      ['A', 'B', 3],
      ['B', 'C', 4],
      ['C', 'A', 5],
    ],
  });

function unwrap(result: ReturnType<typeof addVertex>): Graph {
  if (!result.ok) throw new Error(result.error);
  return result.graph;
}

describe('edición de vértices', () => {
  it('agrega vértices con identificadores nuevos y no modifica el grafo original', () => {
    const g0 = triangle();
    const result = addVertex(g0, '  D ', { x: 10.4, y: 20.6 });
    expect(result).toMatchObject({ ok: true, id: 'v4' });
    const g1 = unwrap(result);
    expect(g1.vertices.at(-1)).toEqual({ id: 'v4', label: 'D', position: { x: 10, y: 21 } });
    expect(g0.vertices).toHaveLength(3);
  });

  it('valida los nombres: vacíos, con espacios, demasiado largos o repetidos', () => {
    const g = triangle();
    expect(checkVertexLabel(g, '   ')).toMatch(/vacío/);
    expect(checkVertexLabel(g, 'v 1')).toMatch(/espacios/);
    expect(checkVertexLabel(g, 'NOMBRELARGO')).toMatch(/máximo 8/);
    expect(checkVertexLabel(g, 'A')).toMatch(/Ya existe/);
    // Renombrar un vértice con su propio nombre es válido.
    expect(checkVertexLabel(g, 'A', 'v1')).toBeNull();
    // Mayúsculas y minúsculas son nombres distintos.
    expect(checkVertexLabel(g, 'a')).toBeNull();
  });

  it('propone el primer nombre libre y una posición que no se superpone', () => {
    const g = triangle();
    expect(suggestVertexLabel(g)).toBe('D');
    expect(suggestVertexLabel(EMPTY_GRAPH)).toBe('A');
    const p = suggestPosition({ ...g, vertices: [{ id: 'v1', label: 'A', position: { x: 80, y: 70 } }] });
    expect(p).toEqual({ x: 200, y: 70 });
  });

  it('respeta el límite de vértices', () => {
    let g: Graph = EMPTY_GRAPH;
    for (let i = 0; i < MAX_VERTICES; i++) g = unwrap(addVertex(g, `V${i}`, { x: i, y: 0 }));
    const result = addVertex(g, 'extra', { x: 0, y: 0 });
    expect(result.ok).toBe(false);
  });

  it('renombra y mueve vértices', () => {
    const g = unwrap(renameVertex(triangle(), 'v1', 'X'));
    expect(g.vertices[0]?.label).toBe('X');
    expect(renameVertex(g, 'v2', 'X')).toMatchObject({ ok: false });
    expect(unwrap(moveVertex(g, 'v2', { x: 7, y: 8 })).vertices[1]?.position).toEqual({ x: 7, y: 8 });
  });

  it('al eliminar un vértice elimina también sus aristas incidentes', () => {
    const g0 = triangle();
    expect(incidentEdges(g0, 'v1').map((e) => e.id)).toEqual(['e1', 'e3']);
    const g = unwrap(removeVertex(g0, 'v1'));
    expect(g.vertices.map((v) => v.label)).toEqual(['B', 'C']);
    expect(g.edges.map((e) => e.id)).toEqual(['e2']);
    expect(validateGraph(g)).toEqual([]);
  });

  it('genera identificadores a partir del mayor sufijo existente', () => {
    expect(nextId('v', ['v1', 'v7', 'x9', 'v3'])).toBe('v8');
    expect(nextId('e', [])).toBe('e1');
  });
});

describe('edición de aristas', () => {
  it('rechaza lazos y vértices inexistentes', () => {
    const g = triangle();
    expect(addEdge(g, 'v1', 'v1')).toMatchObject({ ok: false, error: expect.stringMatching(/lazos/) as unknown });
    expect(addEdge(g, 'v1', 'v9')).toMatchObject({ ok: false });
  });

  it('permite aristas paralelas (multigrafo), cada una con su identificador', () => {
    const g = unwrap(addEdge(triangle(), 'v2', 'v1', 7));
    expect(g.edges.filter((e) => [e.source, e.target].sort().join() === 'v1,v2')).toHaveLength(2);
    expect(g.edges.at(-1)).toEqual({ id: 'e4', source: 'v2', target: 'v1', weight: 7 });
  });

  it('rechaza pesos no finitos y modifica, invierte y elimina aristas', () => {
    const g0 = triangle();
    expect(addEdge(g0, 'v1', 'v2', Number.NaN).ok).toBe(false);
    expect(setEdgeWeight(g0, 'e1', Number.POSITIVE_INFINITY).ok).toBe(false);
    const g1 = unwrap(setEdgeWeight(g0, 'e1', -2.5));
    expect(g1.edges[0]?.weight).toBe(-2.5);
    const g2 = unwrap(reverseEdge(g1, 'e1'));
    expect(g2.edges[0]).toMatchObject({ source: 'v2', target: 'v1' });
    const g3 = unwrap(removeEdge(g2, 'e1'));
    expect(g3.edges.map((e) => e.id)).toEqual(['e2', 'e3']);
  });
});

describe('lectura de pesos', () => {
  it.each([
    ['4', 4],
    [' 2,5 ', 2.5],
    ['-3', -3],
    ['+.5', 0.5],
    ['0', 0],
    ['-0', 0],
  ])('«%s» es %d', (text, value) => {
    expect(parseWeight(text)).toEqual({ ok: true, value });
  });

  it.each(['', 'abc', '1e3', '2..5', '1,000.5', '5000000'])('rechaza «%s»', (text) => {
    expect(parseWeight(text).ok).toBe(false);
  });
});

describe('tipo de grafo', () => {
  it('al quitar la dirección, los arcos opuestos quedan como aristas paralelas', () => {
    const g = buildGraph({
      directed: true,
      weighted: false,
      vertices: [
        ['A', 0, 0],
        ['B', 1, 0],
        ['C', 2, 0],
      ],
      edges: [
        ['A', 'B'],
        ['B', 'A'],
        ['B', 'C'],
      ],
    });
    expect(countOppositeArcPairs(g)).toBe(1);
    const undirected = setDirected(g, false);
    expect(undirected.directed).toBe(false);
    expect(undirected.edges).toHaveLength(3);
    expect(setDirected(undirected, false)).toBe(undirected);
  });
});
