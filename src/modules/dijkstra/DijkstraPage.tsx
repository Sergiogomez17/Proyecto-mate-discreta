import { useEffect, useMemo, useState } from 'react';
import { FolderInput, ListOrdered, Route, SlidersHorizontal, Table2, Waypoints } from 'lucide-react';
import { getModule } from '@/app/modules';
import type { DijkstraAction, DijkstraRun } from '@/algorithms/graph/dijkstra';
import { countShortestPaths, dijkstra, formatDistance, negativeEdges, pathEdgeIds, shortestPaths } from '@/algorithms/graph/dijkstra';
import { describeEdge } from '@/algorithms/graph/editing';
import { findExample } from '@/algorithms/graph/examples';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
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
import { useDijkstraGraphStore } from './store';
import { ScrollArea } from '@/components/ui/ScrollArea';

const EXAMPLES = ['ciudades', 'empates', 'dirigido', 'konigsberg', 'petersen'].flatMap((id) => findExample(id) ?? []);

const ACTION_LABEL: Record<DijkstraAction, string> = {
  init: 'Inicialización',
  select: 'Vértice definitivo',
  improve: 'Relajación: mejora',
  tie: 'Relajación: empate',
  keep: 'Relajación: sin cambio',
  unreachable: 'Inalcanzables',
  finish: 'Fin',
};

const LEGEND = [
  { label: 'Origen', swatch: 'size-3 rounded-full bg-navy-panel' },
  { label: 'Vértice actual', swatch: 'size-3 rounded-full border-[3px] border-cyan' },
  { label: 'Definitivo', swatch: 'size-3 rounded-full bg-purple' },
  { label: 'Vecino que se relaja', swatch: 'size-3 rounded-full border-2 border-dashed border-cyan' },
  { label: 'Arista relajada', swatch: 'h-1 w-4 rounded bg-[#00B8D4]' },
  { label: 'Árbol de predecesores', swatch: 'h-1 w-4 rounded bg-purple-strong' },
  { label: 'Camino mínimo', swatch: 'h-1.5 w-4 rounded bg-purple-hover' },
];

