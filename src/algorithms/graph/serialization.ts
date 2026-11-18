import type { Edge, Graph, Point, Vertex } from '@/types/graph';
import { checkVertexLabel, MAX_ABS_WEIGHT, MAX_EDGES, MAX_VERTICES, nextId } from './editing';
import { circleLayout } from './layout';
import { validateGraph } from './validate';

/**
 * Formato de archivo JSON de GraphLab UVG.
 *
 * {
 *   "format": "graphlab-uvg/grafo", "version": 1, "name": "Mi grafo",
 *   "directed": false, "weighted": true,
 *   "vertices": [{ "id": "v1", "label": "A", "x": 80, "y": 220 }, …],
 *   "edges":    [{ "id": "e1", "source": "v1", "target": "v2", "weight": 4 }, …]
 * }
 *
 * Para facilitar la escritura a mano, la importación también acepta: vértices como texto
 * («"A"»), vértices sin coordenadas (se colocan en círculo), aristas sin id o sin peso (peso 1)
 * y extremos de arista indicados por nombre en lugar de id.
 */
export const GRAPH_FILE_FORMAT = 'graphlab-uvg/grafo';
export const GRAPH_FILE_VERSION = 1;
export const MAX_IMPORT_SIZE = 1_000_000;
const MAX_NAME_LENGTH = 60;
const MAX_REPORTED_ERRORS = 12;

export interface GraphFile {
  format: typeof GRAPH_FILE_FORMAT;
  version: typeof GRAPH_FILE_VERSION;
  name: string;
  exportedAt: string;
  directed: boolean;
  weighted: boolean;
  vertices: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ id: string; source: string; target: string; weight: number }>;
}

export function toGraphFile(graph: Graph, name: string, now: Date = new Date()): GraphFile {
  return {
    format: GRAPH_FILE_FORMAT,
    version: GRAPH_FILE_VERSION,
    name: normalizeName(name),
    exportedAt: now.toISOString(),
    directed: graph.directed,
    weighted: graph.weighted,
    vertices: graph.vertices.map((v) => ({ id: v.id, label: v.label, x: v.position.x, y: v.position.y })),
    edges: graph.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, weight: e.weight })),
  };
}

export function serializeGraph(graph: Graph, name: string, now?: Date): string {
  return JSON.stringify(toGraphFile(graph, name, now), null, 2);
}

export function normalizeName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
  return name === '' ? 'Grafo sin nombre' : name;
}

