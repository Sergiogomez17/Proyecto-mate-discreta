import { Bot, FastForward, Play, RotateCcw, TriangleAlert, Undo2 } from 'lucide-react';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { VerdictBox, VertexSelect } from '@/modules/shared/SimulationParts';
import type { Graph } from '@/types/graph';
import { cn } from '@/utils/cn';
import type { FleurySimulation } from './useFleury';
import { ScrollArea } from '@/components/ui/ScrollArea';

const KIND_TEXT = {
  circuit: { title: 'Tiene circuito euleriano', verdict: 'yes' as const },
  path: { title: 'Tiene camino euleriano (abierto)', verdict: 'yes' as const },
  none: { title: 'No es euleriano: no existe recorrido que use cada arista una vez', verdict: 'no' as const },
  'no-edges': { title: 'Sin aristas', verdict: 'unknown' as const },
};

/** Clasificación euleriana y controles de la simulación de Fleury. */
export function EulerControls({ graph, sim }: { graph: Graph; sim: FleurySimulation }) {
  const { analysis, state } = sim;
  const kind = KIND_TEXT[analysis.kind];
  return (
    <div className="space-y-5">
      <VerdictBox verdict={kind.verdict} title={kind.title} testId="euler-classification">
        <ul className="list-disc space-y-1 pl-5">
          {analysis.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </VerdictBox>

      <section aria-label="Algoritmo de Fleury" className="space-y-3">
        <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Algoritmo de Fleury</h3>
        {!state ? (
          <>
            <p className="text-sm text-ink-secondary">
              Elija el vértice inicial y recorra el grafo eligiendo una arista por vez (en la lista o haciendo clic en el lienzo). Regla de Fleury: no cruzar un puente del grafo restante si hay otra opción.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <VertexSelect graph={graph} label="Vértice inicial" value={sim.start} onChange={sim.setStart} />
              <Button onClick={sim.begin} disabled={!sim.start || analysis.kind === 'no-edges'} icon={<Play aria-hidden className="size-4" />}>
                Comenzar recorrido
              </Button>
            </div>
            {sim.startCheck && (
              <p role={sim.startCheck.ok ? 'status' : 'alert'} className={cn('text-sm font-medium', sim.startCheck.ok ? 'text-green-800' : 'text-danger')}>
                {sim.startCheck.message}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-ink">
              Vértice actual: <strong data-testid="fleury-current">{sim.label(state.current)}</strong> · Aristas usadas:{' '}
              <strong>
                {state.used.length} de {graph.edges.length}
              </strong>
            </p>
            {sim.options.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">Aristas disponibles desde {sim.label(state.current)}</p>
                <ul className="space-y-1.5" aria-label="Aristas disponibles">
                  {sim.options.map((o) => (
                    <li key={o.edge.id}>
                      <button
                        type="button"
                        onClick={() => sim.choose(o)}
                        className={cn(
                          'flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border bg-white/80 px-3 py-2 text-left text-sm font-semibold text-ink hover:border-purple',
                          o.avoidable ? 'border-warning/60' : 'border-card-border',
                        )}
                      >
                        <span>
                          {sim.edgeName(o.edge.id)}
                          {graph.weighted ? <span className="ml-1 font-normal text-ink-secondary">(peso {o.edge.weight})</span> : null}
                        </span>
                        <span className="flex gap-1">
                          {!graph.directed && o.bridge && <Badge tone="warning">Puente</Badge>}
                          {o.avoidable ? <Badge tone="danger">Evitable</Badge> : <Badge tone="success">Segura</Badge>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sim.warning && (
              <div role="alert" className="space-y-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm text-ink">
                <p className="flex items-start gap-2 font-semibold text-amber-800">
                  <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> Puente evitable: {sim.edgeName(sim.warning.edge.id)}
                </p>
                <p>
                  {graph.directed
                    ? 'Si la toma, las aristas restantes ya no podrán recorrerse todas.'
                    : 'Al cruzarlo, el grafo restante quedaría dividido y no se podría volver a la otra parte.'}{' '}
                  Fleury indica elegir otra arista.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={sim.dismissWarning}>
                    Elegir otra arista
                  </Button>
                  <Button size="sm" variant="ghost" onClick={sim.forceWarning}>
                    Cruzar de todos modos
                  </Button>
                </div>
              </div>
            )}

            {sim.message && !sim.warning && (
              <p role="status" className={cn('text-sm font-medium', sim.message.tone === 'error' ? 'text-danger' : sim.message.tone === 'warning' ? 'text-amber-800' : 'text-ink')}>
                {sim.message.text}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={sim.autoStep} disabled={sim.done} icon={<Bot aria-hidden className="size-4" />}>
                Paso de Fleury
              </Button>
              <Button size="sm" variant="secondary" onClick={sim.solve} disabled={sim.done} icon={<FastForward aria-hidden className="size-4" />}>
                Completar con Fleury
              </Button>
              <Button size="sm" variant="ghost" onClick={sim.undo} disabled={state.used.length === 0} icon={<Undo2 aria-hidden className="size-4" />}>
                Deshacer arista
              </Button>
              <Button size="sm" variant="ghost" onClick={sim.reset} icon={<RotateCcw aria-hidden className="size-4" />}>
                Reiniciar recorrido
              </Button>
            </div>

            {sim.done && <Conclusion graph={graph} sim={sim} />}
          </>
        )}
      </section>
    </div>
  );
}

function Conclusion({ graph, sim }: { graph: Graph; sim: FleurySimulation }) {
  const { state } = sim;
  if (!state) return null;
  const route = state.trail.map(sim.label).join(' → ');
  if (sim.complete) {
    const closed = state.current === state.start;
    return (
      <VerdictBox verdict="yes" title={closed ? 'Circuito euleriano completo' : 'Camino euleriano completo'} testId="fleury-result">
        <p className="font-mono">{route}</p>
        <p className="mt-1">
          Se recorrieron las {graph.edges.length} aristas exactamente una vez{closed ? ', volviendo al vértice inicial' : `, de ${sim.label(state.start)} a ${sim.label(state.current)}`}.
        </p>
      </VerdictBox>
    );
  }
  const left = graph.edges.length - state.used.length;
  return (
    <VerdictBox verdict="no" title="El recorrido se detuvo sin usar todas las aristas" testId="fleury-result">
      <p className="font-mono">{route}</p>
      <p className="mt-1">
        Desde {sim.label(state.current)} no hay aristas sin usar y quedan {left} {left === 1 ? 'arista' : 'aristas'} por recorrer. Use «Deshacer arista» para volver al paso en que se cruzó el puente evitable.
      </p>
    </VerdictBox>
  );
}

/** Grados de los vértices (paridad o equilibrio) y registro del recorrido. */
export function EulerDetails({ graph, sim }: { graph: Graph; sim: FleurySimulation }) {
  const { analysis, state } = sim;
  const ordered = sortVerticesByLabel(graph.vertices);
  return (
    <div className="space-y-5">
      <ScrollArea label="Tabla de grados" className="rounded-lg border border-card-border bg-white/70">
        <table className="w-full text-sm">
          <thead className="bg-navy-panel text-left text-white">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Vértice
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                {graph.directed ? 'Salida − entrada' : 'Grado'}
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                {graph.directed ? 'Equilibrio' : 'Paridad'}
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((v) => {
              const d = analysis.degree.get(v.id) ?? 0;
              const b = analysis.balance.get(v.id) ?? 0;
              return (
                <tr key={v.id} className="border-t border-card-border">
                  <th scope="row" className="px-3 py-1.5 text-left font-semibold text-ink">
                    {v.label}
                  </th>
                  <td className="px-3 py-1.5 text-ink">{graph.directed ? (b > 0 ? `+${b}` : b) : d}</td>
                  <td className="px-3 py-1.5 text-ink-secondary">
                    {graph.directed ? (b === 0 ? 'Equilibrado' : b > 0 ? 'Sobra salida' : 'Sobra entrada') : d === 0 ? 'Aislado' : d % 2 === 0 ? 'Par' : 'Impar'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
      {!graph.directed && (
        <p className="text-sm text-ink-secondary">
          Vértices de grado impar: <strong className="text-ink">{analysis.oddVertices.length ? analysis.oddVertices.map((v) => v.label).join(', ') : 'ninguno'}</strong> ({analysis.oddVertices.length}).
          Siempre son una cantidad par, porque la suma de los grados es 2|E|.
        </p>
      )}
      {state && (
        <div>
          <h3 className="text-sm font-semibold text-ink">Orden de visita</h3>
          <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-sm" data-testid="fleury-trail" aria-label="Vértices en orden de visita">
            {state.trail.map((id, i) => (
              <li key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden className="text-ink-secondary">
                    →
                  </span>
                )}
                <span className="rounded-md bg-purple px-2 py-0.5 font-semibold text-white">{sim.label(id)}</span>
              </li>
            ))}
          </ol>
          {state.used.length > 0 && (
            <ol className="mt-3 list-decimal space-y-0.5 pl-6 text-sm text-ink" aria-label="Aristas usadas en orden">
              {state.used.map((id) => (
                <li key={id}>{sim.edgeName(id)}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
