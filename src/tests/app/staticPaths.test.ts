import { describe, expect, it } from 'vitest';
import { MODULES } from '@/app/modules';
import { STATIC_PATHS } from '@/app/staticPaths';

describe('rutas publicadas como páginas estáticas (GitHub Pages)', () => {
  it('coinciden exactamente con las rutas de la aplicación', () => {
    const appPaths = ['simulaciones', 'ayuda', ...MODULES.map((m) => m.path.replace(/^\//, ''))];
    expect([...STATIC_PATHS].sort()).toEqual([...new Set(appPaths)].sort());
  });
});
