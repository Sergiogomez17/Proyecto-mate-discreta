import { createGraphStore } from '@/stores/graphStore';

/** Grafo de trabajo del módulo Euler y Hamilton (independiente del editor de grafos). */
export const useEulerGraphStore = createGraphStore({ storageKey: 'euler-hamilton', defaultExampleId: 'casa' });
