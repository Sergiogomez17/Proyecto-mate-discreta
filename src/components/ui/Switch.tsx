import { useId } from 'react';
import { cn } from '@/utils/cn';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

/** Interruptor accesible (role="switch") con su etiqueta visible. */
export function Switch({ label, checked, onChange, description, disabled = false }: SwitchProps) {
  const id = useId();
  const descriptionId = useId();
  return (
    <div className="flex items-center gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-purple bg-purple' : 'border-card-border bg-slate-300',
        )}
      >
        <span className={cn('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-ink">
        {label}
      </label>
      {description && (
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      )}
    </div>
  );
}
