import type { Edge, EdgeId, Graph, Point, Vertex, VertexId } from '@/types/graph';

/**
 * Operaciones de edición de grafos. Son funciones puras: reciben un grafo y devuelven uno nuevo
 * (o un mensaje de error), sin modificar el original. Hacen cumplir la política de `types/graph.ts`:
 * sin lazos, aristas paralelas permitidas, pesos finitos y nombres únicos.
 */

export const MAX_VERTEX_LABEL_LENGTH = 8;
/** Límites del editor: mantienen fluido el dibujo y legibles la matriz y las tablas. */
export const MAX_VERTICES = 60;
export const MAX_EDGES = 300;
/** Magnitud máxima de un peso; evita números que no se pueden leer en el dibujo. */
export const MAX_ABS_WEIGHT = 1_000_000;

export const EMPTY_GRAPH: Graph = { directed: false, weighted: false, vertices: [], edges: [] };

export type GraphEditResult = { ok: true; graph: Graph; id: string | null } | { ok: false; error: string };

const fail = (error: string): GraphEditResult => ({ ok: false, error });
const done = (graph: Graph, id: string | null = null): GraphEditResult => ({ ok: true, graph, id });

export function findVertex(graph: Graph, id: VertexId): Vertex | undefined {
  return graph.vertices.find((v) => v.id === id);
}

export function findEdge(graph: Graph, id: EdgeId): Edge | undefined {
  return graph.edges.find((e) => e.id === id);
}

/** Nombre visible de un vértice (o su identificador si no existe). */
export function vertexLabel(graph: Graph, id: VertexId): string {
  return findVertex(graph, id)?.label ?? id;
}

/** Descripción de una arista: «A — B» en grafos no dirigidos, «A → B» en dirigidos. */
export function describeEdge(graph: Graph, edge: Edge): string {
  return `${vertexLabel(graph, edge.source)} ${graph.directed ? '→' : '—'} ${vertexLabel(graph, edge.target)}`;
}

/** Devuelve el mensaje de error del nombre propuesto, o null si es válido. */
export function checkVertexLabel(graph: Graph, raw: string, exceptId?: VertexId): string | null {
  const label = raw.trim();
  if (label === '') return 'El nombre del vértice no puede estar vacío.';
  if (/\s/.test(label)) return 'El nombre del vértice no puede contener espacios.';
  if ([...label].length > MAX_VERTEX_LABEL_LENGTH) return `El nombre admite como máximo ${MAX_VERTEX_LABEL_LENGTH} caracteres.`;
  if (graph.vertices.some((v) => v.label === label && v.id !== exceptId)) return `Ya existe un vértice llamado «${label}».`;
  return null;
}

/** Primer nombre libre: A, B, …, Z y después V1, V2, … */
export function suggestVertexLabel(graph: Graph): string {
  const used = new Set(graph.vertices.map((v) => v.label));
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    if (!used.has(letter)) return letter;
  }
  for (let k = 1; ; k++) if (!used.has(`V${k}`)) return `V${k}`;
}

