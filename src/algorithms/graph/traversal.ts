import type { EdgeId, Graph, VertexId } from '@/types/graph';
import { neighborLists } from './adjacency';
import { sortVerticesByLabel } from './order';

/**
 * Recorridos en anchura (BFS) y en profundidad (DFS) con registro de cada operación.
 *
 * - Los vecinos se exploran en orden alfabético por nombre y sin duplicados (las aristas paralelas
 *   llevan al mismo vecino). En grafos dirigidos se siguen los arcos en su sentido.
 * - BFS usa una cola: un vértice se marca como descubierto al encolarlo y se visita al desencolarlo.
 * - DFS es la versión recursiva: la pila de llamadas se muestra en cada paso.
 * - Opcionalmente, al agotarse lo alcanzable, se continúa desde el siguiente vértice no visitado
 *   (bosque de recorrido).
 */

export type GraphTraversalKind = 'bfs' | 'dfs';

export type TraversalAction = 'start' | 'visit' | 'discover' | 'skip' | 'return' | 'restart' | 'end';

export interface GraphTraversalStep {
  action: TraversalAction;
  current: VertexId | null;
  neighbor: VertexId | null;
  /** Arista examinada (la de menor id entre las paralelas). */
  edgeId: EdgeId | null;
  /** Vértices visitados, en orden de visita. */
  order: VertexId[];
  /** BFS: cola (frente → final). */
  queue: VertexId[];
  /** DFS: pila de llamadas (base → cima). */
  stack: VertexId[];
  treeEdges: EdgeId[];
  exploredEdges: EdgeId[];
  /** Padre de cada vértice en el árbol de recorrido. */
  parent: Record<VertexId, VertexId>;
  explanation: string;
}

export interface TraversalOptions {
  /** Continuar con los vértices no alcanzados (bosque). */
  forest: boolean;
}

export function graphTraversalSteps(graph: Graph, start: VertexId, kind: GraphTraversalKind, options: TraversalOptions = { forest: false }): GraphTraversalStep[] {
  const label = new Map(graph.vertices.map((v) => [v.id, v.label]));
  if (!label.has(start)) return [];
  const name = (id: VertexId) => label.get(id) ?? id;
  const nbs = neighborLists(graph);
  const steps: GraphTraversalStep[] = [];
  const order: VertexId[] = [];
  const queue: VertexId[] = [];
  const stack: VertexId[] = [];
  const treeEdges: EdgeId[] = [];
  const explored: EdgeId[] = [];
  const parent: Record<VertexId, VertexId> = {};
  const marked = new Set<VertexId>();
  const arrow = graph.directed ? '→' : '–';

  const push = (action: TraversalAction, current: VertexId | null, explanation: string, neighbor: VertexId | null = null, edgeId: EdgeId | null = null) => {
    steps.push({
      action,
      current,
      neighbor,
      edgeId,
      order: [...order],
      queue: [...queue],
      stack: [...stack],
      treeEdges: [...treeEdges],
      exploredEdges: [...explored],
      parent: { ...parent },
      explanation,
    });
  };

  const bfsFrom = (root: VertexId) => {
    marked.add(root);
    queue.push(root);
    push('start', root, `Se encola ${name(root)} y se marca como descubierto.`);
    while (queue.length > 0) {
      const u = queue.shift();
      if (u === undefined) break;
      order.push(u);
      push('visit', u, `Se desencola ${name(u)} (el primero de la cola) y se visita: es el ${order.length}.º vértice del recorrido.`);
      for (const nb of nbs.get(u) ?? []) {
        const w = nb.vertex.id;
        const edgeId = nb.edgeIds[0] ?? null;
        if (edgeId) explored.push(edgeId);
        if (!marked.has(w)) {
          marked.add(w);
          queue.push(w);
          if (edgeId) treeEdges.push(edgeId);
          parent[w] = u;
          push('discover', u, `Se examina ${name(u)}${arrow}${name(w)}: ${name(w)} no había sido descubierto; se encola y ${name(u)}${arrow}${name(w)} pasa al árbol BFS.`, w, edgeId);
        } else {
          push('skip', u, `Se examina ${name(u)}${arrow}${name(w)}: ${name(w)} ya fue descubierto; se ignora.`, w, edgeId);
        }
      }
    }
  };

  const dfsVisit = (u: VertexId) => {
    for (const nb of nbs.get(u) ?? []) {
      const w = nb.vertex.id;
      const edgeId = nb.edgeIds[0] ?? null;
      if (edgeId) explored.push(edgeId);
      if (!marked.has(w)) {
        marked.add(w);
        if (edgeId) treeEdges.push(edgeId);
        parent[w] = u;
        order.push(w);
        stack.push(w);
        push('discover', w, `Se examina ${name(u)}${arrow}${name(w)}: ${name(w)} no ha sido visitado. Se llama a DFS(${name(w)}) y se visita: es el ${order.length}.º vértice.`, w, edgeId);
        dfsVisit(w);
      } else {
        const reason = !graph.directed && parent[u] === w ? `es el padre de ${name(u)}` : 'ya fue visitado';
        push('skip', u, `Se examina ${name(u)}${arrow}${name(w)}: ${name(w)} ${reason}; no se sigue por ahí.`, w, edgeId);
      }
    }
    stack.pop();
    const back = stack[stack.length - 1];
    push('return', u, back ? `${name(u)} no tiene más vecinos sin visitar: termina DFS(${name(u)}) y se regresa a ${name(back)}.` : `${name(u)} no tiene más vecinos sin visitar: termina DFS(${name(u)}), la llamada inicial.`);
  };

  const dfsFrom = (root: VertexId) => {
    marked.add(root);
    order.push(root);
    stack.push(root);
    push('start', root, `Se llama a DFS(${name(root)}) y se visita ${name(root)}: es el ${order.length}.º vértice del recorrido.`);
    dfsVisit(root);
  };

  const run = kind === 'bfs' ? bfsFrom : dfsFrom;
  run(start);
  if (options.forest) {
    for (const v of sortVerticesByLabel(graph.vertices)) {
      if (marked.has(v.id)) continue;
      push('restart', null, `${v.label} no es alcanzable desde lo ya recorrido: se inicia un nuevo árbol del bosque desde ${v.label}.`);
      run(v.id);
    }
  }
  const missing = sortVerticesByLabel(graph.vertices).filter((v) => !marked.has(v.id));
  push(
    'end',
    null,
    missing.length === 0
      ? `Fin del recorrido: se visitaron los ${order.length} vértices.`
      : `Fin del recorrido: se visitaron ${order.length} vértices. ${missing.map((v) => v.label).join(', ')} no ${missing.length === 1 ? 'es alcanzable' : 'son alcanzables'} desde ${name(start)}.`,
  );
  return steps;
}

/** Orden de visita final (sin generar pasos intermedios innecesarios para la interfaz). */
export function traversalOrder(graph: Graph, start: VertexId, kind: GraphTraversalKind, options?: TraversalOptions): VertexId[] {
  const steps = graphTraversalSteps(graph, start, kind, options);
  return steps[steps.length - 1]?.order ?? [];
}
