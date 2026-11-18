import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ModuleId } from '@/app/modules';
import { MODULES } from '@/app/modules';
import { createSafeStorage, STORAGE_PREFIX } from '@/utils/storage';

interface PreferencesState {
  /** Último módulo abierto, para ofrecer «Continuar» en el panel principal. */
  lastVisitedModule: ModuleId | null;
  /** Si la guía rápida del panel principal está desplegada. */
  helpExpanded: boolean;
  setLastVisitedModule: (id: ModuleId) => void;
  setHelpExpanded: (expanded: boolean) => void;
  resetPreferences: () => void;
}

const DEFAULTS = { lastVisitedModule: null, helpExpanded: true } satisfies Pick<
  PreferencesState,
  'lastVisitedModule' | 'helpExpanded'
>;

const isModuleId = (value: unknown): value is ModuleId => MODULES.some((m) => m.id === value);

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setLastVisitedModule: (id) => set({ lastVisitedModule: id }),
      setHelpExpanded: (expanded) => set({ helpExpanded: expanded }),
      resetPreferences: () => set(DEFAULTS),
    }),
    {
      name: `${STORAGE_PREFIX}:preferences`,
      version: 1,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: ({ lastVisitedModule, helpExpanded }) => ({ lastVisitedModule, helpExpanded }),
      // Los datos de localStorage pueden estar alterados: se aceptan solo valores válidos.
      merge: (persisted, current) => {
        const data = (persisted ?? {}) as Partial<PreferencesState>;
        return {
          ...current,
          lastVisitedModule: isModuleId(data.lastVisitedModule) ? data.lastVisitedModule : null,
          helpExpanded: typeof data.helpExpanded === 'boolean' ? data.helpExpanded : current.helpExpanded,
        };
      },
    },
  ),
);
