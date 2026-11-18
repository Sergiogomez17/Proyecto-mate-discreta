import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-light';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 select-none';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-purple text-white hover:bg-purple-hover active:bg-purple-hover shadow-sm',
  secondary: 'border border-purple/40 bg-white/70 text-purple hover:bg-white hover:border-purple',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-danger text-white hover:bg-red-700',
  /** Para fondos azul marino: borde celeste y texto blanco. */
  'outline-light': 'border border-cyan-soft/70 text-white hover:bg-cyan/10 hover:border-cyan',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

/** Clases de botón reutilizables (también para enlaces con apariencia de botón). */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}
