import { useEffect, useId, useMemo, useState } from 'react';
import { FolderInput, Layers, ListTree, SlidersHorizontal, Workflow } from 'lucide-react';
import { getModule } from '@/app/modules';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import type { GraphTraversalKind, GraphTraversalStep, TraversalAction } from '@/algorithms/graph/traversal';
import { graphTraversalSteps } from '@/algorithms/graph/traversal';
import { findExample } from '@/algorithms/graph/examples';
import type { CanvasHighlight, EdgeMark, VertexMark } from '@/components/graph/flowTypes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { PlayerControls } from '@/components/ui/PlayerControls';
import { usePlayer } from '@/hooks/usePlayer';
import { SelectionPanel } from '@/modules/graphs/SelectionPanel';
import { CanvasLegend, GraphWorkspace } from '@/modules/shared/graph/GraphWorkspace';
import { GraphSourcePanel } from '@/modules/shared/graph/GraphSourcePanel';
import { graphSummaryLine } from '@/modules/shared/graph/summary';
import { useGraphWorkspace } from '@/modules/shared/graph/useGraphWorkspace';
import { isFinished } from '@/modules/shared/player';
import { StepCard, VerdictBox, VertexSelect } from '@/modules/shared/SimulationParts';
import { GraphStoreContext } from '@/stores/graphStoreContext';
import { usePreferencesStore } from '@/stores/preferencesStore';
import type { Graph, VertexId } from '@/types/graph';
import { cn } from '@/utils/cn';
import { useTraversalGraphStore } from './store';

const EXAMPLES = ['petersen', 'casa', 'desconexo', 'dirigido', 'ciudades', 'completo'].flatMap((id) => findExample(id) ?? []);

const KINDS: Array<{ id: GraphTraversalKind; name: string; rule: string }> = [
  { id: 'bfs', name: 'BFS (anchura)', rule: 'visita primero todos los vecinos del vértice actual, usando una cola (el primero que entra es el primero que sale).' },
  { id: 'dfs', name: 'DFS (profundidad)', rule: 'avanza hacia un vecino no visitado tan lejos como puede y retrocede al agotar los vecinos; usa la pila de llamadas recursivas.' },
];

const ACTION_LABEL: Record<TraversalAction, string> = {
  start: 'Inicio',
  visit: 'Visitar',
  discover: 'Arista de árbol',
  skip: 'Ya visitado',
  return: 'Retroceder',
  restart: 'Nuevo árbol',
  end: 'Fin',
};

const LEGEND = [
  { label: 'Vértice actual', swatch: 'size-3 rounded-full border-[3px] border-cyan' },
  { label: 'Visitado (orden)', swatch: 'size-3 rounded-full bg-purple' },
  { label: 'En la cola (BFS)', swatch: 'size-3 rounded-full border-2 border-dashed border-cyan' },
  { label: 'En la pila de llamadas (DFS)', swatch: 'size-3 rounded-full bg-purple-strong ring-2 ring-purple-strong/40' },
  { label: 'Arista examinada', swatch: 'h-1 w-4 rounded bg-[#00B8D4]' },
  { label: 'Árbol de recorrido', swatch: 'h-1 w-4 rounded bg-purple-strong' },
  { label: 'Explorada fuera del árbol', swatch: 'h-0.5 w-4 border-t-2 border-dashed border-slate-400' },
];

