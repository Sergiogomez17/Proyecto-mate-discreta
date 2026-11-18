import { neighborLists } from '@/algorithms/graph/adjacency';
import type { Edge, Graph, VertexId } from '@/types/graph';

/**
 * Validadores que comprueban MATEMÁTICAMENTE una respuesta. Cuando hay varias respuestas correctas
 * (recorridos BFS/DFS con otro orden de vecinos, recorridos eulerianos, ciclos hamiltonianos,
 * caminos mínimos con empates…), se acepta cualquiera de ellas.
 */

export type Validation = { valid: true } | { valid: false; error: string };

/** Separa una respuesta escrita («A B C», «A, B, C», «A → B → C») en nombres. */
export function splitLabels(text: string): string[] {
  return text
    .split(/[\s,;→>-]+/)
    .map((t) => t.trim())
    .filter((t) => t !== '');
}

/** Convierte nombres en identificadores. Devuelve también los nombres que no existen. */
export function labelsToIds(graph: Graph, labels: readonly string[]): { ids: VertexId[]; unknown: string[] } {
  const byLabel = new Map(graph.vertices.map((v) => [v.label, v.id]));
  const byLower = new Map(graph.vertices.map((v) => [v.label.toLowerCase(), v.id]));
  const ids: VertexId[] = [];
  const unknown: string[] = [];
  for (const l of labels) {
    const id = byLabel.get(l) ?? byLower.get(l.toLowerCase());
    if (id === undefined) unknown.push(l);
    else ids.push(id);
  }
  return { ids, unknown };
}

function succ(graph: Graph): Map<VertexId, Set<VertexId>> {
  return new Map([...neighborLists(graph)].map(([id, list]) => [id, new Set(list.map((nb) => nb.vertex.id))]));
}

function reachableFrom(graph: Graph, start: VertexId): Set<VertexId> {
  const s = succ(graph);
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const u = stack.pop();
    if (u === undefined) break;
    for (const w of s.get(u) ?? []) {
      if (seen.has(w)) continue;
      seen.add(w);
      stack.push(w);
    }
  }
  return seen;
}

function commonChecks(graph: Graph, start: VertexId, order: readonly VertexId[], name: (id: VertexId) => string): Validation | Set<VertexId> {
  const reach = reachableFrom(graph, start);
  if (order[0] !== start) return { valid: false, error: `El recorrido debe empezar en ${name(start)}.` };
  const seen = new Set<VertexId>();
  for (const id of order) {
    if (seen.has(id)) return { valid: false, error: `${name(id)} aparece más de una vez: cada vértice se visita una sola vez.` };
    if (!reach.has(id)) return { valid: false, error: `${name(id)} no es alcanzable desde ${name(start)}.` };
    seen.add(id);
  }
  if (order.length < reach.size) {
    const missing = [...reach].filter((id) => !seen.has(id)).map(name);
    return { valid: false, error: `Faltan vértices alcanzables: ${missing.join(', ')}.` };
  }
  return reach;
}

/**
 * ¿Es `order` un orden de visita válido de BFS desde `start`, para ALGÚN orden de los vecinos?
 * Se simula la cola: al visitar u, sus vecinos aún no descubiertos deben aparecer a continuación
 * (en cualquier orden) antes de los descubiertos por vértices posteriores.
 */
export function validateBfsOrder(graph: Graph, start: VertexId, order: readonly VertexId[]): Validation {
  const name = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const base = commonChecks(graph, start, order, name);
  if (!(base instanceof Set)) return base;
  const s = succ(graph);
  const discovered = new Set([start]);
  let next = 1;
  for (let i = 0; i < order.length; i++) {
    const u = order[i];
    if (u === undefined) break;
    if (!discovered.has(u)) return { valid: false, error: `${name(u)} aparece antes de ser descubierto: aún no está en la cola.` };
    const fresh = [...(s.get(u) ?? [])].filter((w) => !discovered.has(w));
    const block = order.slice(next, next + fresh.length);
    const expected = new Set(fresh);
    const wrong = block.find((w) => !expected.has(w));
    if (wrong !== undefined) {
      return {
        valid: false,
        error: `Al visitar ${name(u)} se encolan sus vecinos no descubiertos (${fresh.map(name).join(', ')}); deben visitarse antes que ${name(wrong)}.`,
      };
    }
    for (const w of fresh) discovered.add(w);
    next += fresh.length;
  }
  return { valid: true };
}

