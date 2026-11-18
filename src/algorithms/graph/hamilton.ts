import type { Graph, Vertex, VertexId } from '@/types/graph';
import { componentIndex, neighborLists } from './adjacency';
import { sortVerticesByLabel } from './order';

/**
 * Caminos y ciclos hamiltonianos (visitan cada vértice exactamente una vez).
 *
 * La búsqueda es exacta (backtracking) pero tiene un límite de nodos explorados para no bloquear el
 * navegador. Por eso hay tres resultados posibles, que nunca se confunden:
 * - «found»: se encontró una solución (y se puede verificar).
 * - «none»: se DEMOSTRÓ que no existe, por un argumento estructural o por una búsqueda completa.
 * - «limit»: la búsqueda se detuvo por el límite; no se puede afirmar nada.
 *
 * Convenciones: los arcos se recorren en su sentido; las aristas paralelas no cambian el resultado;
 * un ciclo hamiltoniano requiere al menos 3 vértices.
 */

export type HamiltonKind = 'path' | 'cycle';

export type HamiltonResult =
  | { status: 'found'; route: VertexId[]; explored: number }
  | { status: 'none'; reason: string; explored: number; byExhaustiveSearch: boolean }
  | { status: 'limit'; explored: number };

export interface HamiltonOptions {
  kind: HamiltonKind;
  /** Máximo de extensiones de la ruta que se exploran antes de detenerse. */
  limit: number;
  /** Fijar el vértice inicial (opcional). */
  start?: VertexId | null;
}

export const HAMILTON_LIMITS = [10_000, 100_000, 1_000_000] as const;

/** Argumentos que demuestran, sin buscar, que no existe la ruta pedida. */
function structuralProof(graph: Graph, kind: HamiltonKind, start: VertexId | null): string | null {
  const n = graph.vertices.length;
  if (n === 0) return 'El grafo no tiene vértices.';
  if (kind === 'cycle' && n < 3) return 'Por convención, un ciclo hamiltoniano requiere al menos 3 vértices.';
  if (n === 1) return null;

  const comp = componentIndex(graph.vertices, graph.edges);
  if (new Set(comp.values()).size > 1) return 'El grafo no es conexo: ninguna ruta puede pasar por vértices de componentes distintas.';

  const out = neighborLists(graph);
  const inDeg = new Map<VertexId, number>(graph.vertices.map((v) => [v.id, 0]));
  for (const list of out.values()) for (const nb of list) inDeg.set(nb.vertex.id, (inDeg.get(nb.vertex.id) ?? 0) + 1);
  const ordered = sortVerticesByLabel(graph.vertices);
  const names = (vs: Vertex[]) => vs.map((v) => v.label).join(', ');

  if (!graph.directed) {
    const deg = (v: Vertex) => out.get(v.id)?.length ?? 0;
    const leaves = ordered.filter((v) => deg(v) === 1);
    if (kind === 'cycle' && leaves.length > 0) return `${names(leaves)} ${leaves.length === 1 ? 'tiene' : 'tienen'} un solo vecino: en un ciclo cada vértice necesita dos vecinos distintos.`;
    if (kind === 'path' && leaves.length > 2) return `Hay ${leaves.length} vértices con un solo vecino (${names(leaves)}); cada uno debería ser un extremo del camino, y un camino solo tiene dos extremos.`;
    if (kind === 'path' && start && leaves.length === 2 && !leaves.some((v) => v.id === start)) {
      return `Con inicio fijo en ${graph.vertices.find((v) => v.id === start)?.label ?? start}: los vértices ${names(leaves)} tienen un solo vecino y ambos deberían ser extremos del camino.`;
    }
    return null;
  }
  const noIn = ordered.filter((v) => (inDeg.get(v.id) ?? 0) === 0);
  const noOut = ordered.filter((v) => (out.get(v.id)?.length ?? 0) === 0);
  if (kind === 'cycle' && noIn.length > 0) return `${names(noIn)} no ${noIn.length === 1 ? 'recibe' : 'reciben'} ningún arco: no se puede llegar a ${noIn.length === 1 ? 'él' : 'ellos'} en un ciclo.`;
  if (kind === 'cycle' && noOut.length > 0) return `De ${names(noOut)} no sale ningún arco: un ciclo no podría continuar.`;
  if (kind === 'path' && noIn.length > 1) return `${names(noIn)} no reciben arcos; todos deberían ser el inicio del camino, que es uno solo.`;
  if (kind === 'path' && noOut.length > 1) return `De ${names(noOut)} no salen arcos; todos deberían ser el final del camino, que es uno solo.`;
  return null;
}

