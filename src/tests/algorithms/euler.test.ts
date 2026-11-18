import { describe, expect, it } from 'vitest';
import {
  analyzeEuler,
  applyFleuryStep,
  canCompleteTrail,
  checkEulerStart,
  findBridges,
  fleuryOptions,
  runFleury,
  startFleury,
} from '@/algorithms/graph/euler';
import { buildGraph, findExample } from '@/algorithms/graph/examples';
import type { Graph } from '@/types/graph';

const example = (id: string): Graph => {
  const g = findExample(id)?.graph;
  if (!g) throw new Error(id);
  return g;
};
const idOf = (g: Graph, label: string) => g.vertices.find((v) => v.label === label)?.id ?? '';
const labelsOf = (g: Graph, ids: string[]) => ids.map((id) => g.vertices.find((v) => v.id === id)?.label);
const P = (x: number): [string, number, number][] => Array.from({ length: x }, (_, i) => [String.fromCharCode(65 + i), 0, 0]);

/** Comprueba que un recorrido usa cada arista exactamente una vez y es continuo. */
function assertEulerTrail(g: Graph, trail: string[], used: string[]) {
  expect(new Set(used).size).toBe(g.edges.length);
  expect(used).toHaveLength(g.edges.length);
  used.forEach((edgeId, i) => {
    const e = g.edges.find((x) => x.id === edgeId);
    const a = trail[i];
    const b = trail[i + 1];
    expect(e).toBeDefined();
    if (!e) return;
    const ok = (e.source === a && e.target === b) || (!g.directed && e.source === b && e.target === a);
    expect(ok).toBe(true);
  });
}

describe('clasificación euleriana', () => {
  it('K5 (todos los grados pares) tiene circuito euleriano', () => {
    const a = analyzeEuler(example('completo'));
    expect(a.kind).toBe('circuit');
    expect(a.oddVertices).toHaveLength(0);
    expect(a.starts).toHaveLength(5);
  });

  it('la casa (dos vértices impares) tiene camino euleriano entre ellos', () => {
    const g = example('casa');
    const a = analyzeEuler(g);
    expect(a.kind).toBe('path');
    expect(labelsOf(g, a.starts)).toEqual(['B', 'C']);
  });

  it('Königsberg (cuatro vértices impares) no tiene recorrido euleriano', () => {
    const a = analyzeEuler(example('konigsberg'));
    expect(a.kind).toBe('none');
    expect(a.oddVertices.map((v) => v.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(a.reasons.at(-1)).toMatch(/4 vértices de grado impar/);
  });

  it('ignora los vértices aislados pero exige que las aristas estén conectadas', () => {
    const conIsla = buildGraph({ directed: false, weighted: false, vertices: P(4), edges: [['A', 'B'], ['B', 'C'], ['C', 'A']] });
    const a = analyzeEuler(conIsla);
    expect(a.kind).toBe('circuit');
    expect(a.isolated.map((v) => v.label)).toEqual(['D']);
    expect(a.starts).not.toContain(idOf(conIsla, 'D'));

    const dosTriangulos = buildGraph({
      directed: false,
      weighted: false,
      vertices: P(6),
      edges: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['E', 'F'], ['F', 'D']],
    });
    expect(analyzeEuler(dosTriangulos)).toMatchObject({ kind: 'none', connected: false });
  });

  it('un grafo sin aristas no tiene recorrido que hacer', () => {
    expect(analyzeEuler(buildGraph({ directed: false, weighted: false, vertices: P(2), edges: [] })).kind).toBe('no-edges');
  });

  it('en grafos dirigidos usa el equilibrio entre entrada y salida', () => {
    const ciclo = buildGraph({ directed: true, weighted: false, vertices: P(3), edges: [['A', 'B'], ['B', 'C'], ['C', 'A']] });
    expect(analyzeEuler(ciclo).kind).toBe('circuit');
    const camino = buildGraph({ directed: true, weighted: false, vertices: P(3), edges: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'C']] });
    const a = analyzeEuler(camino);
    expect(a.kind).toBe('path');
    expect(labelsOf(camino, a.starts)).toEqual(['A']);
    const nada = buildGraph({ directed: true, weighted: false, vertices: P(3), edges: [['A', 'B'], ['A', 'C']] });
    expect(analyzeEuler(nada).kind).toBe('none');
  });

  it('valida el vértice inicial', () => {
    const g = example('casa');
    const a = analyzeEuler(g);
    expect(checkEulerStart(g, a, idOf(g, 'B')).ok).toBe(true);
    const bad = checkEulerStart(g, a, idOf(g, 'A'));
    expect(bad.ok).toBe(false);
    expect(bad.message).toMatch(/debe empezar en B o C/);
  });
});

