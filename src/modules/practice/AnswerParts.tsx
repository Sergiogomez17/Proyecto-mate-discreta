import { useId } from 'react';
import { Delete, Eraser } from 'lucide-react';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import type { Answers, Exercise, Part } from '@/algorithms/practice/types';
import { splitLabels } from '@/algorithms/practice/validators';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/formClasses';
import type { Graph } from '@/types/graph';

interface PartProps {
  exercise: Exercise;
  part: Part;
  answers: Answers;
  onChange: (partId: string, value: string | Record<string, string>) => void;
}

const record = (v: Answers[string] | undefined): Record<string, string> => (typeof v === 'object' ? v : {});
const text = (v: Answers[string] | undefined): string => (typeof v === 'string' ? v : '');

/** Un apartado de la respuesta, según su tipo. */
export function AnswerPart({ exercise, part, answers, onChange }: PartProps) {
  const headingId = useId();
  return (
    <fieldset className="space-y-3 rounded-xl border border-card-border bg-white/60 p-4" aria-labelledby={headingId}>
      <legend id={headingId} className="px-1 text-sm font-bold text-navy-panel">
        {part.title}
      </legend>
      {part.type === 'fields' && <FieldsInput part={part} value={record(answers[part.id])} onChange={(v) => onChange(part.id, v)} />}
      {part.type === 'choice' && <ChoiceInput part={part} value={text(answers[part.id])} onChange={(v) => onChange(part.id, v)} />}
      {part.type === 'sequence' && <SequenceInput part={part} value={text(answers[part.id])} onChange={(v) => onChange(part.id, v)} />}
      {part.type === 'mapping' && exercise.figure.kind === 'pair' && (
        <MappingInput part={part} g1={exercise.figure.g1} g2={exercise.figure.g2} value={record(answers[part.id])} onChange={(v) => onChange(part.id, v)} />
      )}
    </fieldset>
  );
}

function FieldsInput({ part, value, onChange }: { part: Extract<Part, { type: 'fields' }>; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const baseId = useId();
  const wide = part.fields.some((f) => f.kind === 'labels');
  return (
    <div className={wide ? 'grid gap-3 sm:grid-cols-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'}>
      {part.fields.map((f, i) => (
        <div key={f.key} className={f.kind === 'labels' ? 'space-y-1 sm:col-span-2' : 'space-y-1'}>
          <label htmlFor={`${baseId}-${i}`} className="text-xs font-semibold text-ink-secondary">
            {f.label}
          </label>
          <input
            id={`${baseId}-${i}`}
            className={inputClass}
            inputMode={f.kind === 'number' ? 'numeric' : 'text'}
            autoComplete="off"
            value={value[f.key] ?? ''}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function ChoiceInput({ part, value, onChange }: { part: Extract<Part, { type: 'choice' }>; value: string; onChange: (v: string) => void }) {
  const name = useId();
  return (
    <div className="space-y-2">
      {part.options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="size-4 accent-purple" />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function SequenceInput({ part, value, onChange }: { part: Extract<Part, { type: 'sequence' }>; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const items = splitLabels(value);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-semibold text-ink-secondary">
        {part.help} También puede hacer clic en la figura.
      </label>
      <input id={id} className={inputClass} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Por ejemplo: A B C" />
      {items.length > 0 && (
        <ol className="flex flex-wrap gap-1.5" aria-label="Secuencia escrita">
          {items.map((l, i) => (
            <li key={i} className="inline-flex items-center gap-1 rounded-md bg-purple px-2 py-0.5 text-sm font-semibold text-white">
              <span className="text-xs text-cyan">{i + 1}</span>
              {l}
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onChange(items.slice(0, -1).join(' '))} disabled={items.length === 0} icon={<Delete aria-hidden className="size-4" />}>
          Quitar último
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onChange('')} disabled={items.length === 0} icon={<Eraser aria-hidden className="size-4" />}>
          Borrar
        </Button>
      </div>
    </div>
  );
}

function MappingInput({
  part,
  g1,
  g2,
  value,
  onChange,
}: {
  part: Extract<Part, { type: 'mapping' }>;
  g1: Graph;
  g2: Graph;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const baseId = useId();
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-secondary">{part.help}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sortVerticesByLabel(g1.vertices).map((v, i) => (
          <div key={v.id} className="flex items-center gap-2">
            <label htmlFor={`${baseId}-${i}`} className="min-w-10 text-sm font-bold text-ink">
              f({v.label})
            </label>
            <select
              id={`${baseId}-${i}`}
              value={value[v.id] ?? ''}
              onChange={(e) => onChange({ ...value, [v.id]: e.target.value })}
              className="h-9 min-w-0 flex-1 rounded-md border border-card-border bg-white px-1 text-sm text-ink"
            >
              <option value="">—</option>
              {sortVerticesByLabel(g2.vertices).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
