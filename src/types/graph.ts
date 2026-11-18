/**
 * Modelo de datos de grafos de GraphLab UVG.
 *
 * POLÍTICA DE GRAFOS (válida para todos los módulos y algoritmos)
 * -----------------------------------------------------------------
 * 1. Lazos (arista de un vértice a sí mismo): NO permitidos.
 *    Evita ambigüedades en el conteo de grados y no aporta a los temas del curso.
 * 2. Aristas paralelas: PERMITIDAS (multigrafo). Cada arista tiene un `id` propio,
 *    de modo que dos aristas entre los mismos vértices son objetos distintos.
 *    Esto permite modelar ejemplos clásicos como los puentes de Königsberg.
 *    - Grado: cuenta cada arista paralela por separado.
 *    - Matriz de adyacencia: muestra la multiplicidad (número de aristas).
 *    - Dijkstra: considera todas las aristas; la relajación usa la de menor peso.
 *    - BFS/DFS y Hamilton: trabajan con el conjunto de vecinos (sin duplicados).
 *    - Isomorfismo: debe conservar la multiplicidad de cada par de vértices.
 * 3. En grafos dirigidos, u→v y v→u son arcos distintos y no se consideran paralelos.
 * 4. Pesos: números reales finitos. Dijkstra rechaza pesos negativos.
 *    En un grafo no ponderado, todas las aristas se tratan con peso 1.
 * 5. Vértices aislados: permitidos. Cada algoritmo indica cómo los trata
 *    (por ejemplo, Euler los ignora al comprobar la conectividad).
 */

export type VertexId = string;
export type EdgeId = string;

export interface Point {
  x: number;
  y: number;
}

export interface Vertex {
  id: VertexId;
  /** Nombre visible, editable por el usuario (por ejemplo, «A» o «v1»). */
  label: string;
  /** Posición en el lienzo; no influye en ningún cálculo. */
  position: Point;
}

export interface Edge {
  id: EdgeId;
  source: VertexId;
  target: VertexId;
  /** Peso de la arista. Se ignora (se toma como 1) si el grafo no es ponderado. */
  weight: number;
}

export interface Graph {
  directed: boolean;
  weighted: boolean;
  vertices: Vertex[];
  edges: Edge[];
}

export interface VertexDegree {
  /** Grafos no dirigidos: número de aristas incidentes. Dirigidos: entrada + salida. */
  degree: number;
  inDegree: number;
  outDegree: number;
}

export type GraphIssueCode =
  | 'duplicate-vertex-id'
  | 'empty-label'
  | 'duplicate-label'
  | 'duplicate-edge-id'
  | 'missing-endpoint'
  | 'self-loop'
  | 'invalid-weight';

export interface GraphIssue {
  code: GraphIssueCode;
  message: string;
  vertexId?: VertexId;
  edgeId?: EdgeId;
}
