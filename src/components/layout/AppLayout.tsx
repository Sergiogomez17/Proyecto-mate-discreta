import { Outlet, ScrollRestoration, useNavigation } from 'react-router';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function AppLayout() {
  // Mientras se descarga el código de un simulador se muestra una barra de progreso.
  const loading = useNavigation().state === 'loading';
  return (
    <div className="flex min-h-screen flex-col" aria-busy={loading}>
      {loading && (
        <div role="status" aria-live="polite" className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-navy">
          <div className="h-full w-1/3 animate-pulse bg-cyan" />
          <span className="sr-only">Cargando módulo…</span>
        </div>
      )}
      <a
        href="#contenido"
        className="sr-only z-50 rounded-md bg-purple px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      {/* Sin transición de página: el encabezado y la portada comparten el azul marino y un fundido
          dejaría ver el fondo claro entre ambos. Las animaciones se reservan para los algoritmos. */}
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
