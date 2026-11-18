import type { BinaryTree, TreeNodeId } from '@/types/tree';

export type TreeIssueCode =
  | 'missing-root'
  | 'root-not-found'
  | 'missing-child'
  | 'self-child'
  | 'repeated-child'
  | 'multiple-parents'
  | 'root-has-parent'
  | 'unreachable'
  | 'empty-label'
  | 'duplicate-label';

export interface TreeIssue {
  code: TreeIssueCode;
  message: string;
  nodeId?: TreeNodeId;
}

/**
 * Comprueba que la estructura sea un árbol binario: una raíz sin padre, cada nodo con
 * a lo sumo un padre, sin ciclos, todos los nodos alcanzables desde la raíz y etiquetas
 * no vacías y únicas. Devuelve la lista de problemas (vacía si es válido).
 */
export function validateTree(tree: BinaryTree): TreeIssue[] {
  const issues: TreeIssue[] = [];
  const ids = Object.keys(tree.nodes);
  const labelOf = (id: TreeNodeId) => tree.nodes[id]?.label ?? id;

  if (tree.rootId === null) {
    if (ids.length > 0) issues.push({ code: 'missing-root', message: 'Hay nodos pero el árbol no tiene raíz.' });
    return issues;
  }
  if (!tree.nodes[tree.rootId]) {
    issues.push({ code: 'root-not-found', message: 'La raíz indicada no existe.' });
    return issues;
  }

  const parents = new Map<TreeNodeId, TreeNodeId[]>();
  const labels = new Map<string, TreeNodeId>();
  for (const id of ids) {
    const node = tree.nodes[id];
    if (!node) continue;
    if (node.id !== id) issues.push({ code: 'missing-child', nodeId: id, message: `El nodo «${id}» tiene un identificador inconsistente.` });

    const label = node.label.trim();
    if (label === '') issues.push({ code: 'empty-label', nodeId: id, message: 'Hay un nodo sin etiqueta.' });
    else if (labels.has(label)) issues.push({ code: 'duplicate-label', nodeId: id, message: `La etiqueta «${label}» está repetida.` });
    else labels.set(label, id);

    if (node.left !== null && node.left === node.right) {
      issues.push({ code: 'repeated-child', nodeId: id, message: `«${label}» tiene el mismo nodo como hijo izquierdo y derecho.` });
    }
    for (const child of [node.left, node.right]) {
      if (child === null) continue;
      if (child === id) {
        issues.push({ code: 'self-child', nodeId: id, message: `«${label}» es hijo de sí mismo.` });
      } else if (!tree.nodes[child]) {
        issues.push({ code: 'missing-child', nodeId: id, message: `«${label}» apunta a un hijo que no existe.` });
      } else {
        parents.set(child, [...(parents.get(child) ?? []), id]);
      }
    }
  }

  for (const [child, list] of parents) {
    if (child === tree.rootId) {
      issues.push({ code: 'root-has-parent', nodeId: child, message: `La raíz «${labelOf(child)}» aparece como hija de otro nodo (hay un ciclo).` });
    } else if (list.length > 1) {
      issues.push({ code: 'multiple-parents', nodeId: child, message: `«${labelOf(child)}» tiene más de un padre.` });
    }
  }

  // Alcanzabilidad desde la raíz (con protección contra ciclos).
  const reached = new Set<TreeNodeId>();
  const stack: TreeNodeId[] = [tree.rootId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || reached.has(id) || !tree.nodes[id]) continue;
    reached.add(id);
    const node = tree.nodes[id];
    if (node.left !== null) stack.push(node.left);
    if (node.right !== null) stack.push(node.right);
  }
  for (const id of ids) {
    if (!reached.has(id)) issues.push({ code: 'unreachable', nodeId: id, message: `«${labelOf(id)}» no está conectado con la raíz.` });
  }

  return issues;
}
