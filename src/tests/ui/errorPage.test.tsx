import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RouteErrorPage } from '@/modules/notfound/RouteErrorPage';

function renderFailing(error: Error) {
  const Boom = () => {
    throw error;
  };
  const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteErrorPage /> }]);
  return render(<RouterProvider router={router} />);
}

describe('página de error de las rutas', () => {
  it('explica que hay que recargar si no se pudo descargar un módulo', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderFailing(new TypeError('Failed to fetch dynamically imported module: /assets/DijkstraPage.js'));
    expect(screen.getByRole('heading', { level: 1, name: 'No se pudo cargar el módulo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument();
    expect(screen.queryByText('Detalle técnico')).not.toBeInTheDocument();
  });

  it('muestra un mensaje comprensible y el detalle técnico ante otros errores', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderFailing(new Error('algo falló'));
    expect(screen.getByRole('heading', { level: 1, name: 'Ocurrió un error inesperado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
    expect(screen.getByText('algo falló')).toBeInTheDocument();
  });
});
