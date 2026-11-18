import { useMemo, useState } from 'react';
import type { FleuryOption, FleuryState, StartCheck } from '@/algorithms/graph/euler';
import { analyzeEuler, applyFleuryStep, checkEulerStart, fleuryChoice, fleuryOptions, startFleury } from '@/algorithms/graph/euler';
import { describeEdge } from '@/algorithms/graph/editing';
import { sortVerticesByLabel } from '@/algorithms/graph/order';
import type { CanvasHighlight, EdgeMark, VertexMark } from '@/components/graph/flowTypes';
import type { EdgeId, Graph, VertexId } from '@/types/graph';

export type FleuryMessage = { tone: 'info' | 'warning' | 'error'; text: string } | null;

/**
 * Simulación interactiva del algoritmo de Fleury: el usuario elige una arista por vez y el sistema
 * verifica el inicio, muestra las aristas disponibles, detecta puentes del grafo restante, advierte
 * sobre los puentes evitables, registra el recorrido y comprueba al final que se usaron todas.
 */
export function useFleury(graph: Graph) {
  const analysis = useMemo(() => analyzeEuler(graph), [graph]);
  const ordered = useMemo(() => sortVerticesByLabel(graph.vertices), [graph.vertices]);
  const [session, setSession] = useState<{ graph: Graph; state: FleuryState } | null>(null);
  const [startChoice, setStartChoice] = useState<VertexId | ''>('');
  const [startCheck, setStartCheck] = useState<StartCheck | null>(null);
  const [warning, setWarning] = useState<FleuryOption | null>(null);
  const [message, setMessage] = useState<FleuryMessage>(null);

  // Si el grafo cambia (por ejemplo, al deshacer), la simulación anterior deja de ser válida.
  const state = session && session.graph === graph ? session.state : null;
  const start = graph.vertices.some((v) => v.id === startChoice) ? startChoice : (analysis.starts[0] ?? ordered[0]?.id ?? '');
  const options = useMemo(() => (state ? fleuryOptions(graph, state) : []), [graph, state]);
  const label = (id: VertexId) => graph.vertices.find((v) => v.id === id)?.label ?? id;
  const edgeName = (id: EdgeId) => {
    const e = graph.edges.find((x) => x.id === id);
    return e ? describeEdge(graph, e) : id;
  };

  const set = (next: FleuryState) => setSession({ graph, state: next });

  const begin = () => {
    if (!start) return;
    const check = checkEulerStart(graph, analysis, start);
    setStartCheck(check);
    setWarning(null);
    if (!check.ok) {
      setMessage(null);
      return;
    }
    set(startFleury(start));
    setMessage({ tone: 'info', text: `Recorrido iniciado en ${label(start)}. Elija una de las aristas disponibles.` });
  };

  const apply = (option: FleuryOption, forced: boolean) => {
    if (!state) return;
    const next = applyFleuryStep(state, option);
    set(next);
    setWarning(null);
    const n = next.used.length;
    const name = `${label(state.current)}${graph.directed ? '→' : '–'}${label(option.to)}`;
    let text = `Paso ${n}: se recorrió ${name}. Ahora en ${label(option.to)}.`;
    if (forced) text += ' Se cruzó un puente evitable: es probable que queden aristas sin poder recorrer.';
    else if (option.bridge) text += ' Era un puente, pero no había otra opción: cruzarlo es correcto.';
    setMessage({ tone: forced ? 'warning' : 'info', text });
  };

  const choose = (option: FleuryOption) => {
    if (option.avoidable) {
      setWarning(option);
      setMessage({
        tone: 'warning',
        text: graph.directed
          ? `Atención: si toma ${edgeName(option.edge.id)}, ya no podrá recorrer todas las aristas restantes. Hay otra opción mejor.`
          : `Atención: ${edgeName(option.edge.id)} es un puente del grafo restante y hay otras aristas disponibles. La regla de Fleury indica no cruzarlo.`,
      });
      return;
    }
    apply(option, false);
  };

  const chooseEdge = (edgeId: EdgeId) => {
    if (!state) return;
    const option = options.find((o) => o.edge.id === edgeId);
    if (option) return choose(option);
    if (state.used.includes(edgeId)) setMessage({ tone: 'error', text: `${edgeName(edgeId)} ya fue recorrida: un recorrido euleriano no repite aristas.` });
    else setMessage({ tone: 'error', text: `${edgeName(edgeId)} no sale de ${label(state.current)}: solo puede continuar por una arista disponible desde el vértice actual.` });
  };

  const autoStep = () => {
    const option = fleuryChoice(options);
    if (option) apply(option, false);
  };

  const solve = () => {
    if (!state) return;
    let current = state;
    for (;;) {
      const option = fleuryChoice(fleuryOptions(graph, current));
      if (!option) break;
      current = applyFleuryStep(current, option);
    }
    set(current);
    setWarning(null);
    setMessage({ tone: 'info', text: 'El algoritmo de Fleury completó el recorrido eligiendo, en cada paso, la primera arista (en orden alfabético) que no es un puente evitable.' });
  };

  const undo = () => {
    if (!state || state.used.length === 0) return;
    set({ ...state, used: state.used.slice(0, -1), trail: state.trail.slice(0, -1), current: state.trail[state.trail.length - 2] ?? state.start });
    setWarning(null);
    setMessage({ tone: 'info', text: 'Se deshizo la última arista.' });
  };

  const reset = () => {
    setSession(null);
    setWarning(null);
    setMessage(null);
    setStartCheck(null);
  };

  const done = state !== null && options.length === 0;
  const complete = state !== null && state.used.length === graph.edges.length;

  const highlight = useMemo((): CanvasHighlight => {
    const vertices = new Map<VertexId, VertexMark>();
    const edges = new Map<EdgeId, EdgeMark>();
    if (!state) {
      for (const v of graph.vertices) {
        const odd = (analysis.degree.get(v.id) ?? 0) % 2 === 1;
        if (graph.directed) {
          const b = analysis.balance.get(v.id) ?? 0;
          vertices.set(v.id, b === 0 ? { badge: '±0' } : { tone: 'frontier', badge: b > 0 ? `+${b}` : `−${-b}` });
        } else vertices.set(v.id, { ...(odd ? { tone: 'frontier' as const } : {}), badge: `g=${analysis.degree.get(v.id) ?? 0}` });
      }
      return { vertices, edges };
    }
    for (const id of new Set(state.trail)) vertices.set(id, { tone: 'visited' });
    vertices.set(state.start, { tone: 'start', badge: 'inicio' });
    vertices.set(state.current, { tone: 'current', ...(state.current === state.start ? { badge: 'inicio' } : {}) });
    state.used.forEach((id, i) => edges.set(id, { tone: 'used', badge: `${i + 1}` }));
    for (const o of options) edges.set(o.edge.id, { tone: o.avoidable ? 'warning' : 'candidate' });
    return { vertices, edges };
  }, [graph, analysis, state, options]);

  return {
    analysis,
    start,
    setStart: (id: VertexId | '') => {
      setStartChoice(id);
      setStartCheck(null);
    },
    startCheck,
    state,
    options,
    warning,
    message,
    begin,
    choose,
    chooseEdge,
    forceWarning: () => warning && apply(warning, true),
    dismissWarning: () => {
      setWarning(null);
      setMessage({ tone: 'info', text: 'Elija otra arista disponible.' });
    },
    autoStep,
    solve,
    undo,
    reset,
    done,
    complete,
    highlight,
    label,
    edgeName,
  };
}

export type FleurySimulation = ReturnType<typeof useFleury>;
