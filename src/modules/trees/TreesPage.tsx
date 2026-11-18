import { useEffect, useId, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Calculator, Eraser, FolderOpen, ListOrdered, Network, SlidersHorizontal } from 'lucide-react';
import { getModule } from '@/app/modules';
import { TREE_EXAMPLES } from '@/algorithms/tree/examples';
import { PageHeader } from '@/components/layout/PageHeader';
import type { TreeHighlight } from '@/components/tree/TreeCanvas';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Panel } from '@/components/ui/Panel';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTreeStore } from '@/stores/treeStore';
import { NodeEditor } from './NodeEditor';
import { TraversalPanel } from './TraversalPanel';
import { TreeResults } from './TreeResults';
import { useTraversal } from './useTraversal';

type PendingAction = { type: 'example'; exampleId: string } | { type: 'clear' } | null;

export function TreesPage() {
  const module = getModule('trees');
  const tree = useTreeStore((s) => s.tree);
  const selectedId = useTreeStore((s) => s.selectedId);
  const select = useTreeStore((s) => s.select);
  const loadExample = useTreeStore((s) => s.loadExample);
  const clear = useTreeStore((s) => s.clear);
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);
  const traversal = useTraversal(tree);
  const [exampleId, setExampleId] = useState<string>(TREE_EXAMPLES[0]?.id ?? '');
  const [pending, setPending] = useState<PendingAction>(null);
  const exampleSelectId = useId();
  const nodeCount = Object.keys(tree.nodes).length;

  useEffect(() => setLastVisited('trees'), [setLastVisited]);

  const highlight = useMemo<TreeHighlight | undefined>(() => {
    const step = traversal.step;
    if (!step) return undefined;
    return {
      currentId: step.nodeId,
      visitedOrder: new Map(step.visited.map((id, i) => [id, i + 1])),
      activePath: new Set(step.stack),
    };
  }, [traversal.step]);

  const example = TREE_EXAMPLES.find((e) => e.id === exampleId);

  const requestExample = () => {
    if (nodeCount === 0) loadExample(exampleId);
    else setPending({ type: 'example', exampleId });
  };

  // MotionConfig: la animación del recorrido respeta la preferencia del sistema de reducir el movimiento.
  return (
    <MotionConfig reducedMotion="user">
      <PageHeader
        eyebrow="Simulación"
        title={module.title}
        description="Construya un árbol binario, analice sus propiedades y observe paso a paso los recorridos preorden, inorden, postorden y por niveles."
        icon={module.icon}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Simulaciones', to: '/simulaciones' }, { label: module.title }]}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
        <Panel
          title="Árbol"
          description={nodeCount === 1 ? '1 nodo' : `${nodeCount} nodos`}
          icon={Network}
          className="lg:row-span-1"
          bodyClassName="p-0"
        >
          <div className="flex flex-wrap items-end gap-2 border-b border-card-border bg-white/40 px-4 py-3" role="toolbar" aria-label="Herramientas del árbol">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label htmlFor={exampleSelectId} className="text-xs font-semibold text-ink-secondary">
                Árbol de ejemplo
              </label>
              <select
                id={exampleSelectId}
                value={exampleId}
                onChange={(e) => setExampleId(e.target.value)}
                className="h-10 min-w-0 rounded-lg border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none"
              >
                {TREE_EXAMPLES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="secondary" onClick={requestExample} icon={<FolderOpen aria-hidden className="size-4" />}>
              Cargar ejemplo
            </Button>
            <Button variant="ghost" onClick={() => setPending({ type: 'clear' })} disabled={nodeCount === 0} icon={<Eraser aria-hidden className="size-4" />}>
              Reiniciar árbol
            </Button>
          </div>
          {example && <p className="px-4 pt-3 text-xs text-ink-secondary">{example.description}</p>}

          <div className="min-h-40 px-2 py-4">
            {nodeCount === 0 ? (
              <p className="px-4 py-16 text-center text-sm text-ink-secondary">El árbol está vacío. Cree la raíz en el panel «Nodo» o cargue un ejemplo.</p>
            ) : (
              <TreeCanvas tree={tree} selectedId={selectedId} onSelect={select} {...(highlight ? { highlight } : {})} />
            )}
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-1 border-t border-card-border px-4 py-3 text-xs text-ink-secondary" aria-label="Leyenda">
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-dashed border-purple-strong" /> Seleccionado
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-[3px] border-cyan" /> Nodo actual
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-purple" /> Visitado (con su número de orden)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-4 rounded bg-[#00B8D4]" /> Llamadas activas
            </li>
          </ul>
        </Panel>

        <Panel title="Nodo" description="Propiedades y edición" icon={SlidersHorizontal}>
          <NodeEditor />
        </Panel>

        <Panel title="Recorridos" description="Procedimiento paso a paso" icon={ListOrdered} className="lg:col-span-1">
          <TraversalPanel
            tree={tree}
            kind={traversal.kind}
            onKindChange={traversal.setKind}
            steps={traversal.steps}
            step={traversal.step}
            finalOrder={traversal.finalOrder}
            player={traversal.player}
            dispatch={traversal.dispatch}
          />
        </Panel>

        <Panel title="Resultados" description="Propiedades del árbol" icon={Calculator}>
          <TreeResults tree={tree} />
        </Panel>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.type === 'clear' ? '¿Reiniciar el árbol?' : '¿Reemplazar el árbol actual?'}
        description={
          pending?.type === 'clear'
            ? `Se eliminarán los ${nodeCount} nodos del árbol actual. Esta acción no se puede deshacer.`
            : `El árbol actual (${nodeCount} nodos) se reemplazará por el ejemplo «${TREE_EXAMPLES.find((e) => e.id === (pending?.type === 'example' ? pending.exampleId : ''))?.name ?? ''}».`
        }
        confirmLabel={pending?.type === 'clear' ? 'Reiniciar' : 'Reemplazar'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.type === 'clear') clear();
          if (pending?.type === 'example') loadExample(pending.exampleId);
          setPending(null);
        }}
      />
    </MotionConfig>
  );
}
