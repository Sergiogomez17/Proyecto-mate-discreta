import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { levelName, TOPICS, topicName } from '@/algorithms/practice/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/utils/cn';
import { usePracticeStore } from './practiceStore';

const dateFormat = new Intl.DateTimeFormat('es-GT', { dateStyle: 'short', timeStyle: 'short' });

/** Resultados acumulados e historial local de ejercicios. */
export function HistoryPanel() {
  const history = usePracticeStore((s) => s.history);
  const clear = usePracticeStore((s) => s.clear);
  const [confirming, setConfirming] = useState(false);
  const graded = history.filter((a) => a.checks > 0);
  const average = graded.length ? Math.round(graded.reduce((s, a) => s + a.score, 0) / graded.length) : null;
  const perfect = graded.filter((a) => a.score === 100).length;
  const byTopic = TOPICS.map((t) => {
    const list = graded.filter((a) => a.topic === t.id);
    return { name: t.name, count: list.length, avg: list.length ? Math.round(list.reduce((s, a) => s + a.score, 0) / list.length) : null };
  }).filter((r) => r.count > 0);

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-card-border bg-card px-2 py-2">
          <dt className="text-xs font-semibold text-ink-secondary">Calificados</dt>
          <dd className="text-lg font-bold text-ink" data-testid="stat-graded">
            {graded.length}
          </dd>
        </div>
        <div className="rounded-lg border border-card-border bg-card px-2 py-2">
          <dt className="text-xs font-semibold text-ink-secondary">Promedio</dt>
          <dd className="text-lg font-bold text-ink" data-testid="stat-average">
            {average === null ? '—' : `${average} %`}
          </dd>
        </div>
        <div className="rounded-lg border border-card-border bg-card px-2 py-2">
          <dt className="text-xs font-semibold text-ink-secondary">Perfectos</dt>
          <dd className="text-lg font-bold text-ink">{perfect}</dd>
        </div>
      </dl>

      {byTopic.length > 0 && (
        <div>
          <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Por tema</h3>
          <ul className="mt-2 space-y-1.5">
            {byTopic.map((r) => (
              <li key={r.name} className="text-sm">
                <div className="flex justify-between text-ink">
                  <span>{r.name}</span>
                  <span className="font-semibold">
                    {r.avg} % · {r.count}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-ink/10" aria-hidden>
                  <div className="h-1.5 rounded-full bg-purple" style={{ width: `${r.avg ?? 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold tracking-wide text-navy-panel uppercase">Historial</h3>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} disabled={history.length === 0} icon={<Trash2 aria-hidden className="size-4" />}>
            Borrar historial
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="mt-1 text-sm text-ink-secondary">Aún no hay ejercicios. El historial se guarda solo en este navegador.</p>
        ) : (
          <ol className="mt-2 divide-y divide-card-border rounded-lg border border-card-border bg-white/70" aria-label="Historial de ejercicios" data-testid="history">
            {history.slice(0, 12).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {topicName(a.topic)} · {levelName(a.level)}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {dateFormat.format(new Date(a.date))}
                    {a.hintsUsed > 0 ? ` · ${a.hintsUsed} ${a.hintsUsed === 1 ? 'pista' : 'pistas'}` : ''}
                    {a.revealed ? ' · solución vista' : ''}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-bold', a.checks === 0 ? 'bg-ink/8 text-ink-secondary' : a.score === 100 ? 'bg-success/15 text-green-800' : a.score >= 50 ? 'bg-warning/15 text-amber-800' : 'bg-danger/12 text-red-800')}>
                  {a.checks === 0 ? 'sin calificar' : `${a.score} %`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title="¿Borrar el historial de práctica?"
        description={`Se eliminarán los ${history.length} registros guardados en este navegador. Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          clear();
          setConfirming(false);
        }}
      />
    </div>
  );
}
