import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { MODULES } from '@/app/modules';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { renderApp } from '../renderApp';

describe('panel principal', () => {
  beforeEach(() => usePreferencesStore.getState().resetPreferences());

  it('muestra la identidad: encabezado, título y subtítulo', () => {
    renderApp('/');
    expect(screen.getByText('UVG Campus Altiplano · Matemática Discreta')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'GraphLab UVG' })).toBeInTheDocument();
    expect(screen.getByText('Laboratorio interactivo de grafos, árboles y algoritmos.')).toBeInTheDocument();
  });

  it('ordena la navegación principal como Inicio → Laboratorio → Simulaciones', () => {
    renderApp('/');
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    const labels = within(nav).getAllByRole('link').map((a) => a.textContent);
    expect(labels.slice(0, 3)).toEqual(['Inicio', 'Laboratorio', 'Simulaciones']);
    expect(within(nav).getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });

  it('muestra una tarjeta por módulo y cada una enlaza a su ruta', () => {
    renderApp('/');
    const section = screen.getByRole('region', { name: 'Módulos del laboratorio' });
    for (const module of MODULES) {
      const link = within(section).getByRole('link', { name: new RegExp(module.title) });
      expect(link).toHaveAttribute('href', module.path);
    }
    expect(within(section).getAllByRole('link')).toHaveLength(MODULES.length);
  });

  it('muestra la información académica', () => {
    renderApp('/');
    const info = screen.getByRole('region', { name: 'Información académica' });
    expect(within(info).getByText('Proyecto académico')).toBeInTheDocument();
    expect(within(info).getByText('Sergio Marco Antonio Gómez Toma')).toBeInTheDocument();
  });

  it('calcula los grados del grafo de la portada (lema del apretón de manos)', () => {
    renderApp('/');
    expect(screen.getByText(/A\(2\), B\(3\), C\(4\), D\(3\), E\(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Σ grados = 14 = 2 · 7 aristas/)).toBeInTheDocument();
  });

  it('permite ocultar y mostrar la ayuda, y recuerda la elección', async () => {
    const { user } = renderApp('/');
    const help = screen.getByRole('region', { name: 'Cómo usar la plataforma' });
    const toggle = within(help).getByRole('button', { name: /Ocultar/ });
    // El contenido se oculta con el atributo `hidden`, controlado por aria-controls.
    const content = help.querySelector(`#${toggle.getAttribute('aria-controls') ?? ''}`);
    expect(content).not.toHaveAttribute('hidden');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(content).toHaveAttribute('hidden');
    expect(usePreferencesStore.getState().helpExpanded).toBe(false);

    await user.click(within(help).getByRole('button', { name: /Mostrar/ }));
    expect(content).not.toHaveAttribute('hidden');
    expect(usePreferencesStore.getState().helpExpanded).toBe(true);
  });
});
