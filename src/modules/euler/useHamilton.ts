import { useMemo, useState } from 'react';
import { lightestEdge } from '@/algorithms/graph/adjacency';
import type { HamiltonKind, HamiltonResult } from '@/algorithms/graph/hamilton';
import { checkHamiltonRoute, HAMILTON_LIMITS, searchHamilton } from '@/algorithms/graph/hamilton';
import type { CanvasHighlight, EdgeMark, VertexMark } from '@/components/graph/flowTypes';
import type { EdgeId, Graph, VertexId } from '@/types/graph';

interface SearchRecord {
  graph: Graph;
  kind: HamiltonKind;
  limit: number;
  start: VertexId | '';
  result: HamiltonResult;
}

/** Búsqueda de caminos y ciclos hamiltonianos y validación de rutas construidas por el usuario. */
export function useHamilton(graph: Graph) {
  const [kind, setKind] = useState<HamiltonKind>('cycle');
  const [limit, setLimit] = useState<number>(HAMILTON_LIMITS[1]);
  const [startChoice, setStartChoice] = useState<VertexId | ''>('');
  const [record, setRecord] = useState<SearchRecord | null>(null);
  const [routeState, setRouteState] = useState<{ graph: Graph; ids: VertexId[] }>({ graph, ids: [] });
  const [building, setBuilding] = useState(false);

  const start = startChoice === '' || graph.vertices.some((v) => v.id === startChoice) ? startChoice : '';
  // Un resultado solo vale para el grafo y las opciones con que se obtuvo.
  const search = record && record.graph === graph && record.kind === kind && record.limit === limit && record.start === start ? record : null;
  const route = useMemo(() => (routeState.graph === graph ? routeState.ids : []), [routeState, graph]);
  const check = useMemo(() => checkHamiltonRoute(graph, route, kind), [graph, route, kind]);

  const runSearch = () => setRecord({ graph, kind, limit, start, result: searchHamilton(graph, { kind, limit, start: start || null }) });

  const addToRoute = (id: VertexId) => setRouteState({ graph, ids: [...route, id] });
  const removeLast = () => setRouteState({ graph, ids: route.slice(0, -1) });
  const clearRoute = () => setRouteState({ graph, ids: [] });

  const highlight = useMemo((): CanvasHighlight | undefined => {
    const shown = route.length > 0 ? route : search?.result.status === 'found' ? search.result.route : [];
    if (shown.length === 0) return undefined;
    const vertices = new Map<VertexId, VertexMark>();
    const edges = new Map<EdgeId, EdgeMark>();
    const positions = new Map<VertexId, number[]>();
    shown.forEach((id, i) => positions.set(id, [...(positions.get(id) ?? []), i + 1]));
    for (const [id, pos] of positions) {
      vertices.set(id, { tone: pos.length > 1 ? 'error' : 'visited', badge: pos.join(',') });
    }
    const last = shown[shown.length - 1];
    if (route.length > 0 && last !== undefined && (positions.get(last)?.length ?? 0) === 1) vertices.set(last, { tone: 'current', badge: positions.get(last)?.join(',') ?? '' });
    const link = (a: VertexId | undefined, b: VertexId | undefined) => {
      if (a === undefined || b === undefined) return;
      const e = lightestEdge(graph, a, b);
      if (e) edges.set(e.id, { tone: 'path' });
    };
    for (let i = 1; i < shown.length; i++) link(shown[i - 1], shown[i]);
    const closes = route.length > 0 ? check.valid : true;
    if (kind === 'cycle' && shown.length === graph.vertices.length && closes) link(last, shown[0]);
    return { vertices, edges };
  }, [graph, route, search, kind, check.valid]);

  return {
    kind,
    setKind,
    limit,
    setLimit,
    start,
    setStart: setStartChoice,
    search,
    runSearch,
    route,
    check,
    building,
    setBuilding,
    addToRoute,
    removeLast,
    clearRoute,
    highlight,
  };
}

export type HamiltonSimulation = ReturnType<typeof useHamilton>;
