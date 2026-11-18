import { describe, expect, it } from 'vitest';
import { buildGraph, findExample, ISOMORPHISM_PAIRS } from '@/algorithms/graph/examples';
import { checkHamiltonRoute, searchHamilton } from '@/algorithms/graph/hamilton';
import { checkMapping, compareInvariants, findIsomorphism } from '@/algorithms/graph/isomorphism';
import type { Graph } from '@/types/graph';

const example = (id: string): Graph => {
  const g = findExample(id)?.graph;
  if (!g) throw new Error(id);
  return g;
};
const pair = (id: string) => {
  const p = ISOMORPHISM_PAIRS.find((x) => x.id === id);
  if (!p) throw new Error(id);
  return p;
};
const ids = (g: Graph, labels: string[]) => labels.map((l) => g.vertices.find((v) => v.label === l)?.id ?? `?${l}`);
const labels = (g: Graph, route: string[]) => route.map((id) => g.vertices.find((v) => v.id === id)?.label);
const V = (n: number): [string, number, number][] => Array.from({ length: n }, (_, i) => [String.fromCharCode(65 + i), 0, 0]);

describe('Hamilton: búsqueda', () => {
  it('encuentra un ciclo hamiltoniano en la casa y la ruta es válida', () => {
    const g = example('casa');
    const r = searchHamilton(g, { kind: 'cycle', limit: 10_000 });
    expect(r.status).toBe('found');
    if (r.status !== 'found') return;
    expect(checkHamiltonRoute(g, r.route, 'cycle').valid).toBe(true);
  });

  it('Petersen: tiene camino pero se demuestra que no tiene ciclo hamiltoniano', () => {
    const g = example('petersen');
    const path = searchHamilton(g, { kind: 'path', limit: 1_000_000 });
    expect(path.status).toBe('found');
    if (path.status === 'found') expect(checkHamiltonRoute(g, path.route, 'path').valid).toBe(true);
    const cycle = searchHamilton(g, { kind: 'cycle', limit: 1_000_000 });
    expect(cycle).toMatchObject({ status: 'none', byExhaustiveSearch: true });
  });

  it('con un límite pequeño informa búsqueda incompleta, no «no existe»', () => {
    const r = searchHamilton(example('petersen'), { kind: 'cycle', limit: 20 });
    expect(r.status).toBe('limit');
  });

  it('demuestra la inexistencia por argumentos estructurales', () => {
    const estrella = buildGraph({ directed: false, weighted: false, vertices: V(4), edges: [['A', 'B'], ['A', 'C'], ['A', 'D']] });
    const p = searchHamilton(estrella, { kind: 'path', limit: 10 });
    expect(p).toMatchObject({ status: 'none', byExhaustiveSearch: false });
    if (p.status === 'none') expect(p.reason).toMatch(/3 vértices con un solo vecino/);
    expect(searchHamilton(estrella, { kind: 'cycle', limit: 10 }).status).toBe('none');
    expect(searchHamilton(example('desconexo'), { kind: 'path', limit: 10 })).toMatchObject({ status: 'none', explored: 0 });
    const dos = buildGraph({ directed: false, weighted: false, vertices: V(2), edges: [['A', 'B'], ['A', 'B']] });
    const c = searchHamilton(dos, { kind: 'cycle', limit: 10 });
    expect(c.status === 'none' && c.reason).toMatch(/al menos 3 vértices/);
  });

  it('respeta el sentido de los arcos y el inicio fijo', () => {
    const g = buildGraph({ directed: true, weighted: false, vertices: V(3), edges: [['A', 'B'], ['B', 'C']] });
    const r = searchHamilton(g, { kind: 'path', limit: 100 });
    expect(r.status === 'found' && labels(g, r.route)).toEqual(['A', 'B', 'C']);
    expect(searchHamilton(g, { kind: 'cycle', limit: 100 }).status).toBe('none');
    expect(searchHamilton(g, { kind: 'path', limit: 100, start: ids(g, ['C'])[0] ?? null }).status).toBe('none');
  });
});

describe('Hamilton: verificación de rutas', () => {
  it('detecta repeticiones, saltos sin arista y vértices faltantes', () => {
    const g = example('casa');
    const r = checkHamiltonRoute(g, ids(g, ['A', 'B', 'A', 'E']), 'path');
    expect(r.valid).toBe(false);
    expect([...r.badSteps]).toEqual([2, 3]);
    expect(r.issues.join(' ')).toMatch(/A ya fue visitado/);
    expect(r.issues.join(' ')).toMatch(/no hay arista de A a E/);
    expect(r.missing.map((v) => v.label)).toEqual(['C', 'D']);
  });

  it('exige la arista de cierre en un ciclo', () => {
    const g = example('casa');
    expect(checkHamiltonRoute(g, ids(g, ['A', 'B', 'D', 'E', 'C']), 'path').valid).toBe(true);
    expect(checkHamiltonRoute(g, ids(g, ['A', 'B', 'D', 'E', 'C']), 'cycle').valid).toBe(true);
    // Un camino hamiltoniano cuyos extremos no son adyacentes no forma ciclo.
    expect(checkHamiltonRoute(g, ids(g, ['B', 'A', 'C', 'E', 'D']), 'path').valid).toBe(true);
    const k = buildGraph({ directed: false, weighted: false, vertices: V(4), edges: [['A', 'B'], ['B', 'C'], ['C', 'D']] });
    const notClosed = checkHamiltonRoute(k, ids(k, ['A', 'B', 'C', 'D']), 'cycle');
    expect(notClosed.valid).toBe(false);
    expect(notClosed.issues.join(' ')).toMatch(/falta una arista de D a A/);
  });
});

