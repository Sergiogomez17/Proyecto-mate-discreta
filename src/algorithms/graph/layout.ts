import type { Point } from '@/types/graph';

/** Posiciones sobre una circunferencia, empezando arriba y en sentido horario. */
export function circleLayout(count: number, center: Point = { x: 300, y: 240 }, radius?: number): Point[] {
  if (count <= 0) return [];
  if (count === 1) return [{ ...center }];
  // El radio crece con el número de vértices para mantener la separación entre ellos.
  const r = radius ?? Math.max(140, (count * 90) / (2 * Math.PI));
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return { x: Math.round(center.x + r * Math.cos(angle)), y: Math.round(center.y + r * Math.sin(angle)) };
  });
}
