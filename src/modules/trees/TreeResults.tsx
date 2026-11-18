import { useMemo } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { computeProperties } from '@/algorithms/tree/properties';
import { validateTree } from '@/algorithms/tree/validate';
import type { BinaryTree, TreeNodeId } from '@/types/tree';
import { ScrollArea } from '@/components/ui/ScrollArea';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="surface-card rounded-lg p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-ink">{value}</dd>
      {hint && <dd className="text-xs text-ink-secondary">{hint}</dd>}
    </div>
  );
}

export function TreeResults({ tree }: { tree: BinaryTree }) {
  const issues = useMemo(() => validateTree(tree), [tree]);
  const props = useMemo(() => (issues.length === 0 ? computeProperties(tree) : null), [tree, issues]);
  const label = (id: TreeNodeId | null) => (id ? (tree.nodes[id]?.label ?? id) : '—');

  if (!props) {
    return (
      <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-red-900">
        <p className="flex items-center gap-2 font-semibold">
          <TriangleAlert aria-hidden className="size-4" /> La estructura no es un árbol binario válido
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {issues.map((issue, i) => (
            <li key={`${issue.code}-${i}`}>{issue.message}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (props.nodeCount === 0) {
    return <p className="text-sm text-ink-secondary">Árbol vacío: 0 nodos, altura −1 por convención.</p>;
  }

  const rows = props.levels.flat();
  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
        <CircleCheck aria-hidden className="size-4" /> Estructura válida: árbol binario con raíz única, sin ciclos y sin nodos desconectados.
      </p>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Nodos" value={props.nodeCount} />
        <Stat label="Raíz" value={label(props.rootId)} />
        <Stat label="Altura" value={props.height} hint="aristas de la raíz a la hoja más lejana" />
        <Stat label="Hojas" value={props.leaves.length} hint={props.leaves.map(label).join(', ')} />
        <Stat label="Nodos internos" value={props.internalNodes.length} hint={props.internalNodes.map(label).join(', ') || 'ninguno'} />
        <Stat label="Grado del árbol" value={props.maxChildCount} hint="máximo de hijos de un nodo" />
      </dl>

      <div>
        <h3 className="text-sm font-semibold text-ink">Niveles</h3>
        <ul className="mt-2 space-y-1.5 text-sm">
          {props.levels.map((level, depth) => (
            <li key={depth} className="flex gap-3">
              <span className="w-16 shrink-0 font-semibold text-ink-secondary">Nivel {depth}</span>
              <span className="font-mono text-ink">{level.map(label).join(', ')}</span>
            </li>
          ))}
        </ul>
      </div>

      <ScrollArea label="Tabla de nodos" className="rounded-lg border border-card-border">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">Propiedades de cada nodo</caption>
          <thead className="bg-navy-panel text-xs uppercase tracking-wide text-white">
            <tr>
              <th scope="col" className="px-3 py-2">Nodo</th>
              <th scope="col" className="px-3 py-2">Profundidad</th>
              <th scope="col" className="px-3 py-2">Padre</th>
              <th scope="col" className="px-3 py-2">Grado (hijos)</th>
              <th scope="col" className="px-3 py-2">Grado como grafo</th>
              <th scope="col" className="px-3 py-2">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border bg-white/60">
            {rows.map((id) => {
              const n = props.info.get(id);
              if (!n) return null;
              return (
                <tr key={id}>
                  <th scope="row" className="px-3 py-2 font-semibold text-ink">{n.label}</th>
                  <td className="px-3 py-2">{n.depth}</td>
                  <td className="px-3 py-2">{label(n.parentId)}</td>
                  <td className="px-3 py-2">{n.childCount}</td>
                  <td className="px-3 py-2">{n.graphDegree}</td>
                  <td className="px-3 py-2">{n.isRoot ? (n.isLeaf ? 'Raíz y hoja' : 'Raíz') : n.isLeaf ? 'Hoja' : 'Interno'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
      <p className="text-xs text-ink-secondary">
        El <strong>grado</strong> de un nodo en un árbol es su número de hijos. El <strong>grado como grafo</strong> cuenta también la arista hacia su padre.
      </p>
    </div>
  );
}
