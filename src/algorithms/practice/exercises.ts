import { neighborLists } from '@/algorithms/graph/adjacency';
import { computeDegrees } from '@/algorithms/graph/degrees';
import { dijkstra, formatDistance, shortestPaths } from '@/algorithms/graph/dijkstra';
import { analyzeEuler, runFleury } from '@/algorithms/graph/euler';
import { checkHamiltonRoute, searchHamilton } from '@/algorithms/graph/hamilton';
import { checkMapping, compareInvariants, describeMapping, findIsomorphism } from '@/algorithms/graph/isomorphism';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import { traversalOrder } from '@/algorithms/graph/traversal';
import { computeProperties } from '@/algorithms/tree/properties';
import type { TraversalKind } from '@/algorithms/tree/traversals';
import { TRAVERSAL_INFO, traverse } from '@/algorithms/tree/traversals';
import type { Edge, Graph, VertexId } from '@/types/graph';
import type { BinaryTree } from '@/types/tree';
import { eulerianGraph, graphFromEdges, hamiltonianGraph, LETTERS, randomBinaryTree, randomGraph, relabeledCopy } from './generators';
import type { Rng } from './random';
import { createRng, pick, randInt, shuffle } from './random';
import type { Answers, Exercise, Field, Grade, GradeItem, Level, Topic } from './types';
import { labelsToIds, parseNumberAnswer, pathCost, splitLabels, validateBfsOrder, validateDfsOrder, validateEulerTrail } from './validators';

/*
 * Laboratorio de práctica: cada ejercicio se GENERA con una semilla (es reproducible), se CALIFICA
 * con los algoritmos del proyecto y su SOLUCIÓN también se calcula con ellos. No hay respuestas
 * guardadas de antemano.
 */

const SIZE: Record<Level, number> = { basic: 0, intermediate: 1, advanced: 2 };
/** Valor según el nivel: [básico, intermedio, avanzado]. */
const by = <T>(level: Level, [basic, intermediate, advanced]: [T, T, T]): T => (level === 'basic' ? basic : level === 'intermediate' ? intermediate : advanced);

const vlabel = (g: Graph, id: VertexId) => g.vertices.find((v) => v.id === id)?.label ?? id;
const idOf = (g: Graph, label: string) => g.vertices.find((v) => v.label === label)?.id ?? '';
const sorted = (g: Graph) => sortVerticesByLabel(g.vertices);

/* ─────────────────────────── Generación ─────────────────────────── */

export function generateExercise(topic: Topic, level: Level, seed: number): Exercise {
  const rng = createRng(seed * 31 + SIZE[level] * 7 + topic.length);
  const base = { topic, level, seed, params: {} };
  switch (topic) {
    case 'degrees':
      return { ...base, ...degreesExercise(rng, level) };
    case 'tree-properties':
      return { ...base, ...treePropertiesExercise(rng, level) };
    case 'preorder':
    case 'inorder':
    case 'postorder':
      return { ...base, ...traversalExercise(rng, level, topic) };
    case 'euler':
      return { ...base, ...eulerExercise(rng, level) };
    case 'fleury':
      return { ...base, ...fleuryExercise(rng, level) };
    case 'hamilton':
      return { ...base, ...hamiltonExercise(rng, level) };
    case 'isomorphism':
      return { ...base, ...isomorphismExercise(rng, level) };
    case 'dijkstra':
      return { ...base, ...dijkstraExercise(rng, level) };
    case 'bfs':
    case 'dfs':
      return { ...base, ...searchExercise(rng, level, topic) };
  }
}

type Generated = Omit<Exercise, 'topic' | 'level' | 'seed' | 'params'> & { params?: Exercise['params'] };

function degreesExercise(rng: Rng, level: Level): Generated {
  const directed = level === 'advanced';
  const graph = randomGraph(rng, { n: by(level, [5, 6, 6]), extra: by(level, [2, 3, 3]), parallel: level === 'intermediate' ? 1 : 0, directed });
  const fields: Field[] = directed
    ? sorted(graph).flatMap((v) => [
        { key: `in-${v.id}`, label: `Entrada de ${v.label}`, kind: 'number' as const },
        { key: `out-${v.id}`, label: `Salida de ${v.label}`, kind: 'number' as const },
      ])
    : [...sorted(graph).map((v) => ({ key: v.id, label: `Grado de ${v.label}`, kind: 'number' as const })), { key: 'sum', label: 'Suma de los grados', kind: 'number' }];
  const m = graph.edges.length;
  return {
    title: directed ? 'Grados de entrada y de salida' : 'Grado de cada vértice',
    statement: directed
      ? 'En este grafo dirigido, escriba el grado de entrada (arcos que llegan) y el de salida (arcos que salen) de cada vértice.'
      : `Escriba el grado de cada vértice y la suma de todos los grados.${level === 'intermediate' ? ' Atención: hay aristas paralelas.' : ''}`,
    figure: { kind: 'graph', graph },
    parts: [{ type: 'fields', id: 'degrees', title: directed ? 'Grados de entrada y salida' : 'Grados', fields }],
    hints: directed
      ? ['El grado de entrada cuenta las puntas de flecha que llegan al vértice; el de salida, los arcos que parten de él.', `Comprobación: la suma de todas las entradas y la suma de todas las salidas valen |E| = ${m}.`]
      : [
          'El grado de un vértice es el número de aristas que lo tocan.',
          'Cada arista paralela cuenta por separado.',
          `Comprobación (lema del apretón de manos): la suma de los grados es 2·|E|, y el grafo tiene ${m} aristas.`,
        ],
  };
}

