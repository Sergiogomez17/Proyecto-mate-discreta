import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple' | 'on-dark';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-ink/8 text-ink-secondary',
  info: 'bg-navy/8 text-navy-secondary',
  success: 'bg-success/12 text-green-800',
  warning: 'bg-warning/15 text-amber-800',
  danger: 'bg-danger/12 text-red-800',
  purple: 'bg-purple/12 text-purple-hover',
  /** Para encabezados azul marino. */
  'on-dark': 'bg-white/10 text-cyan ring-1 ring-cyan-soft/40',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}