/**
 * ¿Es `order` un orden de visita válido de DFS (recursivo) desde `start`, para algún orden de vecinos?
 * Cada vértice nuevo debe ser vecino no visitado del vértice más profundo de la pila que aún tenga
 * vecinos sin visitar.
 */
export function validateDfsOrder(graph: Graph, start: VertexId, order: readonly VertexId[]): Validation {
  const name = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const base = commonChecks(graph, start, order, name);
  if (!(base instanceof Set)) return base;
  const s = succ(graph);
  const visited = new Set([start]);
  const stack = [start];
  for (let i = 1; i < order.length; i++) {
    const v = order[i];
    if (v === undefined) break;
    const hasPending = (u: VertexId) => [...(s.get(u) ?? [])].some((w) => !visited.has(w));
    while (stack.length && !hasPending(stack[stack.length - 1] ?? '')) stack.pop();
    const top = stack[stack.length - 1];
    if (top === undefined) return { valid: false, error: `No queda ningún vértice con vecinos pendientes para llegar a ${name(v)}.` };
    if (!s.get(top)?.has(v)) {
      return {
        valid: false,
        error: `Después de ${name(order[i - 1] ?? top)}, DFS debe seguir desde ${name(top)} (el vértice más profundo con vecinos sin visitar), y ${name(v)} no es vecino de ${name(top)}.`,
      };
    }
    visited.add(v);
    stack.push(v);
  }
  return { valid: true };
}

/** ¿La secuencia de vértices es un recorrido euleriano (usa cada arista exactamente una vez)? */
export function validateEulerTrail(graph: Graph, seq: readonly VertexId[]): Validation {
  const name = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  if (seq.length < 2) return { valid: false, error: 'Escriba al menos dos vértices.' };
  const unused: Edge[] = [...graph.edges];
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1];
    const b = seq[i];
    const k = unused.findIndex((e) => (e.source === a && e.target === b) || (!graph.directed && e.source === b && e.target === a));
    if (k === -1) {
      const exists = graph.edges.some((e) => (e.source === a && e.target === b) || (!graph.directed && e.source === b && e.target === a));
      return {
        valid: false,
        error: exists
          ? `Paso ${i}: la arista ${name(a ?? '')}–${name(b ?? '')} ya se había usado; no se puede repetir.`
          : `Paso ${i}: no hay arista entre ${name(a ?? '')} y ${name(b ?? '')}.`,
      };
    }
    unused.splice(k, 1);
  }
  if (unused.length > 0) return { valid: false, error: `Faltan ${unused.length} ${unused.length === 1 ? 'arista' : 'aristas'} por recorrer.` };
  return { valid: true };
}

/** Peso de un camino usando, entre vértices consecutivos, la arista de menor peso. Null si no es camino. */
export function pathCost(graph: Graph, seq: readonly VertexId[]): number | null {
  let total = 0;
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1];
    const b = seq[i];
    const options = graph.edges.filter((e) => (e.source === a && e.target === b) || (!graph.directed && e.source === b && e.target === a));
    if (options.length === 0) return null;
    total += Math.min(...options.map((e) => (graph.weighted ? e.weight : 1)));
  }
  return total;
}

/** Lee un número escrito por el estudiante (acepta coma decimal y «∞» / «inf»). */
export function parseNumberAnswer(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (t === '') return null;
  if (['∞', 'inf', 'infinito', 'infinity'].includes(t)) return Infinity;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
