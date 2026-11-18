import { useId } from 'react';
import { Eraser, Pencil, Search, Square, Undo2 } from 'lucide-react';
import { HAMILTON_LIMITS } from '@/algorithms/graph/hamilton';
import { Button } from '@/components/ui/Button';
import { VerdictBox, VertexSelect } from '@/modules/shared/SimulationParts';
import type { Graph, VertexId } from '@/types/graph';
import { cn } from '@/utils/cn';
import type { HamiltonSimulation } from './useHamilton';

const number = (n: number) => n.toLocaleString('es');

/** Búsqueda automática (con límite) y construcción manual de rutas hamiltonianas. */
export function HamiltonControls({ graph, sim }: { graph: Graph; sim: HamiltonSimulation }) {
  const limitId = useId();
  const label = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const what = sim.kind === 'cycle' ? 'ciclo hamiltoniano' : 'camino hamiltoniano';
  const result = sim.search?.result;

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Qué buscar" className="grid grid-cols-2 gap-1 rounded-lg bg-navy/8 p-1">
        {(['cycle', 'path'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={sim.kind === k}
            disabled={sim.building}
            onClick={() => sim.setKind(k)}
            className={cn('rounded-md px-3 py-2 text-sm font-semibold transition-colors', sim.kind === k ? 'bg-navy-panel text-white shadow-sm' : 'text-ink hover:bg-white/70')}
          >
            {k === 'cycle' ? 'Ciclo hamiltoniano' : 'Camino hamiltoniano'}
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-secondary">
        {sim.kind === 'cycle'
          ? 'Un ciclo hamiltoniano visita cada vértice exactamente una vez y vuelve al inicio.'
          : 'Un camino hamiltoniano visita cada vértice exactamente una vez, sin volver al inicio.'}
        {graph.directed ? ' Los arcos se recorren en su sentido.' : ''}
      </p>

      <section aria-label="Búsqueda automática" className="space-y-3">
        <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Búsqueda por backtracking</h3>
        <div className="flex flex-wrap items-end gap-3">
          <VertexSelect graph={graph} label="Vértice inicial" value={sim.start} onChange={sim.setStart} emptyLabel="Cualquiera" disabled={sim.building} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor={limitId} className="text-xs font-semibold text-ink-secondary">
              Límite de búsqueda
            </label>
            <select
              id={limitId}
              value={sim.limit}
              disabled={sim.building}
              onChange={(e) => sim.setLimit(Number(e.target.value))}
              className="h-10 rounded-lg border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none"
            >
              {HAMILTON_LIMITS.map((l) => (
                <option key={l} value={l}>
                  {number(l)} extensiones
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={sim.runSearch} disabled={sim.building || graph.vertices.length === 0} icon={<Search aria-hidden className="size-4" />}>
          Buscar {what}
        </Button>

        {result?.status === 'found' && (
          <VerdictBox verdict="yes" title={`Existe solución: se encontró un ${what}`} testId="hamilton-result">
            <p className="font-mono">
              {result.route.map(label).join(' → ')}
              {sim.kind === 'cycle' && result.route[0] !== undefined ? ` → ${label(result.route[0])}` : ''}
            </p>
            <p className="mt-1 text-xs text-ink-secondary">Verificada: cada vértice aparece una vez y cada paso usa una arista. Rutas parciales exploradas: {number(result.explored)}.</p>
          </VerdictBox>
        )}
        {result?.status === 'none' && (
          <VerdictBox verdict="no" title={`Se demostró que no existe ${what}`} testId="hamilton-result">
            <p>{result.reason}</p>
            <p className="mt-1 text-xs text-ink-secondary">
              {result.byExhaustiveSearch ? `Demostración por búsqueda exhaustiva (${number(result.explored)} rutas parciales exploradas).` : 'Demostración por un argumento estructural, sin necesidad de buscar.'}
            </p>
          </VerdictBox>
        )}
        {result?.status === 'limit' && (
          <VerdictBox verdict="unknown" title="Búsqueda incompleta: se alcanzó el límite" testId="hamilton-result">
            <p>
              Se exploraron {number(result.explored)} rutas parciales sin encontrar un {what} ni agotar las posibilidades. <strong>No se puede afirmar que no exista.</strong> Aumente el límite o fije el vértice inicial.
            </p>
          </VerdictBox>
        )}
      </section>

      <section aria-label="Ruta manual" className="space-y-3">
        <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Comprobar una ruta propia</h3>
        <p className="text-sm text-ink-secondary">Pulse «Construir ruta» y haga clic en los vértices del lienzo en el orden que propone. El sistema detecta repeticiones y saltos sin arista.</p>
        <div className="flex flex-wrap gap-2">
          {sim.building ? (
            <Button size="sm" onClick={() => sim.setBuilding(false)} icon={<Square aria-hidden className="size-4" />}>
              Terminar ruta
            </Button>
          ) : (
            <Button size="sm" onClick={() => sim.setBuilding(true)} disabled={graph.vertices.length === 0} icon={<Pencil aria-hidden className="size-4" />}>
              Construir ruta
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={sim.removeLast} disabled={sim.route.length === 0} icon={<Undo2 aria-hidden className="size-4" />}>
            Quitar último
          </Button>
          <Button size="sm" variant="ghost" onClick={sim.clearRoute} disabled={sim.route.length === 0} icon={<Eraser aria-hidden className="size-4" />}>
            Borrar ruta
          </Button>
        </div>
      </section>
    </div>
  );
}

/** Estado de la ruta manual: vértices visitados, errores y conclusión. */
export function HamiltonDetails({ graph, sim }: { graph: Graph; sim: HamiltonSimulation }) {
  const label = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const { route, check } = sim;
  if (route.length === 0) {
    return <p className="text-sm text-ink-secondary">Todavía no hay una ruta propia. Use «Construir ruta» y haga clic en los vértices del lienzo.</p>;
  }
  const what = sim.kind === 'cycle' ? 'ciclo hamiltoniano' : 'camino hamiltoniano';
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">
          Ruta propuesta ({route.length} {route.length === 1 ? 'vértice' : 'vértices'} de {graph.vertices.length})
        </h3>
        <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-sm" data-testid="hamilton-route" aria-label="Ruta propuesta">
          {route.map((id, i) => (
            <li key={i} className="inline-flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden className="text-ink-secondary">
                  →
                </span>
              )}
              <span className={cn('rounded-md px-2 py-0.5 font-semibold', check.badSteps.has(i) ? 'bg-danger text-white' : 'bg-purple text-white')}>{label(id)}</span>
            </li>
          ))}
        </ol>
      </div>
      {check.valid ? (
        <VerdictBox verdict="yes" title={`La ruta es un ${what} válido`} testId="route-check">
          <p>Visita los {graph.vertices.length} vértices exactamente una vez{sim.kind === 'cycle' ? ' y vuelve al inicio por una arista' : ''}, y cada paso usa una arista del grafo.</p>
        </VerdictBox>
      ) : (
        <VerdictBox verdict={check.badSteps.size > 0 || check.repeated.length > 0 ? 'no' : 'unknown'} title={check.badSteps.size > 0 ? 'La ruta tiene errores' : 'La ruta todavía no está completa'} testId="route-check">
          <ul className="list-disc space-y-0.5 pl-5">
            {check.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </VerdictBox>
      )}
    </div>
  );
}
