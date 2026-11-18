import { describe, expect, it } from 'vitest';
import { componentIndex } from '@/algorithms/graph/adjacency';
import { computeDegrees } from '@/algorithms/graph/degrees';
import { dijkstra, formatDistance, shortestPaths } from '@/algorithms/graph/dijkstra';
import { analyzeEuler, runFleury } from '@/algorithms/graph/euler';
import { buildGraph } from '@/algorithms/graph/examples';
import { searchHamilton } from '@/algorithms/graph/hamilton';
import { findIsomorphism } from '@/algorithms/graph/isomorphism';
import { traversalOrder } from '@/algorithms/graph/traversal';
import { computeProperties } from '@/algorithms/tree/properties';
import { traverse } from '@/algorithms/tree/traversals';
import { validateTree } from '@/algorithms/tree/validate';
import { generateExercise, gradeExercise, solutionOf } from '@/algorithms/practice/exercises';
import { randomBinaryTree, randomGraph } from '@/algorithms/practice/generators';
import { createRng } from '@/algorithms/practice/random';
import type { Answers, Exercise } from '@/algorithms/practice/types';
import { LEVELS, TOPICS } from '@/algorithms/practice/types';
import { parseNumberAnswer, splitLabels, validateBfsOrder, validateDfsOrder, validateEulerTrail } from '@/algorithms/practice/validators';
import type { Graph } from '@/types/graph';

const SEEDS = [1, 2, 3, 17, 99, 2024];

/** Respuestas correctas calculadas con los algoritmos (para comprobar que la calificación es coherente). */
function correctAnswers(ex: Exercise): Answers {
  const lab = (g: Graph, id: string) => g.vertices.find((v) => v.id === id)?.label ?? id;
  if (ex.figure.kind === 'tree') {
    const tree = ex.figure.tree;
    const l = (id: string) => tree.nodes[id]?.label ?? id;
    if (ex.topic === 'tree-properties') {
      const p = computeProperties(tree);
      return { props: { root: l(p.rootId ?? ''), height: String(p.height), leafCount: String(p.leaves.length), leaves: p.leaves.map(l).join(' '), internal: String(p.internalNodes.length) } };
    }
    const kind = ex.topic === 'preorder' || ex.topic === 'inorder' || ex.topic === 'postorder' ? ex.topic : 'preorder';
    return { order: traverse(tree, kind).map(l).join(' ') };
  }
  if (ex.figure.kind === 'pair') {
    const r = findIsomorphism(ex.figure.g1, ex.figure.g2);
    return r.status === 'isomorphic' ? { iso: 'yes', map: Object.fromEntries(r.mapping) } : { iso: 'no' };
  }
  const g = ex.figure.graph;
  switch (ex.topic) {
    case 'degrees': {
      const d = computeDegrees(g);
      const f: Record<string, string> = { sum: String(2 * g.edges.length) };
      for (const v of g.vertices) {
        f[v.id] = String(d.get(v.id)?.degree);
        f[`in-${v.id}`] = String(d.get(v.id)?.inDegree);
        f[`out-${v.id}`] = String(d.get(v.id)?.outDegree);
      }
      return { degrees: f };
    }
    case 'euler': {
      const a = analyzeEuler(g);
      return { kind: a.kind === 'no-edges' ? 'none' : a.kind, odd: { odd: a.oddVertices.map((v) => v.label).join(', ') || 'ninguno' } };
    }
    case 'fleury': {
      const a = analyzeEuler(g);
      return { trail: runFleury(g, a.starts[0] ?? '').state.trail.map((id) => lab(g, id)).join(' ') };
    }
    case 'hamilton': {
      const r = searchHamilton(g, { kind: 'cycle', limit: 1_000_000 });
      return { cycle: r.status === 'found' ? r.route.map((id) => lab(g, id)).join(' ') : '' };
    }
    case 'dijkstra': {
      const run = dijkstra(g, ex.params.source ?? '');
      const target = ex.params.target ?? '';
      return {
        dist: Object.fromEntries(g.vertices.map((v) => [v.id, formatDistance(run.dist[v.id])])),
        path: (shortestPaths(run, target, (id) => lab(g, id), 1)[0] ?? []).map((id) => lab(g, id)).join(' → '),
      };
    }
    default:
      return { order: traversalOrder(g, ex.params.start ?? '', ex.topic === 'dfs' ? 'dfs' : 'bfs').map((id) => lab(g, id)).join(', ') };
  }
}

