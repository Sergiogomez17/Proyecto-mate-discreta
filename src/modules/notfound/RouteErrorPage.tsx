import { isRouteErrorResponse, useRouteError } from 'react-router';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';

/** El código de un módulo no se pudo descargar (sin conexión o tras publicarse una versión nueva). */
function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(error.message);
}

/**
 * Página de error de las rutas. Sustituye la pantalla técnica por defecto de React Router por un
 * mensaje comprensible y una salida: recargar o volver al inicio.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <PageHeader eyebrow="Error 404" title="Página no encontrada" description="La dirección no corresponde a ningún módulo de GraphLab." />;
  }
  const chunk = isChunkLoadError(error);
  return (
    <>
      <PageHeader
        eyebrow="Error"
        title={chunk ? 'No se pudo cargar el módulo' : 'Ocurrió un error inesperado'}
        description={
          chunk
            ? 'Puede que se haya publicado una versión nueva de GraphLab o que se perdiera la conexión. Recargue la página para continuar.'
            : 'El módulo no pudo mostrarse. Sus grafos y proyectos guardados en el navegador no se han perdido.'
        }
      />
      <div className="mx-auto max-w-7xl space-y-4 px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.location.reload()} icon={<RefreshCw aria-hidden className="size-4" />}>
            Recargar la página
          </Button>
          <ButtonLink to="/" variant="secondary">
            Volver al inicio
          </ButtonLink>
        </div>
        {!chunk && error instanceof Error && (
          <details className="text-sm text-ink-secondary">
            <summary className="cursor-pointer">Detalle técnico</summary>
            <p className="mt-1 font-mono">{error.message}</p>
          </details>
        )}
      </div>
    </>
  );
}
