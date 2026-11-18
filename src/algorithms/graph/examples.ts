import type { Edge, Graph, Vertex } from '@/types/graph';
import { circleLayout } from './layout';

interface GraphSpec {
  directed: boolean;
  weighted: boolean;
  /** [nombre, x, y]: x e y son el centro del vértice en el lienzo. */
  vertices: Array<[string, number, number]>;
  /** [origen, destino, peso]: por nombre de vértice. */
  edges: Array<[string, string, number?]>;
}

/** Construye un grafo a partir de nombres. Identificadores: v1, v2, … y e1, e2, … */
export function buildGraph(spec: GraphSpec): Graph {
  const vertices: Vertex[] = spec.vertices.map(([label, x, y], i) => ({ id: `v${i + 1}`, label, position: { x, y } }));
  const idOf = new Map(vertices.map((v) => [v.label, v.id]));
  const edges: Edge[] = spec.edges.map(([s, t, w], i) => {
    const source = idOf.get(s);
    const target = idOf.get(t);
    if (!source || !target) throw new Error(`Ejemplo mal definido: la arista ${s}-${t} usa un vértice inexistente.`);
    return { id: `e${i + 1}`, source, target, weight: w ?? 1 };
  });
  return { directed: spec.directed, weighted: spec.weighted, vertices, edges };
}

export interface GraphExample {
  id: string;
  name: string;
  description: string;
  graph: Graph;
}

const k5Positions = circleLayout(5, { x: 300, y: 220 }, 160);
const k5Labels = ['A', 'B', 'C', 'D', 'E'];
const outerPetersen = circleLayout(5, { x: 300, y: 230 }, 190);
const innerPetersen = circleLayout(5, { x: 300, y: 230 }, 90);
const pentagon = circleLayout(5, { x: 220, y: 200 }, 140);
const hexagon = circleLayout(6, { x: 220, y: 200 }, 140);
/** Vértices con nombre y posición tomada de una lista de puntos. */
const placed = (labels: string[], points: Array<{ x: number; y: number }>) =>
  labels.map((l, i): [string, number, number] => [l, points[i]?.x ?? 0, points[i]?.y ?? 0]);

