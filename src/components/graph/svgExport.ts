import type { Graph } from '@/types/graph';
import { ARROW_GAP, edgeGeometry, edgeOffsets, formatWeight, VERTEX_RADIUS } from './geometry';

const PADDING = 40;
const COLORS = {
  background: '#EDF4FC',
  edge: '#475569',
  vertexFill: '#FFFFFF',
  vertexStroke: '#071A42',
  text: '#061438',
  weightFill: '#FFFFFF',
  weightStroke: '#7C3AED',
};

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export interface SvgExport {
  svg: string;
  width: number;
  height: number;
}

/**
 * Dibujo del grafo como documento SVG independiente (para descargar o convertir a PNG).
 * Usa la misma geometría que el lienzo del editor, por lo que el resultado coincide con lo que se ve.
 */
export function graphToSvg(graph: Graph, title = 'Grafo'): SvgExport {
  const xs = graph.vertices.map((v) => v.position.x);
  const ys = graph.vertices.map((v) => v.position.y);
  const minX = (xs.length ? Math.min(...xs) : 0) - VERTEX_RADIUS - PADDING;
  const minY = (ys.length ? Math.min(...ys) : 0) - VERTEX_RADIUS - PADDING;
  const maxX = (xs.length ? Math.max(...xs) : 0) + VERTEX_RADIUS + PADDING;
  const maxY = (ys.length ? Math.max(...ys) : 0) + VERTEX_RADIUS + PADDING;
  const width = Math.round(maxX - minX);
  const height = Math.round(maxY - minY);

  const byId = new Map(graph.vertices.map((v) => [v.id, v]));
  const offsets = edgeOffsets(graph);
  const edgeParts: string[] = [];
  const weightParts: string[] = [];

  for (const edge of graph.edges) {
    const s = byId.get(edge.source);
    const t = byId.get(edge.target);
    if (!s || !t) continue;
    const geo = edgeGeometry(s.position, t.position, offsets.get(edge.id) ?? 0, VERTEX_RADIUS, graph.directed ? ARROW_GAP : 0);
    edgeParts.push(
      `<path d="${geo.path}" fill="none" stroke="${COLORS.edge}" stroke-width="2"${graph.directed ? ' marker-end="url(#flecha)"' : ''}/>`,
    );
    if (graph.weighted) {
      const text = formatWeight(edge.weight);
      const w = Math.max(22, text.length * 8 + 10);
      weightParts.push(
        `<g><rect x="${geo.labelX - w / 2}" y="${geo.labelY - 10}" width="${w}" height="20" rx="6" fill="${COLORS.weightFill}" stroke="${COLORS.weightStroke}" stroke-width="1.2"/>` +
          `<text x="${geo.labelX}" y="${geo.labelY + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="${COLORS.text}">${escapeXml(text)}</text></g>`,
      );
    }
  }

  const vertexParts = graph.vertices.map((v) => {
    const size = [...v.label].length > 3 ? 11 : 15;
    return (
      `<g><circle cx="${v.position.x}" cy="${v.position.y}" r="${VERTEX_RADIUS}" fill="${COLORS.vertexFill}" stroke="${COLORS.vertexStroke}" stroke-width="2"/>` +
      `<text x="${v.position.x}" y="${v.position.y + size / 3}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${COLORS.text}">${escapeXml(v.label)}</text></g>`
    );
  });

  const marker = graph.directed
    ? `<defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${COLORS.edge}"/></marker></defs>`
    : '';

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" font-family="Inter, 'Segoe UI', Arial, sans-serif" role="img">`,
    `<title>${escapeXml(title)}</title>`,
    marker,
    `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${COLORS.background}"/>`,
    ...edgeParts,
    ...weightParts,
    ...vertexParts,
    '</svg>',
  ].join('\n');
  return { svg, width, height };
}
