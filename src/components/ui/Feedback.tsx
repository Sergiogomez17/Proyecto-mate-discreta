/**
 * Mensajes de resultado de una acción: los errores se anuncian como alerta y los avisos
 * de éxito como estado, para que los lectores de pantalla los comuniquen.
 */
export function Feedback({ error, success }: { error: string | null; success: string | null }) {
  return (
    <>
      <p role="alert" className="text-sm font-medium text-danger empty:hidden">
        {error ?? ''}
      </p>
      <p role="status" className="text-sm font-medium text-green-800 empty:hidden">
        {error ? '' : (success ?? '')}
      </p>
    </>
  );
}
