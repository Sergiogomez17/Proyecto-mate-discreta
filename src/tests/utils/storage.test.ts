import { describe, expect, it } from 'vitest';
import { createSafeStorage } from '@/utils/storage';

describe('createSafeStorage', () => {
  it('lee y escribe en el almacenamiento del navegador cuando está disponible', () => {
    const storage = createSafeStorage(() => window.localStorage);
    storage.setItem('k', 'v');
    expect(window.localStorage.getItem('k')).toBe('v');
    expect(storage.getItem('k')).toBe('v');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });

  it('sigue funcionando en memoria si el almacenamiento lanza errores (cuota llena, modo privado)', () => {
    const failing = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cuota llena');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    } as unknown as Storage;
    const storage = createSafeStorage(() => failing);
    expect(() => storage.setItem('k', 'v')).not.toThrow();
    expect(storage.getItem('k')).toBe('v');
    expect(() => storage.removeItem('k')).not.toThrow();
    expect(storage.getItem('k')).toBeNull();
  });

  it('funciona si acceder al almacenamiento lanza una excepción', () => {
    const storage = createSafeStorage(() => {
      throw new Error('SecurityError');
    });
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
  });
});
