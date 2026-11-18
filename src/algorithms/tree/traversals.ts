import type { BinaryTree, BinaryTreeNode, TreeNodeId } from '@/types/tree';
import type { ChildSide } from './properties';
import { childIds, getNode } from './properties';

export type TraversalKind = 'preorder' | 'inorder' | 'postorder' | 'levelorder';

export const TRAVERSAL_INFO: Record<TraversalKind, { name: string; rule: string }> = {
  preorder: { name: 'Preorden', rule: 'Raíz → izquierda → derecha' },
  inorder: { name: 'Inorden', rule: 'Izquierda → raíz → derecha' },
  postorder: { name: 'Postorden', rule: 'Izquierda → derecha → raíz' },
  levelorder: { name: 'Por niveles', rule: 'Nivel por nivel, de izquierda a derecha (BFS con una cola)' },
};

export const TRAVERSAL_KINDS = Object.keys(TRAVERSAL_INFO) as TraversalKind[];

/**
 * Implementación de referencia de los cuatro recorridos.
 * Sirve para comprobar que la secuencia producida por los pasos animados es la correcta.
 */
export function traverse(tree: BinaryTree, kind: TraversalKind): TreeNodeId[] {
  const order: TreeNodeId[] = [];
  if (tree.rootId === null) return order;

  if (kind === 'levelorder') {
    const queue: TreeNodeId[] = [tree.rootId];
    for (let head = 0; head < queue.length; head++) {
      const id = queue[head];
      if (id === undefined) break;
      order.push(id);
      queue.push(...childIds(getNode(tree, id)));
    }
    return order;
  }

  const visit = (id: TreeNodeId | null): void => {
    if (id === null) return;
    const node = getNode(tree, id);
    if (kind === 'preorder') order.push(id);
    visit(node.left);
    if (kind === 'inorder') order.push(id);
    visit(node.right);
    if (kind === 'postorder') order.push(id);
  };
  visit(tree.rootId);
  return order;
}

export type StepAction = 'enter' | 'visit' | 'return' | 'enqueue';

export interface TraversalStep {
  action: StepAction;
  /** Nodo sobre el que actúa el paso (nodo actual). */
  nodeId: TreeNodeId;
  /** Nodos registrados hasta este paso, en orden. */
  visited: TreeNodeId[];
  /** Pila de llamadas recursivas (preorden, inorden, postorden); vacía en BFS. */
  stack: TreeNodeId[];
  /** Cola de BFS; vacía en los recorridos en profundidad. */
  queue: TreeNodeId[];
  explanation: string;
  /** Número de orden si el paso registra un nodo. */
  order: number | null;
}

/**
 * Genera la secuencia de pasos del recorrido, operación por operación:
 * - Recorridos en profundidad: «entrar» en un nodo (llamada recursiva), «registrar» el nodo
 *   y «regresar» al padre (fin de la llamada). La pila refleja las llamadas activas.
 * - Por niveles: «encolar» y «desencolar y registrar», con la cola visible.
 * Cada paso guarda una copia del estado, de modo que se puede avanzar y retroceder libremente.
 */
