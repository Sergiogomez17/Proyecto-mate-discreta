import { createGraphStore } from '@/stores/graphStore';

/** Grafo de trabajo del módulo Dijkstra. */
export const useDijkstraGraphStore = createGraphStore({ storageKey: 'dijkstra', defaultExampleId: 'ciudades' });
