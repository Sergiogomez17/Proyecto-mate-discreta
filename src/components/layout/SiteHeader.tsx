import { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { BrandMark } from './BrandMark';
import { NAV_ITEMS } from './navItems';

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-white after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-cyan' : 'text-white/70 hover:text-white',
  );

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const { pathname } = useLocation();

  // Al navegar, el menú móvil se cierra.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 rounded-md">
          <BrandMark />
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight">
              GraphLab <span className="text-cyan">UVG</span>
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-white/55 sm:block">Matemática Discreta</span>
          </span>
          <span className="sr-only">(ir al inicio)</span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClasses}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-white/85 hover:bg-white/10 md:hidden"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>

      <nav id={menuId} aria-label="Navegación principal (móvil)" hidden={!menuOpen} className="border-t border-white/10 md:hidden">
        <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn('block rounded-md px-3 py-2.5 text-sm font-medium', isActive ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