function treePropertiesExercise(rng: Rng, level: Level): Generated {
  const tree = randomBinaryTree(rng, by(level, [5, 8, 11]));
  return {
    title: 'Propiedades de un árbol binario',
    statement: 'Observe el árbol y responda. La altura se mide en aristas (un solo nodo tiene altura 0).',
    figure: { kind: 'tree', tree },
    parts: [
      {
        type: 'fields',
        id: 'props',
        title: 'Propiedades',
        fields: [
          { key: 'root', label: 'Raíz', kind: 'label' },
          { key: 'height', label: 'Altura', kind: 'number' },
          { key: 'leafCount', label: 'Número de hojas', kind: 'number' },
          { key: 'leaves', label: 'Hojas (separadas por espacios)', kind: 'labels' },
          { key: 'internal', label: 'Número de nodos internos', kind: 'number' },
        ],
      },
    ],
    hints: [
      'La raíz es el único nodo sin padre: está en la parte superior.',
      'La altura es el número de aristas del camino más largo desde la raíz hasta una hoja.',
      'Una hoja no tiene hijos. Hojas + nodos internos = número total de nodos.',
    ],
  };
}

function traversalExercise(rng: Rng, level: Level, kind: TraversalKind & Topic): Generated {
  const tree = randomBinaryTree(rng, by(level, [5, 8, 12]));
  const order = traverse(tree, kind).map((id) => tree.nodes[id]?.label ?? id);
  const info = TRAVERSAL_INFO[kind];
  return {
    title: `Recorrido en ${info.name.toLowerCase()}`,
    statement: `Escriba el recorrido en ${info.name.toLowerCase()} del árbol (${info.rule}). Puede hacer clic en los nodos en orden.`,
    figure: { kind: 'tree', tree },
    parts: [{ type: 'sequence', id: 'order', title: `Recorrido en ${info.name.toLowerCase()}`, help: 'Nodos en orden, separados por espacios.' }],
    hints: [
      `Regla: ${info.rule}. Aplíquela recursivamente a cada subárbol.`,
      `El recorrido tiene ${order.length} nodos y empieza por ${order[0] ?? ''}.`,
      `El último nodo del recorrido es ${order[order.length - 1] ?? ''}.`,
    ],
  };
}

type EulerTarget = 'circuit' | 'path' | 'odd' | 'split';

function removeEdges(graph: Graph, ids: string[]): Graph {
  return { ...graph, edges: graph.edges.filter((e) => !ids.includes(e.id)) };
}

/** Grafo con la clasificación euleriana pedida. */
function eulerGraph(rng: Rng, n: number, target: EulerTarget): Graph {
  for (let attempt = 0; attempt < 60; attempt++) {
    const base = eulerianGraph(rng, n, randInt(rng, 1, 2));
    let g = base;
    if (target === 'path') g = removeEdges(base, [pick(rng, base.edges).id]);
    if (target === 'odd') {
      const [a, b] = shuffle(rng, base.edges);
      if (a && b) g = removeEdges(base, [a.id, b.id]);
    }
    if (target === 'split') {
      const k = n - 3;
      const first = eulerianGraph(rng, k, 0).edges.map((e): [string, string] => [vlabel(base, e.source), vlabel(base, e.target)]);
      const rest = LETTERS.slice(k, n);
      const [x, y, z] = rest;
      if (!x || !y || !z) continue;
      g = graphFromEdges(LETTERS.slice(0, n), [...first, [x, y], [y, z], [z, x]], false, false);
    }
    const a = analyzeEuler(g);
    const ok =
      (target === 'circuit' && a.kind === 'circuit') ||
      (target === 'path' && a.kind === 'path') ||
      (target === 'odd' && a.kind === 'none' && a.connected) ||
      (target === 'split' && a.kind === 'none' && !a.connected);
    if (ok) return g;
  }
  return eulerianGraph(rng, n, 1);
}

const EULER_OPTIONS = [
  { value: 'circuit', label: 'Tiene circuito euleriano' },
  { value: 'path', label: 'Tiene camino euleriano abierto (no circuito)' },
  { value: 'none', label: 'No tiene recorrido euleriano' },
];

