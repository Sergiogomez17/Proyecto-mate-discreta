import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCheck, Eraser, FolderOpen, GitCompareArrows, Scale, Search, SlidersHorizontal } from 'lucide-react';
import { getModule } from '@/app/modules';
import { ISOMORPHISM_PAIRS } from '@/algorithms/graph/examples';
import type { IsomorphismResult } from '@/algorithms/graph/isomorphism';
import { checkMapping, compareInvariants, describeMapping, findIsomorphism, ISOMORPHISM_LIMIT } from '@/algorithms/graph/isomorphism';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import type { CanvasHighlight, EdgeMark, VertexMark } from '@/components/graph/flowTypes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { SelectionPanel } from '@/modules/graphs/SelectionPanel';
import { GraphWorkspace } from '@/modules/shared/graph/GraphWorkspace';
import { GraphSourcePanel } from '@/modules/shared/graph/GraphSourcePanel';
import { graphSummaryLine } from '@/modules/shared/graph/summary';
import { useGraphWorkspace } from '@/modules/shared/graph/useGraphWorkspace';
import { VerdictBox } from '@/modules/shared/SimulationParts';
import { GraphStoreContext } from '@/stores/graphStoreContext';
import { usePreferencesStore } from '@/stores/preferencesStore';
import type { Graph, VertexId } from '@/types/graph';
import { cn } from '@/utils/cn';
import { useIsoG1Store, useIsoG2Store } from './store';
import { ScrollArea } from '@/components/ui/ScrollArea';

const number = (n: number) => n.toLocaleString('es');

