import type { Edge, EdgeId, Graph, Vertex, VertexId } from '@/types/graph';
import { componentIndex, otherEnd } from './adjacency';
import { compareLabels, sortVerticesByLabel } from './order';

/**
 * Recorridos eulerianos y algoritmo de Fleury.
 *
 * Un recorrido euleriano usa cada arista exactamente una vez. Criterios (grafo con al menos una arista
 * y cuyas aristas están todas en una misma componente conexa; los vértices aislados no influyen):
 * - No dirigido: 0 vértices de grado impar → circuito; 2 → camino abierto entre ellos; más → no existe.
 * - Dirigido: todos con entrada = salida → circuito; un vértice con salida − entrada = 1 (inicio),
 *   uno con entrada − salida = 1 (fin) y el resto equilibrados → camino; en otro caso no existe.
 *   (Para dirigidos basta la conexidad débil junto con estas condiciones de grado.)
 */

export type EulerKind = 'circuit' | 'path' | 'none' | 'no-edges';

export interface EulerAnalysis {
  kind: EulerKind;
  directed: boolean;
  /** Grado de cada vértice (no dirigido) o salida − entrada (dirigido). */
  degree: Map<VertexId, number>;
  balance: Map<VertexId, number>;
  oddVertices: Vertex[];
  evenVertices: Vertex[];
  isolated: Vertex[];
  /** Las aristas están en una sola componente (ignorando vértices aislados). */
  connected: boolean;
  /** Vértices desde los que puede empezar el recorrido euleriano. */
  starts: VertexId[];
  /** Explicación del criterio aplicado, en frases. */
  reasons: string[];
}

const names = (vs: Vertex[]) => vs.map((v) => v.label).join(', ');

export function analyzeEuler(graph: Graph): EulerAnalysis {
  const degree = new Map<VertexId, number>(graph.vertices.map((v) => [v.id, 0]));
  const balance = new Map<VertexId, number>(graph.vertices.map((v) => [v.id, 0]));
  for (const e of graph.edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    balance.set(e.source, (balance.get(e.source) ?? 0) + 1);
    balance.set(e.target, (balance.get(e.target) ?? 0) - 1);
  }
  const ordered = sortVerticesByLabel(graph.vertices);
  const isolated = ordered.filter((v) => (degree.get(v.id) ?? 0) === 0);
  const oddVertices = ordered.filter((v) => (degree.get(v.id) ?? 0) % 2 === 1);
  const evenVertices = ordered.filter((v) => (degree.get(v.id) ?? 0) % 2 === 0);
  const withEdges = ordered.filter((v) => (degree.get(v.id) ?? 0) > 0);

  const comp = componentIndex(graph.vertices, graph.edges);
  const edgeComponents = new Set(withEdges.map((v) => comp.get(v.id)));
  const connected = edgeComponents.size <= 1;

  const base = { directed: graph.directed, degree, balance, oddVertices, evenVertices, isolated, connected };
  const reasons: string[] = [];

  if (graph.edges.length === 0) {
    reasons.push('El grafo no tiene aristas: no hay nada que recorrer.');
    return { ...base, kind: 'no-edges', starts: [], reasons };
  }
  if (isolated.length > 0) {
    reasons.push(`Vértices aislados (${names(isolated)}): no tienen aristas, por lo que no afectan a la existencia del recorrido.`);
  }
  if (!connected) {
    reasons.push(`Las aristas están repartidas en ${edgeComponents.size} componentes conexas: ningún recorrido puede pasar de una a otra.`);
    return { ...base, kind: 'none', starts: [], reasons };
  }
  reasons.push('Todas las aristas pertenecen a una misma componente conexa.');

  if (!graph.directed) {
    const odd = oddVertices.length;
    if (odd === 0) {
      reasons.push('Todos los vértices tienen grado par: existe un circuito euleriano y puede empezar en cualquier vértice con aristas.');
      return { ...base, kind: 'circuit', starts: withEdges.map((v) => v.id), reasons };
    }
    if (odd === 2) {
      reasons.push(`Exactamente dos vértices tienen grado impar (${names(oddVertices)}): existe un camino euleriano abierto que empieza en uno y termina en el otro.`);
      return { ...base, kind: 'path', starts: oddVertices.map((v) => v.id), reasons };
    }
    reasons.push(`Hay ${odd} vértices de grado impar (${names(oddVertices)}); con más de dos no existe recorrido euleriano.`);
    return { ...base, kind: 'none', starts: [], reasons };
  }

  const plus = ordered.filter((v) => (balance.get(v.id) ?? 0) > 0);
  const minus = ordered.filter((v) => (balance.get(v.id) ?? 0) < 0);
  if (plus.length === 0 && minus.length === 0) {
    reasons.push('En cada vértice el grado de entrada es igual al de salida: existe un circuito euleriano dirigido.');
    return { ...base, kind: 'circuit', starts: withEdges.map((v) => v.id), reasons };
  }
  const [s] = plus;
  const [t] = minus;
  if (plus.length === 1 && minus.length === 1 && s && t && balance.get(s.id) === 1 && balance.get(t.id) === -1) {
    reasons.push(`${s.label} tiene una salida más que entradas y ${t.label} una entrada más que salidas; el resto está equilibrado: existe un camino euleriano dirigido de ${s.label} a ${t.label}.`);
    return { ...base, kind: 'path', starts: [s.id], reasons };
  }
  const unbalanced = ordered.filter((v) => (balance.get(v.id) ?? 0) !== 0);
  reasons.push(`Vértices desequilibrados (salida − entrada ≠ 0): ${unbalanced.map((v) => `${v.label} (${(balance.get(v.id) ?? 0) > 0 ? '+' : ''}${balance.get(v.id) ?? 0})`).join(', ')}. No cumplen las condiciones: no existe recorrido euleriano.`);
  return { ...base, kind: 'none', starts: [], reasons };
}

