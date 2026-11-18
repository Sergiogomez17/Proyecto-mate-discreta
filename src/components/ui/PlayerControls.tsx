import { useId } from 'react';
import type { Dispatch } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type { PlayerAction, PlayerState } from '@/modules/shared/player';
import { isFinished, SPEEDS } from '@/modules/shared/player';
import { Button } from './Button';

interface PlayerControlsProps {
  player: PlayerState;
  dispatch: Dispatch<PlayerAction>;
  /** Texto del botón de reinicio (por ejemplo, «Reiniciar recorrido»). */
  resetLabel: string;
  groupLabel: string;
  disabled?: boolean;
}

/** Controles de una simulación paso a paso: iniciar, pausar, continuar, avanzar, retroceder, reiniciar y velocidad. */
export function PlayerControls({ player, dispatch, resetLabel, groupLabel, disabled = false }: PlayerControlsProps) {
  const speedId = useId();
  const finished = isFinished(player);
  return (
    <div className="flex flex-wrap items-end gap-2" role="group" aria-label={groupLabel}>
      <Button onClick={() => dispatch({ type: 'start' })} disabled={disabled} icon={<Play aria-hidden className="size-4" />}>
        Iniciar
      </Button>
      <Button variant="secondary" onClick={() => dispatch({ type: 'pause' })} disabled={disabled || !player.playing} icon={<Pause aria-hidden className="size-4" />}>
        Pausar
      </Button>
      <Button variant="secondary" onClick={() => dispatch({ type: 'resume' })} disabled={disabled || player.playing || finished} icon={<StepForward aria-hidden className="size-4" />}>
        Continuar
      </Button>
      <Button variant="secondary" onClick={() => dispatch({ type: 'prev' })} disabled={disabled || player.index < 0} icon={<ChevronLeft aria-hidden className="size-4" />}>
        Paso anterior
      </Button>
      <Button variant="secondary" onClick={() => dispatch({ type: 'next' })} disabled={disabled || finished} icon={<ChevronRight aria-hidden className="size-4" />}>
        Paso siguiente
      </Button>
      <Button variant="ghost" onClick={() => dispatch({ type: 'reset' })} disabled={player.index < 0} icon={<RotateCcw aria-hidden className="size-4" />}>
        {resetLabel}
      </Button>
      <div className="ml-auto flex flex-col gap-1">
        <label htmlFor={speedId} className="text-xs font-semibold text-ink-secondary">
          Velocidad
        </label>
        <select
          id={speedId}
          value={player.speedMs}
          onChange={(e) => dispatch({ type: 'setSpeed', speedMs: Number(e.target.value) })}
          className="h-10 rounded-lg border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none"
        >
          {SPEEDS.map((s) => (
            <option key={s.ms} value={s.ms}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
