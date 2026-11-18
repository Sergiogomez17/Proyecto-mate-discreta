import { useId } from 'react';
import type { ReactNode } from 'react';
import { CircleCheck, CircleHelp, CircleX } from 'lucide-react';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import { Badge } from '@/components/ui/Badge';
import type { Graph, VertexId } from '@/types/graph';
import { cn } from '@/utils/cn';

interface VertexSelectProps {
  graph: Graph;
  label: string;
  value: VertexId | '';
  onChange: (id: VertexId | '') => void;
  /** Texto de la opción vacía; si se omite, no hay opción vacía. */
  emptyLabel?: string;
  disabled?: boolean;
}

/** Lista desplegable de vértices en orden alfabético. */
export function VertexSelect({ graph, label, value, onChange, emptyLabel, disabled = false }: VertexSelectProps) {
  const id = useId();
  const valid = value === '' || graph.vertices.some((v) => v.id === value);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-ink-secondary">
        {label}
      </label>
      <select
        id={id}
        value={valid ? value : ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-0 rounded-lg border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none disabled:bg-slate-100"
      >
        {(emptyLabel !== undefined || !valid) && <option value="">{emptyLabel ?? 'Elija…'}</option>}
        {sortVerticesByLabel(graph.vertices).map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface StepCardProps {
  index: number;
  total: number;
  actionLabel: string | null;
  actionTone?: 'info' | 'purple' | 'success' | 'warning';
  formula?: string | null;
  explanation: string | null;
  idleText: string;
  children?: ReactNode;
}

/** Paso actual de una simulación: número, tipo de operación, fórmula y explicación. */
export function StepCard({ index, total, actionLabel, actionTone = 'info', formula, explanation, idleText, children }: StepCardProps) {
  const started = index >= 0 && explanation !== null;
  return (
    <div className="surface-card space-y-3 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink" aria-live="polite">
          {started ? `Paso ${index + 1} de ${total}` : `${total} pasos · pulse «Iniciar» o «Paso siguiente»`}
        </p>
        {started && actionLabel && <Badge tone={actionTone}>{actionLabel}</Badge>}
      </div>
      {started && formula && <p className="rounded-md bg-navy-panel px-3 py-2 font-mono text-sm text-cyan">{formula}</p>}
      <p className="min-h-10 text-sm leading-relaxed text-ink" aria-live="polite" data-testid="step-explanation">
        {started ? explanation : idleText}
      </p>
      {children}
    </div>
  );
}

type Verdict = 'yes' | 'no' | 'unknown';

/** Recuadro de conclusión con tres estados claramente distintos. */
export function VerdictBox({ verdict, title, children, testId }: { verdict: Verdict; title: string; children?: ReactNode; testId?: string }) {
  const Icon = verdict === 'yes' ? CircleCheck : verdict === 'no' ? CircleX : CircleHelp;
  return (
    <div
      role="status"
      data-testid={testId}
      className={cn(
        'space-y-1 rounded-xl border p-4',
        verdict === 'yes' && 'border-success/40 bg-success/10',
        verdict === 'no' && 'border-danger/40 bg-danger/10',
        verdict === 'unknown' && 'border-warning/50 bg-warning/10',
      )}
    >
      <p className={cn('flex items-center gap-2 text-sm font-bold', verdict === 'yes' ? 'text-green-900' : verdict === 'no' ? 'text-red-900' : 'text-amber-800')}>
        <Icon aria-hidden className="size-4 shrink-0" /> {title}
      </p>
      {children && <div className="text-sm text-ink">{children}</div>}
    </div>
  );
}