function eulerExercise(rng: Rng, level: Level): Generated {
  const targets: EulerTarget[] = level === 'advanced' ? ['circuit', 'path', 'odd', 'split'] : ['circuit', 'path', 'odd'];
  const graph = eulerGraph(rng, by(level, [5, 6, 7]), pick(rng, targets));
  return {
    title: 'Clasificación euleriana',
    statement: 'Clasifique el grafo e indique sus vértices de grado impar.',
    figure: { kind: 'graph', graph },
    parts: [
      { type: 'choice', id: 'kind', title: '¿Qué recorrido euleriano tiene?', options: EULER_OPTIONS },
      { type: 'fields', id: 'odd', title: 'Grados impares', fields: [{ key: 'odd', label: 'Vértices de grado impar (o «ninguno»)', kind: 'labels' }] },
    ],
    hints: [
      'Calcule el grado de cada vértice y cuente cuántos son impares.',
      'Si las aristas forman una sola componente: 0 impares → circuito; 2 → camino abierto; más de 2 → ninguno.',
      '¿Todas las aristas están conectadas entre sí? Si no, no puede existir un recorrido euleriano.',
    ],
  };
}

function fleuryExercise(rng: Rng, level: Level): Generated {
  const graph = eulerGraph(rng, by(level, [5, 6, 7]), rng() < 0.5 ? 'circuit' : 'path');
  const a = analyzeEuler(graph);
  const run = runFleury(graph, a.starts[0] ?? '');
  const first = run.state.trail.slice(0, 2).map((id) => vlabel(graph, id));
  return {
    title: 'Recorrido euleriano (Fleury)',
    statement: 'Escriba un recorrido que use cada arista exactamente una vez, como lista de vértices. Puede hacer clic en los vértices en orden. Se acepta cualquier recorrido válido.',
    figure: { kind: 'graph', graph },
    parts: [{ type: 'sequence', id: 'trail', title: 'Recorrido euleriano', help: `Vértices en orden (${graph.edges.length + 1} vértices, ya que hay ${graph.edges.length} aristas).` }],
    hints: [
      a.kind === 'path'
        ? `Hay dos vértices de grado impar (${a.oddVertices.map((v) => v.label).join(' y ')}): el recorrido debe empezar en uno y terminar en el otro.`
        : 'Todos los grados son pares: puede empezar en cualquier vértice y terminará en el mismo.',
      'Regla de Fleury: no cruce un puente del grafo que queda sin recorrer si tiene otra opción.',
      `Un comienzo posible: ${first.join(' → ')}.`,
    ],
  };
}

function hamiltonExercise(rng: Rng, level: Level): Generated {
  const { graph } = hamiltonianGraph(rng, by(level, [5, 6, 8]), by(level, [2, 3, 5]));
  const lowest = sorted(graph).sort((x, y) => (neighborLists(graph).get(x.id)?.length ?? 0) - (neighborLists(graph).get(y.id)?.length ?? 0))[0];
  return {
    title: 'Ciclo hamiltoniano',
    statement: 'Encuentre un ciclo que visite cada vértice exactamente una vez y vuelva al inicio. Escriba los vértices en orden (sin repetir el inicial al final). Se acepta cualquier ciclo válido.',
    figure: { kind: 'graph', graph },
    parts: [{ type: 'sequence', id: 'cycle', title: 'Ciclo hamiltoniano', help: `Los ${graph.vertices.length} vértices en el orden del ciclo.` }],
    hints: [
      'Un vértice con solo dos vecinos obliga a usar las dos aristas que lo tocan.',
      `Conviene empezar por un vértice de grado bajo, por ejemplo ${lowest?.label ?? ''}.`,
      'Si llega a un vértice sin vecinos libres, retroceda (backtracking) y pruebe otra opción.',
    ],
  };
}

function swapEdges(rng: Rng, g: Graph): Graph | null {
  const has = (a: string, b: string, edges: Edge[]) => edges.some((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a));
  for (let i = 0; i < 40; i++) {
    const [e1, e2] = shuffle(rng, g.edges);
    if (!e1 || !e2) return null;
    const [a, b, c, d] = [e1.source, e1.target, e2.source, e2.target];
    if (new Set([a, b, c, d]).size < 4 || has(a, c, g.edges) || has(b, d, g.edges)) continue;
    const edges = g.edges.filter((e) => e.id !== e1.id && e.id !== e2.id);
    return { ...g, edges: [...edges, { ...e1, target: c }, { ...e2, source: b, target: d }] };
  }
  return null;
}