describe('isomorfismo', () => {
  it('encuentra una correspondencia válida entre el pentágono y la estrella', () => {
    const { g1, g2 } = pair('pentagono-estrella');
    const r = findIsomorphism(g1, g2);
    expect(r.status).toBe('isomorphic');
    if (r.status === 'isomorphic') expect(checkMapping(g1, g2, r.mapping).valid).toBe(true);
  });

  it('K3,3 y el prisma: invariantes básicos iguales, pero no son isomorfos', () => {
    const { g1, g2 } = pair('k33-prisma');
    const rows = compareInvariants(g1, g2);
    expect(rows.filter((r) => !r.equal).map((r) => r.name)).toEqual(['Triángulos (ciclos de longitud 3)']);
    const r = findIsomorphism(g1, g2);
    expect(r.status).toBe('not-isomorphic');
  });

  it('un grafo reetiquetado es isomorfo a sí mismo', () => {
    const { g2 } = pair('k33-prisma');
    const relabeled = { ...g2, vertices: g2.vertices.map((v) => ({ ...v, label: `p${v.label}` })) };
    expect(findIsomorphism(g2, relabeled).status).toBe('isomorphic');
  });

  it('con todos los invariantes iguales, la búsqueda exhaustiva demuestra que no son isomorfos', () => {
    // C8 con una cuerda entre vértices opuestos frente a C8 con una cuerda a distancia 3:
    // mismos grados, conexos, sin triángulos; el primero forma dos ciclos de 5 y el segundo uno de 4.
    const ring: Array<[string, string]> = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((l, i, all) => [l, all[(i + 1) % 8] ?? 'A']);
    const g1 = buildGraph({ directed: false, weighted: false, vertices: V(8), edges: [...ring, ['A', 'E']] });
    const g2 = buildGraph({ directed: false, weighted: false, vertices: V(8), edges: [...ring, ['A', 'D']] });
    expect(compareInvariants(g1, g2).every((r) => r.equal)).toBe(true);
    const r = findIsomorphism(g1, g2);
    expect(r).toMatchObject({ status: 'not-isomorphic', byExhaustiveSearch: true });
    expect(findIsomorphism(g1, g2, 3).status).toBe('limit');
  });

  it('C6 y dos triángulos: la secuencia de grados coincide pero el número de componentes no', () => {
    const { g1, g2 } = pair('ciclo-triangulos');
    const r = findIsomorphism(g1, g2);
    expect(r).toMatchObject({ status: 'not-isomorphic', byExhaustiveSearch: false });
    if (r.status === 'not-isomorphic') expect(r.reason).toMatch(/Componentes conexas/);
  });

  it('en grafos dirigidos conserva el sentido de los arcos', () => {
    const { g1, g2 } = pair('dirigidos');
    const r = findIsomorphism(g1, g2);
    expect(r.status).toBe('isomorphic');
    // Una «estrella de salida» y una «estrella de entrada» tienen el mismo grafo subyacente.
    const out = buildGraph({ directed: true, weighted: false, vertices: V(3), edges: [['A', 'B'], ['A', 'C']] });
    const into = buildGraph({ directed: true, weighted: false, vertices: V(3), edges: [['B', 'A'], ['C', 'A']] });
    const rows = compareInvariants(out, into);
    expect(rows.find((r) => r.name.startsWith('Secuencia de grados'))?.equal).toBe(true);
    expect(findIsomorphism(out, into).status).toBe('not-isomorphic');
  });

  it('distingue tipos distintos y multiplicidades', () => {
    const a = buildGraph({ directed: false, weighted: false, vertices: V(2), edges: [['A', 'B'], ['A', 'B']] });
    const b = buildGraph({ directed: false, weighted: false, vertices: V(3), edges: [['A', 'B'], ['B', 'C']] });
    expect(findIsomorphism(a, b).status).toBe('not-isomorphic');
    expect(findIsomorphism(a, { ...a, directed: true }).status).toBe('not-isomorphic');
  });

  it('verifica correspondencias propuestas: biyectividad y conservación de aristas', () => {
    const { g1, g2 } = pair('pentagono-estrella');
    const m = (pairs: Array<[string, string]>) => new Map(pairs.map(([a, b]) => [ids(g1, [a])[0] ?? '', ids(g2, [b])[0] ?? '']));
    const identity = checkMapping(g1, g2, m([['A', '1'], ['B', '2'], ['C', '3'], ['D', '4'], ['E', '5']]));
    expect(identity.bijective).toBe(true);
    expect(identity.valid).toBe(false);
    expect(identity.problems[0]).toMatch(/A–B: 1 arista en G1, pero 0 aristas entre 1–2 en G2/);
    const good = checkMapping(g1, g2, m([['A', '1'], ['B', '3'], ['C', '5'], ['D', '2'], ['E', '4']]));
    expect(good.valid).toBe(true);
    const repeated = checkMapping(g1, g2, m([['A', '1'], ['B', '1']]));
    expect(repeated.bijective).toBe(false);
    expect(repeated.problems.join(' ')).toMatch(/Falta asignar: C, D, E/);
    expect(repeated.problems.join(' ')).toMatch(/1 es imagen de varios vértices \(A, B\)/);
  });
});
