import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { computeDegrees } from '@/algorithms/graph/degrees';
import { traversalOrder } from '@/algorithms/graph/traversal';
import { generateExercise } from '@/algorithms/practice/exercises';
import { traverse } from '@/algorithms/tree/traversals';
import { usePracticeStore } from '@/modules/practice/practiceStore';
import type * as RandomModule from '@/algorithms/practice/random';
import { renderApp } from '../renderApp';

// Semilla fija: el ejercicio «al azar» es predecible en las pruebas.
vi.mock('@/algorithms/practice/random', async (importOriginal) => ({ ...(await importOriginal<typeof RandomModule>()), newSeed: () => 7 }));

const open = async () => {
  const rendered = renderApp('/laboratorio');
  await screen.findByRole('heading', { level: 1, name: 'Laboratorio de práctica' }, { timeout: 5000 });
  return rendered;
};
const exercisePanel = () => screen.getByRole('region', { name: /Grado de cada vértice|Recorrido|Propiedades|Caminos/ });

describe('laboratorio de práctica', () => {
  beforeEach(() => usePracticeStore.getState().clear());

  it('califica un ejercicio de grados, guarda el historial y muestra la solución solo después de comprobar', async () => {
    const { user } = await open();
    const ex = generateExercise('degrees', 'basic', 7);
    if (ex.figure.kind !== 'graph') throw new Error('se esperaba un grafo');
    const graph = ex.figure.graph;
    const degrees = computeDegrees(graph);

    expect(screen.getByRole('button', { name: 'Ver solución' })).toBeDisabled();
    for (const v of graph.vertices) await user.type(screen.getByLabelText(`Grado de ${v.label}`), String(degrees.get(v.id)?.degree));
    await user.type(screen.getByLabelText('Suma de los grados'), String(2 * graph.edges.length - 1));
    await user.click(screen.getByRole('button', { name: 'Comprobar respuesta' }));

    const grade = screen.getByTestId('grade');
    expect(within(grade).getByTestId('score')).not.toHaveTextContent('100 %');
    expect(grade).toHaveTextContent('Suma de los grados: Incorrecto: revise el cálculo.');
    expect(grade).not.toHaveTextContent('Respuesta correcta');

    const sum = screen.getByLabelText('Suma de los grados');
    await user.clear(sum);
    await user.type(sum, String(2 * graph.edges.length));
    await user.click(screen.getByRole('button', { name: 'Comprobar respuesta' }));
    expect(screen.getByTestId('score')).toHaveTextContent('100 %');

    const history = screen.getByTestId('history');
    expect(history).toHaveTextContent('Grados · Básico');
    expect(history).toHaveTextContent('100 %');
    expect(usePracticeStore.getState().history[0]).toMatchObject({ topic: 'degrees', level: 'basic', seed: 7, score: 100, checks: 2 });

    await user.click(screen.getByRole('button', { name: 'Ver solución' }));
    expect(screen.getByTestId('solution')).toHaveTextContent(`Suma de los grados: ${2 * graph.edges.length}`);
  });

  it('construye un recorrido haciendo clic en el árbol y da pistas progresivas', async () => {
    const { user } = await open();
    await user.selectOptions(screen.getByLabelText('Tema'), 'postorder');
    await user.click(screen.getByRole('radio', { name: 'Intermedio' }));
    await user.click(screen.getByRole('button', { name: 'Generar ejercicio' }));
    const ex = generateExercise('postorder', 'intermediate', 7);
    if (ex.figure.kind !== 'tree') throw new Error('se esperaba un árbol');
    const tree = ex.figure.tree;
    const order = traverse(tree, 'postorder').map((id) => tree.nodes[id]?.label ?? '');

    await user.click(screen.getByRole('button', { name: 'Pista (0/3)' }));
    expect(screen.getByRole('list', { name: 'Pistas' })).toHaveTextContent('Pista 1:');
    expect(screen.getByRole('button', { name: 'Pista (1/3)' })).toBeEnabled();

    // Los dos primeros nodos invertidos: el error está en la primera posición.
    const [first, second] = order;
    for (const label of [second, first]) fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Nodo ${label ?? ''}`) }));
    await user.click(screen.getByRole('button', { name: 'Comprobar respuesta' }));
    expect(screen.getByTestId('grade')).toHaveTextContent('El primer nodo no es correcto.');

    const input = screen.getByLabelText(/Nodos en orden/);
    await user.clear(input);
    await user.type(input, order.join(' '));
    await user.click(screen.getByRole('button', { name: 'Comprobar respuesta' }));
    expect(screen.getByTestId('score')).toHaveTextContent('100 %');
  });

  it('acepta un orden BFS válido escrito por el estudiante', async () => {
    const { user } = await open();
    await user.selectOptions(screen.getByLabelText('Tema'), 'bfs');
    await user.click(screen.getByRole('button', { name: 'Generar ejercicio' }));
    const ex = generateExercise('bfs', 'basic', 7);
    if (ex.figure.kind !== 'graph') throw new Error('se esperaba un grafo');
    const g = ex.figure.graph;
    const order = traversalOrder(g, ex.params.start ?? '', 'bfs').map((id) => g.vertices.find((v) => v.id === id)?.label ?? '');
    await user.type(screen.getByLabelText(/Todos los vértices alcanzables/), order.join(' '));
    await user.click(screen.getByRole('button', { name: 'Comprobar respuesta' }));
    expect(screen.getByTestId('grade')).toHaveTextContent('Correcto: es un orden válido de BFS');
  });

  it('borra el historial solo después de confirmar', async () => {
    usePracticeStore.getState().record({ id: 'x', date: new Date().toISOString(), topic: 'euler', level: 'advanced', seed: 1, score: 50, checks: 1, hintsUsed: 2, revealed: false });
    const { user } = await open();
    expect(screen.getByTestId('history')).toHaveTextContent('Euler · Avanzado');
    expect(screen.getByTestId('history')).toHaveTextContent('2 pistas');
    expect(screen.getByTestId('stat-average')).toHaveTextContent('50 %');
    await user.click(screen.getByRole('button', { name: 'Borrar historial' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));
    expect(usePracticeStore.getState().history).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Borrar historial' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Borrar' }));
    expect(usePracticeStore.getState().history).toHaveLength(0);
    expect(exercisePanel()).toBeInTheDocument();
  });
});
