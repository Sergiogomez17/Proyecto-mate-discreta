import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeftRight, CirclePlus, Pencil, Scale, Spline, Trash2 } from 'lucide-react';
import { computeDegrees } from '@/algorithms/graph/degrees';
import {
  describeEdge,
  findEdge,
  findVertex,
  MAX_VERTEX_LABEL_LENGTH,
  parseWeight,
  suggestPosition,
  suggestVertexLabel,
  vertexLabel,
} from '@/algorithms/graph/editing';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import { formatWeight } from '@/components/graph/geometry';
import { Button } from '@/components/ui/Button';
import { Feedback } from '@/components/ui/Feedback';
import { inputClass, labelClass } from '@/components/ui/formClasses';
import { useActiveGraphStore } from '@/stores/graphStoreContext';
import type { Edge, Graph, Vertex, VertexId } from '@/types/graph';

interface SelectionPanelProps {
  onRequestDeleteVertex: (id: VertexId) => void;
  onStartEdgeFrom: (id: VertexId) => void;
  /** Aviso general del editor (por ejemplo, tras eliminar el elemento mostrado aquí). */
  onNotice: (message: string) => void;
}

/** Panel de propiedades: edición del elemento seleccionado y formularios para agregar elementos. */
export function SelectionPanel({ onRequestDeleteVertex, onStartEdgeFrom, onNotice }: SelectionPanelProps) {
  const useStore = useActiveGraphStore();
  const graph = useStore((s) => s.graph);
  const selection = useStore((s) => s.selection);
  const vertex = selection?.kind === 'vertex' ? findVertex(graph, selection.id) : undefined;
  const edge = selection?.kind === 'edge' ? findEdge(graph, selection.id) : undefined;
  const headingId = useId();

  return (
    <div className="space-y-6">
      <section aria-labelledby={headingId} className="space-y-3">
        <h3 id={headingId} className="text-sm font-bold tracking-wide text-navy-panel uppercase">
          {vertex ? `Vértice ${vertex.label}` : edge ? `Arista ${describeEdge(graph, edge)}` : 'Elemento seleccionado'}
        </h3>
        {vertex ? (
          <VertexDetails key={vertex.id} graph={graph} vertex={vertex} onRequestDelete={onRequestDeleteVertex} onStartEdgeFrom={onStartEdgeFrom} />
        ) : edge ? (
          <EdgeDetails key={edge.id} graph={graph} edge={edge} onNotice={onNotice} />
        ) : (
          <p className="text-sm text-ink-secondary">
            Haga clic en un vértice o en una arista del lienzo (o recórralos con Tab y pulse Enter) para ver y editar sus propiedades.
          </p>
        )}
      </section>
      <hr className="border-card-border" />
      <AddVertexForm graph={graph} />
      <hr className="border-card-border" />
      <AddEdgeForm graph={graph} />
    </div>
  );
}

function useFeedback() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const report = (err: string | null, message: string) => {
    setError(err);
    setSuccess(err ? null : message);
    return err === null;
  };
  return { error, success, report };
}

