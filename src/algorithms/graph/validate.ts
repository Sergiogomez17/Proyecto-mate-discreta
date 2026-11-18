import type { Graph, GraphIssue } from '@/types/graph';

/**
 * Comprueba que un grafo cumple la política descrita en `types/graph.ts`.
 * Devuelve la lista de problemas encontrados; una lista vacía significa grafo válido.
 */
export function validateGraph(graph: Graph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const vertexIds = new Set<string>();
  const labels = new Map<string, string>();

  for (const vertex of graph.vertices) {
    if (vertexIds.has(vertex.id)) {
      issues.push({ code: 'duplicate-vertex-id', vertexId: vertex.id, message: `El identificador de vértice «${vertex.id}» está repetido.` });
    }
    vertexIds.add(vertex.id);

    const label = vertex.label.trim();
    if (label === '') {
      issues.push({ code: 'empty-label', vertexId: vertex.id, message: 'Hay un vértice sin nombre.' });
    } else if (labels.has(label)) {
      issues.push({ code: 'duplicate-label', vertexId: vertex.id, message: `El nombre «${label}» se usa en más de un vértice.` });
    } else {
      labels.set(label, vertex.id);
    }
  }

  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) {
      issues.push({ code: 'duplicate-edge-id', edgeId: edge.id, message: `El identificador de arista «${edge.id}» está repetido.` });
    }
    edgeIds.add(edge.id);

    if (!vertexIds.has(edge.source) || !vertexIds.has(edge.target)) {
      issues.push({ code: 'missing-endpoint', edgeId: edge.id, message: `La arista «${edge.id}» conecta un vértice que no existe.` });
    } else if (edge.source === edge.target) {
      issues.push({ code: 'self-loop', edgeId: edge.id, message: 'No se permiten lazos (aristas de un vértice a sí mismo).' });
    }

    if (!Number.isFinite(edge.weight)) {
      issues.push({ code: 'invalid-weight', edgeId: edge.id, message: `La arista «${edge.id}» tiene un peso que no es un número finito.` });
    }
  }

  return issues;
}