export function TraversalsPage() {
  const module = getModule('traversals');
  const ws = useGraphWorkspace(useTraversalGraphStore);
  const { graph } = ws;
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);
  useEffect(() => setLastVisited('traversals'), [setLastVisited]);
  const tabsId = useId();
  const forestId = useId();

  const [kind, setKind] = useState<GraphTraversalKind>('bfs');
  const [startChoice, setStart] = useState<VertexId | ''>('');
  const [forest, setForest] = useState(false);
  const ordered = useMemo(() => sortVerticesByLabel(graph.vertices), [graph.vertices]);
  const start = graph.vertices.some((v) => v.id === startChoice) ? startChoice : (ordered[0]?.id ?? '');

  const steps = useMemo(() => (start ? graphTraversalSteps(graph, start, kind, { forest }) : []), [graph, start, kind, forest]);
  const { player, dispatch } = usePlayer(steps.length, steps);
  const step = player.index >= 0 ? (steps[player.index] ?? null) : null;
  const running = player.index >= 0;
  const finished = isFinished(player);
  const label = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const edgeText = (edgeId: string) => {
    const e = graph.edges.find((x) => x.id === edgeId);
    if (!e || !step) return edgeId;
    // Se muestra en el sentido en que se recorrió (del padre al hijo).
    const child = step.parent[e.target] === e.source ? e.target : e.source;
    const parent = step.parent[child] ?? (child === e.target ? e.source : e.target);
    return `${label(parent)} → ${label(child)}`;
  };

  const highlight = useMemo(() => buildHighlight(graph, kind, step, start), [graph, kind, step, start]);
  const info = KINDS.find((k) => k.id === kind) ?? KINDS[0];

  return (
    <>
      <PageHeader
        eyebrow="Simulación"
        title={module.title}
        description="Recorra grafos en anchura y en profundidad: vea la cola o la pila de llamadas, las aristas exploradas y el árbol de recorrido en cada paso."
        icon={module.icon}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Simulaciones', to: '/simulaciones' }, { label: module.title }]}
      />
      <GraphStoreContext.Provider value={useTraversalGraphStore}>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:px-8">
          <div className="contents lg:block lg:space-y-6">
            <Panel id="grafo" title="Grafo" description={graphSummaryLine(graph)} icon={Layers} bodyClassName="p-0" className="order-1">
              <GraphWorkspace
                ws={ws}
                examples={EXAMPLES}
                highlight={highlight}
                simulation={{ active: running, hint: 'Recorrido en curso: la edición está bloqueada. Pulse «Reiniciar recorrido» para modificar el grafo.' }}
                legend={<CanvasLegend items={LEGEND} />}
              />
            </Panel>

            <Panel id="arbol" title="Árbol de recorrido" description="Secuencia, aristas del árbol y aristas exploradas" icon={ListTree} className="order-3">
              {!step ? (
                <p className="text-sm text-ink-secondary">Inicie el recorrido para construir el árbol paso a paso.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Orden de visita</h3>
                    <ol className="mt-2 flex flex-wrap gap-2" data-testid="visit-order" aria-label="Vértices en orden de visita">
                      {step.order.map((id, i) => (
                        <li key={id} className="inline-flex items-center gap-1.5 rounded-md bg-purple px-2.5 py-1 text-sm font-semibold text-white">
                          <span className="text-xs text-cyan">{i + 1}</span>
                          {label(id)}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Aristas del árbol ({step.treeEdges.length})</h3>
                    <p className="mt-1 font-mono text-sm text-ink">{step.treeEdges.length ? step.treeEdges.map(edgeText).join(', ') : 'ninguna todavía'}</p>
                  </div>
                  <p className="text-sm text-ink-secondary">
                    Aristas examinadas: {step.exploredEdges.length}. Las que no entran al árbol llevan a vértices ya {kind === 'bfs' ? 'descubiertos' : 'visitados'}.
                  </p>
                </div>
              )}
            </Panel>
          </div>

          <div className="contents lg:block lg:space-y-6">
            <Panel id="algoritmo" title="Recorrido" description="Tipo, vértice inicial y ejecución" icon={Workflow} className="order-2">
              <div className="space-y-5">
                <div role="tablist" aria-label="Tipo de recorrido" className="grid grid-cols-2 gap-1 rounded-lg bg-navy/8 p-1">
                  {KINDS.map((k) => (
                    <button
                      key={k.id}
                      id={`${tabsId}-${k.id}`}
                      type="button"
                      role="tab"
                      aria-selected={k.id === kind}
                      disabled={running}
                      onClick={() => setKind(k.id)}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
                        k.id === kind ? 'bg-navy-panel text-white shadow-sm' : 'text-ink hover:bg-white/70 disabled:opacity-50',
                      )}
                    >
                      {k.name}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-ink-secondary">
                  <strong className="text-ink">{info?.name}:</strong> {info?.rule} Los vecinos se exploran en orden alfabético por nombre.
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <VertexSelect graph={graph} label="Vértice inicial" value={start} onChange={setStart} disabled={running} />
                </div>
                <label htmlFor={forestId} className="flex items-start gap-2 text-sm text-ink">
                  <input id={forestId} type="checkbox" className="mt-0.5 size-4 accent-purple" checked={forest} disabled={running} onChange={(e) => setForest(e.target.checked)} />
                  Continuar con los vértices no alcanzados (bosque de recorrido)
                </label>

                {steps.length === 0 ? (
                  <p className="text-sm text-ink-secondary">Agregue vértices o cargue un ejemplo para recorrer el grafo.</p>
                ) : (
                  <>
                    <PlayerControls player={player} dispatch={dispatch} resetLabel="Reiniciar recorrido" groupLabel="Controles del recorrido" />
                    <StepCard
                      index={player.index}
                      total={steps.length}
                      actionLabel={step ? ACTION_LABEL[step.action] : null}
                      actionTone={step?.action === 'discover' ? 'success' : step?.action === 'visit' || step?.action === 'start' ? 'purple' : 'info'}
                      explanation={step?.explanation ?? null}
                      idleText={`El recorrido aún no ha comenzado. Inicio: ${start ? label(start) : '—'}.`}
                    >
                      {step && (
                        <div className="space-y-1 text-sm text-ink-secondary">
                          <p>
                            Vértice actual: <strong className="text-ink" data-testid="current-vertex">{step.current ? label(step.current) : '—'}</strong>
                          </p>
                          {kind === 'bfs' ? (
                            <p>
                              Cola (frente → final): <span className="font-mono text-ink" data-testid="queue">{step.queue.length ? step.queue.map(label).join(', ') : 'vacía'}</span>
                            </p>
                          ) : (
                            <p>
                              Pila de llamadas (base → cima): <span className="font-mono text-ink" data-testid="stack">{step.stack.length ? step.stack.map(label).join(' → ') : 'vacía'}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </StepCard>
                    {finished && step && (
                      <VerdictBox verdict="yes" title={`Secuencia final · ${info?.name ?? ''}`} testId="traversal-result">
                        <p className="font-mono text-base">{step.order.map(label).join(' ')}</p>
                        <p className="mt-1 text-xs text-ink-secondary">
                          {step.order.length === graph.vertices.length
                            ? `Se visitaron los ${step.order.length} vértices, cada uno una sola vez.`
                            : `Se visitaron ${step.order.length} de ${graph.vertices.length} vértices; los demás no son alcanzables desde ${start ? label(start) : 'el inicio'}.`}
                        </p>
                      </VerdictBox>
                    )}
                  </>
                )}
              </div>
            </Panel>

            <Panel id="propiedades" title="Propiedades" description="Editar vértices y aristas" icon={SlidersHorizontal} className="order-4">
              {running ? (
                <p className="text-sm text-ink-secondary">La edición está bloqueada mientras dura el recorrido. Pulse «Reiniciar recorrido» para modificar el grafo.</p>
              ) : (
                <SelectionPanel onRequestDeleteVertex={ws.requestDeleteVertex} onStartEdgeFrom={ws.startEdgeFrom} onNotice={ws.info} />
              )}
            </Panel>
            <Panel id="origen-grafo" title="Grafo de trabajo" description="Traer, importar o exportar" icon={FolderInput} className="order-5">
              <GraphSourcePanel ws={ws} disabled={running} />
            </Panel>
          </div>
        </div>
      </GraphStoreContext.Provider>
    </>
  );
}

function buildHighlight(graph: Graph, kind: GraphTraversalKind, step: GraphTraversalStep | null, start: VertexId | ''): CanvasHighlight | undefined {
  const vertices = new Map<VertexId, VertexMark>();
  const edges = new Map<string, EdgeMark>();
  if (!step) {
    if (start) vertices.set(start, { tone: 'start', badge: 'inicio' });
    return { vertices, edges };
  }
  const position = new Map(step.order.map((id, i) => [id, i + 1]));
  const pending = new Set(kind === 'bfs' ? step.queue : step.stack);
  for (const v of graph.vertices) {
    const n = position.get(v.id);
    const badge = n !== undefined ? `${n}.º` : undefined;
    const tone =
      v.id === step.current
        ? 'current'
        : pending.has(v.id)
          ? kind === 'dfs'
            ? 'path'
            : 'frontier'
          : n !== undefined
            ? 'visited'
            : undefined;
    if (tone || badge) vertices.set(v.id, { ...(tone ? { tone } : {}), ...(badge ? { badge } : {}) });
  }
  for (const id of step.exploredEdges) edges.set(id, { tone: 'explored' });
  for (const id of step.treeEdges) edges.set(id, { tone: 'tree' });
  if (step.edgeId) edges.set(step.edgeId, { tone: 'active' });
  return { vertices, edges };
}
