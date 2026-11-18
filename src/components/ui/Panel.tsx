import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PanelProps {
  title: string;
  /** Texto breve bajo el título, dentro del encabezado azul marino. */
  description?: string;
  icon?: LucideIcon;
  /** Acciones alineadas a la derecha del encabezado. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Clases del cuerpo; si se indican, sustituyen al relleno por defecto (p-5). */
  bodyClassName?: string;
  /** Nivel del encabezado para mantener la jerarquía del documento. */
  headingLevel?: 2 | 3;
  id?: string;
}

/**
 * Contenedor principal: encabezado azul marino con texto blanco y cuerpo claro.
 */
export function Panel({ title, description, icon: Icon, actions, children, className, bodyClassName, headingLevel = 2, id }: PanelProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn('overflow-hidden rounded-xl border border-card-border bg-white/55 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 bg-navy-panel px-5 py-4 text-white">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-cyan-soft" />}
          <div className="min-w-0">
            <Heading id={headingId} className="text-lg font-semibold leading-tight">
              {title}
            </Heading>
            {description && <p className="mt-1 text-sm text-white/75">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {/* `bodyClassName` reemplaza el relleno por defecto (cn solo concatena; no resuelve conflictos). */}
      <div className={cn('on-light', bodyClassName ?? 'p-5')}>{children}</div>
    </section>
  );
}
