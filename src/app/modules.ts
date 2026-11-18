import type { LucideIcon } from 'lucide-react';
import { GitCompareArrows, GraduationCap, Layers, Network, Route, Share2, Waypoints } from 'lucide-react';

export type ModuleId =
  | 'trees'
  | 'graphs'
  | 'euler-hamilton'
  | 'isomorphism'
  | 'dijkstra'
  | 'traversals'
  | 'practice';

export type ModuleStatus = 'available' | 'in-development';

export interface ModuleInfo {
  id: ModuleId;
  title: string;
  /** Frase breve para la tarjeta del panel principal. */
  summary: string;
  path: string;
  /** Sección de la navegación a la que pertenece. */
  section: 'simulaciones' | 'laboratorio';
  icon: LucideIcon;
  topics: string[];
  /** Funcionalidades comprometidas para el módulo, tal como se mostrarán al docente. */
  plannedFeatures: string[];
  /** Fase del plan de desarrollo en la que se entrega. */
  phase: number;
  status: ModuleStatus;
}

/**
 * Registro único de módulos. El panel principal, la navegación, las rutas y las
 * migas de pan se generan a partir de esta lista, de modo que agregar un módulo
 * consiste en registrarlo aquí y crear su página.
 */
export const MODULES: readonly ModuleInfo[] = [
  {
    id: 'trees',
    title: 'Árboles binarios',
    summary: 'Construya árboles, calcule altura, niveles y grados, y anime los recorridos preorden, inorden, postorden y por niveles.',
    path: '/simulaciones/arboles-binarios',
    section: 'simulaciones',
    icon: Network,
    topics: ['Raíz y hojas', 'Altura', 'Recorridos'],
    plannedFeatures: [
      'Editor visual: agregar, eliminar y renombrar nodos; asignar hijos izquierdo y derecho.',
      'Validación de la estructura y árboles de ejemplo.',
      'Número de nodos, raíz, hojas, altura (en aristas), profundidad, niveles y grados.',
      'Recorridos preorden, inorden, postorden y por niveles con animación paso a paso.',
      'Controles: iniciar, pausar, continuar, paso siguiente y anterior, reiniciar y velocidad.',
    ],
    phase: 2,
    status: 'available',
  },
  {
    id: 'graphs',
    title: 'Teoría de grafos',
    summary: 'Editor de grafos dirigidos y no dirigidos con pesos, grados, matriz y lista de adyacencia y componentes conexas.',
    path: '/simulaciones/grafos',
    section: 'simulaciones',
    icon: Share2,
    topics: ['Grados', 'Adyacencia', 'Conexidad'],
    plannedFeatures: [
      'Agregar, mover, renombrar y eliminar vértices; crear, ponderar y eliminar aristas.',
      'Grafos dirigidos o no dirigidos, con o sin pesos.',
      'Grado, grado de entrada y de salida de cada vértice.',
      'Matriz de adyacencia, lista de adyacencia y componentes conexas.',
      'Guardado local, ejemplos y exportación e importación en JSON.',
    ],
    phase: 3,
    status: 'available',
  },
  {
    id: 'euler-hamilton',
    title: 'Euler y Hamilton',
    summary: 'Clasifique grafos eulerianos, recorra aristas con el algoritmo de Fleury y busque caminos y ciclos hamiltonianos.',
    path: '/simulaciones/euler-hamilton',
    section: 'simulaciones',
    icon: Route,
    topics: ['Fleury', 'Puentes', 'Backtracking'],
    plannedFeatures: [
      'Clasificación: circuito euleriano, camino euleriano abierto o grafo no euleriano.',
      'Algoritmo de Fleury interactivo con detección de puentes y advertencias.',
      'Búsqueda de caminos y ciclos hamiltonianos por backtracking con límites configurables.',
      'Distinción entre «existe solución», «se demostró que no existe» y «búsqueda incompleta».',
      'Validación de recorridos propuestos por el estudiante.',
    ],
    phase: 4,
    status: 'available',
  },
  {
    id: 'isomorphism',
    title: 'Isomorfismo',
    summary: 'Compare dos grafos, sus invariantes y secuencias de grados, y verifique correspondencias biyectivas.',
    path: '/simulaciones/isomorfismo',
    section: 'simulaciones',
    icon: GitCompareArrows,
    topics: ['Invariantes', 'Biyección', 'Correspondencias'],
    plannedFeatures: [
      'Dos editores de grafos, G1 y G2, en la misma pantalla.',
      'Comparación de vértices, aristas y secuencias de grados ordenadas.',
      'Búsqueda exacta de isomorfismo por backtracking con poda.',
      'Verificación de correspondencias propuestas: biyectividad y conservación de aristas.',
    ],
    phase: 4,
    status: 'available',
  },
  {
    id: 'dijkstra',
    title: 'Dijkstra',
    summary: 'Calcule caminos mínimos paso a paso, con relajaciones, distancias, predecesores y vértices definitivos.',
    path: '/simulaciones/dijkstra',
    section: 'simulaciones',
    icon: Waypoints,
    topics: ['Relajación', 'Caminos mínimos', 'Pesos'],
    plannedFeatures: [
      'Selección de origen y destino, y edición de pesos.',
      'Ejecución automática o paso a paso, con pausa y retroceso.',
      'Tabla de distancias provisionales y definitivas, predecesores y estado de cada vértice.',
      'Relajación d(v) = min(d(v), d(u) + w(u,v)) visible en cada paso.',
      'Empates, múltiples caminos mínimos, pesos cero, vértices inalcanzables y rechazo de pesos negativos.',
    ],
    phase: 4,
    status: 'available',
  },
  {
    id: 'traversals',
    title: 'BFS y DFS',
    summary: 'Recorra grafos en anchura y en profundidad observando la cola, la pila y el árbol de recorrido.',
    path: '/simulaciones/bfs-dfs',
    section: 'simulaciones',
    icon: Layers,
    topics: ['Cola', 'Pila', 'Árbol de recorrido'],
    plannedFeatures: [
      'Búsqueda en anchura (BFS) con la cola visible en cada paso.',
      'Búsqueda en profundidad (DFS) con la pila de llamadas.',
      'Aristas exploradas, árbol de recorrido y secuencia final.',
      'Orden de vecinos determinista (alfabético por nombre) y ejecución automática o manual.',
    ],
    phase: 4,
    status: 'available',
  },
  {
    id: 'practice',
    title: 'Laboratorio de práctica',
    summary: 'Ejercicios generados automáticamente con calificación, pistas, retroalimentación e historial local.',
    path: '/laboratorio',
    section: 'laboratorio',
    icon: GraduationCap,
    topics: ['Ejercicios', 'Calificación', 'Niveles'],
    plannedFeatures: [
      'Ejercicios de grados, árboles, recorridos, Euler, Fleury, Hamilton, isomorfismo, Dijkstra, BFS y DFS.',
      'Niveles básico, intermedio y avanzado.',
      'Calificación con verificación matemática de la respuesta (acepta todas las soluciones válidas).',
      'Pistas, retroalimentación, corrección de errores e historial guardado en el navegador.',
    ],
    phase: 5,
    status: 'available',
  },
];

export function getModule(id: ModuleId): ModuleInfo {
  const module = MODULES.find((m) => m.id === id);
  if (!module) throw new Error(`Módulo desconocido: ${id}`);
  return module;
}

export const SIMULATION_MODULES = MODULES.filter((m) => m.section === 'simulaciones');