describe('puentes', () => {
  it('detecta los puentes de un camino y de una arista que une dos ciclos', () => {
    const g = buildGraph({
      directed: false,
      weighted: false,
      vertices: P(6),
      edges: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'D']],
    });
    const bridges = findBridges(g.vertices.map((v) => v.id), g.edges);
    expect([...bridges]).toEqual(['e4']); // C–D
  });

  it('las aristas paralelas nunca son puente', () => {
    const g = buildGraph({ directed: false, weighted: false, vertices: P(3), edges: [['A', 'B'], ['A', 'B'], ['B', 'C']] });
    expect([...findBridges(g.vertices.map((v) => v.id), g.edges)]).toEqual(['e3']);
  });
});

describe('algoritmo de Fleury', () => {
  it.each(['casa', 'completo', 'empates'])('produce un recorrido euleriano válido cuando existe (%s)', (id) => {
    const g = example(id);
    const a = analyzeEuler(g);
    expect(['circuit', 'path']).toContain(a.kind);
    const start = a.starts[0] ?? '';
    const run = runFleury(g, start);
    expect(run.complete).toBe(true);
    assertEulerTrail(g, run.state.trail, run.state.used);
    if (a.kind === 'circuit') expect(run.state.trail.at(-1)).toBe(start);
  });

  it('funciona con multigrafos y con grafos dirigidos', () => {
    const multi = buildGraph({ directed: false, weighted: false, vertices: P(3), edges: [['A', 'B'], ['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'B'], ['B', 'A']] });
    const a = analyzeEuler(multi);
    const run = runFleury(multi, a.starts[0] ?? '');
    expect(run.complete).toBe(true);
    assertEulerTrail(multi, run.state.trail, run.state.used);

    const dir = buildGraph({ directed: true, weighted: false, vertices: P(4), edges: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'D'], ['D', 'A'], ['C', 'D'], ['D', 'C']] });
    const ad = analyzeEuler(dir);
    expect(ad.kind).toBe('circuit');
    const rd = runFleury(dir, idOf(dir, 'A'));
    expect(rd.complete).toBe(true);
    assertEulerTrail(dir, rd.state.trail, rd.state.used);
  });

  it('marca como evitable un puente cuando hay otra opción', () => {
    // «Moño»: dos triángulos unidos en C; C–D es puente al empezar en B y llegar a C.
    const g = buildGraph({
      directed: false,
      weighted: false,
      vertices: P(5),
      edges: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D'], ['D', 'E'], ['E', 'C']],
    });
    // Desde C con todas las aristas sin usar: no hay puentes (dos ciclos que comparten C).
    const s0 = startFleury(idOf(g, 'C'));
    expect(fleuryOptions(g, s0).every((o) => !o.bridge)).toBe(true);
    // Tras C→A, desde A: A–B es la única opción (no evitable aunque sea puente).
    const toA = fleuryOptions(g, s0).find((o) => o.to === idOf(g, 'A'));
    if (!toA) throw new Error('sin opción');
    const s1 = applyFleuryStep(s0, toA);
    const fromA = fleuryOptions(g, s1);
    expect(fromA).toHaveLength(1);
    expect(fromA[0]?.avoidable).toBe(false);
  });

  it('detecta el puente evitable y que cruzarlo impide terminar', () => {
    // A–B colgando de un triángulo B–C–D. Grados impares: A y B.
    const g = buildGraph({ directed: false, weighted: false, vertices: P(4), edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'B']] });
    expect(analyzeEuler(g).kind).toBe('path');
    const fromB = fleuryOptions(g, startFleury(idOf(g, 'B')));
    const summary = fromB.map((o) => [labelsOf(g, [o.to])[0], o.bridge, o.avoidable, o.safe]);
    expect(summary).toEqual([
      ['A', true, true, false],
      ['C', false, false, true],
      ['D', false, false, true],
    ]);
    const run = runFleury(g, idOf(g, 'B'));
    expect(run.complete).toBe(true);
    expect(labelsOf(g, run.state.trail)).toEqual(['B', 'C', 'D', 'B', 'A']);
    expect(canCompleteTrail(g, g.edges.filter((e) => e.id !== 'e1'), idOf(g, 'A'))).toBe(false);
  });
});