function moveEdge(rng: Rng, g: Graph): Graph {
  const e = pick(rng, g.edges);
  for (let i = 0; i < 40; i++) {
    const a = pick(rng, g.vertices).id;
    const b = pick(rng, g.vertices).id;
    if (a === b || g.edges.some((x) => (x.source === a && x.target === b) || (x.source === b && x.target === a))) continue;
    return { ...g, edges: g.edges.map((x) => (x.id === e.id ? { ...x, source: a, target: b } : x)) };
  }
  return g;
}

function isomorphismExercise(rng: Rng, level: Level): Generated {
  const n = by(level, [4, 5, 6]);
  const g1 = randomGraph(rng, { n, extra: by(level, [1, 2, 3]) });
  let g2 = relabeledCopy(rng, g1);
  if (rng() < 0.5) {
    for (let i = 0; i < 10; i++) {
      const candidate = level === 'basic' ? moveEdge(rng, g2) : (swapEdges(rng, g2) ?? moveEdge(rng, g2));
      if (findIsomorphism(g1, candidate).status === 'not-isomorphic') {
        g2 = candidate;
        break;
      }
    }
  }
  return {
    title: 'Isomorfismo',
    statement: 'Decida si G1 y G2 son isomorfos. Si lo son, indique una correspondencia f: G1 → G2 que conserve las aristas.',
    figure: { kind: 'pair', g1, g2 },
    parts: [
      {
        type: 'choice',
        id: 'iso',
        title: '¿G1 y G2 son isomorfos?',
        options: [
          { value: 'yes', label: 'Sí, son isomorfos' },
          { value: 'no', label: 'No son isomorfos' },
        ],
      },
      { type: 'mapping', id: 'map', title: 'Correspondencia (solo si respondió «Sí»)', help: 'Elija la imagen en G2 de cada vértice de G1.' },
    ],
    hints: [
      'Compare primero los invariantes: número de vértices, de aristas y la secuencia de grados ordenada.',
      'Si los invariantes coinciden no basta: empareje vértices del mismo grado y compruebe que las aristas se conserven.',
      'Fíjese en estructuras pequeñas: triángulos, vértices de grado máximo y a quién están conectados.',
    ],
  };
}

function dijkstraExercise(rng: Rng, level: Level): Generated {
  const directed = level === 'advanced';
  let graph = randomGraph(rng, { n: by(level, [5, 6, 6]), extra: by(level, [3, 4, 5]), weighted: true, directed });
  if (level === 'intermediate') {
    const e = pick(rng, graph.edges);
    graph = { ...graph, edges: graph.edges.map((x) => (x.id === e.id ? { ...x, weight: 0 } : x)) };
  }
  const source = idOf(graph, 'A');
  const run = dijkstra(graph, source);
  const reachable = run.definitive.filter((id) => id !== source);
  // Destino: el vértice alcanzable más lejano (empates: el último por nombre).
  const target = [...reachable].sort((a, b) => (run.dist[a] ?? 0) - (run.dist[b] ?? 0)).at(-1) ?? source;
  const second = run.definitive[1];
  const parts: Exercise['parts'] = [
    { type: 'fields', id: 'dist', title: 'Distancias mínimas desde A', fields: sorted(graph).map((v) => ({ key: v.id, label: `d(${v.label})`, kind: 'distance' as const })) },
  ];
  if (level !== 'basic') parts.push({ type: 'sequence', id: 'path', title: `Un camino mínimo de A a ${vlabel(graph, target)}`, help: 'Vértices del camino en orden.' });
  return {
    title: 'Caminos mínimos (Dijkstra)',
    statement: `Calcule la distancia mínima desde A a cada vértice${directed ? ' respetando el sentido de los arcos (escriba ∞ si no se puede llegar)' : ''}.${level !== 'basic' ? ` Luego escriba un camino mínimo hasta ${vlabel(graph, target)}.` : ''}`,
    figure: { kind: 'graph', graph },
    parts,
    params: { source, target },
    hints: [
      'Empiece con d(A) = 0 y ∞ en los demás. En cada paso fije el vértice no definitivo de menor distancia.',
      'Al fijar u, relaje sus aristas: d(v) = min(d(v), d(u) + w(u,v)).',
      second ? `El segundo vértice que se fija es ${vlabel(graph, second)}.` : 'Ningún otro vértice es alcanzable desde A.',
    ],
  };
}