function VertexDetails({
  graph,
  vertex,
  onRequestDelete,
  onStartEdgeFrom,
}: {
  graph: Graph;
  vertex: Vertex;
  onRequestDelete: (id: VertexId) => void;
  onStartEdgeFrom: (id: VertexId) => void;
}) {
  const useStore = useActiveGraphStore();
  const renameVertex = useStore((s) => s.renameVertex);
  const [label, setLabel] = useState(vertex.label);
  const { error, success, report } = useFeedback();
  const inputId = useId();
  const degree = useMemo(() => computeDegrees(graph).get(vertex.id), [graph, vertex.id]);

  const names = (ids: VertexId[]) => {
    const unique = sortVerticesByLabel([...new Set(ids)].map((id) => findVertex(graph, id)).filter((v): v is Vertex => v !== undefined));
    return unique.length > 0 ? unique.map((v) => v.label).join(', ') : '—';
  };
  const successors = graph.edges.filter((e) => e.source === vertex.id).map((e) => e.target);
  const predecessors = graph.edges.filter((e) => e.target === vertex.id).map((e) => e.source);

  const onRename = (event: FormEvent) => {
    event.preventDefault();
    if (label.trim() === vertex.label) return report(null, 'El nombre no cambió.');
    report(renameVertex(vertex.id, label), `Vértice renombrado a «${label.trim()}».`);
  };

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {graph.directed ? (
          <>
            <dt className="text-ink-secondary">Grado de entrada</dt>
            <dd className="font-semibold text-ink">{degree?.inDegree ?? 0}</dd>
            <dt className="text-ink-secondary">Grado de salida</dt>
            <dd className="font-semibold text-ink">{degree?.outDegree ?? 0}</dd>
            <dt className="text-ink-secondary">Grado total</dt>
            <dd className="font-semibold text-ink">{degree?.degree ?? 0}</dd>
            <dt className="text-ink-secondary">Sucesores</dt>
            <dd className="text-ink">{names(successors)}</dd>
            <dt className="text-ink-secondary">Predecesores</dt>
            <dd className="text-ink">{names(predecessors)}</dd>
          </>
        ) : (
          <>
            <dt className="text-ink-secondary">Grado</dt>
            <dd className="font-semibold text-ink">{degree?.degree ?? 0}</dd>
            <dt className="text-ink-secondary">Vecinos</dt>
            <dd className="text-ink">{names([...successors, ...predecessors])}</dd>
          </>
        )}
      </dl>

      <form onSubmit={onRename} className="space-y-2">
        <label htmlFor={inputId} className={labelClass}>
          Nombre del vértice
        </label>
        <div className="flex gap-2">
          <input id={inputId} className={inputClass} value={label} maxLength={MAX_VERTEX_LABEL_LENGTH} onChange={(e) => setLabel(e.target.value)} />
          <Button type="submit" className="shrink-0" variant="secondary" icon={<Pencil aria-hidden className="size-4" />}>
            Renombrar
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onStartEdgeFrom(vertex.id)} icon={<Spline aria-hidden className="size-4" />}>
          Crear arista desde {vertex.label}
        </Button>
        <Button variant="danger" onClick={() => onRequestDelete(vertex.id)} icon={<Trash2 aria-hidden className="size-4" />}>
          Eliminar vértice
        </Button>
      </div>
      <Feedback error={error} success={success} />
    </div>
  );
}

function EdgeDetails({ graph, edge, onNotice }: { graph: Graph; edge: Edge; onNotice: (message: string) => void }) {
  const useStore = useActiveGraphStore();
  const setEdgeWeight = useStore((s) => s.setEdgeWeight);
  const reverseEdge = useStore((s) => s.reverseEdge);
  const removeEdge = useStore((s) => s.removeEdge);
  const [weight, setWeight] = useState(formatWeight(edge.weight));
  const { error, success, report } = useFeedback();
  const inputId = useId();
  const hintId = useId();
  const parallel = graph.edges.filter(
    (e) => e.id !== edge.id && ((e.source === edge.source && e.target === edge.target) || (!graph.directed && e.source === edge.target && e.target === edge.source)),
  ).length;

  const onWeight = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseWeight(weight);
    if (!parsed.ok) return report(parsed.error, '');
    report(setEdgeWeight(edge.id, parsed.value), `Peso actualizado a ${formatWeight(parsed.value)}.`);
  };

  const onRemove = () => {
    const description = describeEdge(graph, edge);
    const err = removeEdge(edge.id);
    if (err) report(err, '');
    else onNotice(`Se eliminó la arista ${description}. Puede recuperarla con «Deshacer».`);
  };

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-ink-secondary">{graph.directed ? 'Origen' : 'Extremo'}</dt>
        <dd className="font-semibold text-ink">{vertexLabel(graph, edge.source)}</dd>
        <dt className="text-ink-secondary">{graph.directed ? 'Destino' : 'Extremo'}</dt>
        <dd className="font-semibold text-ink">{vertexLabel(graph, edge.target)}</dd>
        <dt className="text-ink-secondary">Peso usado</dt>
        <dd className="text-ink">{graph.weighted ? formatWeight(edge.weight) : '1 (grafo no ponderado)'}</dd>
        <dt className="text-ink-secondary">{graph.directed ? 'Arcos paralelos' : 'Aristas paralelas'}</dt>
        <dd className="text-ink">{parallel === 0 ? 'Ninguna' : parallel}</dd>
      </dl>

      <form onSubmit={onWeight} className="space-y-2">
        <label htmlFor={inputId} className={labelClass}>
          Peso de la arista
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            className={inputClass}
            inputMode="decimal"
            value={weight}
            disabled={!graph.weighted}
            aria-describedby={graph.weighted ? undefined : hintId}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Button type="submit" className="shrink-0" variant="secondary" disabled={!graph.weighted} icon={<Scale aria-hidden className="size-4" />}>
            Cambiar peso
          </Button>
        </div>
        {!graph.weighted && (
          <p id={hintId} className="text-xs text-ink-secondary">
            Active «Ponderado» en la barra de herramientas para asignar pesos.
          </p>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {graph.directed && (
          <Button variant="secondary" onClick={() => report(reverseEdge(edge.id), 'Se invirtió el sentido del arco.')} icon={<ArrowLeftRight aria-hidden className="size-4" />}>
            Invertir sentido
          </Button>
        )}
        <Button variant="danger" onClick={onRemove} icon={<Trash2 aria-hidden className="size-4" />}>
          Eliminar arista
        </Button>
      </div>
      <Feedback error={error} success={success} />
    </div>
  );
}

