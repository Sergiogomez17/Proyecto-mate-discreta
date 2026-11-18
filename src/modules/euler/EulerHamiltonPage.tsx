import { useEffect, useId, useState } from 'react';
import { FolderInput, ListChecks, Route, SlidersHorizontal, Spline } from 'lucide-react';
import { getModule } from '@/app/modules';
import { findExample } from '@/algorithms/graph/examples';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { SelectionPanel } from '@/modules/graphs/SelectionPanel';
import type { LegendItem } from '@/modules/shared/graph/GraphWorkspace';
import { CanvasLegend, GraphWorkspace } from '@/modules/shared/graph/GraphWorkspace';
import { GraphSourcePanel } from '@/modules/shared/graph/GraphSourcePanel';
import { graphSummaryLine } from '@/modules/shared/graph/summary';
import { useGraphWorkspace } from '@/modules/shared/graph/useGraphWorkspace';
import { GraphStoreContext } from '@/stores/graphStoreContext';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { cn } from '@/utils/cn';
import { EulerControls, EulerDetails } from './EulerPanels';
import { HamiltonControls, HamiltonDetails } from './HamiltonPanels';
import { useEulerGraphStore } from './store';
import { useFleury } from './useFleury';
import { useHamilton } from './useHamilton';

type Tab = 'euler' | 'hamilton';

const EXAMPLES = ['casa', 'konigsberg', 'completo', 'petersen', 'dirigido', 'desconexo', 'ciudades'].flatMap((id) => findExample(id) ?? []);

const EULER_LEGEND: LegendItem[] = [
  { label: 'Grado impar (o desequilibrado)', swatch: 'size-3 rounded-full border-2 border-dashed border-cyan' },
  { label: 'Inicio', swatch: 'size-3 rounded-full bg-navy-panel' },
  { label: 'Vértice actual', swatch: 'size-3 rounded-full border-[3px] border-cyan' },
  { label: 'Arista usada (orden)', swatch: 'h-1 w-4 rounded bg-purple-strong' },
  { label: 'Disponible', swatch: 'h-0.5 w-4 border-t-2 border-dashed border-[#00B8D4]' },
  { label: 'Puente evitable', swatch: 'h-0.5 w-4 border-t-2 border-dashed border-warning' },
];
const HAMILTON_LEGEND: LegendItem[] = [
  { label: 'Visitado (orden)', swatch: 'size-3 rounded-full bg-purple' },
  { label: 'Último de la ruta', swatch: 'size-3 rounded-full border-[3px] border-cyan' },
  { label: 'Repetido', swatch: 'size-3 rounded-full border-[3px] border-danger' },
  { label: 'Arista de la ruta', swatch: 'h-1.5 w-4 rounded bg-purple-hover' },
];

export function EulerHamiltonPage() {
  const module = getModule('euler-hamilton');
  const ws = useGraphWorkspace(useEulerGraphStore);
  const { graph } = ws;
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);
  useEffect(() => setLastVisited('euler-hamilton'), [setLastVisited]);
  const tabsId = useId();
  const [tab, setTab] = useState<Tab>('euler');
  const fleury = useFleury(graph);
  const hamilton = useHamilton(graph);

  const eulerActive = tab === 'euler' && fleury.state !== null;
  const hamiltonActive = tab === 'hamilton' && hamilton.building;
  const simulation = eulerActive
    ? {
        active: true,
        hint: `Recorrido de Fleury en curso desde ${fleury.label(fleury.state?.current ?? '')}: haga clic en una arista disponible (línea discontinua). La edición está bloqueada; «Reiniciar recorrido» la habilita.`,
        onEdgeClick: fleury.chooseEdge,
      }
    : hamiltonActive
      ? {
          active: true,
          hint: 'Construyendo una ruta: haga clic en los vértices en el orden de la ruta. Pulse «Terminar ruta» para volver a editar el grafo.',
          onVertexClick: hamilton.addToRoute,
        }
      : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Simulación"
        title={module.title}
        description="Clasifique grafos eulerianos, recórralos arista por arista con el algoritmo de Fleury y busque o verifique caminos y ciclos hamiltonianos."
        icon={module.icon}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Simulaciones', to: '/simulaciones' }, { label: module.title }]}
      />
      <GraphStoreContext.Provider value={useEulerGraphStore}>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:px-8">
          <div className="contents lg:block lg:space-y-6">
            <Panel id="grafo" title="Grafo" description={graphSummaryLine(graph)} icon={Spline} bodyClassName="p-0" className="order-1">
              <GraphWorkspace
                ws={ws}
                examples={EXAMPLES}
                highlight={tab === 'euler' ? fleury.highlight : hamilton.highlight}
                simulation={simulation}
                legend={<CanvasLegend items={tab === 'euler' ? EULER_LEGEND : HAMILTON_LEGEND} />}
              />
            </Panel>
            <Panel
              id="procedimiento"
              title={tab === 'euler' ? 'Grados y recorrido' : 'Ruta propuesta'}
              description={tab === 'euler' ? 'Paridad de los grados y orden de visita' : 'Verificación paso a paso'}
              icon={ListChecks}
              className="order-3"
            >
              {tab === 'euler' ? <EulerDetails graph={graph} sim={fleury} /> : <HamiltonDetails graph={graph} sim={hamilton} />}
            </Panel>
          </div>

          <div className="contents lg:block lg:space-y-6">
            <Panel id="analisis" title="Análisis" description="Euler y Fleury · Hamilton" icon={Route} className="order-2">
              <div className="space-y-5">
                <div role="tablist" aria-label="Tipo de recorrido" className="grid grid-cols-2 gap-1 rounded-lg bg-navy/8 p-1">
                  {(['euler', 'hamilton'] as const).map((t) => (
                    <button
                      key={t}
                      id={`${tabsId}-${t}`}
                      type="button"
                      role="tab"
                      aria-selected={tab === t}
                      aria-controls={`${tabsId}-panel`}
                      onClick={() => setTab(t)}
                      className={cn('rounded-md px-3 py-2 text-sm font-semibold transition-colors', tab === t ? 'bg-navy-panel text-white shadow-sm' : 'text-ink hover:bg-white/70')}
                    >
                      {t === 'euler' ? 'Euler y Fleury' : 'Hamilton'}
                    </button>
                  ))}
                </div>
                <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
                  {tab === 'euler' ? <EulerControls graph={graph} sim={fleury} /> : <HamiltonControls graph={graph} sim={hamilton} />}
                </div>
              </div>
            </Panel>

            <Panel id="propiedades" title="Propiedades" description="Editar vértices y aristas" icon={SlidersHorizontal} className="order-4">
              {simulation ? (
                <p className="text-sm text-ink-secondary">La edición está bloqueada mientras dura la simulación.</p>
              ) : (
                <SelectionPanel onRequestDeleteVertex={ws.requestDeleteVertex} onStartEdgeFrom={ws.startEdgeFrom} onNotice={ws.info} />
              )}
            </Panel>
            <Panel id="origen-grafo" title="Grafo de trabajo" description="Traer, importar o exportar" icon={FolderInput} className="order-5">
              <GraphSourcePanel ws={ws} disabled={simulation !== undefined} />
            </Panel>
          </div>
        </div>
      </GraphStoreContext.Provider>
    </>
  );
}
