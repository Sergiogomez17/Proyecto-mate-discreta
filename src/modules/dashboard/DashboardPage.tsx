import { ArrowRight, BookOpen, FlaskConical, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router';
import { getModule, MODULES } from '@/app/modules';
import { ButtonLink } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { GraphPreview } from './GraphPreview';
import { HelpSection } from './HelpSection';
import { ModuleCard } from './ModuleCard';

export function DashboardPage() {
  const lastVisited = usePreferencesStore((s) => s.lastVisitedModule);
  const lastModule = lastVisited ? getModule(lastVisited) : null;

  return (
    <>
      <section aria-labelledby="titulo-principal" className="border-t border-white/10 bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:px-8 lg:pb-16 lg:pt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-soft sm:text-sm">UVG Campus Altiplano · Matemática Discreta</p>
            <h1 id="titulo-principal" className="mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
              GraphLab <span className="text-cyan">UVG</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/80 sm:text-xl">Laboratorio interactivo de grafos, árboles y algoritmos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/simulaciones" size="lg" icon={<LayoutGrid aria-hidden className="size-5" />}>
                Explorar simulaciones
              </ButtonLink>
              <ButtonLink to="/laboratorio" size="lg" variant="outline-light" icon={<FlaskConical aria-hidden className="size-5" />}>
                Laboratorio de práctica
              </ButtonLink>
            </div>
            {lastModule && (
              <p className="mt-6 flex flex-wrap items-center gap-1.5 text-sm text-white/70">
                Continuar donde se quedó:
                <Link to={lastModule.path} className="inline-flex items-center gap-1 font-semibold text-cyan hover:underline">
                  {lastModule.title}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </p>
            )}
          </div>
          <GraphPreview />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-10 sm:px-6 lg:px-8">
        <Panel
          id="modulos"
          title="Módulos del laboratorio"
          description="Cada tarjeta abre su simulador. Las etiquetas indican en qué fase del plan se entrega cada uno."
          icon={LayoutGrid}
        >
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {MODULES.map((module) => (
              <li key={module.id}>
                <ModuleCard module={module} />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <Panel id="informacion" title="Información académica" icon={BookOpen}>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-ink-secondary">Proyecto académico</dt>
                <dd className="mt-1 text-base font-semibold text-ink">Sergio Marco Antonio Gómez Toma</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-ink-secondary">Curso</dt>
                <dd className="mt-1 text-ink">Matemática Discreta</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-ink-secondary">Institución</dt>
                <dd className="mt-1 text-ink">Universidad del Valle de Guatemala, Campus Altiplano</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-ink-secondary">Contenidos</dt>
                <dd className="mt-1 text-ink">Árboles binarios, teoría de grafos, Euler y Hamilton, isomorfismo, Dijkstra, BFS y DFS.</dd>
              </div>
            </dl>
          </Panel>
          <HelpSection />
        </div>
      </div>
    </>
  );
}
