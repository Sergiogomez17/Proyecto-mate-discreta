import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EditResult } from '@/algorithms/tree/editing';
import * as edit from '@/algorithms/tree/editing';
import type { ChildSide } from '@/algorithms/tree/properties';
import { DEFAULT_TREE_EXAMPLE, TREE_EXAMPLES } from '@/algorithms/tree/examples';
import { validateTree } from '@/algorithms/tree/validate';
import type { BinaryTree, TreeNodeId } from '@/types/tree';
import { createSafeStorage, STORAGE_PREFIX } from '@/utils/storage';

const defaultTree = (): BinaryTree => TREE_EXAMPLES.find((e) => e.id === DEFAULT_TREE_EXAMPLE)?.tree ?? edit.EMPTY_TREE;

interface TreeState {
  tree: BinaryTree;
  selectedId: TreeNodeId | null;
  select: (id: TreeNodeId | null) => void;
  /** Las acciones devuelven un mensaje de error o null si se aplicaron. */
  createRoot: (label: string) => string | null;
  addChild: (parentId: TreeNodeId, side: ChildSide, label: string) => string | null;
  rename: (id: TreeNodeId, label: string) => string | null;
  swapChildren: (id: TreeNodeId) => string | null;
  removeSubtree: (id: TreeNodeId) => string | null;
  loadExample: (exampleId: string) => void;
  clear: () => void;
}

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => {
      /** Aplica el resultado de una edición: si es válida, actualiza el árbol y la selección. */
      const apply = (result: EditResult, selectNew = true): string | null => {
        if (!result.ok) return result.error;
        set({ tree: result.tree, selectedId: selectNew ? result.nodeId : get().selectedId });
        return null;
      };
      return {
        tree: defaultTree(),
        selectedId: null,
        select: (id) => set({ selectedId: id }),
        createRoot: (label) => apply(edit.createRoot(get().tree, label)),
        // El padre sigue seleccionado para poder agregarle el otro hijo de inmediato.
        addChild: (parentId, side, label) => apply(edit.addChild(get().tree, parentId, side, label), false),
        rename: (id, label) => apply(edit.renameNode(get().tree, id, label)),
        swapChildren: (id) => apply(edit.swapChildren(get().tree, id)),
        removeSubtree: (id) => apply(edit.removeSubtree(get().tree, id)),
        loadExample: (exampleId) => {
          const example = TREE_EXAMPLES.find((e) => e.id === exampleId);
          if (example) set({ tree: example.tree, selectedId: null });
        },
        clear: () => set({ tree: edit.EMPTY_TREE, selectedId: null }),
      };
    },
    {
      name: `${STORAGE_PREFIX}:binary-tree`,
      version: 1,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: ({ tree }) => ({ tree }),
      // Un árbol guardado que no supere la validación (datos alterados o antiguos) se descarta.
      merge: (persisted, current) => {
        const tree = (persisted as { tree?: unknown } | undefined)?.tree;
        return isValidTree(tree) ? { ...current, tree } : current;
      },
    },
  ),
);

function isValidTree(value: unknown): value is BinaryTree {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<BinaryTree>;
  if (!(candidate.rootId === null || typeof candidate.rootId === 'string')) return false;
  if (typeof candidate.nodes !== 'object' || candidate.nodes === null) return false;
  const nodesOk = Object.entries(candidate.nodes).every(
    ([key, n]) =>
      typeof n === 'object' &&
      n !== null &&
      n.id === key &&
      typeof n.label === 'string' &&
      (n.left === null || typeof n.left === 'string') &&
      (n.right === null || typeof n.right === 'string'),
  );
  return nodesOk && validateTree(candidate as BinaryTree).length === 0;
}
