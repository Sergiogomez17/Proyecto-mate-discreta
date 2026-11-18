import type { Graph, Vertex, VertexId } from '@/types/graph';
import { componentIndex } from './adjacency';
import { sortVerticesByLabel } from './order';

/**
 * Isomorfismo de grafos: una biyección f entre los vértices de G1 y G2 que conserva las conexiones.
 * Para cada par (u, w) de G1, el número de aristas de u a w debe ser igual al de f(u) a f(w) en G2
 * (así se respetan las aristas paralelas y, en dirigidos, el sentido). Los pesos no intervienen.
 *
 * Las diferencias en invariantes (número de vértices, aristas, secuencias de grados, componentes…)
 * DEMUESTRAN que no son isomorfos, pero su igualdad NO prueba el isomorfismo: para eso hace falta
 * encontrar una correspondencia válida, lo que hace la búsqueda exacta por backtracking.
 */

type Matrix = Map<VertexId, Map<VertexId, number>>;

function multiplicity(graph: Graph): Matrix {
  const m: Matrix = new Map(graph.vertices.map((v) => [v.id, new Map<VertexId, number>()]));
  const add = (a: VertexId, b: VertexId) => {
    const row = m.get(a);
    if (row) row.set(b, (row.get(b) ?? 0) + 1);
  };
  for (const e of graph.edges) {
    add(e.source, e.target);
    if (!graph.directed) add(e.target, e.source);
  }
  return m;
}

const count = (m: Matrix, a: VertexId, b: VertexId) => m.get(a)?.get(b) ?? 0;

interface Degrees {
  total: Map<VertexId, number>;
  inDeg: Map<VertexId, number>;
  outDeg: Map<VertexId, number>;
}

function degrees(graph: Graph): Degrees {
  const total = new Map<VertexId, number>(graph.vertices.map((v) => [v.id, 0]));
  const inDeg = new Map(total);
  const outDeg = new Map(total);
  for (const e of graph.edges) {
    total.set(e.source, (total.get(e.source) ?? 0) + 1);
    total.set(e.target, (total.get(e.target) ?? 0) + 1);
    outDeg.set(e.source, (outDeg.get(e.source) ?? 0) + 1);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }
  return { total, inDeg, outDeg };
}

const sequence = (values: Iterable<number>) => [...values].sort((a, b) => b - a);
const seqText = (values: number[]) => (values.length ? `(${values.join(', ')})` : '()');

export interface InvariantRow {
  name: string;
  g1: string;
  g2: string;
  equal: boolean;
}

function triangles(graph: Graph): number {
  // Número de triángulos del grafo subyacente simple (invariante adicional, útil para distinguir
  // grafos con la misma secuencia de grados, como K3,3 y el prisma).
  const adj = new Map<VertexId, Set<VertexId>>(graph.vertices.map((v) => [v.id, new Set()]));
  for (const e of graph.edges) {
    adj.get(e.source)?.add(e.target);
    adj.get(e.target)?.add(e.source);
  }
  const ids = graph.vertices.map((v) => v.id);
  let t = 0;
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      for (let k = j + 1; k < ids.length; k++) {
        const [a, b, c] = [ids[i], ids[j], ids[k]];
        if (a && b && c && adj.get(a)?.has(b) && adj.get(b)?.has(c) && adj.get(a)?.has(c)) t++;
      }
  return t;
}

/** Tabla comparativa de invariantes. Una fila distinta basta para concluir que no son isomorfos. */
export function compareInvariants(g1: Graph, g2: Graph): InvariantRow[] {
  const d1 = degrees(g1);
  const d2 = degrees(g2);
  const rows: InvariantRow[] = [];
  const row = (name: string, a: string, b: string) => rows.push({ name, g1: a, g2: b, equal: a === b });
  const type = (g: Graph) => (g.directed ? 'Dirigido' : 'No dirigido');
  row('Tipo', type(g1), type(g2));
  row('Vértices |V|', String(g1.vertices.length), String(g2.vertices.length));
  row(g1.directed && g2.directed ? 'Arcos |E|' : 'Aristas |E|', String(g1.edges.length), String(g2.edges.length));
  row('Secuencia de grados (ordenada)', seqText(sequence(d1.total.values())), seqText(sequence(d2.total.values())));
  if (g1.directed && g2.directed) {
    row('Grados de entrada (ordenados)', seqText(sequence(d1.inDeg.values())), seqText(sequence(d2.inDeg.values())));
    row('Grados de salida (ordenados)', seqText(sequence(d1.outDeg.values())), seqText(sequence(d2.outDeg.values())));
  }
  const comps = (g: Graph) => new Set(componentIndex(g.vertices, g.edges).values()).size;
  row('Componentes conexas', String(comps(g1)), String(comps(g2)));
  if (g1.vertices.length <= 60 && g2.vertices.length <= 60) row('Triángulos (ciclos de longitud 3)', String(triangles(g1)), String(triangles(g2)));
  return rows;
}

