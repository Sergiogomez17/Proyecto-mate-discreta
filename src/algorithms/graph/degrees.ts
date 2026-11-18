import type { Graph, VertexDegree, VertexId } from '@/types/graph';

/**
 * Calcula el grado de cada vértice respetando la política de grafos:
 * las aristas paralelas cuentan por separado y los lazos no existen en un grafo válido.
 * Complejidad: O(V + E).
 */
export function computeDegrees(graph: Graph): Map<VertexId, VertexDegree> {
  const degrees = new Map<VertexId, VertexDegree>();
  for (const vertex of graph.vertices) {
    degrees.set(vertex.id, { degree: 0, inDegree: 0, outDegree: 0 });
  }

  for (const edge of graph.edges) {
    const source = degrees.get(edge.source);
    const target = degrees.get(edge.target);
    if (!source || !target) {
      throw new Error(`La arista ${edge.id} referencia un vértice inexistente.`);
    }
    source.degree += 1;
    target.degree += 1;
    if (graph.directed) {
      source.outDegree += 1;
      target.inDegree += 1;
    }
  }

  // En un grafo no dirigido no hay orientación: entrada y salida coinciden con el grado.
  if (!graph.directed) {
    for (const d of degrees.values()) d.inDegree = d.outDegree = d.degree;
  }
  return degrees;
}

/**
 * Lema del apretón de manos: la suma de los grados es 2|E|.
 * Se expone para que la interfaz pueda mostrar la comprobación con datos reales.
 */
export function degreeSum(degrees: Map<VertexId, VertexDegree>): number {
  let total = 0;
  for (const { degree } of degrees.values()) total += degree;
  return total;
}
