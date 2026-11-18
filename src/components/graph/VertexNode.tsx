import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { cn } from '@/utils/cn';
import type { VertexFlowNode, VertexTone } from './flowTypes';
import { VERTEX_RADIUS } from './geometry';

// Las aristas se dibujan de centro a centro; los puntos de conexión existen solo porque
// React Flow los necesita para ubicar cada arista, y permanecen invisibles.
const hiddenHandle = { opacity: 0, pointerEvents: 'none' as const, left: '50%', top: '50%' };

const TONES: Record<VertexTone, string> = {
  current: 'border-[3px] border-cyan bg-cyan/25 ring-4 ring-cyan/60',
  visited: 'border-purple-hover bg-purple text-white',
  path: 'border-purple-hover bg-purple-strong text-white ring-4 ring-purple-strong/35',
  start: 'border-navy-panel bg-navy-panel text-white ring-4 ring-cyan/40',
  target: 'border-[3px] border-success bg-success/15 ring-4 ring-success/35',
  frontier: 'border-dashed border-cyan bg-white',
  muted: 'border-navy-panel opacity-40',
  error: 'border-[3px] border-danger bg-danger/10 ring-4 ring-danger/25',
};

function VertexNodeView({ data, selected }: NodeProps<VertexFlowNode>) {
  const size = VERTEX_RADIUS * 2;
  const look = data.pendingSource
    ? 'border-cyan bg-cyan/20 ring-4 ring-cyan/60'
    : data.tone
      ? cn(TONES[data.tone], selected && 'outline-2 outline-offset-4 outline-purple-strong outline-dashed')
      : selected
        ? 'border-purple-strong ring-4 ring-purple-strong/35'
        : 'border-navy-panel';
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'relative flex items-center justify-center rounded-full border-2 bg-white font-bold text-ink shadow-sm transition-colors',
        [...data.label].length > 3 ? 'text-[11px]' : 'text-[15px]',
        look,
        data.connectable && !data.pendingSource && 'hover:border-cyan hover:ring-4 hover:ring-cyan/40',
      )}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} style={hiddenHandle} />
      <span className="pointer-events-none select-none">{data.label}</span>
      {data.badge !== null && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded bg-navy-panel px-1.5 text-[11px] leading-4 font-bold whitespace-nowrap text-white shadow"
        >
          {data.badge}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={hiddenHandle} />
    </div>
  );
}

export const VertexNode = memo(VertexNodeView);
