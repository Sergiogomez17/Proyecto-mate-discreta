import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { MODULES } from '@/app/modules';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { renderApp } from '../renderApp';

describe('navegación entre módulos', () => {
  beforeEach(() => usePreferencesStore.getState().resetPreferences());

  it('abre el módulo al pulsar su tarjeta y muestra las migas de pan', async () => {
    const { user, router } = renderApp('/');
    const section = screen.getByRole('region', { name: 'Módulos del laboratorio' });
    await user.click(within(section).getByRole('link', { name: /Dijkstra/ }));

    // El simulador se descarga bajo demanda: la navegación termina cuando su código está cargado.
    expect(await screen.findByRole('heading', { level: 1, name: 'Dijkstra' }, { timeout: 5000 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/simulaciones/dijkstra');
    const crumbs = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(crumbs).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    expect(within(crumbs).getByRole('link', { name: 'Simulaciones' })).toHaveAttribute('href', '/simulaciones');
    expect(within(crumbs).getByText('Dijkstra')).toHaveAttribute('aria-current', 'page');
  });

  it.each(MODULES.map((m) => [m.path, m.title] as const))('la ruta %s abre el módulo «%s»', async (path, title) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { level: 1, name: title }, { timeout: 5000 })).toBeInTheDocument();
  });

  it('recuerda el último módulo visitado y lo ofrece en el inicio', async () => {
    const { user } = renderApp('/simulaciones/arboles-binarios');
    await screen.findByRole('heading', { level: 1, name: 'Árboles binarios' }, { timeout: 5000 });
    // Se guarda en un efecto, que puede ejecutarse justo después de mostrarse el título.
    await waitFor(() => expect(usePreferencesStore.getState().lastVisitedModule).toBe('trees'));
    await user.click(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: 'Inicio' }));
    const continueText = await screen.findByText(/Continuar donde se quedó/);
    expect(within(continueText).getByRole('link', { name: 'Árboles binarios' })).toHaveAttribute('href', '/simulaciones/arboles-binarios');
  });

  it('lista los seis simuladores en «Simulaciones»', () => {
    renderApp('/simulaciones');
    expect(screen.getByRole('heading', { level: 1, name: 'Simuladores de grafos y árboles' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Abrir módulo/ })).toHaveLength(6);
  });

  it('muestra la página 404 en rutas desconocidas', () => {
    renderApp('/no-existe');
    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument();
  });

  it('abre y cierra el menú móvil', async () => {
    const { user } = renderApp('/');
    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    const mobileNav = screen.getByRole('navigation', { name: 'Navegación principal (móvil)' });
    await user.click(within(mobileNav).getByRole('link', { name: 'Simulaciones' }));
    expect(await screen.findByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
  });
});
