import { describe, expect, it } from 'vitest';
import type { PlayerAction, PlayerState } from '@/modules/shared/player';
import { initialPlayer, isFinished, playerReducer } from '@/modules/shared/player';

const run = (state: PlayerState, ...actions: PlayerAction[]) => actions.reduce(playerReducer, state);

describe('reproductor de pasos', () => {
  it('empieza antes del primer paso', () => {
    expect(initialPlayer(5)).toMatchObject({ index: -1, total: 5, playing: false });
  });

  it('Iniciar muestra el primer paso y reproduce; tick avanza y se detiene al final', () => {
    let s = run(initialPlayer(3), { type: 'start' });
    expect(s).toMatchObject({ index: 0, playing: true });
    s = run(s, { type: 'tick' }, { type: 'tick' });
    expect(s).toMatchObject({ index: 2, playing: false });
    expect(isFinished(s)).toBe(true);
    expect(run(s, { type: 'tick' }).index).toBe(2);
  });

  it('Pausar detiene los ticks y Continuar los reanuda', () => {
    let s = run(initialPlayer(5), { type: 'start' }, { type: 'pause' }, { type: 'tick' });
    expect(s).toMatchObject({ index: 0, playing: false });
    s = run(s, { type: 'resume' }, { type: 'tick' });
    expect(s).toMatchObject({ index: 1, playing: true });
  });

  it('Paso siguiente y anterior se mueven de uno en uno y pausan', () => {
    let s = run(initialPlayer(3), { type: 'start' }, { type: 'next' });
    expect(s).toMatchObject({ index: 1, playing: false });
    s = run(s, { type: 'next' }, { type: 'next' });
    expect(s.index).toBe(2);
    s = run(s, { type: 'prev' }, { type: 'prev' }, { type: 'prev' }, { type: 'prev' });
    expect(s.index).toBe(-1);
  });

  it('Continuar no hace nada al final; Iniciar vuelve a empezar', () => {
    const end = run(initialPlayer(2), { type: 'next' }, { type: 'next' });
    expect(run(end, { type: 'resume' }).playing).toBe(false);
    expect(run(end, { type: 'start' })).toMatchObject({ index: 0, playing: true });
  });

  it('Reiniciar, cambio de velocidad y nuevos pasos', () => {
    const s = run(initialPlayer(4), { type: 'start' }, { type: 'next' }, { type: 'setSpeed', speedMs: 300 }, { type: 'reset' });
    expect(s).toMatchObject({ index: -1, playing: false, speedMs: 300 });
    expect(run(s, { type: 'next' }, { type: 'load', total: 9 })).toMatchObject({ index: -1, total: 9, playing: false });
    expect(run(initialPlayer(0), { type: 'start' })).toMatchObject({ index: -1, playing: false });
  });
});
