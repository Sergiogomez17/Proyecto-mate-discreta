import { useEffect } from 'react';
import { CircleCheck, Clock } from 'lucide-react';
import type { ModuleId } from '@/app/modules';
import { getModule, MODULES } from '@/app/modules';
import type { Crumb } from '@/components/layout/Breadcrumbs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { usePreferencesStore } from '@/stores/preferencesStore';

/**
 * Página de un módulo cuyo simulador aún no se ha entregado.
 * Muestra con transparencia qué contendrá y en qué fase, sin controles ni resultados simulados.
 * Cuando el módulo esté listo, su ruta apuntará a la página del simulador real.
 */
export function ModuleStatusPage({ moduleId }: { moduleId: ModuleId }) {
  const module = getModule(moduleId);
  const setLastVisited = usePreferencesStore((s) => s.setLastVisitedModule);

  useEffect(() => setLastVisited(moduleId), [moduleId, setLastVisited]);

  const breadcrumbs: Crumb[] =
    module.section === 'simulaciones'
      ? [{ label: 'Inicio', to: '/' }, { label: 'Simulaciones', to: '/simulaciones' }, { label: module.title }]
      : [{ label: 'Inicio', to: '/' }, { label: module.title }];

  const related = MODULES.filter((m) => m.id !== module.id && m.section === module.section).slice(0, 3);

  return (
    <>
      <PageHeader eyebrow={module.section === 'laboratorio' ? 'Laboratorio' : 'Simulación'} title={module.title} description={module.summary} icon={module.icon} breadcrumbs={breadcrumbs} />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-[2fr_1fr] lg:px-8">
        <Panel
          title="Estado del módulo"
          icon={Clock}
          actions={<Badge tone="on-dark">{`En desarrollo · Fase ${module.phase}`}</Badge>}
        >
          <p className="text-sm leading-relaxed text-ink-secondary">
            Este simulador se entrega en la <strong className="text-ink">Fase {module.phase}</strong> del plan de desarrollo. Mientras tanto, esta página
            no muestra controles ni resultados, para no presentar funciones simuladas. Estas son las funcionalidades comprometidas:
          </p>
          <ul className="mt-4 space-y-2.5">
            {module.plannedFeatures.map((feature) => (
              <li key={feature} className="surface-card flex gap-3 rounded-lg p-3 text-sm text-ink">
                <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-purple" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Otros módulos" headingLevel={2}>
          {related.length > 0 ? (
            <ul className="space-y-2">
              {related.map((m) => (
                <li key={m.id}>
                  <ButtonLink to={m.path} variant="secondary" className="w-full justify-start" icon={<m.icon aria-hidden className="size-4" />}>
                    {m.title}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-secondary">Explore los simuladores desde el panel principal.</p>
          )}
          <ButtonLink to="/" variant="ghost" className="mt-4 w-full">
            Volver al inicio
          </ButtonLink>
        </Panel>
      </div>
    </>
  );
}
