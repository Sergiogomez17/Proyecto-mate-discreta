import { useId } from 'react';
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import type { GraphExample } from '@/algorithms/graph/examples';
import type { CanvasHighlight } from '@/components/graph/flowTypes';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GraphToolbar } from '@/modules/graphs/GraphToolbar';
import type { EdgeId, VertexId } from '@/types/graph';
import { cn } from '@/utils/cn';
import type { GraphWorkspaceState } from './useGraphWorkspace';

export interface WorkspaceSimulation {
  /** Mientras está activa, la edición se bloquea y los clics van al simulador. */
  active: boolean;
  /** Indicación de qué hacer en el lienzo durante la simulación. */
  hint: string;
  onVertexClick?: (id: VertexId) => void;
  onEdgeClick?: (id: EdgeId) => void;
}

interface GraphWorkspaceProps {
  ws: GraphWorkspaceState;
  examples?: readonly GraphExample[];
  highlight?: CanvasHighlight | undefined;
  simulation?: WorkspaceSimulation | undefined;
  /** Nombre accesible del lienzo (útil si hay varios en la página). */
  canvasLabel?: string;
  heightClass?: string;
  /** Leyenda de colores del simulador, bajo el lienzo. */
  legend?: ReactNode;
}

const noop = () => undefined;

/** Barra de herramientas, lienzo y avisos de un grafo editable, reutilizable en todos los simuladores. */
export function GraphWorkspace({ ws, examples, highlight, simulation, canvasLabel = 'Lienzo del grafo', heightClass = 'h-[420px] sm:h-[480px]', legend }: GraphWorkspaceProps) {
  const weightId = useId();
  const locked = simulation?.active ?? false;
  const h = ws.handlers;

  return (
    <>
      <GraphToolbar
        mode={ws.mode}
        onModeChange={ws.changeMode}
        directed={ws.graph.directed}
        weighted={ws.graph.weighted}
        onDirectedChange={ws.onDirectedChange}
        onWeightedChange={ws.onWeightedChange}
        canUndo={ws.canUndo}
        canRedo={ws.canRedo}
        onUndo={ws.undo}
        onRedo={ws.redo}
        onLoadExample={ws.requestExample}
        onClear={ws.requestClear}
        isEmpty={ws.graph.vertices.length === 0}
        disabled={locked}
        {...(examples ? { examples } : {})}
      />
      {/* Altura reservada: si el texto cambia entre dos clics, el lienzo no se desplaza bajo el puntero. */}
      <div className={cn('flex flex-col gap-2 border-b border-card-border px-4 py-2 text-sm text-ink sm:flex-row sm:items-center sm:gap-4', locked ? 'bg-cyan/10' : 'bg-navy-panel/5')}>
        <p className="min-h-[3.75rem] min-w-0 flex-1 sm:min-h-10">
          {locked && simulation ? (
            <>
              <Lock aria-hidden className="mr-1 inline size-3.5 align-[-2px] text-navy-panel" />
              {simulation.hint}
            </>
          ) : (
            ws.hint
          )}
        </p>
        {!locked && ws.mode === 'add-edge' && ws.graph.weighted && (
          <div className="flex items-center gap-2">
            <label htmlFor={weightId} className="text-xs font-semibold text-ink-secondary">
              Peso de las nuevas aristas
            </label>
            <input
              id={weightId}
              inputMode="decimal"
              value={ws.edgeWeight}
              onChange={(e) => ws.setEdgeWeight(e.target.value)}
              className="h-8 w-20 rounded-md border border-card-border bg-white px-2 text-sm text-ink focus:border-purple focus:outline-none"
            />
          </div>
        )}
      </div>
      <div className={cn('relative bg-page', heightClass)} aria-label={canvasLabel} role="region">
        <GraphCanvas
          key={ws.canvasKey}
          graph={ws.graph}
          selection={ws.selection}
          mode={locked ? 'select' : ws.mode}
          pendingSourceId={locked ? null : ws.pendingSource}
          onPaneClick={locked ? noop : h.handlePaneClick}
          onVertexClick={locked ? (simulation?.onVertexClick ?? noop) : h.handleVertexClick}
          onEdgeSelect={locked ? (simulation?.onEdgeClick ?? noop) : h.handleEdgeSelect}
          onVertexMoved={h.handleVertexMoved}
          onDeleteSelection={locked ? noop : h.handleDeleteSelection}
          onCancel={locked ? noop : h.handleCancel}
          highlight={highlight}
          locked={locked}
        />
        {ws.graph.vertices.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 top-1/3 px-6 text-center text-sm text-ink-secondary">
            El grafo está vacío. Active «Agregar vértices» y haga clic en el lienzo, o cargue un ejemplo.
          </p>
        )}
      </div>
      {legend && <div className="border-t border-card-border px-4 py-2">{legend}</div>}
      <div className="min-h-10 border-t border-card-border px-4 py-2 text-sm" aria-live="polite">
        {ws.notice && <p className={cn('font-medium', ws.notice.tone === 'error' ? 'text-danger' : 'text-ink')}>{ws.notice.text}</p>}
      </div>
      <ConfirmDialog
        open={ws.dialog !== null}
        title={ws.dialog?.title ?? ''}
        description={ws.dialog?.description ?? ''}
        confirmLabel={ws.dialog?.confirmLabel ?? 'Confirmar'}
        onCancel={ws.cancelPending}
        onConfirm={ws.confirmPending}
      />
    </>
  );
}

export interface LegendItem {
  label: string;
  /** Clases de la muestra de color. */
  swatch: string;
}

/** Leyenda de colores del lienzo. */
export function CanvasLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-secondary" aria-label="Leyenda">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('inline-block shrink-0', item.swatch)} /> {item.label}
        </li>
      ))}
    </ul>
  );
}
