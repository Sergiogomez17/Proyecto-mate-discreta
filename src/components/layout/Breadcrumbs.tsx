import { Fragment } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  /** Sin `to`, la miga representa la página actual. */
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/65">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <li aria-hidden className="flex">
                <ChevronRight className="size-3.5 text-cyan-soft/70" />
              </li>
            )}
            <li>
              {item.to ? (
                <Link to={item.to} className="rounded hover:text-white hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-white">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