/**
 * Puentes del grafo no dirigido formado por `edges` (algoritmo de Tarjan). Una arista es puente si al
 * quitarla aumenta el número de componentes. Con aristas paralelas, ninguna de ellas es puente: por eso
 * se excluye solo la arista por la que se llegó (por identificador), no el vértice padre.
 */
export function findBridges(vertexIds: readonly VertexId[], edges: readonly Edge[]): Set<EdgeId> {
  const incident = new Map<VertexId, Edge[]>(vertexIds.map((id) => [id, []]));
  for (const e of edges) {
    incident.get(e.source)?.push(e);
    incident.get(e.target)?.push(e);
  }
  const disc = new Map<VertexId, number>();
  const low = new Map<VertexId, number>();
  const bridges = new Set<EdgeId>();
  let time = 0;

  const visit = (u: VertexId, viaEdge: EdgeId | null) => {
    disc.set(u, time);
    low.set(u, time);
    time++;
    for (const e of incident.get(u) ?? []) {
      if (e.id === viaEdge) continue;
      const w = otherEnd(e, u);
      const dw = disc.get(w);
      if (dw === undefined) {
        visit(w, e.id);
        low.set(u, Math.min(low.get(u) ?? 0, low.get(w) ?? 0));
        if ((low.get(w) ?? 0) > (disc.get(u) ?? 0)) bridges.add(e.id);
      } else {
        low.set(u, Math.min(low.get(u) ?? 0, dw));
      }
    }
  };
  for (const id of vertexIds) if (!disc.has(id)) visit(id, null);
  return bridges;
}

/**
 * ¿Se puede completar un recorrido que use exactamente las aristas `remaining` empezando en `from`?
 * Es el criterio euleriano aplicado al grafo restante con inicio fijo.
 */
export function canCompleteTrail(graph: Graph, remaining: readonly Edge[], from: VertexId): boolean {
  if (remaining.length === 0) return true;
  const degree = new Map<VertexId, number>();
  const balance = new Map<VertexId, number>();
  for (const e of remaining) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    balance.set(e.source, (balance.get(e.source) ?? 0) + 1);
    balance.set(e.target, (balance.get(e.target) ?? 0) - 1);
  }
  if ((degree.get(from) ?? 0) === 0) return false;
  // Todas las aristas restantes deben estar en la componente de `from`.
  const comp = componentIndex(graph.vertices, remaining);
  const c = comp.get(from);
  if (remaining.some((e) => comp.get(e.source) !== c)) return false;

  if (!graph.directed) {
    const odd = [...degree].filter(([, d]) => d % 2 === 1).map(([id]) => id);
    return odd.length === 0 || (odd.length === 2 && odd.includes(from));
  }
  const unbalanced = [...balance].filter(([, b]) => b !== 0);
  if (unbalanced.length === 0) return true;
  const plus = unbalanced.filter(([, b]) => b > 0);
  const minus = unbalanced.filter(([, b]) => b < 0);
  return unbalanced.length === 2 && plus.length === 1 && minus.length === 1 && plus[0]?.[0] === from && plus[0][1] === 1 && minus[0]?.[1] === -1;
}

export interface FleuryState {
  start: VertexId;
  current: VertexId;
  /** Aristas usadas, en orden. */
  used: EdgeId[];
  /** Vértices visitados, en orden (empieza con `start`). */
  trail: VertexId[];
}

