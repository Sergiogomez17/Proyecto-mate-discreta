import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GraphEditResult } from '@/algorithms/graph/editing';
import * as edit from '@/algorithms/graph/editing';
import { DEFAULT_GRAPH_EXAMPLE, findExample, GRAPH_EXAMPLES } from '@/algorithms/graph/examples';
import { isGraph, normalizeName } from '@/algorithms/graph/serialization';
import type { EdgeId, Graph, Point, VertexId } from '@/types/graph';
import { createSafeStorage, STORAGE_PREFIX } from '@/utils/storage';

export type GraphSelection = { kind: 'vertex'; id: VertexId } | { kind: 'edge'; id: EdgeId } | null;

export interface SavedProject {
  id: string;
  name: string;
  /** Fecha ISO de la última vez que se guardó. */
  savedAt: string;
  graph: Graph;
}

export const MAX_PROJECTS = 20;
/** Cantidad de cambios que se pueden deshacer. */
export const HISTORY_LIMIT = 50;

export interface GraphStoreConfig {
  /** Clave de almacenamiento local (se antepone el prefijo de la aplicación). */
  storageKey: string;
  /** Ejemplo que se carga la primera vez. */
  defaultExampleId: string;
  /** Alternativa: un grafo inicial propio (por ejemplo, uno de los pares de isomorfismo). */
  initial?: { graph: Graph; name: string };
}

interface GraphState {
  graph: Graph;
  /** Nombre del proyecto en edición (se usa al guardar y exportar). */
  name: string;
  selection: GraphSelection;
  past: Graph[];
  future: Graph[];
  projects: SavedProject[];

  select: (selection: GraphSelection) => void;
  setName: (name: string) => void;
  /** Las acciones de edición devuelven un mensaje de error o null si se aplicaron. */
  addVertex: (label: string, position: Point) => string | null;
  renameVertex: (id: VertexId, label: string) => string | null;
  moveVertex: (id: VertexId, position: Point) => void;
  removeVertex: (id: VertexId) => string | null;
  addEdge: (source: VertexId, target: VertexId, weight: number) => string | null;
  setEdgeWeight: (id: EdgeId, weight: number) => string | null;
  reverseEdge: (id: EdgeId) => string | null;
  removeEdge: (id: EdgeId) => string | null;
  setDirected: (directed: boolean) => void;
  setWeighted: (weighted: boolean) => void;
  loadExample: (exampleId: string) => void;
  /** Reemplaza el grafo (importación o proyecto guardado). Se puede deshacer. */
  replaceGraph: (graph: Graph, name: string) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;

  saveProject: (name: string, now?: Date) => string | null;
  openProject: (id: string) => string | null;
  deleteProject: (id: string) => void;
}

/** La selección deja de ser válida si el elemento ya no existe en el grafo. */
function keepSelection(graph: Graph, selection: GraphSelection): GraphSelection {
  if (!selection) return null;
  const exists = selection.kind === 'vertex' ? graph.vertices.some((v) => v.id === selection.id) : graph.edges.some((e) => e.id === selection.id);
  return exists ? selection : null;
}

let projectCounter = 0;
const newProjectId = (now: Date) => `p-${now.getTime().toString(36)}-${(projectCounter++).toString(36)}`;

/**
 * Crea un almacén de grafo independiente (con historial, selección y proyectos). El editor de grafos
 * y cada simulador usan el suyo, de modo que trabajar en uno no altera el grafo de los demás.
 */
