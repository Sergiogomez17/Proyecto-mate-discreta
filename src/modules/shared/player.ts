/**
 * Reproductor de pasos (puro y sin temporizadores): la interfaz despacha acciones y un
 * efecto envía `tick` cada `speedMs` milisegundos mientras `playing` es verdadero.
 * index = −1 representa el estado anterior al primer paso.
 */
export interface PlayerState {
  index: number;
  total: number;
  playing: boolean;
  speedMs: number;
}

export type PlayerAction =
  | { type: 'load'; total: number }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'tick' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'reset' }
  | { type: 'setSpeed'; speedMs: number };

export const SPEEDS = [
  { label: 'Lenta', ms: 1800 },
  { label: 'Normal', ms: 1100 },
  { label: 'Rápida', ms: 600 },
  { label: 'Muy rápida', ms: 300 },
] as const;

export const initialPlayer = (total: number, speedMs: number = SPEEDS[1].ms): PlayerState => ({ index: -1, total, playing: false, speedMs });

export const isFinished = (s: PlayerState) => s.total > 0 && s.index === s.total - 1;

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const last = state.total - 1;
  switch (action.type) {
    case 'load':
      return { ...state, total: action.total, index: -1, playing: false };
    case 'start':
      // Iniciar desde el principio (también si el recorrido ya había terminado).
      if (state.total === 0) return state;
      return { ...state, index: 0, playing: state.total > 1 };
    case 'pause':
      return { ...state, playing: false };
    case 'resume':
      if (state.total === 0 || state.index >= last) return { ...state, playing: false };
      return { ...state, playing: true };
    case 'tick': {
      if (!state.playing) return state;
      const index = Math.min(last, state.index + 1);
      return { ...state, index, playing: index < last };
    }
    case 'next':
      return { ...state, index: Math.min(last, state.index + 1), playing: false };
    case 'prev':
      return { ...state, index: Math.max(-1, state.index - 1), playing: false };
    case 'reset':
      return { ...state, index: -1, playing: false };
    case 'setSpeed':
      return { ...state, speedMs: action.speedMs };
  }
}
