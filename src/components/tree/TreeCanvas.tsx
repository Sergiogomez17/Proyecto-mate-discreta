import { useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { computeLayout } from '@/algorithms/tree/layout';
import type { BinaryTree, TreeNodeId } from '@/types/tree';
import { ScrollArea } from '@/components/ui/ScrollArea';

const GAP_X = 64;
const GAP_Y = 86;
const R = 22;
const PAD = 30;

export interface TreeHighlight {
  currentId: TreeNodeId | null;
  /** Número de orden de cada nodo ya registrado por el recorrido. */
  visitedOrder: Map<TreeNodeId, number>;
  /** Nodos en la pila de llamadas (camino desde la raíz al nodo actual). */
  activePath: Set<TreeNodeId>;
}

interface TreeCanvasProps {
  tree: BinaryTree;
  selectedId: TreeNodeId | null;
  onSelect: (id: TreeNodeId) => void;
  highlight?: TreeHighlight;
}

const COLORS = {
  edge: '#8CA0C8',
  edgeActive: '#00B8D4',
  node: '#FFFFFF',
  nodeStroke: '#071A42',
  visited: '#6D28D9',
  current: '#00E5FF',
  selected: '#7C3AED',
  text: '#061438',
};

/**
 * Dibujo del árbol en SVG. La posición se deriva de la estructura (columna inorden, fila = nivel),
 * por lo que el dibujo siempre refleja fielmente qué hijo es izquierdo y cuál derecho.
 */
export function TreeCanvas({ tree, selectedId, onSelect, highlight }: TreeCanvasProps) {
  const layout = useMemo(() => computeLayout(tree), [tree]);
  const px = (col: number) => PAD + R + col * GAP_X;
  const py = (row: number) => PAD + R + row * GAP_Y;
  const width = PAD * 2 + R * 2 + Math.max(0, layout.columns - 1) * GAP_X;
  const height = PAD * 2 + R * 2 + Math.max(0, layout.rows - 1) * GAP_Y;

  const nodes = Object.values(tree.nodes).filter((n) => layout.positions.has(n.id));
  const current = highlight?.currentId ? layout.positions.get(highlight.currentId) : undefined;

  const onKey = (event: KeyboardEvent<SVGGElement>, id: TreeNodeId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <ScrollArea label="Dibujo del árbol">
      {/* Se reduce hasta caber en pantallas angostas, pero no por debajo del 50 % para que las
          etiquetas sigan legibles; los árboles más anchos se desplazan horizontalmente. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: width, minWidth: Math.round(width * 0.5) }}
        className="mx-auto block h-auto"
        role="group"
        aria-label={`Árbol binario con ${nodes.length} nodos. Seleccione un nodo para editarlo.`}
      >
        {/* Aristas padre → hijo */}
        {nodes.flatMap((node) => {
          const from = layout.positions.get(node.id);
          if (!from) return [];
          return (['left', 'right'] as const).flatMap((side) => {
            const childId = node[side];
            const to = childId ? layout.positions.get(childId) : undefined;
            if (!childId || !to) return [];
            const active = Boolean(highlight?.activePath.has(node.id) && highlight.activePath.has(childId));
            return [
              <line
                key={`${node.id}-${side}`}
                x1={px(from.x)}
                y1={py(from.y)}
                x2={px(to.x)}
                y2={py(to.y)}
                stroke={active ? COLORS.edgeActive : COLORS.edge}
                strokeWidth={active ? 4 : 2}
                strokeLinecap="round"
              />,
            ];
          });
        })}

        {/* Indicador animado del nodo actual del recorrido */}
        {current && (
          <motion.circle
            r={R + 8}
            fill="none"
            stroke={COLORS.current}
            strokeWidth={4}
            initial={false}
            animate={{ cx: px(current.x), cy: py(current.y) }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            data-testid="current-indicator"
          />
        )}

        {nodes.map((node) => {
          const pos = layout.positions.get(node.id);
          if (!pos) return null;
          const cx = px(pos.x);
          const cy = py(pos.y);
          const order = highlight?.visitedOrder.get(node.id);
          const visited = order !== undefined;
          const selected = node.id === selectedId;
          const isCurrent = node.id === highlight?.currentId;
          const description = [
            `Nodo ${node.label}`,
            selected ? 'seleccionado' : null,
            isCurrent ? 'nodo actual del recorrido' : null,
            visited ? `visitado en el orden ${order}` : null,
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-label={description}
              aria-pressed={selected}
              className="group cursor-pointer outline-none"
              onClick={() => onSelect(node.id)}
              onKeyDown={(e) => onKey(e, node.id)}
            >
              <circle cx={cx} cy={cy} r={R + 5} fill="none" stroke={COLORS.selected} strokeWidth={3} className="opacity-0 group-focus-visible:opacity-100" />
              {selected && <circle cx={cx} cy={cy} r={R + 4} fill="none" stroke={COLORS.selected} strokeWidth={2.5} strokeDasharray="5 4" />}
              <circle cx={cx} cy={cy} r={R} fill={visited ? COLORS.visited : COLORS.node} stroke={COLORS.nodeStroke} strokeWidth={2} />
              <text x={cx} y={cy + 5} textAnchor="middle" fontSize={node.label.length > 3 ? 11 : 15} fontWeight={700} fill={visited ? '#FFFFFF' : COLORS.text}>
                {node.label}
              </text>
              {visited && (
                <g aria-hidden>
                  <circle cx={cx + R - 2} cy={cy - R + 2} r={10} fill={COLORS.current} stroke={COLORS.nodeStroke} strokeWidth={1.5} />
                  <text x={cx + R - 2} y={cy - R + 6} textAnchor="middle" fontSize={11} fontWeight={800} fill={COLORS.text}>
                    {order}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </ScrollArea>
  );
}
