import { useEffect } from 'react';
import { Calculator, FolderCog, Share2, SlidersHorizontal } from 'lucide-react';
import { getModule } from '@/app/modules';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { GraphWorkspace } from '@/modules/shared/graph/GraphWorkspace';
import { graphSummaryLine } from '@/modules/shared/graph/summary';
import { useGraphWorkspace } from '@/modules/shared/graph/useGraphWorkspace';
import { useGraphStore } from '@/stores/graphStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { GraphResults } from './GraphResults';
import { ProjectPanel } from './ProjectPanel';
import { SelectionPanel } from './SelectionPanel';

export function GraphsPage() {
  const module = getModule('graphs');
  const ws = useGraphWorkspace(useGraphStore);
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);

  useEffect(() => setLastVisited('graphs'), [setLastVisited]);

  return (
    <>
      <PageHeader
        eyebrow="Simulación"
        title={module.title}
        description="Construya grafos dirigidos o no dirigidos, con o sin pesos, y analice sus grados, su matriz y lista de adyacencia y sus componentes conexas."
        icon={module.icon}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Simulaciones', to: '/simulaciones' }, { label: module.title }]}
      />

      {/* En pantallas angostas los paneles se apilan en orden de uso; en escritorio, en dos columnas. */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:px-8">
        <div className="contents lg:block lg:space-y-6">
          <Panel id="grafo" title="Grafo" description={graphSummaryLine(ws.graph)} icon={Share2} bodyClassName="p-0" className="order-1">
            <GraphWorkspace ws={ws} heightClass="h-[420px] sm:h-[500px]" />
          </Panel>

          <Panel id="resultados" title="Resultados" description="Grados, representaciones y conexidad" icon={Calculator} className="order-3">
            <GraphResults graph={ws.graph} />
          </Panel>
        </div>

        <div className="contents lg:block lg:space-y-6">
          <Panel id="propiedades" title="Propiedades" description="Vértices y aristas" icon={SlidersHorizontal} className="order-2">
            <SelectionPanel onRequestDeleteVertex={ws.requestDeleteVertex} onStartEdgeFrom={ws.startEdgeFrom} onNotice={ws.info} />
          </Panel>
          <Panel id="proyecto" title="Proyecto" description="Guardar, exportar e importar" icon={FolderCog} className="order-4">
            <ProjectPanel onGraphReplaced={ws.graphReplaced} />
          </Panel>
        </div>
      </div>
    </>
  );
}
