import { describe, expect, it } from 'vitest';
import { buildTree, TREE_EXAMPLES } from '@/algorithms/tree/examples';
import type { TraversalKind } from '@/algorithms/tree/traversals';
import { TRAVERSAL_KINDS, traversalSteps, traverse } from '@/algorithms/tree/traversals';
import type { BinaryTree } from '@/types/tree';

const example = (id: string): BinaryTree => {
  const found = TREE_EXAMPLES.find((e) => e.id === id);
  if (!found) throw new Error(id);
  return found.tree;
};
const labels = (tree: BinaryTree, kind: TraversalKind) => traverse(tree, kind).map((id) => tree.nodes[id]?.label).join(' ');

describe('recorridos de referencia', () => {
  it('árbol de expresión (a + b) · (c − d)', () => {
    const t = example('expresion');
    expect(labels(t, 'preorder')).toBe('· + a b − c d');
    expect(labels(t, 'inorder')).toBe('a + b · c − d');
    expect(labels(t, 'postorder')).toBe('a b + c d − ·');
    expect(labels(t, 'levelorder')).toBe('· + − a b c d');
  });

  it('árbol binario de búsqueda: el inorden queda ordenado', () => {
    const t = example('busqueda');
    expect(labels(t, 'inorder')).toBe('20 30 40 50 60 70 80 90');
    expect(labels(t, 'preorder')).toBe('50 30 20 40 70 60 80 90');
    expect(labels(t, 'postorder')).toBe('20 40 30 60 90 80 70 50');
  });

  it('árbol con nodos de un solo hijo (izquierdo o derecho)', () => {
    const t = example('irregular');
    expect(labels(t, 'preorder')).toBe('A B D G C E F H');
    expect(labels(t, 'inorder')).toBe('D G B A E C H F');
    expect(labels(t, 'postorder')).toBe('G D B E H F C A');
    expect(labels(t, 'levelorder')).toBe('A B C D E F G H');
  });

  it('árbol vacío y árbol de un solo nodo', () => {
    const empty = buildTree(null);
    const single = example('unico');
    for (const kind of TRAVERSAL_KINDS) {
      expect(traverse(empty, kind)).toEqual([]);
      expect(traversalSteps(empty, kind)).toEqual([]);
      expect(labels(single, kind)).toBe('A');
    }
  });
});

describe('pasos de la simulación', () => {
  const trees = TREE_EXAMPLES.map((e) => [e.id, e.tree] as const);

  it.each(trees)('en «%s» la secuencia animada coincide con el recorrido de referencia', (_id, tree) => {
    for (const kind of TRAVERSAL_KINDS) {
      const steps = traversalSteps(tree, kind);
      const last = steps[steps.length - 1];
      expect(last?.visited).toEqual(traverse(tree, kind));
      // Cada nodo se registra exactamente una vez, con números de orden 1, 2, 3, …
      const orders = steps.filter((s) => s.action === 'visit').map((s) => s.order);
      expect(orders).toEqual(Array.from({ length: Object.keys(tree.nodes).length }, (_, i) => i + 1));
    }
  });

  it.each(trees)('en «%s» los recorridos en profundidad abren y cierran una llamada por nodo', (_id, tree) => {
    const n = Object.keys(tree.nodes).length;
    for (const kind of ['preorder', 'inorder', 'postorder'] as const) {
      const steps = traversalSteps(tree, kind);
      expect(steps.filter((s) => s.action === 'enter')).toHaveLength(n);
      expect(steps.filter((s) => s.action === 'return')).toHaveLength(n);
      expect(steps).toHaveLength(3 * n);
      expect(steps[steps.length - 1]?.stack).toEqual([]);
      // El nodo actual está siempre en la cima de la pila mientras se procesa.
      for (const s of steps.filter((x) => x.action !== 'return')) expect(s.stack[s.stack.length - 1]).toBe(s.nodeId);
    }
  });

  it('BFS muestra la cola en cada paso', () => {
    const t = example('expresion');
    const steps = traversalSteps(t, 'levelorder');
    const q = (i: number) => steps[i]?.queue.map((id) => t.nodes[id]?.label);
    expect(steps[0]).toMatchObject({ action: 'enqueue' });
    expect(q(0)).toEqual(['·']);
    expect(steps[1]).toMatchObject({ action: 'visit', order: 1 });
    expect(q(1)).toEqual([]);
    expect(steps[2]).toMatchObject({ action: 'enqueue' });
    expect(q(2)).toEqual(['+', '−']);
    // 1 encolado inicial + 7 registros + 3 nodos internos que encolan hijos.
    expect(steps).toHaveLength(11);
  });

  it('las explicaciones describen el movimiento real, incluidos los subárboles vacíos', () => {
    const t = example('irregular');
    const inorder = traversalSteps(t, 'inorder');
    const firstVisit = inorder.find((s) => s.action === 'visit');
    expect(t.nodes[firstVisit?.nodeId ?? '']?.label).toBe('D');
    expect(firstVisit?.explanation).toContain('D no tiene hijo izquierdo');
    expect(firstVisit?.explanation).toContain('Sigue su subárbol derecho, con raíz G');

    const post = traversalSteps(t, 'postorder');
    const enterD = post.find((s) => s.action === 'enter' && t.nodes[s.nodeId]?.label === 'D');
    expect(enterD?.explanation).toContain('No tiene hijo izquierdo; primero se recorre su subárbol derecho, con raíz G');
  });
});
