import type { Vertex } from '@/types/graph';

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'variant' });

/**
 * Orden determinista de nombres de vértices: alfabético en español y numérico para los
 * dígitos («v2» antes que «v10»). Todos los listados, matrices y recorridos lo usan, de modo
 * que el mismo grafo produce siempre los mismos resultados.
 */
export function compareLabels(a: string, b: string): number {
  const result = collator.compare(a, b);
  if (result !== 0) return result;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortVerticesByLabel(vertices: readonly Vertex[]): Vertex[] {
  return [...vertices].sort((a, b) => compareLabels(a.label, b.label) || compareLabels(a.id, b.id));
}