/** Identificador nuevo con el prefijo dado: uno más que el mayor sufijo numérico existente. */
export function nextId(prefix: string, existing: Iterable<string>): string {
  let max = 0;
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  for (const id of existing) {
    const match = pattern.exec(id);
    if (match?.[1]) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${max + 1}`;
}

const roundPoint = (p: Point): Point => ({ x: Math.round(p.x), y: Math.round(p.y) });

/**
 * Posición libre para un vértice agregado desde el formulario: el primer punto de una cuadrícula
 * que no queda encima de otro vértice.
 */
export function suggestPosition(graph: Graph): Point {
  const MIN_DISTANCE = 80;
  for (let row = 0; row < 50; row++) {
    for (let col = 0; col < 6; col++) {
      const candidate = { x: 80 + col * 120, y: 70 + row * 110 };
      const free = graph.vertices.every((v) => Math.hypot(v.position.x - candidate.x, v.position.y - candidate.y) >= MIN_DISTANCE);
      if (free) return candidate;
    }
  }
  return { x: 80, y: 70 };
}

export function addVertex(graph: Graph, rawLabel: string, position: Point): GraphEditResult {
  if (graph.vertices.length >= MAX_VERTICES) return fail(`El editor admite como máximo ${MAX_VERTICES} vértices.`);
  const error = checkVertexLabel(graph, rawLabel);
  if (error) return fail(error);
  const id = nextId('v', graph.vertices.map((v) => v.id));
  const vertex: Vertex = { id, label: rawLabel.trim(), position: roundPoint(position) };
  return done({ ...graph, vertices: [...graph.vertices, vertex] }, id);
}

export function renameVertex(graph: Graph, id: VertexId, rawLabel: string): GraphEditResult {
  if (!findVertex(graph, id)) return fail('El vértice ya no existe.');
  const error = checkVertexLabel(graph, rawLabel, id);
  if (error) return fail(error);
  const label = rawLabel.trim();
  return done({ ...graph, vertices: graph.vertices.map((v) => (v.id === id ? { ...v, label } : v)) }, id);
}

export function moveVertex(graph: Graph, id: VertexId, position: Point): GraphEditResult {
  if (!findVertex(graph, id)) return fail('El vértice ya no existe.');
  const p = roundPoint(position);
  return done({ ...graph, vertices: graph.vertices.map((v) => (v.id === id ? { ...v, position: p } : v)) }, id);
}

/** Aristas que inciden en el vértice (las que se eliminarían junto con él). */
export function incidentEdges(graph: Graph, id: VertexId): Edge[] {
  return graph.edges.filter((e) => e.source === id || e.target === id);
}

/** Elimina el vértice y todas sus aristas incidentes. */
export function removeVertex(graph: Graph, id: VertexId): GraphEditResult {
  if (!findVertex(graph, id)) return fail('El vértice ya no existe.');
  return done({
    ...graph,
    vertices: graph.vertices.filter((v) => v.id !== id),
    edges: graph.edges.filter((e) => e.source !== id && e.target !== id),
  });
}

export type WeightParse = { ok: true; value: number } | { ok: false; error: string };

/**
 * Interpreta el texto de un peso. Acepta enteros y decimales con punto o coma («2,5»),
 * con signo opcional. Los pesos negativos son válidos en el editor; Dijkstra los rechazará.
 */
export function parseWeight(raw: string): WeightParse {
  const text = raw.trim().replace(',', '.');
  if (text === '') return { ok: false, error: 'Escriba un peso.' };
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(text)) return { ok: false, error: `«${raw.trim()}» no es un número válido.` };
  const value = Number(text);
  if (!Number.isFinite(value) || Math.abs(value) > MAX_ABS_WEIGHT) {
    return { ok: false, error: `El peso debe estar entre −${MAX_ABS_WEIGHT.toLocaleString('es')} y ${MAX_ABS_WEIGHT.toLocaleString('es')}.` };
  }
  // Se normaliza −0 a 0.
  return { ok: true, value: value === 0 ? 0 : value };
}

function checkWeight(weight: number): string | null {
  if (!Number.isFinite(weight)) return 'El peso debe ser un número finito.';
  if (Math.abs(weight) > MAX_ABS_WEIGHT) return `El peso debe estar entre −${MAX_ABS_WEIGHT} y ${MAX_ABS_WEIGHT}.`;
  return null;
}

export function addEdge(graph: Graph, source: VertexId, target: VertexId, weight = 1): GraphEditResult {
  if (graph.edges.length >= MAX_EDGES) return fail(`El editor admite como máximo ${MAX_EDGES} aristas.`);
  const from = findVertex(graph, source);
  const to = findVertex(graph, target);
  if (!from || !to) return fail('Seleccione dos vértices existentes.');
  if (source === target) return fail(`No se permiten lazos: una arista no puede unir «${from.label}» consigo mismo.`);
  const weightError = checkWeight(weight);
  if (weightError) return fail(weightError);
  const id = nextId('e', graph.edges.map((e) => e.id));
  const edge: Edge = { id, source, target, weight: weight === 0 ? 0 : weight };
  return done({ ...graph, edges: [...graph.edges, edge] }, id);
}

export function setEdgeWeight(graph: Graph, id: EdgeId, weight: number): GraphEditResult {
  if (!findEdge(graph, id)) return fail('La arista ya no existe.');
  const weightError = checkWeight(weight);
  if (weightError) return fail(weightError);
  return done({ ...graph, edges: graph.edges.map((e) => (e.id === id ? { ...e, weight: weight === 0 ? 0 : weight } : e)) }, id);
}

/** Intercambia origen y destino (solo tiene efecto visible en grafos dirigidos). */
export function reverseEdge(graph: Graph, id: EdgeId): GraphEditResult {
  if (!findEdge(graph, id)) return fail('La arista ya no existe.');
  return done({ ...graph, edges: graph.edges.map((e) => (e.id === id ? { ...e, source: e.target, target: e.source } : e)) }, id);
}

export function removeEdge(graph: Graph, id: EdgeId): GraphEditResult {
  if (!findEdge(graph, id)) return fail('La arista ya no existe.');
  return done({ ...graph, edges: graph.edges.filter((e) => e.id !== id) });
}

/**
 * Cambia entre grafo dirigido y no dirigido conservando las aristas: al pasar a no dirigido,
 * cada arco u→v se convierte en la arista {u, v}; dos arcos opuestos quedan como aristas paralelas.
 */
export function setDirected(graph: Graph, directed: boolean): Graph {
  return graph.directed === directed ? graph : { ...graph, directed };
}

/** Activa o desactiva los pesos. Los valores se conservan para no perderlos al volver a activarlos. */
export function setWeighted(graph: Graph, weighted: boolean): Graph {
  return graph.weighted === weighted ? graph : { ...graph, weighted };
}

/** Número de pares de arcos opuestos (u→v y v→u), que al quitar la dirección serían aristas paralelas. */
export function countOppositeArcPairs(graph: Graph): number {
  const arcs = new Map<string, number>();
  for (const e of graph.edges) arcs.set(`${e.source}\u0000${e.target}`, (arcs.get(`${e.source}\u0000${e.target}`) ?? 0) + 1);
  let pairs = 0;
  for (const [key, count] of arcs) {
    const [s, t] = key.split('\u0000');
    if (s !== undefined && t !== undefined && s < t) pairs += Math.min(count, arcs.get(`${t}\u0000${s}`) ?? 0);
  }
  return pairs;
}
