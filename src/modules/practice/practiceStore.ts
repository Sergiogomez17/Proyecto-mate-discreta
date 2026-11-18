import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Level, Topic } from '@/algorithms/practice/types';
import { LEVELS, TOPICS } from '@/algorithms/practice/types';
import { createSafeStorage, STORAGE_PREFIX } from '@/utils/storage';

/** Un ejercicio intentado. Con tema, nivel y semilla se puede reconstruir el ejercicio. */
export interface Attempt {
  id: string;
  /** Fecha ISO del último cambio. */
  date: string;
  topic: Topic;
  level: Level;
  seed: number;
  /** Mejor calificación obtenida, de 0 a 100. */
  score: number;
  /** Veces que se pulsó «Comprobar». */
  checks: number;
  hintsUsed: number;
  /** Se pidió ver la solución. */
  revealed: boolean;
}

export const HISTORY_LIMIT = 100;

interface PracticeState {
  history: Attempt[];
  /** Agrega el intento o actualiza el existente con el mismo id (queda primero). */
  record: (attempt: Attempt) => void;
  clear: () => void;
}

const isAttempt = (v: unknown): v is Attempt => {
  if (typeof v !== 'object' || v === null) return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a.id === 'string' &&
    typeof a.date === 'string' &&
    TOPICS.some((t) => t.id === a.topic) &&
    LEVELS.some((l) => l.id === a.level) &&
    typeof a.seed === 'number' &&
    typeof a.score === 'number' &&
    a.score >= 0 &&
    a.score <= 100 &&
    typeof a.checks === 'number' &&
    typeof a.hintsUsed === 'number' &&
    typeof a.revealed === 'boolean'
  );
};

/** Historial local de práctica (solo en este navegador). */
export const usePracticeStore = create<PracticeState>()(
  persist(
    (set, get) => ({
      history: [],
      record: (attempt) => set({ history: [attempt, ...get().history.filter((a) => a.id !== attempt.id)].slice(0, HISTORY_LIMIT) }),
      clear: () => set({ history: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}:practice`,
      version: 1,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: ({ history }) => ({ history }),
      merge: (persisted, current) => {
        const raw = (persisted as { history?: unknown } | undefined)?.history;
        return { ...current, history: Array.isArray(raw) ? raw.filter(isAttempt).slice(0, HISTORY_LIMIT) : [] };
      },
    },
  ),
);