function searchExercise(rng: Rng, level: Level, kind: 'bfs' | 'dfs'): Generated {
  const graph = randomGraph(rng, { n: by(level, [6, 7, 8]), extra: by(level, [2, 4, 4]), directed: level === 'advanced' });
  const start = pick(rng, graph.vertices).id;
  const nbs = (neighborLists(graph).get(start) ?? []).map((nb) => nb.vertex.label);
  const name = kind === 'bfs' ? 'BFS (anchura)' : 'DFS (profundidad)';
  return {
    title: `Recorrido ${name}`,
    statement: `Escriba un orden de visita de ${name} desde ${vlabel(graph, start)}${graph.directed ? ', siguiendo el sentido de los arcos' : ''}. Se acepta cualquier orden válido de los vecinos.`,
    figure: { kind: 'graph', graph },
    parts: [{ type: 'sequence', id: 'order', title: `Orden de visita (${kind.toUpperCase()})`, help: 'Todos los vértices alcanzables, en el orden en que se visitan.' }],
    params: { start },
    hints:
      kind === 'bfs'
        ? ['BFS usa una cola: visite todos los vecinos del vértice actual antes de pasar a los vecinos de esos vecinos.', 'Los vecinos de un mismo vértice pueden ir en cualquier orden.', `Después de ${vlabel(graph, start)} vienen sus vecinos: ${nbs.join(', ') || 'ninguno'}.`]
        : ['DFS avanza siempre a un vecino no visitado del vértice actual y retrocede solo cuando no quedan.', 'Al retroceder, continúe desde el vértice más reciente que aún tenga vecinos sin visitar.', `Desde ${vlabel(graph, start)} puede avanzar a: ${nbs.join(', ') || 'ningún vértice'}.`],
  };
}

/* ─────────────────────────── Calificación ─────────────────────────── */

const fieldsOf = (answers: Answers, id: string): Record<string, string> => {
  const v = answers[id];
  return typeof v === 'object' ? v : {};
};
const textOf = (answers: Answers, id: string): string => {
  const v = answers[id];
  return typeof v === 'string' ? v : '';
};
const scoreOf = (items: GradeItem[]) => (items.length === 0 ? 0 : items.filter((i) => i.ok).length / items.length);

function numberItem(label: string, given: string, expected: number): GradeItem {
  const value = parseNumberAnswer(given);
  if (value === null) return { label, ok: false, message: given.trim() === '' ? 'Sin respuesta.' : 'No es un número válido.', expected: formatDistance(expected) };
  return { label, ok: value === expected, message: value === expected ? 'Correcto.' : 'Incorrecto: revise el cálculo.', expected: formatDistance(expected) };
}

function labelSetItem(label: string, given: string, expected: string[], valid: Set<string>): GradeItem {
  // Una respuesta en blanco no cuenta como «conjunto vacío»: para eso se escribe «ninguno».
  if (given.trim() === '') return { label, ok: false, message: 'Sin respuesta (escriba «ninguno» si no hay).', expected: expected.length ? expected.join(', ') : 'ninguno' };
  const raw = given.trim().toLowerCase() === 'ninguno' ? [] : splitLabels(given);
  const norm = (s: string) => [...valid].find((v) => v.toLowerCase() === s.toLowerCase()) ?? s;
  const set = new Set(raw.map(norm));
  const exp = new Set(expected);
  const missing = expected.filter((x) => !set.has(x)).length;
  const extra = [...set].filter((x) => !exp.has(x));
  const ok = missing === 0 && extra.length === 0;
  const parts: string[] = [];
  if (extra.length) parts.push(`${extra.join(', ')} no ${extra.length === 1 ? 'corresponde' : 'corresponden'}`);
  if (missing) parts.push(`falta${missing === 1 ? '' : 'n'} ${missing}`);
  return { label, ok, message: ok ? 'Correcto.' : `Incorrecto: ${parts.join('; ')}.`, expected: expected.length ? expected.join(', ') : 'ninguno' };
}

function sequenceIds(graph: Graph, text: string): { ids: VertexId[]; error: string | null } {
  const { ids, unknown } = labelsToIds(graph, splitLabels(text));
  if (text.trim() === '') return { ids, error: 'Sin respuesta.' };
  if (unknown.length) return { ids, error: `No existen los vértices: ${unknown.join(', ')}.` };
  return { ids, error: null };
}

export function gradeExercise(ex: Exercise, answers: Answers): Grade {
  switch (ex.topic) {
    case 'degrees':
      return gradeDegrees(ex, answers);
    case 'tree-properties':
      return gradeTreeProperties(ex, answers);
    case 'preorder':
    case 'inorder':
    case 'postorder':
      return gradeTraversal(ex, answers, ex.topic);
    case 'euler':
      return gradeEuler(ex, answers);
    case 'fleury':
      return gradeFleury(ex, answers);
    case 'hamilton':
      return gradeHamilton(ex, answers);
    case 'isomorphism':
      return gradeIsomorphism(ex, answers);
    case 'dijkstra':
      return gradeDijkstra(ex, answers);
    case 'bfs':
    case 'dfs':
      return gradeSearch(ex, answers, ex.topic);
  }
}

const graphOf = (ex: Exercise): Graph => {
  if (ex.figure.kind !== 'graph') throw new Error('El ejercicio no tiene un grafo.');
  return ex.figure.graph;
};
const treeOf = (ex: Exercise): BinaryTree => {
  if (ex.figure.kind !== 'tree') throw new Error('El ejercicio no tiene un árbol.');
  return ex.figure.tree;
};

