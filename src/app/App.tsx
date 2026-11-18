import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

/**
 * Prefijo de todas las rutas: coincide con la base de Vite (`/Proyecto-mate-discreta/` en GitHub Pages).
 * Así los enlaces internos y la navegación del historial incluyen la carpeta del sitio.
 */
const BASENAME = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

export function App() {
  const [router] = useState(() => createBrowserRouter(routes, { basename: BASENAME }));
  return <RouterProvider router={router} />;
}
