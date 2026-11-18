import type { Graph, VertexId } from '@/types/graph';
import type { BinaryTree } from '@/types/tree';

export type Topic =
  | 'degrees'
  | 'tree-properties'
  | 'preorder'
  | 'inorder'
  | 'postorder'
  | 'euler'
  | 'fleury'
  | 'hamilton'
  | 'isomorphism'
  | 'dijkstra'
  | 'bfs'
  | 'dfs';

export type Level = 'basic' | 'intermediate' | 'advanced';

export const TOPICS: ReadonlyArray<{ id: Topic; name: string }> = [
  { id: 'degrees', name: 'Grados' },
  { id: 'tree-properties', name: 'Árboles binarios' },
  { id: 'preorder', name: 'Preorden' },
  { id: 'inorder', name: 'Inorden' },
  { id: 'postorder', name: 'Postorden' },
  { id: 'euler', name: 'Euler' },
  { id: 'fleury', name: 'Fleury' },
  { id: 'hamilton', name: 'Hamilton' },
  { id: 'isomorphism', name: 'Isomorfismo' },
  { id: 'dijkstra', name: 'Dijkstra' },
  { id: 'bfs', name: 'BFS' },
  { id: 'dfs', name: 'DFS' },
];

export const LEVELS: ReadonlyArray<{ id: Level; name: string }> = [
  { id: 'basic', name: 'Básico' },
  { id: 'intermediate', name: 'Intermedio' },
  { id: 'advanced', name: 'Avanzado' },
];

export const topicName = (t: Topic) => TOPICS.find((x) => x.id === t)?.name ?? t;
export const levelName = (l: Level) => LEVELS.find((x) => x.id === l)?.name ?? l;

/** Tipo de dato que espera un campo de respuesta. */
export type FieldKind = 'number' | 'distance' | 'label' | 'labels';

export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
}

export type Part =
  | { type: 'fields'; id: string; title: string; fields: Field[] }
  | { type: 'choice'; id: string; title: string; options: Array<{ value: string; label: string }> }
  | { type: 'sequence'; id: string; title: string; help: string }
  | { type: 'mapping'; id: string; title: string; help: string };

export type Figure = { kind: 'graph'; graph: Graph } | { kind: 'tree'; tree: BinaryTree } | { kind: 'pair'; g1: Graph; g2: Graph };

export interface Exercise {
  topic: Topic;
  level: Level;
  seed: number;
  title: string;
  statement: string;
  figure: Figure;
  parts: Part[];
  /** Pistas en orden creciente de ayuda. Ninguna da la respuesta completa. */
  hints: string[];
  /** Datos para calificar (vértice inicial, origen, destino…). */
  params: { start?: VertexId; source?: VertexId; target?: VertexId };
}

/**
 * Respuestas del estudiante por parte: texto (secuencia o elección) o un registro de campos
 * (campos numéricos o correspondencia vértice → vértice).
 */
export type Answers = Record<string, string | Record<string, string>>;

export interface GradeItem {
  label: string;
  ok: boolean;
  /** Retroalimentación: por qué está bien o qué hay que corregir (sin revelar la solución). */
  message: string;
  /** Respuesta correcta; la interfaz solo la muestra si el estudiante pide ver la solución. */
  expected?: string;
}

export interface Grade {
  /** Entre 0 y 1. */
  score: number;
  items: GradeItem[];
}
