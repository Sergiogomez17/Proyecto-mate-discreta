import { describe, expect, it } from 'vitest';
import type { ModuleId } from '@/app/modules';
import { getModule, MODULES, SIMULATION_MODULES } from '@/app/modules';

describe('registro de módulos', () => {
  it('contiene los siete módulos requeridos', () => {
    expect(MODULES.map((m) => m.title)).toEqual([
      'Árboles binarios',
      'Teoría de grafos',
      'Euler y Hamilton',
      'Isomorfismo',
      'Dijkstra',
      'BFS y DFS',
      'Laboratorio de práctica',
    ]);
  });

  it('usa identificadores y rutas únicos', () => {
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(MODULES.length);
    expect(new Set(MODULES.map((m) => m.path)).size).toBe(MODULES.length);
    for (const m of MODULES) expect(m.path).toMatch(/^\/[a-z0-9/-]+$/);
  });

  it('separa simulaciones y laboratorio', () => {
    expect(SIMULATION_MODULES).toHaveLength(6);
    expect(getModule('practice').path).toBe('/laboratorio');
  });

  it('tras la Fase 5 todos los módulos están disponibles', () => {
    expect(MODULES.every((m) => m.status === 'available')).toBe(true);
    expect(MODULES.every((m) => m.phase <= 5)).toBe(true);
  });

  it('lanza un error ante un módulo desconocido', () => {
    expect(() => getModule('inexistente' as ModuleId)).toThrow(/desconocido/);
  });
});