describe('ejercicios generados', () => {
  for (const topic of TOPICS) {
    for (const level of LEVELS) {
      it(`${topic.name} · ${level.name}: reproducibles, coherentes y calificados con los algoritmos`, () => {
        for (const seed of SEEDS) {
          const ex = generateExercise(topic.id, level.id, seed);
          expect(generateExercise(topic.id, level.id, seed)).toEqual(ex);
          expect(ex.hints.length).toBeGreaterThanOrEqual(2);
          expect(ex.parts.length).toBeGreaterThan(0);
          const right = gradeExercise(ex, correctAnswers(ex));
          expect(right.items.filter((i) => !i.ok)).toEqual([]);
          expect(right.score).toBe(1);
          const empty = gradeExercise(ex, {});
          expect(empty.score).toBe(0);
          expect(solutionOf(ex).length).toBeGreaterThan(0);
        }
      });
    }
  }

  it('semillas distintas producen ejercicios distintos', () => {
    const a = generateExercise('dijkstra', 'basic', 1);
    const b = generateExercise('dijkstra', 'basic', 2);
    expect(a.figure).not.toEqual(b.figure);
  });

  it('los niveles aumentan la dificultad', () => {
    const size = (level: 'basic' | 'advanced') => {
      const f = generateExercise('preorder', level, 5).figure;
      return f.kind === 'tree' ? Object.keys(f.tree.nodes).length : 0;
    };
    expect(size('advanced')).toBeGreaterThan(size('basic'));
    const deg = generateExercise('degrees', 'advanced', 5).figure;
    expect(deg.kind === 'graph' && deg.graph.directed).toBe(true);
  });

  it('el ejercicio de isomorfismo produce casos de ambos tipos', () => {
    const statuses = new Set(SEEDS.concat([5, 6, 7, 8, 9, 10]).map((s) => {
      const f = generateExercise('isomorphism', 'intermediate', s).figure;
      return f.kind === 'pair' ? findIsomorphism(f.g1, f.g2).status : 'x';
    }));
    expect(statuses).toEqual(new Set(['isomorphic', 'not-isomorphic']));
  });

  it('el ejercicio de Euler cubre circuitos, caminos y grafos no eulerianos', () => {
    const kinds = new Set(Array.from({ length: 30 }, (_, s) => {
      const f = generateExercise('euler', 'advanced', s).figure;
      return f.kind === 'graph' ? analyzeEuler(f.graph).kind : 'x';
    }));
    expect(kinds).toEqual(new Set(['circuit', 'path', 'none']));
  });
});

describe('calificación con respuestas parciales o erróneas', () => {
  it('da crédito parcial por campo y explica sin revelar la respuesta', () => {
    const ex = generateExercise('degrees', 'basic', 3);
    const right = correctAnswers(ex);
    const fields = { ...(right.degrees as Record<string, string>) };
    const first = Object.keys(fields)[0] ?? '';
    fields[first] = '99';
    const g = gradeExercise(ex, { degrees: fields });
    expect(g.score).toBeGreaterThan(0);
    expect(g.score).toBeLessThan(1);
    const wrong = g.items.find((i) => !i.ok);
    expect(wrong?.message).toBe('Incorrecto: revise el cálculo.');
    expect(wrong?.message).not.toContain(wrong?.expected ?? '§');
  });

  it('en recorridos de árboles indica dónde empieza el error', () => {
    const ex = generateExercise('inorder', 'intermediate', 4);
    const right = (correctAnswers(ex).order as string).split(' ');
    const swapped = [...right];
    [swapped[2], swapped[3]] = [swapped[3] ?? '', swapped[2] ?? ''];
    const g = gradeExercise(ex, { order: swapped.join(' ') });
    expect(g.score).toBeLessThan(1);
    expect(g.items[0]?.message).toMatch(/Las primeras 2 posiciones son correctas/);
  });

  it('isomorfismo: reconocerlo sin dar una correspondencia válida vale la mitad', () => {
    const seed = SEEDS.concat([5, 6, 7, 8, 9, 10]).find((s) => {
      const f = generateExercise('isomorphism', 'basic', s).figure;
      return f.kind === 'pair' && findIsomorphism(f.g1, f.g2).status === 'isomorphic';
    });
    const ex = generateExercise('isomorphism', 'basic', seed ?? 1);
    expect(gradeExercise(ex, { iso: 'yes' }).score).toBe(0.5);
    expect(gradeExercise(ex, { iso: 'no' }).score).toBe(0);
  });

  it('Hamilton acepta el ciclo con el vértice inicial repetido al final', () => {
    const ex = generateExercise('hamilton', 'basic', 2);
    const cycle = (correctAnswers(ex).cycle as string).split(' ');
    expect(gradeExercise(ex, { cycle: [...cycle, cycle[0]].join(' ') }).score).toBe(1);
    // Una rotación del ciclo también es válida; repetir un vértice no.
    expect(gradeExercise(ex, { cycle: [...cycle.slice(1), cycle[0]].join(' ') }).score).toBe(1);
    expect(gradeExercise(ex, { cycle: [...cycle.slice(0, -1), cycle[0]].join(' ') }).score).toBe(0);
  });

  it('Dijkstra acepta ∞ y cualquier camino mínimo', () => {
    expect(parseNumberAnswer('∞')).toBe(Infinity);
    expect(parseNumberAnswer('inf')).toBe(Infinity);
    expect(parseNumberAnswer('2,5')).toBe(2.5);
    expect(parseNumberAnswer('x')).toBeNull();
  });
});

