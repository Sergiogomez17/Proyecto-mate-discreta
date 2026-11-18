import { describe, expect, it } from 'vitest';
import * as edit from '@/algorithms/tree/editing';
import { buildTree, TREE_EXAMPLES } from '@/algorithms/tree/examples';
import { computeLayout } from '@/algorithms/tree/layout';
import { computeProperties } from '@/algorithms/tree/properties';
import { traverse } from '@/algorithms/tree/traversals';
import { validateTree } from '@/algorithms/tree/validate';
import type { BinaryTree } from '@/types/tree';

const example = (id: string) => TREE_EXAMPLES.find((e) => e.id === id)?.tree as BinaryTree;
const lbl = (t: BinaryTree, ids: string[]) => ids.map((id) => t.nodes[id]?.label);

describe('propiedades del árbol', () => {
  it('árbol vacío: 0 nodos y altura −1', () => {
    const p = computeProperties(buildTree(null));
    expect(p).toMatchObject({ nodeCount: 0, rootId: null, height: -1, leaves: [], levels: [] });
  });

  it('un solo nodo: la raíz es hoja y la altura es 0', () => {
    const t = example('unico');
    const p = computeProperties(t);
    expect(p.nodeCount).toBe(1);
    expect(p.height).toBe(0);
    expect(p.leaves).toEqual([t.rootId]);
    expect(p.info.get(t.rootId ?? '')).toMatchObject({ isRoot: true, isLeaf: true, depth: 0, childCount: 0, graphDegree: 0 });
  });

  it('árbol binario de búsqueda: altura en aristas, niveles, hojas y grados', () => {
    const t = example('busqueda');
    const p = computeProperties(t);
    expect(p.nodeCount).toBe(8);
    expect(p.height).toBe(3); // 50 → 70 → 80 → 90
    expect(p.levels.map((l) => lbl(t, l))).toEqual([['50'], ['30', '70'], ['20', '40', '60', '80'], ['90']]);
    expect(lbl(t, p.leaves)).toEqual(['20', '40', '60', '90']);
    expect(lbl(t, p.internalNodes)).toEqual(['50', '30', '70', '80']);
    const n80 = [...p.info.values()].find((n) => n.label === '80');
    expect(n80).toMatchObject({ depth: 2, childCount: 1, graphDegree: 2, isLeaf: false });
    expect(p.maxChildCount).toBe(2);
  });

  it('árbol degenerado: altura n − 1 y una sola hoja', () => {
    const t = example('degenerado');
    const p = computeProperties(t);
    expect(p.height).toBe(3);
    expect(lbl(t, p.leaves)).toEqual(['D']);
    expect(p.maxChildCount).toBe(1);
  });
});

describe('disposición del dibujo', () => {
  it.each(TREE_EXAMPLES.map((e) => [e.id, e.tree] as const))('en «%s» las columnas siguen el inorden y los hijos quedan a su lado', (_id, t) => {
    const layout = computeLayout(t);
    const byColumn = [...layout.positions.entries()].sort((a, b) => a[1].x - b[1].x).map(([id]) => id);
    expect(byColumn).toEqual(traverse(t, 'inorder'));
    expect(layout.rows).toBe(computeProperties(t).height + 1);
    for (const node of Object.values(t.nodes)) {
      const p = layout.positions.get(node.id);
      if (!p) throw new Error('sin posición');
      if (node.left) expect(layout.positions.get(node.left)?.x).toBeLessThan(p.x);
      if (node.right) expect(layout.positions.get(node.right)?.x).toBeGreaterThan(p.x);
    }
  });
});

