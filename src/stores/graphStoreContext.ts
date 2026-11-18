import { createContext, useContext } from 'react';
import type { GraphStore } from './graphStore';
import { useGraphStore } from './graphStore';

/**
 * Almacén de grafo activo para los componentes de edición (paneles de propiedades y de proyecto).
 * Por defecto es el del editor de grafos; cada simulador provee el suyo y el módulo de isomorfismo
 * provee uno distinto para G1 y para G2.
 */
export const GraphStoreContext = createContext<GraphStore>(useGraphStore);

export function useActiveGraphStore(): GraphStore {
  return useContext(GraphStoreContext);
}
