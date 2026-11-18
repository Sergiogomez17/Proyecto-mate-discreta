import type { BinaryTree, TreeNodeId } from '@/types/tree';
import { getNode } from './properties';

export interface TreeLayout {
  /** Columna (x) y nivel (y) de cada nodo, en unidades de cuadrícula. */
  positions: Map<TreeNodeId, { x: number; y: number }>;
  columns: number;
  rows: number;
}

/**
 * Disposición determinista del árbol: la columna es la posición del nodo en el recorrido
 * inorden y la fila es su profundidad. Así ningún par de nodos se superpone y todo hijo
 * izquierdo queda a la izquierda de su padre y todo hijo derecho, a la derecha.
 * Complejidad: O(n).
 */
export function computeLayout(tree: BinaryTree): TreeLayout {
  const positions = new Map<TreeNodeId, { x: number; y: number }>();
  if (tree.rootId === null) return { positions, columns: 0, rows: 0 };

  let column = 0;
  let maxDepth = 0;
  const seen = new Set<TreeNodeId>();
  const stack: Array<{ id: TreeNodeId; depth: number }> = [];
  let current: { id: TreeNodeId; depth: number } | null = { id: tree.rootId, depth: 0 };

  while (current !== null || stack.length > 0) {
    while (current !== null && !seen.has(current.id)) {
      seen.add(current.id);
      stack.push(current);
      const node = getNode(tree, current.id);
      current = node.left !== null ? { id: node.left, depth: current.depth + 1 } : null;
    }
    const top = stack.pop();
    if (!top) break;
    positions.set(top.id, { x: column++, y: top.depth });
    maxDepth = Math.max(maxDepth, top.depth);
    const node = getNode(tree, top.id);
    current = node.right !== null ? { id: node.right, depth: top.depth + 1 } : null;
  }

  return { positions, columns: column, rows: maxDepth + 1 };
}