export function traversalSteps(tree: BinaryTree, kind: TraversalKind): TraversalStep[] {
  if (tree.rootId === null) return [];
  const steps: TraversalStep[] = [];
  const visited: TreeNodeId[] = [];
  const label = (id: TreeNodeId) => getNode(tree, id).label;
  const push = (action: StepAction, nodeId: TreeNodeId, stack: TreeNodeId[], queue: TreeNodeId[], explanation: string, order: number | null = null) =>
    steps.push({ action, nodeId, visited: [...visited], stack: [...stack], queue: [...queue], explanation, order });

  if (kind === 'levelorder') {
    const queue: TreeNodeId[] = [tree.rootId];
    push('enqueue', tree.rootId, [], queue, `Se coloca la raíz ${label(tree.rootId)} en la cola. BFS procesa los nodos en el orden en que entran a la cola.`);
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) break;
      const node = getNode(tree, id);
      const children = childIds(node);
      visited.push(id);
      push(
        'visit',
        id,
        [],
        queue,
        `Se saca ${node.label} del frente de la cola y se registra como n.º ${visited.length}.${children.length === 0 ? ' No tiene hijos que agregar a la cola.' : ''}`,
        visited.length,
      );
      if (children.length > 0) {
        queue.push(...children);
        const described = [node.left !== null ? `${label(node.left)} (izquierdo)` : null, node.right !== null ? `${label(node.right)} (derecho)` : null]
          .filter(Boolean)
          .join(' y ');
        push('enqueue', id, [], queue, `Se agregan al final de la cola los hijos de ${node.label}: ${described}.`);
      }
    }
    return steps;
  }

  const stack: TreeNodeId[] = [];

  const enterText = (node: BinaryTreeNode, parentId: TreeNodeId | null, side: ChildSide | null): string => {
    const relation = parentId === null ? 'la raíz del árbol' : `el hijo ${side === 'left' ? 'izquierdo' : 'derecho'} de ${label(parentId)}`;
    let text = `Se llama al recorrido en ${node.label}, ${relation}.`;
    if (kind === 'inorder' && node.left !== null) text += ` Antes de registrarlo se recorre su subárbol izquierdo, con raíz ${label(node.left)}.`;
    if (kind === 'postorder') {
      if (node.left !== null) text += ` Primero se recorre su subárbol izquierdo, con raíz ${label(node.left)}.`;
      else if (node.right !== null) text += ` No tiene hijo izquierdo; primero se recorre su subárbol derecho, con raíz ${label(node.right)}.`;
    }
    return text;
  };

  const visitText = (node: BinaryTreeNode, order: number): string => {
    const L = node.label;
    if (kind === 'preorder') {
      const next =
        node.left !== null
          ? `Ahora se recorre su subárbol izquierdo, con raíz ${label(node.left)}.`
          : node.right !== null
            ? `No tiene hijo izquierdo; se pasa a su subárbol derecho, con raíz ${label(node.right)}.`
            : 'Es una hoja: no tiene subárboles que recorrer.';
      return `Preorden registra la raíz del subárbol antes que sus hijos: ${L} es el n.º ${order}. ${next}`;
    }
    if (kind === 'inorder') {
      const before = node.left !== null ? `Ya se recorrió el subárbol izquierdo de ${L}` : `${L} no tiene hijo izquierdo`;
      const after = node.right !== null ? ` Sigue su subárbol derecho, con raíz ${label(node.right)}.` : ' No tiene hijo derecho.';
      return `${before}, así que inorden registra ${L} como n.º ${order}.${after}`;
    }
    return node.left === null && node.right === null
      ? `${L} es una hoja: postorden lo registra como n.º ${order}.`
      : `Ya se recorrieron los subárboles de ${L}; postorden registra la raíz al final: ${L} es el n.º ${order}.`;
  };

  const returnText = (node: BinaryTreeNode, parentId: TreeNodeId | null, side: ChildSide | null): string => {
    if (parentId === null) return `Termina el recorrido del subárbol de la raíz ${node.label}: el recorrido está completo.`;
    const parent = getNode(tree, parentId);
    const P = parent.label;
    let next: string;
    if (side === 'left') {
      if (kind === 'inorder') next = `Ahora se registra ${P}.`;
      else if (parent.right !== null) next = `${P} continúa con su subárbol derecho, con raíz ${label(parent.right)}.`;
      else next = kind === 'postorder' ? `${P} no tiene hijo derecho, así que ahora se registra ${P}.` : `${P} no tiene hijo derecho.`;
    } else {
      next = kind === 'postorder' ? `Ahora se registra ${P}.` : `${P} ya completó sus dos subárboles.`;
    }
    return `Termina el subárbol de ${node.label}; se regresa a ${P}. ${next}`;
  };

  const recurse = (id: TreeNodeId, parentId: TreeNodeId | null, side: ChildSide | null): void => {
    const node = getNode(tree, id);
    stack.push(id);
    push('enter', id, stack, [], enterText(node, parentId, side));

    const register = () => {
      visited.push(id);
      push('visit', id, stack, [], visitText(node, visited.length), visited.length);
    };

    if (kind === 'preorder') register();
    if (node.left !== null) recurse(node.left, id, 'left');
    if (kind === 'inorder') register();
    if (node.right !== null) recurse(node.right, id, 'right');
    if (kind === 'postorder') register();

    stack.pop();
    push('return', id, stack, [], returnText(node, parentId, side));
  };

  recurse(tree.rootId, null, null);
  return steps;
}
