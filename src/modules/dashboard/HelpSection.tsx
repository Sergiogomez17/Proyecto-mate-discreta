import { ChevronDown, CircleHelp } from 'lucide-react';
import { Link } from 'react-router';
import { Panel } from '@/components/ui/Panel';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { cn } from '@/utils/cn';

const STEPS = [
  {
    title: 'Elija un módulo',
    text: 'Cada tarjeta abre un simulador: árboles binarios, grafos, Euler y Hamilton, isomorfismo, Dijkstra o BFS y DFS. El laboratorio de práctica reúne los ejercicios.',
  },
  {
    title: 'Construya el ejemplo',
    text: 'Agregue vértices o nodos, conéctelos y asigne pesos en el área gráfica, o cargue uno de los ejemplos preparados.',
  },
  {
    title: 'Ejecute paso a paso',
    text: 'Inicie el algoritmo y avance o retroceda un paso a la vez. El panel de procedimiento explica cada operación.',
  },
  {
    title: 'Compruebe y practique',
    text: 'Contraste las tablas y conclusiones con el cálculo manual, y resuelva ejercicios con calificación automática.',
  },
];

interface HelpSectionProps {
  /** En la página de ayuda la guía se muestra siempre abierta. */
  collapsible?: boolean;
}

export function HelpSection({ collapsible = true }: HelpSectionProps) {
  const storedExpanded = usePreferencesStore((s) => s.helpExpanded);
  const setHelpExpanded = usePreferencesStore((s) => s.setHelpExpanded);
  const expanded = !collapsible || storedExpanded;

  return (
    <Panel
      id="ayuda"
      title="Cómo usar la plataforma"
      description="Guía rápida para docentes y estudiantes"
      icon={CircleHelp}
      actions={
        collapsible && (
          <button
            type="button"
            onClick={() => setHelpExpanded(!storedExpanded)}
            aria-expanded={expanded}
            aria-controls="ayuda-contenido"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
          >
            {expanded ? 'Ocultar' : 'Mostrar'}
            <ChevronDown aria-hidden className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
          </button>
        )
      }
    >
      <div id="ayuda-contenido" hidden={!expanded}>
        {/* En el panel principal la guía ocupa una columna: 2×2. En la página de ayuda, a todo el ancho: 4 columnas. */}
        <ol className={cn('grid gap-4 sm:grid-cols-2', !collapsible && 'xl:grid-cols-4')}>
          {STEPS.map((step, index) => (
            <li key={step.title} className="surface-card rounded-xl p-4">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-purple text-sm font-bold text-white">{index + 1}</span>
              <h3 className="mt-3 font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-ink-secondary">
          No se necesita cuenta ni instalación. Los proyectos y preferencias se guardan solo en este navegador.{' '}
          <Link to="/ayuda" className="font-semibold text-purple underline-offset-2 hover:underline">
            Ver la guía completa y la política de grafos
          </Link>
          .
        </p>
      </div>
      {!expanded && <p className="text-sm text-ink-secondary">La guía está oculta. Pulse «Mostrar» para verla de nuevo.</p>}
    </Panel>
  );
}
