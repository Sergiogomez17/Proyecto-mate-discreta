import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { buildGraph, findExample } from '@/algorithms/graph/examples';
import { traversalOrder } from '@/algorithms/graph/traversal';
import { useDijkstraGraphStore } from '@/modules/dijkstra/store';
import { useTraversalGraphStore } from '@/modules/traversals/store';
import { renderApp } from '../renderApp';

const open = async (path: string, title: string) => {
  const rendered = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: title }, { timeout: 5000 });
  return rendered;
};
const region = (name: string) => screen.getByRole('region', { name });

type User = ReturnType<typeof renderApp>['user'];
/** Avanza con «Paso siguiente» hasta el último paso. */
async function runToEnd(user: User) {
  const next = screen.getByRole('button', { name: 'Paso siguiente' });
  let guard = 0;
  while (!next.hasAttribute('disabled') && guard++ < 500) await user.click(next);
}

describe('simulador de Dijkstra', () => {
  beforeEach(() => {
    useDijkstraGraphStore.getState().loadExample('ciudades');
    useDijkstraGraphStore.setState({ past: [], future: [], selection: null });
  });

  it('ejecuta paso a paso, bloquea la edición y resalta el camino mínimo', async () => {
    const { user } = await open('/simulaciones/dijkstra', 'Dijkstra');
    const algorithm = region('Algoritmo de Dijkstra');
    await user.selectOptions(within(algorithm).getByLabelText('Destino'), 'F');

    await user.click(within(algorithm).getByRole('button', { name: 'Paso siguiente' }));
    expect(screen.getByTestId('step-explanation')).toHaveTextContent('Inicialización: la distancia del origen A es 0');
    // Durante la simulación no se puede editar el grafo.
    expect(screen.getByRole('switch', { name: 'Dirigido' })).toBeDisabled();

    await user.click(within(algorithm).getByRole('button', { name: 'Paso siguiente' }));
    expect(screen.getByTestId('step-explanation')).toHaveTextContent('Se elige A');
    await user.click(within(algorithm).getByRole('button', { name: 'Paso siguiente' }));
    expect(within(algorithm).getByText('d(B) = min(∞, 0 + 4) = 4')).toBeInTheDocument();

    await runToEnd(user);
    const result = screen.getByTestId('dijkstra-result');
    expect(result).toHaveTextContent('Camino mínimo de A a F: costo 12');
    expect(result).toHaveTextContent('A → C → B → D → E → F');
    const rowF = screen.getByTestId('fila-F');
    expect(rowF).toHaveTextContent('12');
    expect(rowF).toHaveTextContent('Definitivo');

    await user.click(screen.getByRole('button', { name: 'Reiniciar simulación' }));
    expect(screen.getByRole('switch', { name: 'Dirigido' })).toBeEnabled();
  });

  it('informa varios caminos mínimos y vértices inalcanzables', async () => {
    useDijkstraGraphStore.getState().loadExample('empates');
    const { user } = await open('/simulaciones/dijkstra', 'Dijkstra');
    const algorithm = region('Algoritmo de Dijkstra');
    await user.selectOptions(within(algorithm).getByLabelText('Destino'), 'F');
    await runToEnd(user);
    expect(screen.getByTestId('dijkstra-result')).toHaveTextContent('Hay 2 caminos mínimos con el mismo costo');
    expect(screen.getByTestId('fila-G')).toHaveTextContent('Inalcanzable');
  });

  it('no ejecuta el algoritmo si hay pesos negativos', async () => {
    useDijkstraGraphStore.getState().replaceGraph(
      buildGraph({ directed: false, weighted: true, vertices: [['A', 0, 0], ['B', 100, 0]], edges: [['A', 'B', -3]] }),
      'Negativo',
    );
    await open('/simulaciones/dijkstra', 'Dijkstra');
    const algorithm = region('Algoritmo de Dijkstra');
    expect(within(algorithm).getByText('No se puede ejecutar Dijkstra: hay pesos negativos')).toBeInTheDocument();
    expect(within(algorithm).getByText('A — B: peso -3')).toBeInTheDocument();
    expect(within(algorithm).queryByRole('button', { name: 'Iniciar' })).not.toBeInTheDocument();
  });
});

describe('simulador de BFS y DFS', () => {
  beforeEach(() => {
    useTraversalGraphStore.getState().loadExample('petersen');
    useTraversalGraphStore.setState({ past: [], future: [], selection: null });
  });

  it('BFS muestra la cola y termina con el orden correcto', async () => {
    const { user } = await open('/simulaciones/bfs-dfs', 'BFS y DFS');
    const graph = findExample('petersen')?.graph;
    if (!graph) throw new Error('falta Petersen');
    const expected = traversalOrder(graph, 'v1', 'bfs').map((id) => graph.vertices.find((v) => v.id === id)?.label);

    await user.click(screen.getByRole('button', { name: 'Paso siguiente' }));
    expect(screen.getByTestId('queue')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Paso siguiente' }));
    expect(screen.getByTestId('step-explanation')).toHaveTextContent('Se desencola 1');

    await runToEnd(user);
    expect(screen.getByTestId('traversal-result')).toHaveTextContent(expected.join(' '));
    expect(screen.getByTestId('traversal-result')).toHaveTextContent('Se visitaron los 10 vértices');
  });

  it('DFS muestra la pila de llamadas; con un vértice aislado informa que no es alcanzable', async () => {
    useTraversalGraphStore.getState().loadExample('desconexo');
    const { user } = await open('/simulaciones/bfs-dfs', 'BFS y DFS');
    await user.click(screen.getByRole('tab', { name: 'DFS (profundidad)' }));
    await user.click(screen.getByRole('button', { name: 'Paso siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Paso siguiente' }));
    expect(screen.getByTestId('stack')).toHaveTextContent('A → B');
    await runToEnd(user);
    expect(screen.getByTestId('traversal-result')).toHaveTextContent('A B C');
    expect(screen.getByTestId('traversal-result')).toHaveTextContent('Se visitaron 3 de 6 vértices');
  });

  it('con «bosque» continúa por los vértices no alcanzados', async () => {
    useTraversalGraphStore.getState().loadExample('desconexo');
    const { user } = await open('/simulaciones/bfs-dfs', 'BFS y DFS');
    await user.click(screen.getByLabelText(/bosque de recorrido/));
    await runToEnd(user);
    expect(screen.getByTestId('traversal-result')).toHaveTextContent('A B C D E F');
  });
});
