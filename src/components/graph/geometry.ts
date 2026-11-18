import type { EdgeId, Graph, Point } from '@/types/graph';

/** Radio del círculo de cada vértice en el lienzo y en la exportación. */
export const VERTEX_RADIUS = 22;
/** Separación entre aristas que unen el mismo par de vértices. */
export const PARALLEL_SPACING = 34;
/** Espacio que se deja antes del borde del vértice destino para la punta de flecha. */
export const ARROW_GAP = 3;

/**
 * Desplazamiento lateral de cada arista. Las aristas entre el mismo par de vértices (paralelas,
 * o arcos opuestos u→v y v→u) se separan simétricamente para que ninguna quede oculta.
 * El signo se expresa respecto de un sentido canónico del par, de modo que dos aristas con
 * sentidos opuestos no se dibujen una encima de la otra.
 */
export function edgeOffsets(graph: Graph): Map<EdgeId, number> {
  const groups = new Map<string, Array<{ id: EdgeId; forward: boolean }>>();
  for (const e of graph.edges) {
    const forward = e.source < e.target;
    const key = forward ? `${e.source}\u0000${e.target}` : `${e.target}\u0000${e.source}`;
    const group = groups.get(key) ?? [];
    group.push({ id: e.id, forward });
    groups.set(key, group);
  }
  const offsets = new Map<EdgeId, number>();
  for (const group of groups.values()) {
    const n = group.length;
    group.forEach(({ id, forward }, i) => {
      const offset = (i - (n - 1) / 2) * PARALLEL_SPACING;
      offsets.set(id, forward ? offset : -offset);
    });
  }
  return offsets;
}

export interface EdgeGeometry {
  /** Trayectoria SVG (recta o curva cuadrática) recortada en el borde de ambos vértices. */
  path: string;
  /** Punto medio de la curva, donde se coloca el peso. */
  labelX: number;
  labelY: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Geometría de una arista entre dos centros. Con desplazamiento 0 es un segmento recto; si no,
 * una curva cuadrática cuyo vértice queda a `offset` píxeles de la recta que une los centros.
 */
export function edgeGeometry(source: Point, target: Point, offset: number, radius = VERTEX_RADIUS, endGap = 0): EdgeGeometry {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy);
  // Normal unitaria (a la izquierda del sentido origen → destino).
  const nx = length === 0 ? 0 : -dy / length;
  const ny = length === 0 ? -1 : dx / length;
  const mx = (source.x + target.x) / 2;
  const my = (source.y + target.y) / 2;
  // En t = 0,5 una curva cuadrática pasa por el punto medio entre la cuerda y el punto de control.
  const cx = mx + nx * offset * 2;
  const cy = my + ny * offset * 2;

  const trim = (from: Point, toward: Point, distance: number): Point => {
    const vx = toward.x - from.x;
    const vy = toward.y - from.y;
    const d = Math.hypot(vx, vy);
    if (d === 0 || distance >= d) return from;
    return { x: from.x + (vx / d) * distance, y: from.y + (vy / d) * distance };
  };
  const control = { x: cx, y: cy };
  const start = trim(source, offset === 0 ? target : control, radius);
  const end = trim(target, offset === 0 ? source : control, radius + endGap);

  const path =
    offset === 0
      ? `M ${r1(start.x)} ${r1(start.y)} L ${r1(end.x)} ${r1(end.y)}`
      : `M ${r1(start.x)} ${r1(start.y)} Q ${r1(cx)} ${r1(cy)} ${r1(end.x)} ${r1(end.y)}`;
  return { path, labelX: r1(mx + nx * offset), labelY: r1(my + ny * offset) };
}

/** Texto del peso: hasta tres decimales, sin ceros sobrantes y con coma decimal. */
export function formatWeight(weight: number): string {
  return Number(weight.toFixed(3)).toLocaleString('es', { maximumFractionDigits: 3, useGrouping: false });
}