export function createGraphStore(config: GraphStoreConfig) {
  return create<GraphState>()(
  persist(
    (set, get) => {
      /** Registra un grafo nuevo en el historial (permite deshacer). */
      const commit = (graph: Graph, selection: GraphSelection = get().selection) => {
        const { graph: previous, past } = get();
        if (graph === previous) return;
        set({ graph, past: [...past, previous].slice(-HISTORY_LIMIT), future: [], selection: keepSelection(graph, selection) });
      };
      const apply = (result: GraphEditResult, select?: (id: string | null) => GraphSelection): string | null => {
        if (!result.ok) return result.error;
        commit(result.graph, select ? select(result.id) : get().selection);
        return null;
      };
      const example = findExample(config.defaultExampleId) ?? GRAPH_EXAMPLES[0];

      return {
        graph: config.initial?.graph ?? example?.graph ?? edit.EMPTY_GRAPH,
        name: config.initial?.name ?? example?.name ?? 'Grafo sin nombre',
        selection: null,
        past: [],
        future: [],
        projects: [],

        select: (selection) => set({ selection: keepSelection(get().graph, selection) }),
        setName: (name) => set({ name: name.slice(0, 60) }),

        addVertex: (label, position) => apply(edit.addVertex(get().graph, label, position), (id) => (id ? { kind: 'vertex', id } : null)),
        renameVertex: (id, label) => apply(edit.renameVertex(get().graph, id, label)),
        moveVertex: (id, position) => {
          const result = edit.moveVertex(get().graph, id, position);
          const current = get().graph.vertices.find((v) => v.id === id)?.position;
          // Un clic sin desplazamiento no genera un paso en el historial.
          if (result.ok && current && (current.x !== Math.round(position.x) || current.y !== Math.round(position.y))) commit(result.graph);
        },
        removeVertex: (id) => apply(edit.removeVertex(get().graph, id), () => null),
        addEdge: (source, target, weight) => apply(edit.addEdge(get().graph, source, target, weight), (id) => (id ? { kind: 'edge', id } : null)),
        setEdgeWeight: (id, weight) => apply(edit.setEdgeWeight(get().graph, id, weight)),
        reverseEdge: (id) => apply(edit.reverseEdge(get().graph, id)),
        removeEdge: (id) => apply(edit.removeEdge(get().graph, id), () => null),
        setDirected: (directed) => commit(edit.setDirected(get().graph, directed)),
        setWeighted: (weighted) => commit(edit.setWeighted(get().graph, weighted)),

        loadExample: (exampleId) => {
          const found = GRAPH_EXAMPLES.find((e) => e.id === exampleId);
          if (!found) return;
          commit(found.graph, null);
          set({ name: found.name });
        },
        replaceGraph: (graph, name) => {
          commit(graph, null);
          set({ name: normalizeName(name) });
        },
        clear: () => {
          commit(edit.EMPTY_GRAPH, null);
          set({ name: 'Grafo sin nombre' });
        },

        undo: () => {
          const { past, graph, future, selection } = get();
          const previous = past[past.length - 1];
          if (!previous) return;
          set({ graph: previous, past: past.slice(0, -1), future: [graph, ...future].slice(0, HISTORY_LIMIT), selection: keepSelection(previous, selection) });
        },
        redo: () => {
          const { past, graph, future, selection } = get();
          const next = future[0];
          if (!next) return;
          set({ graph: next, past: [...past, graph].slice(-HISTORY_LIMIT), future: future.slice(1), selection: keepSelection(next, selection) });
        },

        saveProject: (rawName, now = new Date()) => {
          const name = normalizeName(rawName);
          const { projects, graph } = get();
          const existing = projects.find((p) => p.name === name);
          if (!existing && projects.length >= MAX_PROJECTS) {
            return `Se alcanzó el máximo de ${MAX_PROJECTS} proyectos guardados. Elimine alguno antes de guardar otro.`;
          }
          const project: SavedProject = { id: existing?.id ?? newProjectId(now), name, savedAt: now.toISOString(), graph };
          // El proyecto guardado más reciente aparece primero.
          set({ name, projects: [project, ...projects.filter((p) => p.id !== project.id)] });
          return null;
        },
        openProject: (id) => {
          const project = get().projects.find((p) => p.id === id);
          if (!project) return 'El proyecto ya no existe.';
          commit(project.graph, null);
          set({ name: project.name });
          return null;
        },
        deleteProject: (id) => set({ projects: get().projects.filter((p) => p.id !== id) }),
      };
    },
    {
      name: `${STORAGE_PREFIX}:${config.storageKey}`,
      version: 1,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: ({ graph, name, projects }) => ({ graph, name, projects }),
      // Lo guardado se valida: un grafo o proyecto alterado o incompatible se descarta.
      merge: (persisted, current) => {
        const data = (typeof persisted === 'object' && persisted !== null ? persisted : {}) as Record<string, unknown>;
        const stored = data.graph;
        const graphOk = isGraph(stored);
        const graph = graphOk ? stored : current.graph;
        const name = graphOk && typeof data.name === 'string' ? normalizeName(data.name) : current.name;
        const projects = Array.isArray(data.projects) ? data.projects.filter(isSavedProject).slice(0, MAX_PROJECTS) : [];
        return { ...current, graph, name, projects };
      },
    },
  ),
  );
}

export type GraphStore = ReturnType<typeof createGraphStore>;

/** Almacén del editor de grafos (módulo «Teoría de grafos»). */
export const useGraphStore = createGraphStore({ storageKey: 'graph-editor', defaultExampleId: DEFAULT_GRAPH_EXAMPLE });

function isSavedProject(value: unknown): value is SavedProject {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.name === 'string' && typeof p.savedAt === 'string' && isGraph(p.graph);
}