export type IsomorphismResult =
  | { status: 'isomorphic'; mapping: Map<VertexId, VertexId>; explored: number }
  | { status: 'not-isomorphic'; reason: string; explored: number; byExhaustiveSearch: boolean }
  | { status: 'limit'; explored: number };

export const ISOMORPHISM_LIMIT = 200_000;

/**
 * Búsqueda exacta de un isomorfismo por backtracking con poda:
 * - solo se prueban vértices con los mismos grados (y entrada/salida en dirigidos);
 * - cada asignación debe conservar el número de aristas con todos los vértices ya asignados;
 * - los vértices de G1 se asignan empezando por los de mayor grado y siguiendo sus vecinos.
 */
export function findIsomorphism(g1: Graph, g2: Graph, limit = ISOMORPHISM_LIMIT): IsomorphismResult {
  const invariants = compareInvariants(g1, g2);
  const differing = invariants.find((r) => !r.equal && r.name !== 'Triángulos (ciclos de longitud 3)');
  if (differing) {
    return { status: 'not-isomorphic', reason: `Difieren en «${differing.name}»: ${differing.g1} en G1 frente a ${differing.g2} en G2.`, explored: 0, byExhaustiveSearch: false };
  }
  const tri = invariants.find((r) => r.name.startsWith('Triángulos') && !r.equal);
  if (tri) {
    return { status: 'not-isomorphic', reason: `G1 tiene ${tri.g1} triángulos y G2 tiene ${tri.g2}: un isomorfismo conserva los triángulos.`, explored: 0, byExhaustiveSearch: false };
  }

  const m1 = multiplicity(g1);
  const m2 = multiplicity(g2);
  const d1 = degrees(g1);
  const d2 = degrees(g2);
  const key = (d: Degrees, id: VertexId) => `${d.total.get(id) ?? 0}|${d.inDeg.get(id) ?? 0}|${d.outDeg.get(id) ?? 0}`;

  // Orden de asignación: mayor grado primero y luego vecinos de lo ya ordenado (más poda temprana).
  const order: VertexId[] = [];
  const placed = new Set<VertexId>();
  const byDegree = sortVerticesByLabel(g1.vertices).sort((a, b) => (d1.total.get(b.id) ?? 0) - (d1.total.get(a.id) ?? 0));
  for (const root of byDegree) {
    if (placed.has(root.id)) continue;
    const queue = [root.id];
    placed.add(root.id);
    for (let h = 0; h < queue.length; h++) {
      const u = queue[h];
      if (u === undefined) break;
      order.push(u);
      const nbs = byDegree.filter((v) => !placed.has(v.id) && (count(m1, u, v.id) > 0 || count(m1, v.id, u) > 0));
      for (const v of nbs) {
        placed.add(v.id);
        queue.push(v.id);
      }
    }
  }

  const targets = sortVerticesByLabel(g2.vertices).map((v) => v.id);
  const mapping = new Map<VertexId, VertexId>();
  const used = new Set<VertexId>();
  let explored = 0;
  let aborted = false;

  const consistent = (u: VertexId, v: VertexId) => {
    if (count(m1, u, u) !== count(m2, v, v)) return false;
    for (const [a, b] of mapping) {
      if (count(m1, u, a) !== count(m2, v, b) || count(m1, a, u) !== count(m2, b, v)) return false;
    }
    return true;
  };

  const assign = (i: number): boolean => {
    const u = order[i];
    if (u === undefined) return true;
    for (const v of targets) {
      if (used.has(v) || key(d1, u) !== key(d2, v)) continue;
      if (++explored > limit) {
        aborted = true;
        return false;
      }
      if (!consistent(u, v)) continue;
      mapping.set(u, v);
      used.add(v);
      if (assign(i + 1)) return true;
      if (aborted) return false;
      mapping.delete(u);
      used.delete(v);
    }
    return false;
  };

  if (assign(0)) return { status: 'isomorphic', mapping: new Map(mapping), explored };
  if (aborted) return { status: 'limit', explored };
  return {
    status: 'not-isomorphic',
    reason: 'Los invariantes coinciden, pero la búsqueda exhaustiva probó todas las correspondencias compatibles con los grados y ninguna conserva todas las aristas.',
    explored,
    byExhaustiveSearch: true,
  };
}