describe('validación de la estructura', () => {
  const node = (id: string, label: string, left: string | null = null, right: string | null = null) => ({ id, label, left, right });
  const codes = (t: BinaryTree) => validateTree(t).map((i) => i.code);

  it('acepta los ejemplos y el árbol vacío', () => {
    for (const e of TREE_EXAMPLES) expect(validateTree(e.tree)).toEqual([]);
    expect(validateTree(buildTree(null))).toEqual([]);
  });

  it('detecta nodos sin raíz, raíz inexistente e hijos inexistentes', () => {
    expect(codes({ rootId: null, nodes: { a: node('a', 'A') } })).toEqual(['missing-root']);
    expect(codes({ rootId: 'x', nodes: { a: node('a', 'A') } })).toEqual(['root-not-found']);
    expect(codes({ rootId: 'a', nodes: { a: node('a', 'A', 'z') } })).toEqual(['missing-child']);
  });

  it('detecta ciclos, nodos con dos padres y nodos desconectados', () => {
    expect(codes({ rootId: 'a', nodes: { a: node('a', 'A', 'b'), b: node('b', 'B', 'a') } })).toContain('root-has-parent');
    expect(codes({ rootId: 'a', nodes: { a: node('a', 'A', 'b', 'c'), b: node('b', 'B', 'd'), c: node('c', 'C', 'd'), d: node('d', 'D') } })).toContain('multiple-parents');
    expect(codes({ rootId: 'a', nodes: { a: node('a', 'A', 'a') } })).toContain('self-child');
    expect(codes({ rootId: 'a', nodes: { a: node('a', 'A'), b: node('b', 'B') } })).toEqual(['unreachable']);
    expect(codes({ rootId: 'a', nodes: { a: node('a', 'A', 'b', 'b'), b: node('b', 'B') } })).toContain('repeated-child');
  });

  it('detecta etiquetas vacías o repetidas', () => {
    expect(codes({ rootId: 'a', nodes: { a: node('a', 'A', 'b', 'c'), b: node('b', 'X'), c: node('c', 'X') } })).toEqual(['duplicate-label']);
    expect(codes({ rootId: 'a', nodes: { a: node('a', ' ') } })).toEqual(['empty-label']);
  });
});

describe('operaciones de edición', () => {
  const ok = (r: edit.EditResult): BinaryTree => {
    if (!r.ok) throw new Error(r.error);
    return r.tree;
  };

  it('crea la raíz y agrega hijos izquierdo y derecho', () => {
    let t = ok(edit.createRoot(edit.EMPTY_TREE, 'A'));
    const root = t.rootId as string;
    t = ok(edit.addChild(t, root, 'left', 'B'));
    t = ok(edit.addChild(t, root, 'right', 'C'));
    expect(traverse(t, 'preorder').map((id) => t.nodes[id]?.label)).toEqual(['A', 'B', 'C']);
    expect(validateTree(t)).toEqual([]);
    expect(edit.createRoot(t, 'Z')).toEqual({ ok: false, error: 'El árbol ya tiene raíz.' });
  });

  it('no permite ocupar un lado ya ocupado ni etiquetas inválidas', () => {
    const t = example('expresion');
    const root = t.rootId as string;
    expect(edit.addChild(t, root, 'left', 'Z')).toMatchObject({ ok: false, error: '«·» ya tiene hijo izquierdo.' });
    expect(edit.checkLabel(t, '   ')).toMatch(/Escriba/);
    expect(edit.checkLabel(t, 'a b')).toMatch(/espacios/);
    expect(edit.checkLabel(t, 'ABCDEFG')).toMatch(/como máximo 6/);
    expect(edit.checkLabel(t, 'a')).toMatch(/Ya existe/);
    expect(edit.checkLabel(t, ' q ')).toBeNull();
  });

  it('renombra respetando la unicidad, salvo el propio nodo', () => {
    const t = example('expresion');
    const root = t.rootId as string;
    expect(edit.renameNode(t, root, '·').ok).toBe(true);
    expect(edit.renameNode(t, root, 'a')).toMatchObject({ ok: false });
    expect(ok(edit.renameNode(t, root, '×')).nodes[root]?.label).toBe('×');
  });

  it('intercambia hijos y refleja el inorden', () => {
    const t = example('expresion');
    const swapped = ok(edit.swapChildren(t, t.rootId as string));
    expect(traverse(swapped, 'inorder').map((id) => swapped.nodes[id]?.label).join(' ')).toBe('c − d · a + b');
    const leafId = traverse(t, 'inorder')[0] as string;
    expect(edit.swapChildren(t, leafId)).toMatchObject({ ok: false });
  });

  it('elimina un nodo con todo su subárbol y devuelve el padre', () => {
    const t = example('expresion');
    const plus = Object.values(t.nodes).find((n) => n.label === '+')?.id as string;
    const result = edit.removeSubtree(t, plus);
    const after = ok(result);
    expect(Object.values(after.nodes).map((n) => n.label).sort()).toEqual(['c', 'd', '·', '−'].sort());
    expect(after.nodes[t.rootId as string]?.left).toBeNull();
    expect(result.ok && result.nodeId).toBe(t.rootId);
    expect(validateTree(after)).toEqual([]);
    expect(ok(edit.removeSubtree(t, t.rootId as string))).toEqual({ rootId: null, nodes: {} });
  });

  it('genera identificadores nuevos y sugiere la primera letra libre', () => {
    const t = example('irregular'); // usa A–H, ids n1…n8
    expect(edit.nextNodeId(t)).toBe('n9');
    expect(edit.suggestLabel(t)).toBe('I');
    expect(edit.suggestLabel(edit.EMPTY_TREE)).toBe('A');
  });
});