function gradeDegrees(ex: Exercise, answers: Answers): Grade {
  const g = graphOf(ex);
  const d = computeDegrees(g);
  const f = fieldsOf(answers, 'degrees');
  const items: GradeItem[] = [];
  for (const v of sorted(g)) {
    const deg = d.get(v.id);
    if (g.directed) {
      items.push(numberItem(`Entrada de ${v.label}`, f[`in-${v.id}`] ?? '', deg?.inDegree ?? 0));
      items.push(numberItem(`Salida de ${v.label}`, f[`out-${v.id}`] ?? '', deg?.outDegree ?? 0));
    } else items.push(numberItem(`Grado de ${v.label}`, f[v.id] ?? '', deg?.degree ?? 0));
  }
  if (!g.directed) items.push(numberItem('Suma de los grados', f.sum ?? '', 2 * g.edges.length));
  return { score: scoreOf(items), items };
}

function gradeTreeProperties(ex: Exercise, answers: Answers): Grade {
  const tree = treeOf(ex);
  const p = computeProperties(tree);
  const f = fieldsOf(answers, 'props');
  const label = (id: string) => tree.nodes[id]?.label ?? id;
  const rootLabel = p.rootId ? label(p.rootId) : '';
  const givenRoot = (f.root ?? '').trim();
  const valid = new Set(Object.values(tree.nodes).map((n) => n.label));
  const items: GradeItem[] = [
    {
      label: 'Raíz',
      ok: givenRoot.toLowerCase() === rootLabel.toLowerCase(),
      message: givenRoot === '' ? 'Sin respuesta.' : givenRoot.toLowerCase() === rootLabel.toLowerCase() ? 'Correcto.' : 'Incorrecto: la raíz no tiene padre.',
      expected: rootLabel,
    },
    numberItem('Altura', f.height ?? '', p.height),
    numberItem('Número de hojas', f.leafCount ?? '', p.leaves.length),
    labelSetItem('Hojas', f.leaves ?? '', p.leaves.map(label).sort(), valid),
    numberItem('Nodos internos', f.internal ?? '', p.internalNodes.length),
  ];
  return { score: scoreOf(items), items };
}

function gradeTraversal(ex: Exercise, answers: Answers, kind: TraversalKind): Grade {
  const tree = treeOf(ex);
  const expected = traverse(tree, kind).map((id) => tree.nodes[id]?.label ?? id);
  const given = splitLabels(textOf(answers, 'order'));
  const valid = new Set(expected);
  const norm = given.map((g) => [...valid].find((v) => v.toLowerCase() === g.toLowerCase()) ?? g);
  const unknown = norm.filter((g) => !valid.has(g));
  let prefix = 0;
  while (prefix < expected.length && norm[prefix] === expected[prefix]) prefix++;
  const ok = prefix === expected.length && norm.length === expected.length;
  let message = 'Correcto: es el recorrido del árbol.';
  if (!ok) {
    if (norm.length === 0) message = 'Sin respuesta.';
    else if (unknown.length) message = `No existen los nodos: ${unknown.join(', ')}.`;
    else if (prefix === expected.length) message = `Sobran nodos: el árbol tiene ${expected.length}.`;
    else message = prefix === 0 ? 'El primer nodo no es correcto.' : `Las primeras ${prefix} posiciones son correctas; el error empieza en la posición ${prefix + 1}.`;
  }
  return { score: ok ? 1 : prefix / expected.length / 2, items: [{ label: TRAVERSAL_INFO[kind].name, ok, message, expected: expected.join(' ') }] };
}

function gradeEuler(ex: Exercise, answers: Answers): Grade {
  const g = graphOf(ex);
  const a = analyzeEuler(g);
  const kind = a.kind === 'no-edges' ? 'none' : a.kind;
  const given = textOf(answers, 'kind');
  const option = (v: string) => EULER_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const items: GradeItem[] = [
    { label: 'Clasificación', ok: given === kind, message: given === '' ? 'Sin respuesta.' : given === kind ? 'Correcto.' : 'Incorrecto: revise la cantidad de vértices impares y la conexidad.', expected: option(kind) },
    labelSetItem('Vértices de grado impar', fieldsOf(answers, 'odd').odd ?? '', a.oddVertices.map((v) => v.label), new Set(g.vertices.map((v) => v.label))),
  ];
  return { score: scoreOf(items), items };
}

function gradeFleury(ex: Exercise, answers: Answers): Grade {
  const g = graphOf(ex);
  const { ids, error } = sequenceIds(g, textOf(answers, 'trail'));
  const check = error ? { valid: false as const, error } : validateEulerTrail(g, ids);
  const a = analyzeEuler(g);
  const solution = runFleury(g, a.starts[0] ?? '').state.trail.map((id) => vlabel(g, id)).join(' ');
  return {
    score: check.valid ? 1 : 0,
    items: [{ label: 'Recorrido euleriano', ok: check.valid, message: check.valid ? 'Correcto: usa cada arista exactamente una vez.' : check.error, expected: solution }],
  };
}

