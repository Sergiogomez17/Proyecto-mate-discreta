import { useCallback, useState } from 'react';
import { countOppositeArcPairs, describeEdge, findEdge, incidentEdges, parseWeight, suggestVertexLabel, vertexLabel } from '@/algorithms/graph/editing';
import { findExample } from '@/algorithms/graph/examples';
import type { CanvasMode } from '@/components/graph/flowTypes';
import { formatWeight } from '@/components/graph/geometry';
import type { GraphStore } from '@/stores/graphStore';
import type { EdgeId, Graph, Point, VertexId } from '@/types/graph';

export type Notice = { tone: 'info' | 'error'; text: string } | null;
type PendingAction = { type: 'delete-vertex'; id: VertexId } | { type: 'clear' } | { type: 'example'; exampleId: string } | null;

export interface WorkspaceDialog {
  title: string;
  description: string;
  confirmLabel: string;
}

/**
 * Estado y acciones del editor de grafos sobre un almacén concreto: modo del lienzo, arista en
 * construcción, avisos y confirmaciones. Lo usan el editor de grafos y todos los simuladores.
 */
export function useGraphWorkspace(useStore: GraphStore) {
  const graph = useStore((s) => s.graph);
  const selection = useStore((s) => s.selection);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);

  const [mode, setMode] = useState<CanvasMode>('select');
  const [pendingSource, setPendingSource] = useState<VertexId | null>(null);
  const [edgeWeight, setEdgeWeight] = useState('1');
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  // Cambiar la clave vuelve a montar el lienzo, que se reencuadra sobre el grafo nuevo.
  const [canvasKey, setCanvasKey] = useState(0);

  const info = useCallback((text: string) => setNotice({ tone: 'info', text }), []);
  const fail = useCallback((text: string) => setNotice({ tone: 'error', text }), []);

  const graphReplaced = useCallback(() => {
    setPendingSource(null);
    setMode('select');
    setCanvasKey((k) => k + 1);
  }, []);

  const changeMode = (next: CanvasMode) => {
    setMode(next);
    setPendingSource(null);
    setNotice(null);
  };

  const handlePaneClick = useCallback(
    (position: Point) => {
      const { graph: current, addVertex, select } = useStore.getState();
      if (mode === 'add-vertex') {
        const label = suggestVertexLabel(current);
        const error = addVertex(label, position);
        if (error) fail(error);
        else info(`Se agregó el vértice «${label}». Haga clic en otro lugar para agregar más.`);
      } else if (mode === 'add-edge') {
        if (pendingSource) info('Se canceló la arista en construcción.');
        setPendingSource(null);
      } else {
        select(null);
      }
    },
    [useStore, mode, pendingSource, info, fail],
  );

  const handleVertexClick = useCallback(
    (id: VertexId) => {
      const { graph: current, addEdge, select } = useStore.getState();
      if (mode !== 'add-edge') {
        select({ kind: 'vertex', id });
        return;
      }
      if (pendingSource === null) {
        setPendingSource(id);
        info(`Origen: «${vertexLabel(current, id)}». Ahora haga clic en el vértice ${current.directed ? 'destino' : 'del otro extremo'}.`);
        return;
      }
      if (pendingSource === id) {
        setPendingSource(null);
        fail(`No se permiten lazos: una arista no puede unir «${vertexLabel(current, id)}» consigo mismo. Elija de nuevo el origen.`);
        return;
      }
      let weight = 1;
      if (current.weighted) {
        const parsed = parseWeight(edgeWeight);
        if (!parsed.ok) {
          fail(`Peso de la nueva arista: ${parsed.error}`);
          return;
        }
        weight = parsed.value;
      }
      const error = addEdge(pendingSource, id, weight);
      setPendingSource(null);
      if (error) fail(error);
      else {
        const created = useStore.getState().graph;
        const edge = created.edges[created.edges.length - 1];
        info(`Se agregó la arista ${edge ? describeEdge(created, edge) : ''}${current.weighted ? ` con peso ${formatWeight(weight)}` : ''}. Elija el origen de la siguiente.`);
      }
    },
    [useStore, mode, pendingSource, edgeWeight, info, fail],
  );

  const handleEdgeSelect = useCallback(
    (id: EdgeId) => {
      if (mode === 'add-edge' && pendingSource !== null) return;
      useStore.getState().select({ kind: 'edge', id });
    },
    [useStore, mode, pendingSource],
  );

  const handleVertexMoved = useCallback((id: VertexId, position: Point) => useStore.getState().moveVertex(id, position), [useStore]);

  const handleDeleteSelection = () => {
    const { graph: current, selection: sel, removeEdge } = useStore.getState();
    if (sel?.kind === 'vertex') setPending({ type: 'delete-vertex', id: sel.id });
    if (sel?.kind === 'edge') {
      const edge = findEdge(current, sel.id);
      if (edge && !removeEdge(sel.id)) info(`Se eliminó la arista ${describeEdge(current, edge)}. Puede recuperarla con «Deshacer».`);
    }
  };

  const handleCancel = () => {
    if (pendingSource !== null) {
      setPendingSource(null);
      info('Se canceló la arista en construcción.');
    } else if (mode !== 'select') changeMode('select');
    else useStore.getState().select(null);
  };

  const onDirectedChange = (directed: boolean) => {
    const opposite = countOppositeArcPairs(useStore.getState().graph);
    useStore.getState().setDirected(directed);
    if (directed) info('Grafo dirigido: cada arista es ahora un arco de su origen a su destino. Puede invertir un arco en «Propiedades».');
    else
      info(
        opposite > 0
          ? `Grafo no dirigido: ${opposite} ${opposite === 1 ? 'par de arcos opuestos quedó' : 'pares de arcos opuestos quedaron'} como aristas paralelas.`
          : 'Grafo no dirigido: las aristas ya no tienen sentido.',
      );
  };

  const onWeightedChange = (weighted: boolean) => {
    useStore.getState().setWeighted(weighted);
    info(weighted ? 'Grafo ponderado: cada arista muestra su peso.' : 'Grafo no ponderado: todas las aristas cuentan con peso 1. Los pesos anteriores se conservan por si vuelve a activarlos.');
  };

  const requestExample = (exampleId: string) => {
    if (useStore.getState().graph.vertices.length === 0) {
      useStore.getState().loadExample(exampleId);
      graphReplaced();
    } else setPending({ type: 'example', exampleId });
  };

  /** Reemplaza el grafo (importación, copia desde el editor…). Se puede deshacer. */
  const replaceGraph = (next: Graph, name: string) => {
    useStore.getState().replaceGraph(next, name);
    graphReplaced();
  };

  const startEdgeFrom = (id: VertexId) => {
    const current = useStore.getState().graph;
    setMode('add-edge');
    setPendingSource(id);
    info(`Origen: «${vertexLabel(current, id)}». Ahora haga clic en el vértice ${current.directed ? 'destino' : 'del otro extremo'} en el lienzo.`);
  };

  const undo = () => {
    useStore.getState().undo();
    info('Se deshizo el último cambio.');
  };
  const redo = () => {
    useStore.getState().redo();
    info('Se rehízo el cambio.');
  };

  const confirmPending = () => {
    const store = useStore.getState();
    if (pending?.type === 'delete-vertex') {
      const label = vertexLabel(store.graph, pending.id);
      const error = store.removeVertex(pending.id);
      if (error) fail(error);
      else info(`Se eliminó el vértice «${label}» y sus aristas. Puede recuperarlo con «Deshacer».`);
      if (pendingSource === pending.id) setPendingSource(null);
    }
    if (pending?.type === 'clear') {
      store.clear();
      graphReplaced();
      info('Grafo reiniciado. Puede recuperarlo con «Deshacer».');
    }
    if (pending?.type === 'example') {
      store.loadExample(pending.exampleId);
      graphReplaced();
    }
    setPending(null);
  };

  const dialog: WorkspaceDialog | null = (() => {
    if (pending?.type === 'delete-vertex') {
      const count = incidentEdges(graph, pending.id).length;
      return {
        title: `¿Eliminar el vértice «${vertexLabel(graph, pending.id)}»?`,
        description:
          count === 0
            ? 'El vértice no tiene aristas. Podrá recuperarlo con «Deshacer».'
            : `También se eliminarán ${count === 1 ? 'su arista incidente' : `sus ${count} aristas incidentes`}. Podrá recuperarlo con «Deshacer».`,
        confirmLabel: 'Eliminar',
      };
    }
    if (pending?.type === 'clear') {
      return { title: '¿Reiniciar el grafo?', description: `Se quitarán los ${graph.vertices.length} vértices y ${graph.edges.length} aristas del lienzo.`, confirmLabel: 'Reiniciar' };
    }
    if (pending?.type === 'example') {
      return {
        title: '¿Reemplazar el grafo actual?',
        description: `El grafo actual se reemplazará por el ejemplo «${findExample(pending.exampleId)?.name ?? ''}». Podrá volver a él con «Deshacer».`,
        confirmLabel: 'Reemplazar',
      };
    }
    return null;
  })();

  const hint =
    mode === 'add-vertex'
      ? `Haga clic en un espacio vacío del lienzo para agregar el vértice «${suggestVertexLabel(graph)}».`
      : mode === 'add-edge'
        ? pendingSource
          ? `Origen: «${vertexLabel(graph, pendingSource)}». Haga clic en el vértice ${graph.directed ? 'destino' : 'del otro extremo'} (Esc cancela).`
          : `Haga clic en el vértice ${graph.directed ? 'de origen' : 'de un extremo'} de la nueva arista.`
        : 'Arrastre los vértices para moverlos. Haga clic en un vértice o arista para editarlo; Supr lo elimina.';

  return {
    useStore,
    graph,
    selection,
    canUndo,
    canRedo,
    mode,
    changeMode,
    pendingSource,
    edgeWeight,
    setEdgeWeight,
    notice,
    info,
    fail,
    canvasKey,
    graphReplaced,
    hint,
    handlers: { handlePaneClick, handleVertexClick, handleEdgeSelect, handleVertexMoved, handleDeleteSelection, handleCancel },
    onDirectedChange,
    onWeightedChange,
    requestExample,
    requestClear: () => setPending({ type: 'clear' }),
    requestDeleteVertex: (id: VertexId) => setPending({ type: 'delete-vertex', id }),
    replaceGraph,
    startEdgeFrom,
    undo,
    redo,
    dialog,
    confirmPending,
    cancelPending: () => setPending(null),
  };
}

export type GraphWorkspaceState = ReturnType<typeof useGraphWorkspace>;
