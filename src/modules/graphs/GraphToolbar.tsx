import { useId, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CirclePlus, Eraser, FolderOpen, MousePointer2, Redo2, Spline, Undo2 } from 'lucide-react';
import type { GraphExample } from '@/algorithms/graph/examples';
import { GRAPH_EXAMPLES } from '@/algorithms/graph/examples';
import type { CanvasMode } from '@/components/graph/flowTypes';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/utils/cn';

const MODES: Array<{ id: CanvasMode; label: string; icon: LucideIcon }> = [
  { id: 'select', label: 'Seleccionar y mover', icon: MousePointer2 },
  { id: 'add-vertex', label: 'Agregar vértices', icon: CirclePlus },
  { id: 'add-edge', label: 'Agregar aristas', icon: Spline },
];

interface GraphToolbarProps {
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  directed: boolean;
  weighted: boolean;
  onDirectedChange: (directed: boolean) => void;
  onWeightedChange: (weighted: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onLoadExample: (exampleId: string) => void;
  onClear: () => void;
  isEmpty: boolean;
  /** Ejemplos ofrecidos (por defecto, todos). */
  examples?: readonly GraphExample[];
  /** Bloquea la edición (por ejemplo, durante una simulación). */
  disabled?: boolean;
}

export function GraphToolbar(props: GraphToolbarProps) {
  const examples = props.examples ?? GRAPH_EXAMPLES;
  const locked = props.disabled ?? false;
  const [exampleId, setExampleId] = useState(examples[0]?.id ?? '');
  const exampleSelectId = useId();
  const example = examples.find((e) => e.id === exampleId);

  return (
    <div className="space-y-3 border-b border-card-border bg-white/40 px-4 py-3">
      <div role="toolbar" aria-label="Modo de edición" className="grid grid-cols-1 gap-1 rounded-lg border border-card-border bg-white/70 p-1 sm:grid-cols-3">
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = props.mode === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active && !locked}
              disabled={locked}
              onClick={() => props.onModeChange(id)}
              className={cn(
                'inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap transition-colors',
                active && !locked ? 'bg-purple text-white shadow-sm' : 'text-ink hover:bg-purple/10',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="Tipo de grafo">
          <Switch label="Dirigido" checked={props.directed} disabled={locked} onChange={props.onDirectedChange} description="Las aristas tienen sentido: de su origen a su destino." />
          <Switch label="Ponderado" checked={props.weighted} disabled={locked} onChange={props.onWeightedChange} description="Cada arista tiene un peso numérico." />
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={props.onUndo} disabled={locked || !props.canUndo} icon={<Undo2 aria-hidden className="size-4" />}>
            Deshacer
          </Button>
          <Button variant="ghost" size="sm" onClick={props.onRedo} disabled={locked || !props.canRedo} icon={<Redo2 aria-hidden className="size-4" />}>
            Rehacer
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor={exampleSelectId} className="text-xs font-semibold text-ink-secondary">
            Grafo de ejemplo
          </label>
          <select
            id={exampleSelectId}
            value={exampleId}
            disabled={locked}
            onChange={(e) => setExampleId(e.target.value)}
            className="h-10 min-w-0 rounded-lg border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none"
          >
            {examples.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <Button variant="secondary" onClick={() => props.onLoadExample(exampleId)} disabled={locked} icon={<FolderOpen aria-hidden className="size-4" />}>
          Cargar ejemplo
        </Button>
        <Button variant="ghost" onClick={props.onClear} disabled={locked || props.isEmpty} icon={<Eraser aria-hidden className="size-4" />}>
          Reiniciar grafo
        </Button>
      </div>
      {example && <p className="text-xs text-ink-secondary">{example.description}</p>}
    </div>
  );
}
