import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from '@/stores/preferencesStore';

const KEY = 'graphlab-uvg:preferences';

describe('preferencias persistentes', () => {
  beforeEach(() => usePreferencesStore.getState().resetPreferences());

  it('guarda el último módulo y el estado de la guía en localStorage', () => {
    usePreferencesStore.getState().setLastVisitedModule('dijkstra');
    usePreferencesStore.getState().setHelpExpanded(false);
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as { state: unknown };
    expect(saved.state).toEqual({ lastVisitedModule: 'dijkstra', helpExpanded: false });
  });

  it('restablece los valores por defecto', () => {
    usePreferencesStore.getState().setLastVisitedModule('trees');
    usePreferencesStore.getState().resetPreferences();
    expect(usePreferencesStore.getState().lastVisitedModule).toBeNull();
    expect(usePreferencesStore.getState().helpExpanded).toBe(true);
  });

  it('descarta datos alterados en localStorage al rehidratar', async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ state: { lastVisitedModule: '<script>', helpExpanded: 'sí' }, version: 1 }));
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().lastVisitedModule).toBeNull();
    expect(usePreferencesStore.getState().helpExpanded).toBe(true);
  });

  it('recupera datos válidos guardados previamente', async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ state: { lastVisitedModule: 'graphs', helpExpanded: false }, version: 1 }));
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().lastVisitedModule).toBe('graphs');
    expect(usePreferencesStore.getState().helpExpanded).toBe(false);
  });
});
