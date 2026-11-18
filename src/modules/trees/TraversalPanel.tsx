import { useId } from 'react';
import type { Dispatch } from 'react';
import type { StepAction, TraversalKind, TraversalStep } from '@/algorithms/tree/traversals';
import { TRAVERSAL_INFO, TRAVERSAL_KINDS } from '@/algorithms/tree/traversals';
import { Badge } from '@/components/ui/Badge';
import { PlayerControls } from '@/components/ui/PlayerControls';
import type { BinaryTree, TreeNodeId } from '@/types/tree';
import { cn } from '@/utils/cn';
import type { PlayerAction, PlayerState } from '@/modules/shared/player';
import { isFinished } from '@/modules/shared/player';

const ACTION_LABEL: Record<StepAction, string> = {
  enter: 'Entrar al nodo',
  visit: 'Registrar nodo',
  return: 'Regresar',
  enqueue: 'Encolar',
};

interface TraversalPanelProps {
  tree: BinaryTree;
  kind: TraversalKind;
  onKindChange: (kind: TraversalKind) => void;
  steps: TraversalStep[];
  step: TraversalStep | null;
  finalOrder: TreeNodeId[];
  player: PlayerState;
  dispatch: Dispatch<PlayerAction>;
}

export function TraversalPanel({ tree, kind, onKindChange, steps, step, finalOrder, player, dispatch }: TraversalPanelProps) {
  const tabsId = useId();
  const label = (id: TreeNodeId) => tree.nodes[id]?.label ?? id;
  const finished = isFinished(player);
  const empty = steps.length === 0;

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Tipo de recorrido" className="grid grid-cols-2 gap-1 rounded-lg bg-navy/8 p-1 sm:grid-cols-4">
        {TRAVERSAL_KINDS.map((k) => (
          <button
            key={k}
            id={`${tabsId}-${k}`}
            type="button"
            role="tab"
            aria-selected={k === kind}
            aria-controls={`${tabsId}-panel`}
            onClick={() => onKindChange(k)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
              k === kind ? 'bg-navy-panel text-white shadow-sm' : 'text-ink hover:bg-white/70',
            )}
          >
            {TRAVERSAL_INFO[k].name}
          </button>
        ))}
      </div>

      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${kind}`} className="space-y-5">
        <p className="text-sm text-ink-secondary">
          <strong className="text-ink">{TRAVERSAL_INFO[kind].name}:</strong> {TRAVERSAL_INFO[kind].rule}.
        </p>

        {empty ? (
          <p className="surface-card rounded-lg p-4 text-sm text-ink-secondary">Construya un árbol para recorrerlo.</p>
        ) : (
          <>
            <PlayerControls player={player} dispatch={dispatch} resetLabel="Reiniciar recorrido" groupLabel="Controles del recorrido" />

            <div className="surface-card space-y-3 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink" aria-live="polite">
                  {step ? `Paso ${player.index + 1} de ${steps.length}` : `${steps.length} pasos · pulse «Iniciar» o «Paso siguiente»`}
                </p>
                {step && <Badge tone={step.action === 'visit' ? 'purple' : 'info'}>{ACTION_LABEL[step.action]}</Badge>}
              </div>
              <p className="text-sm text-ink">
                <span className="text-ink-secondary">Nodo actual: </span>
                <strong data-testid="current-node">{step ? label(step.nodeId) : '—'}</strong>
              </p>
              <p className="min-h-10 text-sm leading-relaxed text-ink" aria-live="polite" data-testid="step-explanation">
                {step ? step.explanation : 'El recorrido aún no ha comenzado.'}
              </p>
              {step && kind !== 'levelorder' && (
                <p className="text-sm text-ink-secondary">
                  Pila de llamadas (base → cima): <span className="font-mono text-ink">{step.stack.length ? step.stack.map(label).join(' → ') : 'vacía'}</span>
                </p>
              )}
              {step && kind === 'levelorder' && (
                <p className="text-sm text-ink-secondary">
                  Cola (frente → final): <span className="font-mono text-ink">{step.queue.length ? step.queue.map(label).join(', ') : 'vacía'}</span>
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">Secuencia acumulada</h3>
              {step && step.visited.length > 0 ? (
                <ol className="mt-2 flex flex-wrap gap-2" aria-label="Nodos visitados en orden" data-testid="sequence">
                  {step.visited.map((id, index) => (
                    <li key={id} className="inline-flex items-center gap-1.5 rounded-md bg-purple px-2.5 py-1 text-sm font-semibold text-white">
                      <span className="text-xs text-cyan">{index + 1}</span>
                      {label(id)}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-1 text-sm text-ink-secondary">Todavía no se ha registrado ningún nodo.</p>
              )}
            </div>

            {finished && (
              <div role="status" className="rounded-xl border border-success/40 bg-success/10 p-4">
                <p className="text-sm font-semibold text-green-900">Resultado final · {TRAVERSAL_INFO[kind].name}</p>
                <p className="mt-1 font-mono text-base text-ink" data-testid="final-result">
                  {finalOrder.map(label).join(' ')}
                </p>
                <p className="mt-1 text-xs text-green-900">Se visitaron los {finalOrder.length} nodos, cada uno exactamente una vez.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