function gradeHamilton(ex: Exercise, answers: Answers): Grade {
  const g = graphOf(ex);
  const parsed = sequenceIds(g, textOf(answers, 'cycle'));
  let ids = parsed.ids;
  // Se acepta repetir el vértice inicial al final para cerrar el ciclo.
  if (ids.length === g.vertices.length + 1 && ids[0] === ids[ids.length - 1]) ids = ids.slice(0, -1);
  const check = checkHamiltonRoute(g, ids, 'cycle');
  const found = searchHamilton(g, { kind: 'cycle', limit: 1_000_000 });
  const expected = found.status === 'found' ? found.route.map((id) => vlabel(g, id)).join(' ') : '';
  const message = parsed.error ?? (check.valid ? 'Correcto: es un ciclo hamiltoniano.' : (check.issues[0] ?? 'La ruta no es válida.'));
  return { score: check.valid && !parsed.error ? 1 : 0, items: [{ label: 'Ciclo hamiltoniano', ok: check.valid && !parsed.error, message, expected }] };
}

function gradeIsomorphism(ex: Exercise, answers: Answers): Grade {
  if (ex.figure.kind !== 'pair') throw new Error('El ejercicio no tiene dos grafos.');
  const { g1, g2 } = ex.figure;
  const result = findIsomorphism(g1, g2);
  const truth = result.status === 'isomorphic';
  const given = textOf(answers, 'iso');
  const choiceOk = given === (truth ? 'yes' : 'no');
  const items: GradeItem[] = [
    {
      label: '¿Son isomorfos?',
      ok: choiceOk,
      message: given === '' ? 'Sin respuesta.' : choiceOk ? 'Correcto.' : 'Incorrecto.',
      expected: truth ? 'Sí' : `No. ${result.status === 'not-isomorphic' ? result.reason : ''}`,
    },
  ];
  if (!truth) return { score: choiceOk ? 1 : 0, items };
  const map = new Map(Object.entries(fieldsOf(answers, 'map')).filter(([, v]) => v !== ''));
  const check = checkMapping(g1, g2, map);
  const expected = result.status === 'isomorphic' ? describeMapping(g1, g2, result.mapping).map(({ from, to }) => `${from.label}↦${to.label}`).join(', ') : '';
  items.push({
    label: 'Correspondencia',
    ok: choiceOk && check.valid,
    message: !choiceOk ? 'Sin calificar: primero hay que reconocer que son isomorfos.' : check.valid ? 'Correcto: es biyectiva y conserva las aristas.' : (check.problems[0] ?? 'La correspondencia no es válida.'),
    expected,
  });
  return { score: (choiceOk ? 0.5 : 0) + (choiceOk && check.valid ? 0.5 : 0), items };
}

function gradeDijkstra(ex: Exercise, answers: Answers): Grade {
  const g = graphOf(ex);
  const source = ex.params.source ?? '';
  const run = dijkstra(g, source);
  const f = fieldsOf(answers, 'dist');
  const items = sorted(g).map((v) => numberItem(`d(${v.label})`, f[v.id] ?? '', run.dist[v.id] ?? Infinity));
  const target = ex.params.target;
  if (target && ex.parts.some((p) => p.id === 'path')) {
    const { ids, error } = sequenceIds(g, textOf(answers, 'path'));
    const best = run.dist[target] ?? Infinity;
    const cost = error ? null : pathCost(g, ids);
    let message = error ?? '';
    let ok = false;
    if (!error) {
      if (ids[0] !== source) message = 'El camino debe empezar en A.';
      else if (ids[ids.length - 1] !== target) message = `El camino debe terminar en ${vlabel(g, target)}.`;
      else if (cost === null) message = `Hay un paso sin ${g.directed ? 'arco' : 'arista'} entre vértices consecutivos.`;
      else if (cost !== best) message = `El camino cuesta ${formatDistance(cost)}, pero no es mínimo.`;
      else {
        ok = true;
        message = `Correcto: cuesta ${formatDistance(cost)}, el mínimo.`;
      }
    }
    const paths = shortestPaths(run, target, (id) => vlabel(g, id), 1);
    items.push({ label: 'Camino mínimo', ok, message, expected: paths[0]?.map((id) => vlabel(g, id)).join(' → ') ?? '' });
  }
  return { score: scoreOf(items), items };
}