export function IsomorphismPage() {
  const module = getModule('isomorphism');
  const ws1 = useGraphWorkspace(useIsoG1Store);
  const ws2 = useGraphWorkspace(useIsoG2Store);
  const g1 = ws1.graph;
  const g2 = ws2.graph;
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);
  useEffect(() => setLastVisited('isomorphism'), [setLastVisited]);
  const pairSelectId = useId();
  const [pairId, setPairId] = useState(ISOMORPHISM_PAIRS[0]?.id ?? '');
  const pair = ISOMORPHISM_PAIRS.find((p) => p.id === pairId);

  const invariants = useMemo(() => compareInvariants(g1, g2), [g1, g2]);
  const [searchRecord, setSearchRecord] = useState<{ g1: Graph; g2: Graph; result: IsomorphismResult } | null>(null);
  const search = searchRecord && searchRecord.g1 === g1 && searchRecord.g2 === g2 ? searchRecord.result : null;
  const [proposal, setProposal] = useState<Record<VertexId, VertexId>>({});
  const proposalMap = useMemo(() => new Map(Object.entries(proposal).filter(([a, b]) => b !== '' && g1.vertices.some((v) => v.id === a))), [proposal, g1]);
  const check = useMemo(() => (proposalMap.size > 0 ? checkMapping(g1, g2, proposalMap) : null), [g1, g2, proposalMap]);

  const loadPair = () => {
    if (!pair) return;
    ws1.replaceGraph(pair.g1, `${pair.name} · G1`);
    ws2.replaceGraph(pair.g2, `${pair.name} · G2`);
    setProposal({});
    ws1.info(`Se cargó el par «${pair.name}». Puede volver a los grafos anteriores con «Deshacer» en cada uno.`);
  };

  const highlights = useMemo(() => buildHighlights(g1, g2, proposalMap, check), [g1, g2, proposalMap, check]);

  return (
    <>
      <PageHeader
        eyebrow="Simulación"
        title={module.title}
        description="Construya dos grafos, compare sus invariantes y compruebe si existe una correspondencia biyectiva que conserve las conexiones."
        icon={module.icon}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Simulaciones', to: '/simulaciones' }, { label: module.title }]}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="surface-card flex flex-wrap items-end gap-3 rounded-xl p-4">
          <div className="flex min-w-56 flex-1 flex-col gap-1">
            <label htmlFor={pairSelectId} className="text-xs font-semibold text-ink-secondary">
              Par de ejemplo
            </label>
            <select
              id={pairSelectId}
              value={pairId}
              onChange={(e) => setPairId(e.target.value)}
              className="h-10 min-w-0 rounded-lg border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none"
            >
              {ISOMORPHISM_PAIRS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" onClick={loadPair} icon={<FolderOpen aria-hidden className="size-4" />}>
            Cargar par en G1 y G2
          </Button>
          {pair && <p className="w-full text-xs text-ink-secondary">{pair.description}</p>}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <GraphStoreContext.Provider value={useIsoG1Store}>
            <Panel id="g1" title="G1" description={graphSummaryLine(g1)} icon={GitCompareArrows} bodyClassName="p-0">
              <GraphWorkspace ws={ws1} highlight={highlights.g1} canvasLabel="Lienzo de G1" heightClass="h-[360px] sm:h-[400px]" />
            </Panel>
          </GraphStoreContext.Provider>
          <GraphStoreContext.Provider value={useIsoG2Store}>
            <Panel id="g2" title="G2" description={graphSummaryLine(g2)} icon={GitCompareArrows} bodyClassName="p-0">
              <GraphWorkspace ws={ws2} highlight={highlights.g2} canvasLabel="Lienzo de G2" heightClass="h-[360px] sm:h-[400px]" />
            </Panel>
          </GraphStoreContext.Provider>
        </div>

        <Panel id="comparacion" title="Comparación" description="Invariantes, búsqueda exacta y correspondencias" icon={Scale}>
          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-label="Invariantes" className="min-w-0 space-y-3">
              <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Invariantes</h3>
              <ScrollArea label="Tabla de invariantes" className="rounded-lg border border-card-border bg-white/70">
                <table className="w-full text-sm" data-testid="invariants">
                  <thead className="bg-navy-panel text-left text-white">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        Invariante
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        G1
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        G2
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        ¿Igual?
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invariants.map((r) => (
                      <tr key={r.name} className={cn('border-t border-card-border', !r.equal && 'bg-danger/8')}>
                        <th scope="row" className="px-3 py-1.5 text-left font-semibold text-ink">
                          {r.name}
                        </th>
                        <td className="px-3 py-1.5 font-mono text-ink">{r.g1}</td>
                        <td className="px-3 py-1.5 font-mono text-ink">{r.g2}</td>
                        <td className={cn('px-3 py-1.5 font-semibold', r.equal ? 'text-green-800' : 'text-danger')}>{r.equal ? 'Sí' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
              <p className="text-xs text-ink-secondary">
                Un invariante distinto demuestra que no son isomorfos. Que todos coincidan <strong>no</strong> basta para afirmar que lo son: hace falta una correspondencia que conserve todas las aristas. Los pesos no
                intervienen; las aristas paralelas y el sentido de los arcos sí.
              </p>
            </section>

            <section aria-label="Búsqueda exacta" className="min-w-0 space-y-3">
              <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Búsqueda exacta</h3>
              <p className="text-sm text-ink-secondary">Backtracking con poda: solo se prueban vértices de igual grado y cada asignación debe conservar las aristas con los ya asignados.</p>
              <Button onClick={() => setSearchRecord({ g1, g2, result: findIsomorphism(g1, g2) })} icon={<Search aria-hidden className="size-4" />}>
                Comprobar isomorfismo
              </Button>
              {search?.status === 'isomorphic' && (
                <VerdictBox verdict="yes" title="G1 y G2 son isomorfos" testId="iso-result">
                  <p>Correspondencia encontrada (verificada: biyectiva y conserva todas las aristas):</p>
                  <ul className="mt-1 grid grid-cols-2 gap-x-4 font-mono sm:grid-cols-3">
                    {describeMapping(g1, g2, search.mapping).map(({ from, to }) => (
                      <li key={from.id}>
                        {from.label} ↦ {to.label}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" variant="secondary" className="mt-2" onClick={() => setProposal(Object.fromEntries(search.mapping))} icon={<ArrowRightLeft aria-hidden className="size-4" />}>
                    Usar como propuesta
                  </Button>
                </VerdictBox>
              )}
              {search?.status === 'not-isomorphic' && (
                <VerdictBox verdict="no" title="G1 y G2 no son isomorfos" testId="iso-result">
                  <p>{search.reason}</p>
                  {search.byExhaustiveSearch && <p className="mt-1 text-xs text-ink-secondary">Asignaciones exploradas: {number(search.explored)}.</p>}
                </VerdictBox>
              )}
              {search?.status === 'limit' && (
                <VerdictBox verdict="unknown" title="Búsqueda incompleta" testId="iso-result">
                  <p>
                    Se alcanzó el límite de {number(ISOMORPHISM_LIMIT)} asignaciones sin encontrar una correspondencia ni descartar todas. <strong>No se puede concluir</strong> si son o no isomorfos.
                  </p>
                </VerdictBox>
              )}
            </section>
          </div>

          <section aria-label="Correspondencia propuesta" className="mt-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Proponer una correspondencia f: G1 → G2</h3>
              <Button size="sm" variant="ghost" onClick={() => setProposal({})} disabled={proposalMap.size === 0} icon={<Eraser aria-hidden className="size-4" />}>
                Borrar propuesta
              </Button>
            </div>
            {g1.vertices.length === 0 ? (
              <p className="text-sm text-ink-secondary">G1 no tiene vértices.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {sortVerticesByLabel(g1.vertices).map((v) => (
                  <MappingSelect key={v.id} from={v.label} value={proposal[v.id] ?? ''} g2={g2} onChange={(to) => setProposal((p) => ({ ...p, [v.id]: to }))} />
                ))}
              </div>
            )}
            {check && (
              <>
                {check.valid ? (
                  <VerdictBox verdict="yes" title="La correspondencia es un isomorfismo" testId="mapping-check">
                    <p>Es biyectiva y cada par de vértices de G1 tiene el mismo número de {g1.directed ? 'arcos' : 'aristas'} que su imagen en G2.</p>
                  </VerdictBox>
                ) : (
                  <VerdictBox verdict={check.complete ? 'no' : 'unknown'} title={check.complete ? 'La correspondencia no es un isomorfismo' : 'Correspondencia incompleta'} testId="mapping-check">
                    <ul className="list-disc space-y-0.5 pl-5">
                      {check.problems.slice(0, 12).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    {check.problems.length > 12 && <p className="mt-1 text-xs">… y {check.problems.length - 12} problemas más.</p>}
                  </VerdictBox>
                )}
                <p className="flex items-center gap-1 text-xs text-ink-secondary">
                  <CheckCheck aria-hidden className="size-3.5" /> En los lienzos, cada vértice de G1 muestra su imagen (↦) y cada vértice de G2 su preimagen (←); las conexiones que no se conservan aparecen en rojo.
                </p>
              </>
            )}
          </section>
          <p className="sr-only" aria-live="polite">
            {check ? (check.valid ? 'Correspondencia válida' : `${check.problems.length} problemas en la correspondencia`) : ''}
          </p>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <GraphStoreContext.Provider value={useIsoG1Store}>
            <Panel id="propiedades-g1" title="Propiedades de G1" icon={SlidersHorizontal}>
              <div className="space-y-6">
                <SelectionPanel onRequestDeleteVertex={ws1.requestDeleteVertex} onStartEdgeFrom={ws1.startEdgeFrom} onNotice={ws1.info} />
                <GraphSourcePanel ws={ws1} name="G1" />
              </div>
            </Panel>
          </GraphStoreContext.Provider>
          <GraphStoreContext.Provider value={useIsoG2Store}>
            <Panel id="propiedades-g2" title="Propiedades de G2" icon={SlidersHorizontal}>
              <div className="space-y-6">
                <SelectionPanel onRequestDeleteVertex={ws2.requestDeleteVertex} onStartEdgeFrom={ws2.startEdgeFrom} onNotice={ws2.info} />
                <GraphSourcePanel ws={ws2} name="G2" />
              </div>
            </Panel>
          </GraphStoreContext.Provider>
        </div>
      </div>
    </>
  );
}

function MappingSelect({ from, value, g2, onChange }: { from: string; value: VertexId; g2: Graph; onChange: (to: VertexId) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 rounded-lg border border-card-border bg-white/70 px-2 py-1.5">
      <label htmlFor={id} className="min-w-8 text-sm font-bold text-ink">
        f({from})
      </label>
      <select id={id} value={g2.vertices.some((v) => v.id === value) ? value : ''} onChange={(e) => onChange(e.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-card-border bg-white px-1 text-sm text-ink">
        <option value="">—</option>
        {sortVerticesByLabel(g2.vertices).map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function edgesBetween(graph: Graph, a: VertexId, b: VertexId) {
  return graph.edges.filter((e) => (e.source === a && e.target === b) || (!graph.directed && e.source === b && e.target === a));
}

function buildHighlights(g1: Graph, g2: Graph, mapping: ReadonlyMap<VertexId, VertexId>, check: ReturnType<typeof checkMapping> | null): { g1?: CanvasHighlight; g2?: CanvasHighlight } {
  if (mapping.size === 0) return {};
  const v1 = new Map<VertexId, VertexMark>();
  const v2 = new Map<VertexId, VertexMark>();
  const e1 = new Map<string, EdgeMark>();
  const e2 = new Map<string, EdgeMark>();
  const label2 = new Map(g2.vertices.map((v) => [v.id, v.label]));
  const label1 = new Map(g1.vertices.map((v) => [v.id, v.label]));
  const pre = new Map<VertexId, string[]>();
  for (const [a, b] of mapping) {
    const name = label2.get(b);
    if (!name) continue;
    v1.set(a, { badge: `↦ ${name}`, ...(check?.valid ? { tone: 'visited' as const } : {}) });
    pre.set(b, [...(pre.get(b) ?? []), label1.get(a) ?? a]);
  }
  for (const [b, names] of pre) {
    const tone = names.length > 1 ? ('error' as const) : check?.valid ? ('visited' as const) : null;
    v2.set(b, { badge: `← ${names.join(',')}`, ...(tone ? { tone } : {}) });
  }
  for (const { a, b } of check?.violations ?? []) {
    for (const e of edgesBetween(g1, a, b)) e1.set(e.id, { tone: 'error' });
    const fa = mapping.get(a);
    const fb = mapping.get(b);
    if (fa && fb) for (const e of edgesBetween(g2, fa, fb)) e2.set(e.id, { tone: 'error' });
  }
  return { g1: { vertices: v1, edges: e1 }, g2: { vertices: v2, edges: e2 } };
}