export function DijkstraPage() {
  const module = getModule('dijkstra');
  const ws = useGraphWorkspace(useDijkstraGraphStore);
  const { graph } = ws;
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);
  useEffect(() => setLastVisited('dijkstra'), [setLastVisited]);

  const ordered = useMemo(() => sortVerticesByLabel(graph.vertices), [graph.vertices]);
  const [sourceChoice, setSource] = useState<VertexId | ''>('');
  const [targetChoice, setTarget] = useState<VertexId | ''>('');
  // Elecciones por defecto: el primer vértice como origen y el último como destino.
  const source = graph.vertices.some((v) => v.id === sourceChoice) ? sourceChoice : (ordered[0]?.id ?? '');
  const target = targetChoice === '' || graph.vertices.some((v) => v.id === targetChoice) ? targetChoice : '';

  const negatives = useMemo(() => negativeEdges(graph), [graph]);
  const run = useMemo<DijkstraRun | null>(() => (source && negatives.length === 0 ? dijkstra(graph, source) : null), [graph, source, negatives]);
  const steps = useMemo(() => run?.steps ?? [], [run]);
  const { player, dispatch } = usePlayer(steps.length, steps);
  const step = player.index >= 0 ? (steps[player.index] ?? null) : null;
  const finished = isFinished(player);
  const running = player.index >= 0;

  const label = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;

  const final = useMemo(() => {
    if (!run || !target) return null;
    const labelOf = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
    const paths = shortestPaths(run, target, labelOf);
    return { distance: run.dist[target] ?? Infinity, paths, count: countShortestPaths(run, target) };
  }, [run, target, graph.vertices]);

  const highlight = useMemo(() => buildHighlight(graph, source, target, step, finished ? final : null), [graph, source, target, step, finished, final]);

  return (
    <>
      <PageHeader
        eyebrow="Simulación"
        title={module.title}
        description="Calcule caminos mínimos desde un origen, paso a paso: cada selección de vértice y cada relajación d(v) = min(d(v), d(u) + w(u,v)) se muestran tal como las ejecuta el algoritmo."
        icon={module.icon}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Simulaciones', to: '/simulaciones' }, { label: module.title }]}
      />
      <GraphStoreContext.Provider value={useDijkstraGraphStore}>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:px-8">
          <div className="contents lg:block lg:space-y-6">
            <Panel id="grafo" title="Grafo" description={graphSummaryLine(graph)} icon={Waypoints} bodyClassName="p-0" className="order-1">
              <GraphWorkspace
                ws={ws}
                examples={EXAMPLES}
                highlight={highlight}
                simulation={{ active: running, hint: 'Simulación en curso: la edición está bloqueada. Pulse «Reiniciar simulación» para modificar el grafo o sus pesos.' }}
                legend={<CanvasLegend items={LEGEND} />}
              />
            </Panel>

            <Panel id="tabla" title="Tabla de distancias" description="Estado de cada vértice en el paso actual" icon={Table2} className="order-3">
              <DistanceTable graph={graph} run={run} step={step} source={source} />
            </Panel>
          </div>

          <div className="contents lg:block lg:space-y-6">
            <Panel id="algoritmo" title="Algoritmo de Dijkstra" description="Origen, destino y ejecución" icon={Route} className="order-2">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <VertexSelect graph={graph} label="Origen" value={source} onChange={setSource} disabled={running} />
                  <VertexSelect graph={graph} label="Destino" value={target} onChange={setTarget} emptyLabel="— Todos —" disabled={running} />
                </div>

                {graph.vertices.length === 0 ? (
                  <p className="text-sm text-ink-secondary">Agregue vértices o cargue un ejemplo para ejecutar el algoritmo.</p>
                ) : negatives.length > 0 ? (
                  <VerdictBox verdict="no" title="No se puede ejecutar Dijkstra: hay pesos negativos">
                    <p>Dijkstra supone que ninguna arista resta distancia; con pesos negativos una distancia «definitiva» podría mejorar después. Corrija estas aristas:</p>
                    <ul className="mt-1 list-disc pl-5">
                      {negatives.map((e) => (
                        <li key={e.id}>
                          {describeEdge(graph, e)}: peso {formatDistance(e.weight)}
                        </li>
                      ))}
                    </ul>
                  </VerdictBox>
                ) : (
                  <>
                    <PlayerControls player={player} dispatch={dispatch} resetLabel="Reiniciar simulación" groupLabel="Controles de Dijkstra" />
                    <StepCard
                      index={player.index}
                      total={steps.length}
                      actionLabel={step ? ACTION_LABEL[step.action] : null}
                      actionTone={step?.action === 'select' ? 'purple' : step?.action === 'improve' ? 'success' : step?.action === 'tie' ? 'warning' : 'info'}
                      formula={step?.formula ?? null}
                      explanation={step?.explanation ?? null}
                      idleText={`El algoritmo aún no ha comenzado. Origen: ${source ? label(source) : '—'}.`}
                    />
                    {!graph.weighted && <p className="text-xs text-ink-secondary">El grafo no es ponderado: cada arista cuenta con peso 1 (el camino mínimo es el de menos aristas).</p>}
                  </>
                )}

                {finished && run && <FinalResult graph={graph} run={run} target={target} final={final} />}
              </div>
            </Panel>

            <Panel id="propiedades" title="Propiedades" description="Editar vértices, aristas y pesos" icon={SlidersHorizontal} className="order-4">
              {running ? (
                <p className="text-sm text-ink-secondary">La edición está bloqueada mientras dura la simulación. Pulse «Reiniciar simulación» para modificar el grafo.</p>
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

type Final = { distance: number; paths: VertexId[][]; count: number } | null;

function buildHighlight(graph: Graph, source: VertexId | '', target: VertexId | '', step: DijkstraRun['steps'][number] | null, final: Final): CanvasHighlight | undefined {
  const vertices = new Map<VertexId, VertexMark>();
  const edges = new Map<string, EdgeMark>();
  if (!step) {
    if (source) vertices.set(source, { tone: 'start', badge: 'origen' });
    if (target && target !== source) vertices.set(target, { tone: 'target', badge: 'destino' });
    return { vertices, edges };
  }
  const definitive = new Set(step.definitive);
  for (const v of graph.vertices) {
    const d = step.dist[v.id];
    const badge = `d=${formatDistance(d)}`;
    if (v.id === step.current) vertices.set(v.id, { tone: 'current', badge });
    else if (v.id === step.neighbor) vertices.set(v.id, { tone: 'frontier', badge });
    else if (definitive.has(v.id)) vertices.set(v.id, { tone: 'visited', badge });
    else if (v.id === source) vertices.set(v.id, { tone: 'start', badge });
    else vertices.set(v.id, { badge });
  }
  // Árbol de predecesores: la arista más liviana de cada predecesor a su vértice.
  for (const [v, preds] of Object.entries(step.pred)) {
    for (const p of preds) for (const id of pathEdgeIds(graph, [p, v])) edges.set(id, { tone: 'tree' });
  }
  if (step.edgeId) edges.set(step.edgeId, { tone: 'active' });
  if (final && target) {
    for (const path of final.paths) for (const id of pathEdgeIds(graph, path)) edges.set(id, { tone: 'path' });
    const mark = vertices.get(target);
    vertices.set(target, { tone: 'target', ...(mark?.badge ? { badge: mark.badge } : {}) });
  }
  return { vertices, edges };
}

function DistanceTable({ graph, run, step, source }: { graph: Graph; run: DijkstraRun | null; step: DijkstraRun['steps'][number] | null; source: VertexId | '' }) {
  if (!run) return <p className="text-sm text-ink-secondary">La tabla aparece cuando se puede ejecutar el algoritmo.</p>;
  const label = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const ordered = sortVerticesByLabel(graph.vertices);
  const finished = step?.action === 'finish';
  return (
    <div className="space-y-2">
      <ScrollArea label="Tabla de distancias" className="rounded-lg border border-card-border bg-white/70">
        <table className="w-full text-sm" data-testid="distance-table">
          <thead className="bg-navy-panel text-left text-white">
            <tr>
              {['Vértice', 'Distancia provisional', 'Distancia definitiva', 'Predecesor', 'Estado'].map((h) => (
                <th key={h} scope="col" className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordered.map((v) => {
              const d = step ? step.dist[v.id] : undefined;
              const isDef = step?.definitive.includes(v.id) ?? false;
              const preds = step?.pred[v.id] ?? [];
              const state = !step
                ? '—'
                : v.id === step.current && step.action === 'select'
                  ? 'Se fija ahora'
                  : isDef
                    ? 'Definitivo'
                    : d === Infinity
                      ? finished || step.action === 'unreachable'
                        ? 'Inalcanzable'
                        : 'Sin alcanzar'
                      : 'Provisional';
              return (
                <tr
                  key={v.id}
                  className={cn('border-t border-card-border', step?.current === v.id && 'bg-cyan/15', step?.neighbor === v.id && 'bg-purple/8')}
                  data-testid={`fila-${v.label}`}
                >
                  <th scope="row" className="px-3 py-1.5 text-left font-semibold text-ink">
                    {v.label}
                    {v.id === source ? <span className="ml-1 text-xs font-normal text-ink-secondary">(origen)</span> : null}
                  </th>
                  <td className="px-3 py-1.5 text-ink">{step && !isDef ? formatDistance(d) : '—'}</td>
                  <td className="px-3 py-1.5 font-semibold text-ink">{step && isDef ? formatDistance(d) : '—'}</td>
                  <td className="px-3 py-1.5 text-ink">{preds.length ? preds.map(label).join(' o ') : '—'}</td>
                  <td className="px-3 py-1.5 text-ink-secondary">{state}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
      <p className="text-xs text-ink-secondary">
        Un vértice es definitivo cuando el algoritmo lo elige: su distancia ya no puede mejorar porque no hay pesos negativos. «Predecesor» con varias opciones indica empates (más de un camino mínimo).
      </p>
    </div>
  );
}

function FinalResult({ graph, run, target, final }: { graph: Graph; run: DijkstraRun; target: VertexId | ''; final: Final }) {
  const label = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const source = label(run.source);
  if (!target || !final) {
    const reachable = run.definitive.length;
    return (
      <VerdictBox verdict="yes" title={`Distancias mínimas desde ${source}`} testId="dijkstra-result">
        <p>
          Se calcularon las distancias de {reachable} {reachable === 1 ? 'vértice alcanzable' : 'vértices alcanzables'}. Elija un destino para resaltar su camino mínimo.
        </p>
      </VerdictBox>
    );
  }
  if (final.distance === Infinity) {
    return (
      <VerdictBox verdict="no" title={`${label(target)} es inalcanzable desde ${source}`} testId="dijkstra-result">
        <p>No existe ningún camino{graph.directed ? ' que respete el sentido de los arcos' : ''}: la distancia es ∞.</p>
      </VerdictBox>
    );
  }
  return (
    <VerdictBox verdict="yes" title={`Camino mínimo de ${source} a ${label(target)}: costo ${formatDistance(final.distance)}`} testId="dijkstra-result">
      <ul className="space-y-0.5 font-mono">
        {final.paths.map((p) => (
          <li key={p.join('-')}>{p.map(label).join(' → ')}</li>
        ))}
      </ul>
      {final.count > 1 && (
        <p className="mt-1">
          Hay {final.count} caminos mínimos con el mismo costo{final.count > final.paths.length ? ` (se muestran ${final.paths.length})` : ''}.
        </p>
      )}
      <p className="mt-1 text-xs text-ink-secondary">
        <ListOrdered aria-hidden className="mr-1 inline size-3.5" />
        Se reconstruye siguiendo los predecesores desde {label(target)} hasta {source}.
      </p>
    </VerdictBox>
  );
}
