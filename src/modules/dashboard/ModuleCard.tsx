import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { ModuleInfo } from '@/app/modules';
import { Badge } from '@/components/ui/Badge';

export function ModuleCard({ module }: { module: ModuleInfo }) {
  const Icon = module.icon;
  const available = module.status === 'available';
  return (
    <Link
      to={module.path}
      className="surface-card group flex h-full flex-col rounded-xl p-5 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-purple/45"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-navy">
          <Icon aria-hidden className="size-5 text-cyan" />
        </span>
        <Badge tone={available ? 'success' : 'info'}>{available ? 'Disponible' : `Fase ${module.phase} · en desarrollo`}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">{module.title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-secondary">{module.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Temas">
        {module.topics.map((topic) => (
          <li key={topic} className="rounded-md border border-card-border bg-white/60 px-2 py-0.5 text-xs font-medium text-navy-panel">
            {topic}
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-purple group-hover:text-purple-hover">
        Abrir módulo
        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
