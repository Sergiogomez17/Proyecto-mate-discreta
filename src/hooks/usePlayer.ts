import { useEffect, useReducer } from 'react';
import { initialPlayer, playerReducer } from '@/modules/shared/player';

/**
 * Reproductor de una secuencia de `total` pasos. Cuando cambian los pasos (`steps`), la reproducción
 * vuelve al principio. Mientras se reproduce, avanza un paso cada `speedMs` milisegundos.
 */
export function usePlayer(total: number, steps: unknown) {
  const [player, dispatch] = useReducer(playerReducer, total, (t) => initialPlayer(t));

  useEffect(() => dispatch({ type: 'load', total }), [total, steps]);

  useEffect(() => {
    if (!player.playing) return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), player.speedMs);
    return () => window.clearTimeout(timer);
  }, [player.playing, player.index, player.speedMs]);

  return { player, dispatch };
}
