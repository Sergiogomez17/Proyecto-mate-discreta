import type { BinaryTree } from '@/types/tree';

interface NodeSpec {
  label: string;
  left?: NodeSpec;
  right?: NodeSpec;
}

/** Construye un árbol a partir de una descripción anidada; los identificadores se asignan en preorden (n1, n2, …). */
export function buildTree(spec: NodeSpec | null): BinaryTree {
  if (spec === null) return { rootId: null, nodes: {} };
  const nodes: BinaryTree['nodes'] = {};
  let counter = 0;
  const build = (s: NodeSpec): string => {
    const id = `n${++counter}`;
    nodes[id] = { id, label: s.label, left: null, right: null };
    const left = s.left ? build(s.left) : null;
    const right = s.right ? build(s.right) : null;
    nodes[id] = { id, label: s.label, left, right };
    return id;
  };
  return { rootId: build(spec), nodes };
}

export interface TreeExample {
  id: string;
  name: string;
  description: string;
  tree: BinaryTree;
}

const leaf = (label: string): NodeSpec => ({ label });

export const TREE_EXAMPLES: readonly TreeExample[] = [
  {
    id: 'expresion',
    name: 'Árbol de expresión (a + b) · (c − d)',
    description: 'Los operadores son nodos internos y los operandos son hojas. El recorrido inorden reproduce la expresión infija.',
    tree: buildTree({ label: '·', left: { label: '+', left: leaf('a'), right: leaf('b') }, right: { label: '−', left: leaf('c'), right: leaf('d') } }),
  },
  {
    id: 'busqueda',
    name: 'Árbol binario de búsqueda',
    description: 'Cada nodo es mayor que su subárbol izquierdo y menor que el derecho: el inorden da los valores ordenados.',
    tree: buildTree({
      label: '50',
      left: { label: '30', left: leaf('20'), right: leaf('40') },
      right: { label: '70', left: leaf('60'), right: { label: '80', right: leaf('90') } },
    }),
  },
  {
    id: 'irregular',
    name: 'Árbol con nodos de un solo hijo',
    description: 'Combina nodos con dos hijos, con solo hijo izquierdo y con solo hijo derecho.',
    tree: buildTree({
      label: 'A',
      left: { label: 'B', left: { label: 'D', right: leaf('G') } },
      right: { label: 'C', left: leaf('E'), right: { label: 'F', left: leaf('H') } },
    }),
  },
  {
    id: 'degenerado',
    name: 'Árbol degenerado (una sola rama)',
    description: 'Cada nodo tiene un solo hijo: la altura es n − 1, el peor caso de un árbol binario.',
    tree: buildTree({ label: 'A', right: { label: 'B', right: { label: 'C', right: leaf('D') } } }),
  },
  {
    id: 'unico',
    name: 'Un solo nodo',
    description: 'La raíz también es hoja. Altura 0.',
    tree: buildTree(leaf('A')),
  },
];

export const DEFAULT_TREE_EXAMPLE = 'expresion';