/** Nombre de archivo seguro a partir del nombre del proyecto. */
export function fileNameFor(name: string, extension: string): string {
  const base = normalizeName(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${base === '' ? 'grafo' : base}.${extension}`;
}

export type ImportResult = { ok: true; graph: Graph; name: string; warnings: string[] } | { ok: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Interpreta y valida un archivo JSON de grafo. Nunca lanza excepciones: devuelve los errores. */
export function parseGraphJson(text: string): ImportResult {
  if (text.length > MAX_IMPORT_SIZE) return { ok: false, errors: ['El archivo es demasiado grande (máximo 1 MB).'] };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['El archivo no contiene JSON válido. Revise comas, comillas y llaves.'] };
  }
  return parseGraphData(data);
}

export function parseGraphData(data: unknown): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const error = (message: string) => {
    if (errors.length < MAX_REPORTED_ERRORS) errors.push(message);
  };

  if (!isRecord(data)) return { ok: false, errors: ['El JSON debe ser un objeto con las listas «vertices» y «edges».'] };
  if (data.format !== undefined && data.format !== GRAPH_FILE_FORMAT) {
    return { ok: false, errors: [`Formato no reconocido: se esperaba «${GRAPH_FILE_FORMAT}».`] };
  }
  if (data.version !== undefined && data.version !== GRAPH_FILE_VERSION) {
    return { ok: false, errors: [`Versión de archivo no compatible (${String(data.version)}). Esta aplicación lee la versión ${GRAPH_FILE_VERSION}.`] };
  }
  if (data.directed !== undefined && typeof data.directed !== 'boolean') error('«directed» debe ser true o false.');
  if (data.weighted !== undefined && typeof data.weighted !== 'boolean') error('«weighted» debe ser true o false.');
  if (!Array.isArray(data.vertices)) return { ok: false, errors: [...errors, 'Falta la lista «vertices».'] };
  const rawEdges: unknown = data.edges ?? [];
  if (!Array.isArray(rawEdges)) return { ok: false, errors: [...errors, '«edges» debe ser una lista.'] };
  if (data.vertices.length > MAX_VERTICES) return { ok: false, errors: [`El grafo tiene ${data.vertices.length} vértices; el máximo es ${MAX_VERTICES}.`] };
  if (rawEdges.length > MAX_EDGES) return { ok: false, errors: [`El grafo tiene ${rawEdges.length} aristas; el máximo es ${MAX_EDGES}.`] };

  // Vértices
  const vertices: Vertex[] = [];
  const missingPosition: number[] = [];
  const pendingIds: Array<string | null> = [];
  data.vertices.forEach((raw: unknown, i: number) => {
    const where = `Vértice ${i + 1}`;
    const item = typeof raw === 'string' ? { label: raw } : raw;
    if (!isRecord(item)) return error(`${where}: debe ser un objeto o un nombre.`);
    if (typeof item.label !== 'string') return error(`${where}: falta el nombre («label»).`);
    const partial: Graph = { directed: false, weighted: false, vertices, edges: [] };
    const labelError = checkVertexLabel(partial, item.label);
    if (labelError) return error(`${where}: ${labelError}`);
    if (item.id !== undefined && (typeof item.id !== 'string' || item.id.trim() === '')) return error(`${where}: «id» debe ser un texto no vacío.`);
    const hasX = item.x !== undefined;
    const hasY = item.y !== undefined;
    if ((hasX && !isFiniteNumber(item.x)) || (hasY && !isFiniteNumber(item.y))) return error(`${where}: las coordenadas «x» e «y» deben ser números.`);
    const position: Point = isFiniteNumber(item.x) && isFiniteNumber(item.y) ? { x: Math.round(item.x), y: Math.round(item.y) } : { x: 0, y: 0 };
    if (!(isFiniteNumber(item.x) && isFiniteNumber(item.y))) missingPosition.push(vertices.length);
    pendingIds.push(typeof item.id === 'string' ? item.id.trim() : null);
    vertices.push({ id: '', label: item.label.trim(), position });
  });

  // Identificadores: se respetan los del archivo y se generan los que falten.
  const usedIds = new Set<string>();
  pendingIds.forEach((id, i) => {
    if (id === null) return;
    if (usedIds.has(id)) error(`El identificador de vértice «${id}» está repetido.`);
    usedIds.add(id);
    const v = vertices[i];
    if (v) v.id = id;
  });
  for (const v of vertices) {
    if (v.id === '') {
      v.id = nextId('v', usedIds);
      usedIds.add(v.id);
    }
  }

  if (missingPosition.length > 0) {
    const points = circleLayout(vertices.length);
    for (const i of missingPosition) {
      const v = vertices[i];
      const p = points[i];
      if (v && p) v.position = p;
    }
    warnings.push(`Se calcularon posiciones para ${missingPosition.length} ${missingPosition.length === 1 ? 'vértice sin coordenadas' : 'vértices sin coordenadas'}.`);
  }

  // Aristas
  const byId = new Map(vertices.map((v) => [v.id, v.id]));
  const byLabel = new Map(vertices.map((v) => [v.label, v.id]));
  const resolve = (ref: unknown): string | undefined => (typeof ref === 'string' ? (byId.get(ref) ?? byLabel.get(ref)) : undefined);
  const edges: Edge[] = [];
  const edgeIds = new Set<string>();
  const pendingEdgeIds: Array<string | null> = [];
  let anyWeight = false;

  rawEdges.forEach((raw: unknown, i: number) => {
    const where = `Arista ${i + 1}`;
    if (!isRecord(raw)) return error(`${where}: debe ser un objeto con «source» y «target».`);
    const source = resolve(raw.source);
    const target = resolve(raw.target);
    if (source === undefined || target === undefined) {
      return error(`${where}: «source» y «target» deben ser el id o el nombre de un vértice existente.`);
    }
    if (source === target) return error(`${where}: no se permiten lazos (arista de un vértice a sí mismo).`);
    if (raw.weight !== undefined) {
      if (!isFiniteNumber(raw.weight)) return error(`${where}: «weight» debe ser un número.`);
      if (Math.abs(raw.weight) > MAX_ABS_WEIGHT) return error(`${where}: el peso supera el máximo permitido (${MAX_ABS_WEIGHT}).`);
      anyWeight = true;
    }
    if (raw.id !== undefined && (typeof raw.id !== 'string' || raw.id.trim() === '')) return error(`${where}: «id» debe ser un texto no vacío.`);
    const id = typeof raw.id === 'string' ? raw.id.trim() : null;
    if (id !== null) {
      if (edgeIds.has(id)) return error(`El identificador de arista «${id}» está repetido.`);
      edgeIds.add(id);
    }
    pendingEdgeIds.push(id);
    const weight = isFiniteNumber(raw.weight) ? raw.weight : 1;
    edges.push({ id: '', source, target, weight: weight === 0 ? 0 : weight });
  });
  edges.forEach((e, i) => {
    const id = pendingEdgeIds[i] ?? null;
    if (id !== null) e.id = id;
  });
  for (const e of edges) {
    if (e.id === '') {
      e.id = nextId('e', edgeIds);
      edgeIds.add(e.id);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const graph: Graph = {
    directed: data.directed === true,
    weighted: typeof data.weighted === 'boolean' ? data.weighted : anyWeight,
    vertices,
    edges,
  };
  // Comprobación final con la misma validación que usa toda la aplicación.
  const issues = validateGraph(graph);
  if (issues.length > 0) return { ok: false, errors: issues.slice(0, MAX_REPORTED_ERRORS).map((i) => i.message) };

  const name = typeof data.name === 'string' ? normalizeName(data.name) : 'Grafo importado';
  return { ok: true, graph, name, warnings };
}

/** Comprueba que un valor guardado (por ejemplo, en localStorage) es un grafo válido completo. */
export function isGraph(value: unknown): value is Graph {
  if (!isRecord(value)) return false;
  if (typeof value.directed !== 'boolean' || typeof value.weighted !== 'boolean') return false;
  if (!Array.isArray(value.vertices) || !Array.isArray(value.edges)) return false;
  if (value.vertices.length > MAX_VERTICES || value.edges.length > MAX_EDGES) return false;
  const verticesOk = value.vertices.every(
    (v: unknown) =>
      isRecord(v) &&
      typeof v.id === 'string' &&
      typeof v.label === 'string' &&
      isRecord(v.position) &&
      isFiniteNumber(v.position.x) &&
      isFiniteNumber(v.position.y) &&
      checkVertexLabel({ directed: false, weighted: false, vertices: [], edges: [] }, v.label) === null,
  );
  const edgesOk = value.edges.every(
    (e: unknown) => isRecord(e) && typeof e.id === 'string' && typeof e.source === 'string' && typeof e.target === 'string' && isFiniteNumber(e.weight),
  );
  return verticesOk && edgesOk && validateGraph(value as unknown as Graph).length === 0;
}
