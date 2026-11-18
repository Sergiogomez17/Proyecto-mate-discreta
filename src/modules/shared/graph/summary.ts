/** Describe el grafo en una línea: «6 vértices · 9 aristas · no dirigido · ponderado». */
export function graphSummaryLine(graph: { vertices: unknown[]; edges: unknown[]; directed: boolean; weighted: boolean }) {
  const n = graph.vertices.length;
  const m = graph.edges.length;
  return `${n} ${n === 1 ? 'vértice' : 'vértices'} · ${m} ${m === 1 ? 'arista' : 'aristas'} · ${graph.directed ? 'dirigido' : 'no dirigido'} · ${graph.weighted ? 'ponderado' : 'no ponderado'}`;
}