describe('validadores matemáticos', () => {
  const g = buildGraph({
    directed: false,
    weighted: false,
    vertices: ['A', 'B', 'C', 'D', 'E'].map((l): [string, number, number] => [l, 0, 0]),
    edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']],
  });
  const ids = (s: string) => splitLabels(s).map((l) => g.vertices.find((v) => v.label === l)?.id ?? l);

  it('BFS: acepta cualquier orden de vecinos y rechaza saltos de nivel', () => {
    expect(validateBfsOrder(g, 'v1', ids('A B C D E')).valid).toBe(true);
    expect(validateBfsOrder(g, 'v1', ids('A C B D E')).valid).toBe(true);
    const bad = validateBfsOrder(g, 'v1', ids('A B D C E'));
    expect(bad.valid).toBe(false);
    expect(!bad.valid && bad.error).toMatch(/deben visitarse antes que D/);
    expect(validateBfsOrder(g, 'v1', ids('B A C D E')).valid).toBe(false);
    expect(validateBfsOrder(g, 'v1', ids('A B C D')).valid).toBe(false);
  });

  it('DFS: acepta órdenes en profundidad y rechaza los que no lo son', () => {
    expect(validateDfsOrder(g, 'v1', ids('A B D C E')).valid).toBe(true);
    expect(validateDfsOrder(g, 'v1', ids('A C D E B')).valid).toBe(true);
    expect(validateDfsOrder(g, 'v1', ids('A B C D E')).valid).toBe(false);
    expect(validateDfsOrder(g, 'v1', ids('A B D A C E')).valid).toBe(false);
  });

  it('recorrido euleriano: continuidad y aristas sin repetir', () => {
    const tri = buildGraph({ directed: false, weighted: false, vertices: [['A', 0, 0], ['B', 0, 0], ['C', 0, 0]], edges: [['A', 'B'], ['B', 'C'], ['C', 'A']] });
    const t = (s: string) => splitLabels(s).map((l) => tri.vertices.find((v) => v.label === l)?.id ?? l);
    expect(validateEulerTrail(tri, t('A B C A')).valid).toBe(true);
    expect(validateEulerTrail(tri, t('A C B A')).valid).toBe(true);
    expect(validateEulerTrail(tri, t('A B A C'))).toMatchObject({ valid: false });
    expect(validateEulerTrail(tri, t('A B C'))).toMatchObject({ valid: false, error: 'Faltan 1 arista por recorrer.' });
  });
});

describe('generadores', () => {
  it('los grafos aleatorios son conexos y cumplen la política', () => {
    for (const seed of SEEDS) {
      const g = randomGraph(createRng(seed), { n: 7, extra: 4 });
      expect(new Set(componentIndex(g.vertices, g.edges).values()).size).toBe(1);
      expect(g.edges.every((e) => e.source !== e.target)).toBe(true);
    }
  });

  it('los árboles aleatorios son válidos y tienen n nodos', () => {
    for (const seed of SEEDS) {
      const t = randomBinaryTree(createRng(seed), 9);
      expect(validateTree(t)).toEqual([]);
      expect(Object.keys(t.nodes)).toHaveLength(9);
    }
  });
});
