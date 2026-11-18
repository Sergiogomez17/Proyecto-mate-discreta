/**
 * Modelo de datos de árboles binarios (se usará en el módulo de la Fase 2).
 *
 * Convenciones:
 * - Cada nodo tiene como máximo un hijo izquierdo y uno derecho.
 * - La altura del árbol se mide en número de aristas desde la raíz hasta la hoja
 *   más lejana: un árbol con un solo nodo tiene altura 0; el árbol vacío, −1.
 * - La profundidad de un nodo es el número de aristas desde la raíz hasta él.
 */

export type TreeNodeId = string;

export interface BinaryTreeNode {
  id: TreeNodeId;
  label: string;
  left: TreeNodeId | null;
  right: TreeNodeId | null;
}

export interface BinaryTree {
  rootId: TreeNodeId | null;
  nodes: Record<TreeNodeId, BinaryTreeNode>;
}
