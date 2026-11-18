import type { BinaryTree, BinaryTreeNode, TreeNodeId } from '@/types/tree';

export type ChildSide = 'left' | 'right';

export function getNode(tree: BinaryTree, id: TreeNodeId): BinaryTreeNode {
  const node = tree.nodes[id];
  if (!node) throw new Error(`El nodo «${id}» no existe en el árbol.`);
  return node;
}

/** Hijos existentes, en orden izquierdo → derecho. */
export function childIds(node: BinaryTreeNode): TreeNodeId[] {
  const children: TreeNodeId[] = [];
  if (node.left !== null) children.push(node.left);
  if (node.right !== null) children.push(node.right);
  return children;
}

export interface NodeInfo {
  id: TreeNodeId;
  label: string;
  /** Número de aristas desde la raíz. Coincide con el nivel del nodo (la raíz está en el nivel 0). */
  depth: number;
  parentId: TreeNodeId | null;
  side: ChildSide | null;
  /** Grado del nodo en el árbol: número de hijos (0, 1 o 2). */
  childCount: number;
  /** Grado del vértice visto como grafo no dirigido: hijos + arista al padre. */
  graphDegree: number;
  isLeaf: boolean;
  isRoot: boolean;
}

export interface TreeProperties {
  nodeCount: number;
  rootId: TreeNodeId | null;
  /** Hojas e internos, en orden por niveles. */
  leaves: TreeNodeId[];
  internalNodes: TreeNodeId[];
  /** Número de aristas de la raíz a la hoja más lejana. Árbol vacío: −1; un solo nodo: 0. */
  height: number;
  /** levels[k] = nodos del nivel k, de izquierda a derecha. */
  levels: TreeNodeId[][];
  info: Map<TreeNodeId, NodeInfo>;
  /** Grado del árbol: máximo número de hijos de un nodo. */
  maxChildCount: number;
}

/**
 * Calcula las propiedades de un árbol mediante un recorrido por niveles desde la raíz.
 * Supone un árbol válido (ver `validateTree`); los nodos repetidos se ignoran para no entrar en ciclos.
 * Complejidad: O(n).
 */
export function computeProperties(tree: BinaryTree): TreeProperties {
  const info = new Map<TreeNodeId, NodeInfo>();
  const levels: TreeNodeId[][] = [];
  if (tree.rootId === null) {
    return { nodeCount: 0, rootId: null, leaves: [], internalNodes: [], height: -1, levels, info, maxChildCount: 0 };
  }

  const queue: Array<{ id: TreeNodeId; depth: number; parentId: TreeNodeId | null; side: ChildSide | null }> = [
    { id: tree.rootId, depth: 0, parentId: null, side: null },
  ];
  for (let head = 0; head < queue.length; head++) {
    const item = queue[head];
    if (!item || info.has(item.id)) continue;
    const node = getNode(tree, item.id);
    const children = childIds(node);
    info.set(item.id, {
      id: item.id,
      label: node.label,
      depth: item.depth,
      parentId: item.parentId,
      side: item.side,
      childCount: children.length,
      graphDegree: children.length + (item.parentId === null ? 0 : 1),
      isLeaf: children.length === 0,
      isRoot: item.parentId === null,
    });
    (levels[item.depth] ??= []).push(item.id);
    if (node.left !== null) queue.push({ id: node.left, depth: item.depth + 1, parentId: item.id, side: 'left' });
    if (node.right !== null) queue.push({ id: node.right, depth: item.depth + 1, parentId: item.id, side: 'right' });
  }

  const all = [...info.values()];
  return {
    nodeCount: all.length,
    rootId: tree.rootId,
    leaves: all.filter((n) => n.isLeaf).map((n) => n.id),
    internalNodes: all.filter((n) => !n.isLeaf).map((n) => n.id),
    height: levels.length - 1,
    levels,
    info,
    maxChildCount: all.reduce((max, n) => Math.max(max, n.childCount), 0),
  };
}
