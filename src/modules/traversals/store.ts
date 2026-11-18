import { createGraphStore } from '@/stores/graphStore';

/** Grafo de trabajo del módulo BFS y DFS. */
export const useTraversalGraphStore = createGraphStore({ storageKey: 'bfs-dfs', defaultExampleId: 'petersen' });
