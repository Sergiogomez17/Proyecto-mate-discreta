import { describe, expect, it } from 'vitest';
import { buildGraph, GRAPH_EXAMPLES } from '@/algorithms/graph/examples';
import { edgeGeometry, edgeOffsets, formatWeight, PARALLEL_SPACING, VERTEX_RADIUS } from '@/components/graph/geometry';
import { graphToSvg } from '@/components/graph/svgExport';

describe('geometría de aristas', () => {
  it('una arista simple es recta y se recorta en el borde de ambos vértices', () => {
    const geo = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, 0);
    expect(geo.path).toBe(`M ${VERTEX_RADIUS} 0 L ${100 - VERTEX_RADIUS} 0`);
    expect([geo.labelX, geo.labelY]).toEqual([50, 0]);
  });

  it('una arista desplazada es una curva cuyo punto medio queda a la distancia indicada', () => {
    const geo = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, 20);
    expect(geo.path.startsWith('M ')).toBe(true);
    expect(geo.path).toContain(' Q 50 40 ');
    expect([geo.labelX, geo.labelY]).toEqual([50, 20]);
  });

  it('separa simétricamente las aristas paralelas', () => {
    const g = GRAPH_EXAMPLES.find((e) => e.id === 'konigsberg')?.graph;
    if (!g) throw new Error('falta el ejemplo');
    const offsets = edgeOffsets(g);
    expect([offsets.get('e1'), offsets.get('e2')]).toEqual([-PARALLEL_SPACING / 2, PARALLEL_SPACING / 2]);
    expect(offsets.get('e5')).toBe(0);
  });

  it('dibuja los arcos opuestos u→v y v→u en lados distintos', () => {
    const g = buildGraph({
      directed: true,
      weighted: false,
      vertices: [
        ['A', 0, 0],
        ['B', 100, 0],
      ],
      edges: [
        ['A', 'B'],
        ['B', 'A'],
      ],
    });
    const offsets = edgeOffsets(g);
    const ab = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, offsets.get('e1') ?? 0);
    const ba = edgeGeometry({ x: 100, y: 0 }, { x: 0, y: 0 }, offsets.get('e2') ?? 0);
    expect(Math.sign(ab.labelY)).toBe(-Math.sign(ba.labelY));
    expect(ab.labelY).not.toBe(0);
  });

  it('formatea los pesos con coma decimal y sin ceros sobrantes', () => {
    expect(formatWeight(2.5)).toBe('2,5');
    expect(formatWeight(3)).toBe('3');
    expect(formatWeight(1 / 3)).toBe('0,333');
    expect(formatWeight(-12000)).toBe('-12000');
  });
});

describe('exportación SVG', () => {
  it('incluye vértices, aristas, pesos y flechas según el tipo de grafo', () => {
    const g = GRAPH_EXAMPLES.find((e) => e.id === 'dirigido')?.graph;
    if (!g) throw new Error('falta el ejemplo');
    const { svg, width, height } = graphToSvg(g, 'Prueba <1> & "2"');
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('<title>Prueba &lt;1&gt; &amp; &quot;2&quot;</title>');
    expect(svg.match(/<circle /g)).toHaveLength(g.vertices.length);
    expect(svg.match(/marker-end="url\(#flecha\)"/g)).toHaveLength(g.edges.length);
    expect(svg).toContain('>7</text>');
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  it('omite flechas y pesos en un grafo no dirigido y no ponderado', () => {
    const g = GRAPH_EXAMPLES.find((e) => e.id === 'casa')?.graph;
    if (!g) throw new Error('falta el ejemplo');
    const { svg } = graphToSvg(g);
    expect(svg).not.toContain('marker');
    expect(svg).not.toContain('#7C3AED'); // sin etiquetas de peso
    expect(svg.match(/<path d=/g)).toHaveLength(g.edges.length);
  });

  it('exporta un grafo vacío sin errores', () => {
    expect(graphToSvg({ directed: false, weighted: false, vertices: [], edges: [] }).svg).toContain('</svg>');
  });
});
