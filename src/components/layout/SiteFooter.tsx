import { Link } from 'react-router';
import { MODULES } from '@/app/modules';
import { BrandMark } from './BrandMark';

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-navy text-white/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3 text-white">
            <BrandMark className="size-8" />
            <span className="font-bold">
              GraphLab <span className="text-cyan">UVG</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm">
            Proyecto académico de Matemática Discreta. Universidad del Valle de Guatemala, Campus Altiplano.
          </p>
          <p className="mt-2 text-sm">Autor: Sergio Marco Antonio Gómez Toma</p>
        </div>
        <nav aria-label="Módulos">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-soft">Módulos</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {MODULES.map((m) => (
              <li key={m.id}>
                <Link to={m.path} className="hover:text-white hover:underline">
                  {m.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-soft">Plataforma</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link to="/ayuda" className="hover:text-white hover:underline">
                Ayuda y guía de uso
              </Link>
            </li>
            <li>Funciona en el navegador, sin cuenta ni instalación.</li>
            <li>Los datos se guardan solo en este dispositivo.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/50 sm:px-6 lg:px-8">
          Sitio académico independiente. No es un sitio oficial de la Universidad del Valle de Guatemala.
        </p>
      </div>
    </footer>
  );
}
