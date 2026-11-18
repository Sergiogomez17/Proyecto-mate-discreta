import { ISOMORPHISM_PAIRS } from '@/algorithms/graph/examples';
import { createGraphStore } from '@/stores/graphStore';

const first = ISOMORPHISM_PAIRS[0];

/** Grafos G1 y G2 del módulo de isomorfismo: cada uno con su propio historial. */
export const useIsoG1Store = createGraphStore({
  storageKey: 'isomorfismo-g1',
  defaultExampleId: 'casa',
  ...(first ? { initial: { graph: first.g1, name: `${first.name} · G1` } } : {}),
});
export const useIsoG2Store = createGraphStore({
  storageKey: 'isomorfismo-g2',
  defaultExampleId: 'casa',
  ...(first ? { initial: { graph: first.g2, name: `${first.name} · G2` } } : {}),
});