export interface FleuryOption {
  edge: Edge;
  to: VertexId;
  /** Grafos no dirigidos: la arista es puente del grafo restante. */
  bridge: boolean;
  /** Tras usarla, todavía se pueden recorrer todas las aristas restantes. */
  safe: boolean;
  /** Fleury la desaconseja: es puente (o, en dirigidos, impide terminar) y hay otra opción que no lo es. */
  avoidable: boolean;
}

export function startFleury(start: VertexId): FleuryState {
  return { start, current: start, used: [], trail: [start] };
}

export function remainingEdges(graph: Graph, state: FleuryState): Edge[] {
  const used = new Set(state.used);
  return graph.edges.filter((e) => !used.has(e.id));
}

/** Aristas disponibles desde el vértice actual, con la información que usa la regla de Fleury. */
export function fleuryOptions(graph: Graph, state: FleuryState): FleuryOption[] {
  const remaining = remainingEdges(graph, state);
  const here = state.current;
  const available = remaining.filter((e) => (graph.directed ? e.source === here : e.source === here || e.target === here));
  const bridges = graph.directed ? new Set<EdgeId>() : findBridges(graph.vertices.map((v) => v.id), remaining);
  const label = new Map(graph.vertices.map((v) => [v.id, v.label]));

  const options = available.map((edge) => {
    const to = graph.directed ? edge.target : otherEnd(edge, here);
    const after = remaining.filter((e) => e.id !== edge.id);
    return { edge, to, bridge: bridges.has(edge.id), safe: canCompleteTrail(graph, after, to), avoidable: false };
  });
  // Regla de Fleury: no cruzar un puente si existe otra arista que no lo sea.
  const risky = (o: FleuryOption) => (graph.directed ? !o.safe : o.bridge);
  const hasAlternative = options.some((o) => !risky(o));
  for (const o of options) o.avoidable = hasAlternative && risky(o);
  return options.sort((a, b) => compareLabels(label.get(a.to) ?? '', label.get(b.to) ?? '') || compareLabels(a.edge.id, b.edge.id));
}

export function applyFleuryStep(state: FleuryState, option: FleuryOption): FleuryState {
  return { ...state, current: option.to, used: [...state.used, option.edge.id], trail: [...state.trail, option.to] };
}

/** Elección del algoritmo: la primera opción (en orden alfabético) que Fleury no desaconseja. */
export function fleuryChoice(options: readonly FleuryOption[]): FleuryOption | undefined {
  return options.find((o) => !o.avoidable);
}

export interface FleuryRun {
  state: FleuryState;
  /** Para cada paso, las opciones que había y la elegida. */
  steps: Array<{ from: VertexId; options: FleuryOption[]; chosen: FleuryOption }>;
  complete: boolean;
}

/** Algoritmo de Fleury completo desde `start`. */
export function runFleury(graph: Graph, start: VertexId): FleuryRun {
  let state = startFleury(start);
  const steps: FleuryRun['steps'] = [];
  for (;;) {
    const options = fleuryOptions(graph, state);
    const chosen = fleuryChoice(options);
    if (!chosen) break;
    steps.push({ from: state.current, options, chosen });
    state = applyFleuryStep(state, chosen);
  }
  return { state, steps, complete: state.used.length === graph.edges.length };
}

export type StartCheck = { ok: true; message: string } | { ok: false; message: string };

/** Comprueba si `start` es un vértice inicial válido según la clasificación. */
export function checkEulerStart(graph: Graph, analysis: EulerAnalysis, start: VertexId): StartCheck {
  const label = graph.vertices.find((v) => v.id === start)?.label ?? start;
  if (analysis.kind === 'no-edges') return { ok: false, message: 'El grafo no tiene aristas que recorrer.' };
  if (analysis.kind === 'none') return { ok: false, message: 'El grafo no tiene recorrido euleriano: ningún vértice inicial permite usar todas las aristas una sola vez.' };
  if (analysis.starts.includes(start)) {
    return {
      ok: true,
      message:
        analysis.kind === 'circuit'
          ? `${label} es válido: en un circuito euleriano se puede empezar en cualquier vértice con aristas, y se termina en el mismo.`
          : `${label} es válido: el camino euleriano debe empezar en ${analysis.directed ? 'el vértice con una salida de más' : 'uno de los dos vértices de grado impar'}.`,
    };
  }
  if ((analysis.degree.get(start) ?? 0) === 0) return { ok: false, message: `${label} es un vértice aislado: no tiene aristas.` };
  const startNames = analysis.starts.map((id) => graph.vertices.find((v) => v.id === id)?.label ?? id).join(' o ');
  return { ok: false, message: `${label} no sirve como inicio: el camino euleriano debe empezar en ${startNames}.` };
}
