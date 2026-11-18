import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import type { Crumb } from './Breadcrumbs';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: Crumb[];
  children?: ReactNode;
}

/** Banda azul marino con la que empieza cada página interior. */
export function PageHeader({ eyebrow, title, description, icon: Icon, breadcrumbs, children }: PageHeaderProps) {
  return (
    <div className="border-t border-white/10 bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className="mt-6 flex items-start gap-4">
          {Icon && (
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-xl border border-cyan-soft/30 bg-navy-secondary/60 sm:inline-flex">
              <Icon aria-hidden className="size-7 text-cyan" />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-soft">{eyebrow}</p>}
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 max-w-3xl text-base text-white/75">{description}</p>}
          </div>
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
