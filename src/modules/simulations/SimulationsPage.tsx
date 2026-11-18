import { LayoutGrid } from 'lucide-react';
import { SIMULATION_MODULES } from '@/app/modules';
import { PageHeader } from '@/components/layout/PageHeader';
import { ModuleCard } from '@/modules/dashboard/ModuleCard';

export function SimulationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Simulaciones"
        title="Simuladores de grafos y árboles"
        description="Construya estructuras, ejecute algoritmos paso a paso y compruebe los resultados."
        icon={LayoutGrid}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Simulaciones' }]}
      />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <h2 className="sr-only">Lista de simuladores</h2>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SIMULATION_MODULES.map((module) => (
            <li key={module.id}>
              <ModuleCard module={module} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
