import type { BinaryTree, TreeNodeId } from '@/types/tree';
import type { ChildSide } from './properties';
import { getNode } from './properties';

/**
 * Operaciones de edición inmutables: cada una devuelve un árbol nuevo o un error explicativo.
 * Así el estado de la interfaz nunca queda a medio modificar.
 */
export type EditResult = { ok: true; tree: BinaryTree; nodeId: TreeNodeId | null } | { ok: false; error: string };

export const MAX_LABEL_LENGTH = 6;
export const EMPTY_TREE: BinaryTree = { rootId: null, nodes: {} };

/** Devuelve un mensaje de error si la etiqueta no es válida para el árbol, o null. */
export function checkLabel(tree: BinaryTree, raw: string, exceptId: TreeNodeId | null = null): string | null {
  const label = raw.trim();
  if (label === '') return 'Escriba una etiqueta para el nodo.';
  if (/\s/.test(label)) return 'La etiqueta no puede contener espacios.';
  if ([...label].length > MAX_LABEL_LENGTH) return `La etiqueta admite como máximo ${MAX_LABEL_LENGTH} caracteres.`;
  const taken = Object.values(tree.nodes).some((n) => n.id !== exceptId && n.label === label);
  if (taken) return `Ya existe un nodo con la etiqueta «${label}». Las etiquetas deben ser únicas.`;
  return null;
}

/** Identificador nuevo, mayor que los existentes con forma «nK». */
export function nextNodeId(tree: BinaryTree): TreeNodeId {
  let max = 0;
  for (const id of Object.keys(tree.nodes)) {
    const match = /^n(\d+)$/.exec(id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `n${max + 1}`;
}

/** Propone la primera letra mayúscula libre (A, B, …) o, si se agotan, N1, N2, … */
export function suggestLabel(tree: BinaryTree): string {
  const used = new Set(Object.values(tree.nodes).map((n) => n.label));
  for (let c = 65; c <= 90; c++) {
    const letter = String.fromCharCode(c);
    if (!used.has(letter)) return letter;
  }
  let k = 1;
  while (used.has(`N${k}`)) k++;
  return `N${k}`;
}

export function createRoot(tree: BinaryTree, raw: string): EditResult {
  if (tree.rootId !== null) return { ok: false, error: 'El árbol ya tiene raíz.' };
  const error = checkLabel(tree, raw);
  if (error) return { ok: false, error };
  const id = nextNodeId(tree);
  return { ok: true, nodeId: id, tree: { rootId: id, nodes: { [id]: { id, label: raw.trim(), left: null, right: null } } } };
}

export function addChild(tree: BinaryTree, parentId: TreeNodeId, side: ChildSide, raw: string): EditResult {
  const parent = tree.nodes[parentId];
  if (!parent) return { ok: false, error: 'El nodo padre no existe.' };
  if (parent[side] !== null) {
    return { ok: false, error: `«${parent.label}» ya tiene hijo ${side === 'left' ? 'izquierdo' : 'derecho'}.` };
  }
  const error = checkLabel(tree, raw);
  if (error) return { ok: false, error };
  const id = nextNodeId(tree);
  return {
    ok: true,
    nodeId: id,
    tree: {
      rootId: tree.rootId,
      nodes: {
        ...tree.nodes,
        [parentId]: { ...parent, [side]: id },
        [id]: { id, label: raw.trim(), left: null, right: null },
      },
    },
  };
}

export function renameNode(tree: BinaryTree, id: TreeNodeId, raw: string): EditResult {
  const node = tree.nodes[id];
  if (!node) return { ok: false, error: 'El nodo no existe.' };
  const error = checkLabel(tree, raw, id);
  if (error) return { ok: false, error };
  return { ok: true, nodeId: id, tree: { rootId: tree.rootId, nodes: { ...tree.nodes, [id]: { ...node, label: raw.trim() } } } };
}

/** Intercambia los hijos izquierdo y derecho (refleja el subárbol inmediato). */
export function swapChildren(tree: BinaryTree, id: TreeNodeId): EditResult {
  const node = tree.nodes[id];
  if (!node) return { ok: false, error: 'El nodo no existe.' };
  if (node.left === null && node.right === null) return { ok: false, error: `«${node.label}» no tiene hijos que intercambiar.` };
  return { ok: true, nodeId: id, tree: { rootId: tree.rootId, nodes: { ...tree.nodes, [id]: { ...node, left: node.right, right: node.left } } } };
}

/** Identificadores del subárbol con raíz en `id` (incluido), en preorden. */
export function subtreeIds(tree: BinaryTree, id: TreeNodeId): TreeNodeId[] {
  const out: TreeNodeId[] = [];
  const seen = new Set<TreeNodeId>();
  const stack: TreeNodeId[] = [id];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || seen.has(current)) continue;
    seen.add(current);
    const node = getNode(tree, current);
    out.push(current);
    if (node.right !== null) stack.push(node.right);
    if (node.left !== null) stack.push(node.left);
  }
  return out;
}

/**
 * Elimina un nodo junto con todo su subárbol (en un árbol binario, quitar solo el nodo
 * dejaría a sus hijos sin padre). Si es la raíz, el árbol queda vacío.
 */
export function removeSubtree(tree: BinaryTree, id: TreeNodeId): EditResult {
  if (!tree.nodes[id]) return { ok: false, error: 'El nodo no existe.' };
  const removed = new Set(subtreeIds(tree, id));
  const nodes: BinaryTree['nodes'] = {};
  let parentId: TreeNodeId | null = null;
  for (const node of Object.values(tree.nodes)) {
    if (removed.has(node.id)) continue;
    const copy = { ...node };
    if (copy.left === id) {
      copy.left = null;
      parentId = copy.id;
    }
    if (copy.right === id) {
      copy.right = null;
      parentId = copy.id;
    }
    nodes[copy.id] = copy;
  }
  return { ok: true, nodeId: parentId, tree: { rootId: tree.rootId === id ? null : tree.rootId, nodes } };
}