export const GRAPH_EXAMPLES: readonly GraphExample[] = [
  {
    id: 'ciudades',
    name: 'Red de ciudades (ponderado)',
    description: 'Grafo no dirigido ponderado de seis vértices: distancias entre ciudades. Útil para Dijkstra.',
    graph: buildGraph({
      directed: false,
      weighted: true,
      vertices: [
        ['A', 80, 220],
        ['B', 240, 80],
        ['C', 240, 360],
        ['D', 440, 80],
        ['E', 440, 360],
        ['F', 600, 220],
      ],
      edges: [
        ['A', 'B', 4],
        ['A', 'C', 2],
        ['B', 'C', 1],
        ['B', 'D', 5],
        ['C', 'D', 8],
        ['C', 'E', 10],
        ['D', 'E', 2],
        ['D', 'F', 6],
        ['E', 'F', 2],
      ],
    }),
  },
  {
    id: 'konigsberg',
    name: 'Puentes de Königsberg (multigrafo)',
    description: 'Cuatro zonas de tierra y siete puentes: aristas paralelas entre A–B y A–C. Todos los grados son impares.',
    graph: buildGraph({
      directed: false,
      weighted: false,
      vertices: [
        ['A', 220, 220],
        ['B', 220, 60],
        ['C', 220, 380],
        ['D', 480, 220],
      ],
      edges: [
        ['A', 'B'],
        ['A', 'B'],
        ['A', 'C'],
        ['A', 'C'],
        ['A', 'D'],
        ['B', 'D'],
        ['C', 'D'],
      ],
    }),
  },
  {
    id: 'casa',
    name: 'La casa (camino euleriano)',
    description: 'Cuadrado con techo triangular: exactamente dos vértices de grado impar.',
    graph: buildGraph({
      directed: false,
      weighted: false,
      vertices: [
        ['A', 300, 60],
        ['B', 180, 190],
        ['C', 420, 190],
        ['D', 180, 360],
        ['E', 420, 360],
      ],
      edges: [
        ['A', 'B'],
        ['A', 'C'],
        ['B', 'C'],
        ['B', 'D'],
        ['C', 'E'],
        ['D', 'E'],
      ],
    }),
  },
  {
    id: 'dirigido',
    name: 'Grafo dirigido con ciclos',
    description: 'Arcos ponderados con dos componentes fuertemente conexas ({A, B, C} y {D, E}) y un sumidero F.',
    graph: buildGraph({
      directed: true,
      weighted: true,
      vertices: [
        ['A', 80, 100],
        ['B', 260, 40],
        ['C', 220, 240],
        ['D', 420, 220],
        ['E', 580, 120],
        ['F', 600, 340],
      ],
      edges: [
        ['A', 'B', 3],
        ['B', 'C', 1],
        ['C', 'A', 4],
        ['C', 'D', 2],
        ['D', 'E', 5],
        ['E', 'D', 1],
        ['E', 'F', 7],
        ['D', 'F', 9],
      ],
    }),
  },
  {
    id: 'desconexo',
    name: 'Grafo desconexo',
    description: 'Tres componentes conexas: un triángulo, una arista y un vértice aislado.',
    graph: buildGraph({
      directed: false,
      weighted: false,
      vertices: [
        ['A', 100, 100],
        ['B', 260, 100],
        ['C', 180, 240],
        ['D', 400, 100],
        ['E', 400, 260],
        ['F', 560, 180],
      ],
      edges: [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
        ['D', 'E'],
      ],
    }),
  },
  {
    id: 'completo',
    name: 'Grafo completo K5',
    description: 'Cinco vértices, todos adyacentes entre sí: 10 aristas y grado 4 en cada vértice.',
    graph: buildGraph({
      directed: false,
      weighted: false,
      vertices: k5Labels.map((label, i): [string, number, number] => [label, k5Positions[i]?.x ?? 0, k5Positions[i]?.y ?? 0]),
      edges: k5Labels.flatMap((a, i) => k5Labels.slice(i + 1).map((b): [string, string] => [a, b])),
    }),
  },
  {
    id: 'petersen',
    name: 'Grafo de Petersen',
    description: 'Diez vértices de grado 3. Tiene camino hamiltoniano pero no ciclo hamiltoniano.',
    graph: buildGraph({
      directed: false,
      weighted: false,
      vertices: [...placed(['1', '2', '3', '4', '5'], outerPetersen), ...placed(['6', '7', '8', '9', '10'], innerPetersen)],
      edges: [
        ['1', '2'],
        ['2', '3'],
        ['3', '4'],
        ['4', '5'],
        ['5', '1'],
        ['1', '6'],
        ['2', '7'],
        ['3', '8'],
        ['4', '9'],
        ['5', '10'],
        ['6', '8'],
        ['8', '10'],
        ['10', '7'],
        ['7', '9'],
        ['9', '6'],
      ],
    }),
  },
  {
    id: 'empates',
    name: 'Caminos mínimos con empates',
    description: 'Dos caminos mínimos de A a D, una arista de peso 0 y un vértice inalcanzable (G).',
    graph: buildGraph({
      directed: false,
      weighted: true,
      vertices: [
        ['A', 80, 200],
        ['B', 240, 80],
        ['C', 240, 320],
        ['D', 400, 200],
        ['E', 560, 200],
        ['F', 560, 360],
        ['G', 80, 380],
      ],
      edges: [
        ['A', 'B', 2],
        ['A', 'C', 3],
        ['B', 'D', 3],
        ['C', 'D', 2],
        ['D', 'E', 0],
        ['E', 'F', 4],
        ['C', 'F', 9],
      ],
    }),
  },
];

export const DEFAULT_GRAPH_EXAMPLE = 'ciudades';

export function findExample(id: string): GraphExample | undefined {
  return GRAPH_EXAMPLES.find((e) => e.id === id);
}

