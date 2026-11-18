import { useId, useMemo, useState } from 'react';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { connectedComponents, stronglyConnectedComponents } from '@/algorithms/graph/components';
import { computeDegrees, degreeSum } from '@/algorithms/graph/degrees';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import { adjacencyList, adjacencyMatrix, countParallelEdges } from '@/algorithms/graph/representation';
import { validateGraph } from '@/algorithms/graph/validate';
import { formatWeight } from '@/components/graph/geometry';
import type { Graph, Vertex } from '@/types/graph';
import { cn } from '@/utils/cn';
import { ScrollArea } from '@/components/ui/ScrollArea';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2">
      <dt className="text-xs font-semibold text-ink-secondary">{label}</dt>
      <dd className="text-lg font-bold text-ink">{value}</dd>
    </div>
  );
}

function SubHeading({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className="text-sm font-bold tracking-wide text-navy-panel uppercase">
      {children}
    </h3>
  );
}

const setText = (vertices: Vertex[]) => `{${vertices.map((v) => v.label).join(', ')}}`;

/** Resultados calculados en vivo a partir del grafo del editor. */
export function GraphResults({ graph }: { graph: Graph }) {
  const results = useMemo(() => {
    const degrees = computeDegrees(graph);
    return {
      issues: validateGraph(graph),
      degrees,
      sum: degreeSum(degrees),
      matrix: adjacencyMatrix(graph),
      list: adjacencyList(graph),
      components: connectedComponents(graph),
      strong: graph.directed ? stronglyConnectedComponents(graph) : null,
      parallel: countParallelEdges(graph),
    };
  }, [graph]);
  const [matrixView, setMatrixView] = useState<'counts' | 'weights'>('counts');
  const ids = { degrees: useId(), matrix: useId(), list: useId(), components: useId() };

  const n = graph.vertices.length;
  const m = graph.edges.length;
  if (n === 0) {
    return <p className="text-sm text-ink-secondary">El grafo está vacío. Agregue vértices para ver sus propiedades.</p>;
  }

  const ordered = sortVerticesByLabel(graph.vertices);
  const isolated = ordered.filter((v) => (results.degrees.get(v.id)?.degree ?? 0) === 0);
  const showWeights = graph.weighted && matrixView === 'weights';
  const componentLabel = graph.directed ? 'Componentes débilmente conexas' : 'Componentes conexas';

  return (
    <div className="space-y-7">
      {results.issues.length === 0 ? (
        <p className="flex items-center gap-2 text-sm font-medium text-green-800">
          <CheckCircle2 aria-hidden className="size-4" /> Grafo válido según la política del laboratorio (sin lazos, nombres únicos, pesos finitos).
        </p>
      ) : (
        <ul className="space-y-1 text-sm text-danger">
          {results.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> {issue.message}
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Vértices |V|" value={n} />
        <Stat label={graph.directed ? 'Arcos |E|' : 'Aristas |E|'} value={m} />
        <Stat label={componentLabel} value={results.components.length} />
        {results.strong ? <Stat label="Fuertemente conexas" value={results.strong.length} /> : <Stat label="Vértices aislados" value={isolated.length} />}
      </dl>

      <p className="rounded-lg border border-card-border bg-white/60 px-3 py-2 text-sm text-ink">
        <strong>Lema del apretón de manos:</strong> la suma de los grados es {results.sum} = 2 · {m}
        {results.sum === 2 * m ? ' ✓' : ''}. {graph.directed && <>Además, Σ grados de entrada = Σ grados de salida = {m}.</>}
        {results.parallel > 0 && (
          <>
            {' '}
            Hay {results.parallel} {graph.directed ? 'arcos paralelos' : 'aristas paralelas'} (multigrafo): {graph.directed ? 'cada uno' : 'cada una'} cuenta por separado.
          </>
        )}
      </p>

      <section aria-labelledby={ids.degrees} className="space-y-2">
        <SubHeading id={ids.degrees}>Grados</SubHeading>
        <ScrollArea label="Tabla de grados" className="rounded-lg border border-card-border bg-white/70">
          <table className="w-full text-sm">
            <thead className="bg-navy-panel text-left text-white">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Vértice
                </th>
                {graph.directed && (
                  <>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Entrada
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Salida
                    </th>
                  </>
                )}
                <th scope="col" className="px-3 py-2 font-semibold">
                  {graph.directed ? 'Grado total' : 'Grado'}
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Paridad
                </th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((v) => {
                const d = results.degrees.get(v.id);
                const degree = d?.degree ?? 0;
                return (
                  <tr key={v.id} className="border-t border-card-border">
                    <th scope="row" className="px-3 py-1.5 text-left font-semibold text-ink">
                      {v.label}
                    </th>
                    {graph.directed && (
                      <>
                        <td className="px-3 py-1.5 text-ink">{d?.inDegree ?? 0}</td>
                        <td className="px-3 py-1.5 text-ink">{d?.outDegree ?? 0}</td>
                      </>
                    )}
                    <td className="px-3 py-1.5 font-semibold text-ink">{degree}</td>
                    <td className="px-3 py-1.5 text-ink-secondary">{degree === 0 ? 'Par (aislado)' : degree % 2 === 0 ? 'Par' : 'Impar'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
        {!graph.directed && <p className="text-xs text-ink-secondary">En un grafo no dirigido no se distinguen grados de entrada y de salida: ambos coinciden con el grado.</p>}
      </section>

      <section aria-labelledby={ids.matrix} className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SubHeading id={ids.matrix}>Matriz de adyacencia</SubHeading>
          {graph.weighted && (
            <div role="group" aria-label="Contenido de la matriz" className="flex gap-1 rounded-lg border border-card-border bg-white/70 p-0.5 text-xs">
              {(['counts', 'weights'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  aria-pressed={matrixView === view}
                  onClick={() => setMatrixView(view)}
                  className={cn('rounded-md px-2 py-1 font-semibold', matrixView === view ? 'bg-purple text-white' : 'text-ink hover:bg-purple/10')}
                >
                  {view === 'counts' ? 'Número de aristas' : 'Pesos'}
                </button>
              ))}
            </div>
          )}
        </div>
        <ScrollArea label="Matriz de adyacencia" className="rounded-lg border border-card-border bg-white/70">
          <table className="text-center text-sm" aria-describedby={`${ids.matrix}-nota`}>
            <thead>
              <tr>
                <td className="bg-navy-panel px-2 py-1.5" />
                {results.matrix.order.map((v) => (
                  <th key={v.id} scope="col" className="min-w-9 bg-navy-panel px-2 py-1.5 font-semibold text-white">
                    {v.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.matrix.order.map((row, i) => (
                <tr key={row.id} className="border-t border-card-border">
                  <th scope="row" className="bg-navy-panel/90 px-2 py-1.5 font-semibold text-white">
                    {row.label}
                  </th>
                  {results.matrix.order.map((col, j) => {
                    const count = results.matrix.counts[i]?.[j] ?? 0;
                    const weights = results.matrix.weights[i]?.[j] ?? [];
                    const text = showWeights ? (weights.length > 0 ? weights.map(formatWeight).join(' · ') : '—') : String(count);
                    return (
                      <td key={col.id} className={cn('border-l border-card-border px-2 py-1.5', count > 0 ? 'font-bold text-purple-hover' : 'text-ink-secondary')}>
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
        <p id={`${ids.matrix}-nota`} className="text-xs text-ink-secondary">
          {graph.directed ? 'Fila: origen; columna: destino. ' : 'Matriz simétrica. '}
          {showWeights
            ? `Cada celda lista los pesos de ${graph.directed ? 'los arcos de la fila a la columna' : 'las aristas entre ese par de vértices'}.`
            : graph.directed
              ? 'Cada celda indica cuántos arcos van de la fila a la columna (más de 1 indica arcos paralelos).'
              : 'Cada celda indica cuántas aristas unen ese par de vértices (más de 1 indica aristas paralelas).'}
        </p>
      </section>

      <section aria-labelledby={ids.list} className="space-y-2">
        <SubHeading id={ids.list}>Lista de adyacencia</SubHeading>
        <ul className="space-y-1 rounded-lg border border-card-border bg-white/70 p-3 font-mono text-sm">
          {results.list.map((row) => (
            <li key={row.vertex.id} className="text-ink">
              <span className="font-bold">{row.vertex.label}</span> →{' '}
              {row.neighbors.length === 0 ? (
                <span className="text-ink-secondary">∅</span>
              ) : (
                row.neighbors.map((nb) => (graph.weighted ? `${nb.vertex.label}(${formatWeight(nb.weight)})` : nb.vertex.label)).join(', ')
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-secondary">
          {graph.directed ? 'Para cada vértice se listan sus sucesores.' : 'Para cada vértice se listan sus vecinos.'}
          {graph.weighted ? ' Entre paréntesis, el peso de la arista.' : ''} Orden alfabético; una entrada por arista.
        </p>
      </section>

      <section aria-labelledby={ids.components} className="space-y-2">
        <SubHeading id={ids.components}>{componentLabel}</SubHeading>
        <ol className="space-y-1 text-sm text-ink">
          {results.components.map((c, i) => (
            <li key={c[0]?.id ?? i}>
              <span className="font-semibold">C{i + 1}</span> = {setText(c)}
              {c.length === 1 ? <span className="text-ink-secondary"> (vértice aislado)</span> : null}
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-secondary">
          {results.components.length === 1
            ? graph.directed
              ? 'El grafo es débilmente conexo: ignorando el sentido de los arcos, todos los vértices están unidos.'
              : 'El grafo es conexo: existe un camino entre cualquier par de vértices.'
            : `El grafo no es conexo: tiene ${results.components.length} componentes.`}
        </p>
        {results.strong && (
          <div className="space-y-1 pt-2">
            <p className="text-sm font-semibold text-ink">Componentes fuertemente conexas</p>
            <ol className="space-y-1 text-sm text-ink">
              {results.strong.map((c, i) => (
                <li key={c[0]?.id ?? i}>
                  <span className="font-semibold">F{i + 1}</span> = {setText(c)}
                </li>
              ))}
            </ol>
            <p className="text-sm text-ink-secondary">
              {results.strong.length === 1
                ? 'El grafo es fuertemente conexo: desde cada vértice se llega a todos los demás siguiendo los arcos.'
                : 'Dentro de cada componente, cada vértice alcanza a los demás siguiendo el sentido de los arcos.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