function AddVertexForm({ graph }: { graph: Graph }) {
  const useStore = useActiveGraphStore();
  const addVertex = useStore((s) => s.addVertex);
  // null: se muestra el primer nombre libre, que se actualiza al cambiar el grafo.
  const [typed, setTyped] = useState<string | null>(null);
  const label = typed ?? suggestVertexLabel(graph);
  const { error, success, report } = useFeedback();
  const inputId = useId();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = label.trim();
    const ok = report(addVertex(label, suggestPosition(graph)), `Se agregó el vértice «${name}».`);
    if (ok) setTyped(null);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2" aria-label="Agregar vértice">
      <label htmlFor={inputId} className={labelClass}>
        Nombre del nuevo vértice
      </label>
      <div className="flex gap-2">
        <input id={inputId} className={inputClass} value={label} maxLength={MAX_VERTEX_LABEL_LENGTH} onChange={(e) => setTyped(e.target.value)} />
        <Button type="submit" className="shrink-0" icon={<CirclePlus aria-hidden className="size-4" />}>
          Agregar vértice
        </Button>
      </div>
      <p className="text-xs text-ink-secondary">Sin espacios y con hasta {MAX_VERTEX_LABEL_LENGTH} caracteres. También puede usar el modo «Agregar vértices» y hacer clic en el lienzo.</p>
      <Feedback error={error} success={success} />
    </form>
  );
}

function AddEdgeForm({ graph }: { graph: Graph }) {
  const useStore = useActiveGraphStore();
  const addEdge = useStore((s) => s.addEdge);
  const ordered = useMemo(() => sortVerticesByLabel(graph.vertices), [graph.vertices]);
  const [source, setSource] = useState<VertexId>(() => ordered[0]?.id ?? '');
  const [target, setTarget] = useState<VertexId>(() => ordered[1]?.id ?? '');
  const [weight, setWeight] = useState('1');
  const { error, success, report } = useFeedback();
  const sourceId = useId();
  const targetId = useId();
  const weightId = useId();

  // Si el vértice elegido se eliminó, el campo vuelve a quedar sin elegir.
  const sourceValue = findVertex(graph, source) ? source : '';
  const targetValue = findVertex(graph, target) ? target : '';

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!sourceValue || !targetValue) return report(`Elija ${graph.directed ? 'el origen y el destino' : 'los dos extremos'} de la arista.`, '');
    let value = 1;
    if (graph.weighted) {
      const parsed = parseWeight(weight);
      if (!parsed.ok) return report(parsed.error, '');
      value = parsed.value;
    }
    const description = `${vertexLabel(graph, sourceValue)} ${graph.directed ? '→' : '—'} ${vertexLabel(graph, targetValue)}`;
    report(addEdge(sourceValue, targetValue, value), `Se agregó la arista ${description}${graph.weighted ? ` con peso ${formatWeight(value)}` : ''}.`);
  };

  if (graph.vertices.length < 2) {
    return (
      <div className="space-y-1">
        <p className={labelClass}>Nueva arista</p>
        <p className="text-sm text-ink-secondary">Se necesitan al menos dos vértices para crear una arista.</p>
      </div>
    );
  }

  const options = ordered.map((v) => (
    <option key={v.id} value={v.id}>
      {v.label}
    </option>
  ));

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-label="Agregar arista">
      <p className={labelClass}>Nueva arista</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor={sourceId} className="text-xs font-semibold text-ink-secondary">
            {graph.directed ? 'Origen' : 'Extremo 1'}
          </label>
          <select id={sourceId} className={inputClass} value={sourceValue} onChange={(e) => setSource(e.target.value)}>
            <option value="">Elija…</option>
            {options}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor={targetId} className="text-xs font-semibold text-ink-secondary">
            {graph.directed ? 'Destino' : 'Extremo 2'}
          </label>
          <select id={targetId} className={inputClass} value={targetValue} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Elija…</option>
            {options}
          </select>
        </div>
      </div>
      {graph.weighted && (
        <div className="space-y-1">
          <label htmlFor={weightId} className="text-xs font-semibold text-ink-secondary">
            Peso
          </label>
          <input id={weightId} className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
      )}
      <Button type="submit" icon={<Spline aria-hidden className="size-4" />}>
        Agregar arista
      </Button>
      <Feedback error={error} success={success} />
    </form>
  );
}