export interface MappingCheck {
  valid: boolean;
  /** Todos los vértices de G1 tienen imagen. */
  complete: boolean;
  bijective: boolean;
  problems: string[];
  /** Pares de G1 cuya conexión no se conserva. */
  violations: Array<{ a: VertexId; b: VertexId; inG1: number; inG2: number }>;
}

/** Verifica una correspondencia propuesta (vértice de G1 → vértice de G2). */
export function checkMapping(g1: Graph, g2: Graph, proposal: ReadonlyMap<VertexId, VertexId>): MappingCheck {
  const problems: string[] = [];
  const l1 = new Map(g1.vertices.map((v) => [v.id, v.label]));
  const l2 = new Map(g2.vertices.map((v) => [v.id, v.label]));
  const name1 = (id: VertexId) => l1.get(id) ?? id;
  const name2 = (id: VertexId) => l2.get(id) ?? id;

  if (g1.directed !== g2.directed) problems.push('Los dos grafos deben ser del mismo tipo (ambos dirigidos o ambos no dirigidos).');
  if (g1.vertices.length !== g2.vertices.length) problems.push(`G1 tiene ${g1.vertices.length} vértices y G2 ${g2.vertices.length}: no puede haber una biyección.`);

  const unassigned = sortVerticesByLabel(g1.vertices).filter((v) => !l2.has(proposal.get(v.id) ?? ''));
  const complete = unassigned.length === 0;
  if (!complete) problems.push(`Falta asignar: ${unassigned.map((v) => v.label).join(', ')}.`);

  const preimages = new Map<VertexId, VertexId[]>();
  for (const [a, b] of proposal) if (l1.has(a) && l2.has(b)) preimages.set(b, [...(preimages.get(b) ?? []), a]);
  let injective = true;
  for (const [b, as] of preimages) {
    if (as.length > 1) {
      injective = false;
      problems.push(`${name2(b)} es imagen de varios vértices (${as.map(name1).join(', ')}): la correspondencia no es inyectiva.`);
    }
  }
  const bijective = complete && injective && g1.vertices.length === g2.vertices.length;

  const m1 = multiplicity(g1);
  const m2 = multiplicity(g2);
  const violations: MappingCheck['violations'] = [];
  const ids = sortVerticesByLabel(g1.vertices).map((v) => v.id);
  const word = (n: number) => (g1.directed ? (n === 1 ? 'arco' : 'arcos') : n === 1 ? 'arista' : 'aristas');
  for (let i = 0; i < ids.length; i++) {
    for (let j = g1.directed ? 0 : i; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      if (a === undefined || b === undefined) continue;
      const fa = proposal.get(a);
      const fb = proposal.get(b);
      if (fa === undefined || fb === undefined || !l2.has(fa) || !l2.has(fb)) continue;
      const x = count(m1, a, b);
      const y = count(m2, fa, fb);
      if (x !== y) {
        violations.push({ a, b, inG1: x, inG2: y });
        const sep = g1.directed ? '→' : '–';
        problems.push(`${name1(a)}${sep}${name1(b)}: ${x} ${word(x)} en G1, pero ${y} ${word(y)} entre ${name2(fa)}${sep}${name2(fb)} en G2.`);
      }
    }
  }
  return { valid: bijective && violations.length === 0 && g1.directed === g2.directed, complete, bijective, problems, violations };
}

export function describeMapping(g1: Graph, g2: Graph, mapping: ReadonlyMap<VertexId, VertexId>): Array<{ from: Vertex; to: Vertex }> {
  const v2 = new Map(g2.vertices.map((v) => [v.id, v]));
  return sortVerticesByLabel(g1.vertices).flatMap((from) => {
    const to = v2.get(mapping.get(from.id) ?? '');
    return to ? [{ from, to }] : [];
  });
}
