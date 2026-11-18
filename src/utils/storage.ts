import type { StateStorage } from 'zustand/middleware';

/**
 * Almacenamiento local seguro.
 *
 * `localStorage` puede no existir o lanzar excepciones (modo privado, cuota llena,
 * almacenamiento bloqueado). En esos casos la aplicación sigue funcionando con un
 * almacén en memoria que se pierde al recargar.
 */
export function createSafeStorage(getBackend: () => Storage | undefined = defaultBackend): StateStorage {
  const memory = new Map<string, string>();

  const backend = (): Storage | undefined => {
    try {
      return getBackend();
    } catch {
      return undefined;
    }
  };

  return {
    getItem(name) {
      try {
        const store = backend();
        if (store) return store.getItem(name);
      } catch {
        /* se usa la memoria */
      }
      return memory.get(name) ?? null;
    },
    setItem(name, value) {
      memory.set(name, value);
      try {
        backend()?.setItem(name, value);
      } catch {
        /* sin persistencia: el valor queda en memoria */
      }
    },
    removeItem(name) {
      memory.delete(name);
      try {
        backend()?.removeItem(name);
      } catch {
        /* nada que limpiar */
      }
    },
  };
}

function defaultBackend(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

/** Prefijo común de las claves de GraphLab en localStorage. */
export const STORAGE_PREFIX = 'graphlab-uvg';