export function searchHamilton(graph: Graph, options: HamiltonOptions): HamiltonResult {
  const { kind, limit } = options;
  const start = options.start ?? null;
  const proof = structuralProof(graph, kind, start);
  if (proof) return { status: 'none', reason: proof, explored: 0, byExhaustiveSearch: false };

  const n = graph.vertices.length;
  const ordered = sortVerticesByLabel(graph.vertices);
  if (n === 1 && ordered[0]) return { status: 'found', route: [ordered[0].id], explored: 1 };

  const out = neighborLists(graph);
  const succ = new Map<VertexId, VertexId[]>([...out].map(([id, list]) => [id, list.map((nb) => nb.vertex.id)]));
  const hasArc = (a: VertexId, b: VertexId) => succ.get(a)?.includes(b) ?? false;

  // Posibles inicios. En un ciclo cualquier vértice sirve (se fija el primero). En un camino
  // no dirigido, si hay vértices con un solo vecino, el camino debe empezar en uno de ellos;
  // en uno dirigido, si un vértice no recibe arcos, debe ser el inicio.
  let starts: VertexId[];
  if (start) starts = [start];
  else if (kind === 'cycle') starts = ordered[0] ? [ordered[0].id] : [];
  else if (!graph.directed) {
    const leaves = ordered.filter((v) => (succ.get(v.id)?.length ?? 0) === 1).map((v) => v.id);
    starts = leaves.length > 0 ? leaves : ordered.map((v) => v.id);
  } else {
    const indeg = new Map<VertexId, number>();
    for (const list of succ.values()) for (const w of list) indeg.set(w, (indeg.get(w) ?? 0) + 1);
    const sources = ordered.filter((v) => (indeg.get(v.id) ?? 0) === 0).map((v) => v.id);
    starts = sources.length > 0 ? sources : ordered.map((v) => v.id);
  }

  let explored = 0;
  let aborted = false;
  const route: VertexId[] = [];
  const visited = new Set<VertexId>();

  const extend = (u: VertexId): boolean => {
    if (route.length === n) return kind === 'path' || hasArc(u, route[0] ?? u);
    for (const w of succ.get(u) ?? []) {
      if (visited.has(w)) continue;
      if (++explored > limit) {
        aborted = true;
        return false;
      }
      visited.add(w);
      route.push(w);
      if (extend(w)) return true;
      if (aborted) return false;
      route.pop();
      visited.delete(w);
    }
    return false;
  };

  for (const s of starts) {
    route.length = 0;
    visited.clear();
    route.push(s);
    visited.add(s);
    explored++;
    if (extend(s)) return { status: 'found', route: [...route], explored };
    if (aborted) return { status: 'limit', explored };
  }
  const where = start ? ` empezando en ${graph.vertices.find((v) => v.id === start)?.label ?? start}` : '';
  return {
    status: 'none',
    reason: `La búsqueda exhaustiva revisó todas las rutas posibles${where} y ninguna visita todos los vértices${kind === 'cycle' ? ' volviendo al inicio' : ''}.`,
    explored,
    byExhaustiveSearch: true,
  };
}

export interface RouteCheck {
  /** La ruta es un camino (o ciclo) hamiltoniano válido. */
  valid: boolean;
  /** Mensajes de error, en el orden en que aparecen en la ruta. */
  issues: string[];
  /** Índices de la ruta con un paso inválido (vértice repetido o sin conexión con el anterior). */
  badSteps: Set<number>;
  missing: Vertex[];
  repeated: Vertex[];
}

/** Verifica una ruta propuesta por el usuario (lista de vértices en orden). */
export function checkHamiltonRoute(graph: Graph, route: readonly VertexId[], kind: HamiltonKind): RouteCheck {
  const byId = new Map(graph.vertices.map((v) => [v.id, v]));
  const succ = neighborLists(graph);
  const adjacent = (a: VertexId, b: VertexId) => succ.get(a)?.some((nb) => nb.vertex.id === b) ?? false;
  const label = (id: VertexId) => byId.get(id)?.label ?? id;
  const issues: string[] = [];
  const badSteps = new Set<number>();
  const seen = new Set<VertexId>();
  const repeated: Vertex[] = [];

  route.forEach((id, i) => {
    if (seen.has(id)) {
      badSteps.add(i);
      const v = byId.get(id);
      if (v && !repeated.includes(v)) repeated.push(v);
      issues.push(`Paso ${i + 1}: ${label(id)} ya fue visitado (no se puede repetir un vértice).`);
    }
    seen.add(id);
    const prev = route[i - 1];
    if (prev !== undefined && !adjacent(prev, id)) {
      badSteps.add(i);
      issues.push(`Paso ${i + 1}: no hay ${graph.directed ? 'arco' : 'arista'} de ${label(prev)} a ${label(id)}.`);
    }
  });

  const missing = sortVerticesByLabel(graph.vertices).filter((v) => !seen.has(v.id));
  if (route.length > 0 && missing.length > 0) issues.push(`Faltan por visitar: ${missing.map((v) => v.label).join(', ')}.`);

  const first = route[0];
  const last = route[route.length - 1];
  let closes = true;
  if (kind === 'cycle') {
    if (graph.vertices.length < 3) {
      closes = false;
      issues.push('Un ciclo hamiltoniano requiere al menos 3 vértices.');
    } else if (first !== undefined && last !== undefined && missing.length === 0 && !adjacent(last, first)) {
      closes = false;
      issues.push(`Para cerrar el ciclo falta ${graph.directed ? 'un arco' : 'una arista'} de ${label(last)} a ${label(first)}.`);
    }
  }
  const valid = route.length === graph.vertices.length && route.length > 0 && badSteps.size === 0 && missing.length === 0 && closes;
  return { valid, issues, badSteps, missing, repeated };
}
