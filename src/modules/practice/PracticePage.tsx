import { useEffect, useId, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, CircleX, Eye, GraduationCap, History, Lightbulb, RefreshCw, RotateCcw, Settings2, Sparkles } from 'lucide-react';
import { getModule } from '@/app/modules';
import { generateExercise, gradeExercise, solutionOf } from '@/algorithms/practice/exercises';
import { newSeed } from '@/algorithms/practice/random';
import type { Answers, Grade, Level, Topic } from '@/algorithms/practice/types';
import { LEVELS, levelName, TOPICS, topicName } from '@/algorithms/practice/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { cn } from '@/utils/cn';
import { AnswerPart } from './AnswerParts';
import { ExerciseFigure } from './ExerciseFigure';
import { HistoryPanel } from './HistoryPanel';
import { usePracticeStore } from './practiceStore';

interface Session {
  id: string;
  topic: Topic;
  level: Level;
  seed: number;
}

const newSession = (topic: Topic, level: Level, seed = newSeed()): Session => ({ id: `${Date.now().toString(36)}-${seed}`, topic, level, seed });

export function PracticePage() {
  const module = getModule('practice');
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);
  useEffect(() => setLastVisited('practice'), [setLastVisited]);
  const record = usePracticeStore((s) => s.record);
  const topicId = useId();

  const [topic, setTopic] = useState<Topic>('degrees');
  const [level, setLevel] = useState<Level>('basic');
  const [session, setSession] = useState<Session>(() => newSession('degrees', 'basic'));
  const exercise = useMemo(() => generateExercise(session.topic, session.level, session.seed), [session]);
  const [answers, setAnswers] = useState<Answers>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [best, setBest] = useState(0);
  const [checks, setChecks] = useState(0);
  const [hints, setHints] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const save = (patch: { score?: number; checks?: number; hintsUsed?: number; revealed?: boolean }) =>
    record({
      id: session.id,
      date: new Date().toISOString(),
      topic: session.topic,
      level: session.level,
      seed: session.seed,
      score: patch.score ?? best,
      checks: patch.checks ?? checks,
      hintsUsed: patch.hintsUsed ?? hints,
      revealed: patch.revealed ?? revealed,
    });

  const start = (next: Session) => {
    setSession(next);
    setAnswers({});
    setGrade(null);
    setBest(0);
    setChecks(0);
    setHints(0);
    setRevealed(false);
  };

  const check = () => {
    const result = gradeExercise(exercise, answers);
    const score = Math.round(result.score * 100);
    const nextBest = Math.max(best, score);
    setGrade(result);
    setBest(nextBest);
    setChecks(checks + 1);
    save({ score: nextBest, checks: checks + 1 });
  };

  const showHint = () => {
    const n = Math.min(hints + 1, exercise.hints.length);
    setHints(n);
    if (checks > 0) save({ hintsUsed: n });
  };

  const reveal = () => {
    setRevealed(true);
    save({ revealed: true });
  };

  const sequencePart = exercise.parts.find((p) => p.type === 'sequence');
  const pick = sequencePart
    ? (label: string) => {
        if (!label || revealed) return;
        setAnswers((a) => {
          const current = typeof a[sequencePart.id] === 'string' ? (a[sequencePart.id] as string) : '';
          return { ...a, [sequencePart.id]: current.trim() ? `${current.trim()} ${label}` : label };
        });
      }
    : undefined;

  const percent = grade ? Math.round(grade.score * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Laboratorio"
        title={module.title}
        description="Ejercicios generados al azar en tres niveles, con calificación automática verificada matemáticamente, pistas, corrección de errores e historial en este navegador."
        icon={module.icon}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: module.title }]}
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:px-8">
        <div className="contents lg:block lg:space-y-6">
          <Panel id="ejercicio" title={exercise.title} description={`${topicName(exercise.topic)} · ${levelName(exercise.level)}`} icon={BookOpenCheck} className="order-2">
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-ink" data-testid="statement">
                {exercise.statement}
              </p>
              <ExerciseFigure key={session.id} figure={exercise.figure} onPick={pick} />

              <div className="space-y-4">
                {exercise.parts.map((part) => (
                  <AnswerPart
                    key={`${session.id}-${part.id}`}
                    exercise={exercise}
                    part={part}
                    answers={answers}
                    onChange={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={check} disabled={revealed} icon={<CheckCircle2 aria-hidden className="size-4" />}>
                  Comprobar respuesta
                </Button>
                <Button variant="secondary" onClick={showHint} disabled={hints >= exercise.hints.length || revealed} icon={<Lightbulb aria-hidden className="size-4" />}>
                  Pista ({hints}/{exercise.hints.length})
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAnswers({});
                    setGrade(null);
                  }}
                  disabled={revealed}
                  icon={<RotateCcw aria-hidden className="size-4" />}
                >
                  Borrar respuestas
                </Button>
                <Button
                  variant="ghost"
                  onClick={reveal}
                  disabled={checks === 0 || revealed}
                  title={checks === 0 ? 'Disponible después de comprobar una respuesta' : undefined}
                  icon={<Eye aria-hidden className="size-4" />}
                >
                  Ver solución
                </Button>
              </div>
              {checks === 0 && <p className="text-xs text-ink-secondary">La solución se puede consultar después de comprobar al menos una respuesta.</p>}

              {hints > 0 && (
                <ol className="space-y-1.5 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-ink" aria-label="Pistas">
                  {exercise.hints.slice(0, hints).map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-800" />
                      <span>
                        <strong>Pista {i + 1}:</strong> {h}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {grade && (
                <div role="status" className="space-y-3 rounded-xl border border-card-border bg-white/70 p-4" data-testid="grade">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-bold text-ink">
                      Calificación: <span data-testid="score">{percent} %</span>
                    </p>
                    <Badge tone={percent === 100 ? 'success' : percent >= 50 ? 'warning' : 'danger'}>
                      {grade.items.filter((i) => i.ok).length} de {grade.items.length} correctos
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-ink/10" aria-hidden>
                    <div className={cn('h-2 rounded-full', percent === 100 ? 'bg-success' : percent >= 50 ? 'bg-warning' : 'bg-danger')} style={{ width: `${percent}%` }} />
                  </div>
                  <ul className="space-y-1.5">
                    {grade.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {item.ok ? <CheckCircle2 aria-label="Correcto" className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleX aria-label="Incorrecto" className="mt-0.5 size-4 shrink-0 text-danger" />}
                        <span className="text-ink">
                          <strong>{item.label}:</strong> {item.message}
                          {revealed && !item.ok && item.expected !== undefined && <span className="block text-ink-secondary">Respuesta correcta: {item.expected}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {percent < 100 && !revealed && <p className="text-xs text-ink-secondary">Corrija lo marcado y vuelva a comprobar; se guarda su mejor calificación.</p>}
                </div>
              )}

              {revealed && (
                <div className="space-y-1 rounded-xl border border-purple/40 bg-purple/8 p-4 text-sm text-ink" data-testid="solution">
                  <p className="font-bold text-purple-hover">Solución (calculada con los algoritmos del laboratorio)</p>
                  {solutionOf(exercise).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}

              <Button variant="secondary" onClick={() => start(newSession(session.topic, session.level))} icon={<RefreshCw aria-hidden className="size-4" />}>
                Otro ejercicio de este tema
              </Button>
            </div>
          </Panel>
        </div>

        <div className="contents lg:block lg:space-y-6">
          <Panel id="configuracion" title="Nuevo ejercicio" description="Tema y nivel" icon={Settings2} className="order-1">
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor={topicId} className="text-xs font-semibold text-ink-secondary">
                  Tema
                </label>
                <select
                  id={topicId}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as Topic)}
                  className="h-10 w-full rounded-lg border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none"
                >
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div role="radiogroup" aria-label="Nivel" className="grid grid-cols-3 gap-1 rounded-lg bg-navy/8 p-1">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={level === l.id}
                    onClick={() => setLevel(l.id)}
                    className={cn('rounded-md px-2 py-2 text-sm font-semibold transition-colors', level === l.id ? 'bg-navy-panel text-white shadow-sm' : 'text-ink hover:bg-white/70')}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
              <Button className="w-full" onClick={() => start(newSession(topic, level))} icon={<Sparkles aria-hidden className="size-4" />}>
                Generar ejercicio
              </Button>
              <p className="flex items-start gap-1.5 text-xs text-ink-secondary">
                <GraduationCap aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                Cada ejercicio se genera al azar y se califica con los mismos algoritmos de los simuladores. Cuando hay varias respuestas correctas, se acepta cualquiera.
              </p>
            </div>
          </Panel>
          <Panel id="resultados" title="Resultados" description="Historial local" icon={History} className="order-3">
            <HistoryPanel />
          </Panel>
        </div>
      </div>
    </>
  );
}
