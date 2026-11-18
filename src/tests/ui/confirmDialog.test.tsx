import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { renderApp } from '../renderApp';

describe('confirmación de acciones destructivas (página de ayuda)', () => {
  beforeEach(() => {
    usePreferencesStore.getState().resetPreferences();
    usePreferencesStore.getState().setLastVisitedModule('euler-hamilton');
  });

  it('no borra nada hasta confirmar, y el foco inicial está en «Cancelar»', async () => {
    const { user } = renderApp('/ayuda');
    await user.click(screen.getByRole('button', { name: 'Restablecer preferencias' }));

    const dialog = screen.getByRole('alertdialog', { name: '¿Restablecer preferencias?' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(usePreferencesStore.getState().lastVisitedModule).toBe('euler-hamilton');

    await user.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(usePreferencesStore.getState().lastVisitedModule).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Preferencias restablecidas.');
  });

  it('se cancela con Escape sin borrar datos y devuelve el foco al botón', async () => {
    const { user } = renderApp('/ayuda');
    const trigger = screen.getByRole('button', { name: 'Restablecer preferencias' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(usePreferencesStore.getState().lastVisitedModule).toBe('euler-hamilton');
    expect(trigger).toHaveFocus();
  });

  it('mantiene el foco dentro del diálogo al tabular', async () => {
    const { user } = renderApp('/ayuda');
    await user.click(screen.getByRole('button', { name: 'Restablecer preferencias' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restablecer' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });
});
