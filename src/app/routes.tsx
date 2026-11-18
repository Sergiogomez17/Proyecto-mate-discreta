import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import type { ModuleId } from '@/app/modules';
import { MODULES } from '@/app/modules';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoading } from '@/components/layout/PageLoading';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { HelpPage } from '@/modules/help/HelpPage';
import { NotFoundPage } from '@/modules/notfound/NotFoundPage';
import { RouteErrorPage } from '@/modules/notfound/RouteErrorPage';
import { ModuleStatusPage } from '@/modules/shared/ModuleStatusPage';
import { SimulationsPage } from '@/modules/simulations/SimulationsPage';

type LazyPage = () => Promise<{ Component: ComponentType }>;

/**
 * Simuladores ya entregados. Se cargan bajo demanda (división de código): el panel principal
 * no descarga el código de los simuladores hasta que el usuario abre uno.
 * Los módulos que no figuran aquí muestran su página de estado.
 */
const MODULE_PAGES: Partial<Record<ModuleId, LazyPage>> = {
  trees: async () => ({ Component: (await import('@/modules/trees/TreesPage')).TreesPage }),
  graphs: async () => ({ Component: (await import('@/modules/graphs/GraphsPage')).GraphsPage }),
  'euler-hamilton': async () => ({ Component: (await import('@/modules/euler/EulerHamiltonPage')).EulerHamiltonPage }),
  isomorphism: async () => ({ Component: (await import('@/modules/isomorphism/IsomorphismPage')).IsomorphismPage }),
  dijkstra: async () => ({ Component: (await import('@/modules/dijkstra/DijkstraPage')).DijkstraPage }),
  traversals: async () => ({ Component: (await import('@/modules/traversals/TraversalsPage')).TraversalsPage }),
  practice: async () => ({ Component: (await import('@/modules/practice/PracticePage')).PracticePage }),
};

/** Rutas de la aplicación. Las de los módulos se generan desde el registro `MODULES`. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    hydrateFallbackElement: <PageLoading />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        // Ruta sin dirección propia: un error dentro de un módulo se muestra sin perder el encabezado y la navegación.
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'simulaciones', element: <SimulationsPage /> },
          { path: 'ayuda', element: <HelpPage /> },
          ...MODULES.map((module): RouteObject => {
            const path = module.path.replace(/^\//, '');
            const lazy = MODULE_PAGES[module.id];
            return lazy ? { path, lazy } : { path, element: <ModuleStatusPage moduleId={module.id} /> };
          }),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