export interface GraphPairExample {
  id: string;
  name: string;
  description: string;
  g1: Graph;
  g2: Graph;
}

/** Pares para el módulo de isomorfismo. */
export const ISOMORPHISM_PAIRS: readonly GraphPairExample[] = [
  {
    id: 'pentagono-estrella',
    name: 'Pentágono y estrella (isomorfos)',
    description: 'Un ciclo de 5 vértices dibujado como pentágono y como estrella: el dibujo cambia, la estructura no.',
    g1: buildGraph({
      directed: false,
      weighted: false,
      vertices: placed(['A', 'B', 'C', 'D', 'E'], pentagon),
      edges: [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
        ['D', 'E'],
        ['E', 'A'],
      ],
    }),
    g2: buildGraph({
      directed: false,
      weighted: false,
      vertices: placed(['1', '2', '3', '4', '5'], pentagon),
      edges: [
        ['1', '3'],
        ['3', '5'],
        ['5', '2'],
        ['2', '4'],
        ['4', '1'],
      ],
    }),
  },
  {
    id: 'k33-prisma',
    name: 'K3,3 y prisma (mismos grados, no isomorfos)',
    description: 'Ambos tienen 6 vértices, 9 aristas y grado 3 en cada vértice, pero el prisma tiene triángulos y K3,3 no.',
    g1: buildGraph({
      directed: false,
      weighted: false,
      vertices: [
        ['A', 100, 80],
        ['B', 220, 80],
        ['C', 340, 80],
        ['D', 100, 320],
        ['E', 220, 320],
        ['F', 340, 320],
      ],
      edges: ['A', 'B', 'C'].flatMap((a) => ['D', 'E', 'F'].map((b): [string, string] => [a, b])),
    }),
    g2: buildGraph({
      directed: false,
      weighted: false,
      vertices: placed(['1', '2', '3', '4', '5', '6'], hexagon),
      edges: [
        ['1', '2'],
        ['2', '3'],
        ['3', '1'],
        ['4', '5'],
        ['5', '6'],
        ['6', '4'],
        ['1', '4'],
        ['2', '5'],
        ['3', '6'],
      ],
    }),
  },
  {
    id: 'ciclo-triangulos',
    name: 'C6 y dos triángulos (no isomorfos)',
    description: 'Mismos vértices, aristas y secuencia de grados (todos 2), pero uno es conexo y el otro no.',
    g1: buildGraph({
      directed: false,
      weighted: false,
      vertices: placed(['A', 'B', 'C', 'D', 'E', 'F'], hexagon),
      edges: [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
        ['D', 'E'],
        ['E', 'F'],
        ['F', 'A'],
      ],
    }),
    g2: buildGraph({
      directed: false,
      weighted: false,
      vertices: [
        ['1', 100, 100],
        ['2', 220, 100],
        ['3', 160, 210],
        ['4', 300, 220],
        ['5', 420, 220],
        ['6', 360, 330],
      ],
      edges: [
        ['1', '2'],
        ['2', '3'],
        ['3', '1'],
        ['4', '5'],
        ['5', '6'],
        ['6', '4'],
      ],
    }),
  },
  {
    id: 'dirigidos',
    name: 'Dos grafos dirigidos isomorfos',
    description: 'El sentido de los arcos también debe conservarse en la correspondencia.',
    g1: buildGraph({
      directed: true,
      weighted: false,
      vertices: [
        ['A', 100, 100],
        ['B', 300, 100],
        ['C', 300, 300],
        ['D', 100, 300],
      ],
      edges: [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
        ['D', 'A'],
        ['A', 'C'],
      ],
    }),
    g2: buildGraph({
      directed: true,
      weighted: false,
      vertices: [
        ['1', 200, 60],
        ['2', 340, 200],
        ['3', 200, 340],
        ['4', 60, 200],
      ],
      edges: [
        ['3', '4'],
        ['4', '1'],
        ['1', '2'],
        ['2', '3'],
        ['3', '1'],
      ],
    }),
  },
];
