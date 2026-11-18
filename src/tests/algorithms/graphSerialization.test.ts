import { describe, expect, it } from 'vitest';
import { GRAPH_EXAMPLES } from '@/algorithms/graph/examples';
import { fileNameFor, GRAPH_FILE_FORMAT, isGraph, parseGraphJson, serializeGraph } from '@/algorithms/graph/serialization';

const errorsOf = (text: string) => {
  const result = parseGraphJson(text);
  if (result.ok) throw new Error('Se esperaba un error');
  return result.errors.join(' | ');
};

describe('exportación e importación JSON', () => {
  it.each(GRAPH_EXAMPLES.map((e) => [e.id, e] as const))('el ejemplo «%s» se exporta y se vuelve a importar idéntico', (_, example) => {
    const text = serializeGraph(example.graph, example.name, new Date('2026-01-02T03:04:05Z'));
    const data = JSON.parse(text) as { format: string; version: number; exportedAt: string };
    expect(data).toMatchObject({ format: GRAPH_FILE_FORMAT, version: 1, exportedAt: '2026-01-02T03:04:05.000Z' });
    const result = parseGraphJson(text);
    expect(result).toEqual({ ok: true, graph: example.graph, name: example.name, warnings: [] });
  });

  it('acepta un formato abreviado escrito a mano', () => {
    const result = parseGraphJson(
      JSON.stringify({
        directed: true,
        vertices: ['A', 'B', { label: 'C', x: 10, y: 20 }],
        edges: [
          { source: 'A', target: 'B', weight: 2 },
          { source: 'B', target: 'C' },
        ],
      }),
    );
    if (!result.ok) throw new Error(result.errors.join());
    expect(result.graph.directed).toBe(true);
    expect(result.graph.weighted).toBe(true); // se infiere porque hay pesos
    expect(result.graph.vertices.map((v) => v.id)).toEqual(['v1', 'v2', 'v3']);
    expect(result.graph.vertices[2]?.position).toEqual({ x: 10, y: 20 });
    expect(result.graph.edges).toEqual([
      { id: 'e1', source: 'v1', target: 'v2', weight: 2 },
      { id: 'e2', source: 'v2', target: 'v3', weight: 1 },
    ]);
    expect(result.warnings[0]).toMatch(/2 vértices sin coordenadas/);
    expect(result.name).toBe('Grafo importado');
  });

  it('conserva los identificadores del archivo y evita duplicarlos al generar nuevos', () => {
    const result = parseGraphJson(JSON.stringify({ vertices: [{ id: 'v2', label: 'A', x: 0, y: 0 }, { label: 'B', x: 1, y: 1 }], edges: [] }));
    expect(result.ok && result.graph.vertices.map((v) => v.id)).toEqual(['v2', 'v3']);
  });

  it.each([
    ['{ no es json', /JSON válido/],
    ['[1, 2]', /debe ser un objeto/],
    [JSON.stringify({ format: 'otro', vertices: [] }), /Formato no reconocido/],
    [JSON.stringify({ version: 2, vertices: [] }), /Versión/],
    [JSON.stringify({ edges: [] }), /Falta la lista «vertices»/],
    [JSON.stringify({ vertices: ['A', 'A'] }), /Ya existe un vértice llamado «A»/],
    [JSON.stringify({ vertices: ['A B'] }), /espacios/],
    [JSON.stringify({ vertices: ['A'], edges: [{ source: 'A', target: 'A' }] }), /lazos/],
    [JSON.stringify({ vertices: ['A'], edges: [{ source: 'A', target: 'Z' }] }), /vértice existente/],
    [JSON.stringify({ vertices: ['A', 'B'], edges: [{ source: 'A', target: 'B', weight: '3' }] }), /debe ser un número/],
    [JSON.stringify({ vertices: [{ id: 'x', label: 'A' }, { id: 'x', label: 'B' }] }), /«x» está repetido/],
    [JSON.stringify({ vertices: Array.from({ length: 61 }, (_, i) => `V${i}`) }), /máximo es 60/],
    [JSON.stringify({ directed: 'sí', vertices: [] }), /«directed»/],
  ])('rechaza datos inválidos (%#)', (text, message) => {
    expect(errorsOf(text)).toMatch(message);
  });

  it('informa varios errores a la vez, indicando el elemento', () => {
    const errors = errorsOf(JSON.stringify({ vertices: ['A', '', 'A'], edges: [{ source: 'A' }] }));
    expect(errors).toMatch(/Vértice 2/);
    expect(errors).toMatch(/Vértice 3/);
    expect(errors).toMatch(/Arista 1/);
  });

  it('genera nombres de archivo seguros', () => {
    expect(fileNameFor('Puentes de Königsberg (multigrafo)', 'json')).toBe('puentes-de-konigsberg-multigrafo.json');
    expect(fileNameFor('  ', 'svg')).toBe('grafo-sin-nombre.svg');
    expect(fileNameFor('***', 'png')).toBe('grafo.png');
  });
});

describe('validación de datos guardados', () => {
  it('acepta un grafo válido y rechaza datos alterados', () => {
    const graph = GRAPH_EXAMPLES[0]?.graph;
    expect(isGraph(graph)).toBe(true);
    expect(isGraph(null)).toBe(false);
    expect(isGraph({ ...graph, directed: 'no' })).toBe(false);
    expect(isGraph({ ...graph, edges: [{ id: 'e1', source: 'v1', target: 'v1', weight: 1 }] })).toBe(false);
    expect(isGraph({ ...graph, vertices: [{ id: 'v1', label: 'A', position: { x: 'a', y: 0 } }], edges: [] })).toBe(false);
  });
});
