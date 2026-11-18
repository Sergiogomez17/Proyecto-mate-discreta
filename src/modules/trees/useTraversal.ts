import { useMemo, useState } from 'react';
import { usePlayer } from '@/hooks/usePlayer';
import type { TraversalKind } from '@/algorithms/tree/traversals';
import { traversalSteps, traverse } from '@/algorithms/tree/traversals';
import type { BinaryTree } from '@/types/tree';

/**
 * Estado de la simulación de recorridos sobre el árbol actual.
 * Si el árbol o el tipo de recorrido cambian, los pasos se recalculan y la reproducción se reinicia.
 */
export function useTraversal(tree: BinaryTree) {
  const [kind, setKind] = useState<TraversalKind>('preorder');
  const steps = useMemo(() => traversalSteps(tree, kind), [tree, kind]);
  const finalOrder = useMemo(() => traverse(tree, kind), [tree, kind]);
  const { player, dispatch } = usePlayer(steps.length, steps);

  const step = player.index >= 0 ? (steps[player.index] ?? null) : null;
  return { kind, setKind, steps, step, finalOrder, player, dispatch };
}