function gradeSearch(ex: Exercise, answers: Answers, kind: 'bfs' | 'dfs'): Grade {
  const g = graphOf(ex);
  const start = ex.params.start ?? '';
  const { ids, error } = sequenceIds(g, textOf(answers, 'order'));
  const check = error ? { valid: false as const, error } : kind === 'bfs' ? validateBfsOrder(g, start, ids) : validateDfsOrder(g, start, ids);
  const alpha = traversalOrder(g, start, kind);
  const alphabetical = check.valid && alpha.join('|') === ids.join('|');
  return {
    score: check.valid ? 1 : 0,
    items: [
      {
        label: `Orden ${kind.toUpperCase()}`,
        ok: check.valid,
        message: check.valid ? `Correcto: es un orden válido de ${kind.toUpperCase()}${alphabetical ? ' (y coincide con el orden alfabético de vecinos)' : ''}.` : check.error,
        expected: `${alpha.map((id) => vlabel(g, id)).join(' ')} (con vecinos en orden alfabético)`,
      },
    ],
  };
}

/* ─────────────────────────── Solución ─────────────────────────── */

/** Explicación completa de la solución, calculada con los algoritmos (solo se muestra a pedido). */
export function solutionOf(ex: Exercise): string[] {
  switch (ex.topic) {
    case 'degrees': {
      const g = graphOf(ex);
      const d = computeDegrees(g);
      const list = sorted(g).map((v) => (g.directed ? `${v.label}: entrada ${d.get(v.id)?.inDegree ?? 0}, salida ${d.get(v.id)?.outDegree ?? 0}` : `${v.label}: ${d.get(v.id)?.degree ?? 0}`));
      return [list.join(' · '), g.directed ? `Total de arcos: ${g.edges.length}.` : `Suma de los grados: ${2 * g.edges.length} = 2 · ${g.edges.length} aristas.`];
    }
    case 'tree-properties': {
      const tree = treeOf(ex);
      const p = computeProperties(tree);
      const l = (id: string) => tree.nodes[id]?.label ?? id;
      return [`Raíz: ${p.rootId ? l(p.rootId) : '—'} · Altura: ${p.height} · Hojas (${p.leaves.length}): ${p.leaves.map(l).join(', ')} · Nodos internos: ${p.internalNodes.length}.`];
    }
    case 'preorder':
    case 'inorder':
    case 'postorder': {
      const tree = treeOf(ex);
      return [`${TRAVERSAL_INFO[ex.topic].name}: ${traverse(tree, ex.topic).map((id) => tree.nodes[id]?.label ?? id).join(' ')}`];
    }
    case 'euler':
    case 'fleury': {
      const g = graphOf(ex);
      const a = analyzeEuler(g);
      const lines = [...a.reasons];
      if (a.kind === 'circuit' || a.kind === 'path') lines.push(`Recorrido de Fleury: ${runFleury(g, a.starts[0] ?? '').state.trail.map((id) => vlabel(g, id)).join(' → ')}`);
      return lines;
    }
    case 'hamilton': {
      const g = graphOf(ex);
      const r = searchHamilton(g, { kind: 'cycle', limit: 1_000_000 });
      return r.status === 'found' ? [`Un ciclo hamiltoniano: ${[...r.route, r.route[0] ?? ''].map((id) => vlabel(g, id)).join(' → ')}`] : ['No se encontró un ciclo.'];
    }
    case 'isomorphism': {
      if (ex.figure.kind !== 'pair') return [];
      const { g1, g2 } = ex.figure;
      const r = findIsomorphism(g1, g2);
      const rows = compareInvariants(g1, g2).map((row) => `${row.name}: ${row.g1} / ${row.g2}`);
      if (r.status === 'isomorphic') return ['Son isomorfos.', `Correspondencia: ${describeMapping(g1, g2, r.mapping).map(({ from, to }) => `${from.label}↦${to.label}`).join(', ')}`];
      return ['No son isomorfos.', r.status === 'not-isomorphic' ? r.reason : 'Búsqueda incompleta.', ...rows];
    }
    case 'dijkstra': {
      const g = graphOf(ex);
      const run = dijkstra(g, ex.params.source ?? '');
      const lines = [`Distancias: ${sorted(g).map((v) => `d(${v.label}) = ${formatDistance(run.dist[v.id])}`).join(', ')}`, `Orden en que se fijan: ${run.definitive.map((id) => vlabel(g, id)).join(', ')}`];
      if (ex.params.target) lines.push(`Camino mínimo: ${shortestPaths(run, ex.params.target, (id) => vlabel(g, id), 1)[0]?.map((id) => vlabel(g, id)).join(' → ') ?? '—'}`);
      return lines;
    }
    case 'bfs':
    case 'dfs': {
      const g = graphOf(ex);
      return [`Con vecinos en orden alfabético: ${traversalOrder(g, ex.params.start ?? '', ex.topic).map((id) => vlabel(g, id)).join(' ')}`, 'Otros órdenes de vecinos también producen recorridos válidos.'];
    }
  }
}
