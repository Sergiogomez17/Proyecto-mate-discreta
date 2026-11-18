/** Pantalla de carga inicial cuando se abre directamente la dirección de un simulador. */
export function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-medium text-ink-secondary">
        <span className="size-5 animate-spin rounded-full border-2 border-purple border-t-transparent" aria-hidden />
        Cargando GraphLab…
      </div>
    </div>
  );
}
