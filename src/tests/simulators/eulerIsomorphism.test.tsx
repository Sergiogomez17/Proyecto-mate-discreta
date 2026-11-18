import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { buildGraph, ISOMORPHISM_PAIRS } from '@/algorithms/graph/examples';
import { useEulerGraphStore } from '@/modules/euler/store';
import { useIsoG1Store, useIsoG2Store } from '@/modules/isomorphism/store';
import { renderApp } from '../renderApp';

const open = async (path: string, title: string) => {
  const rendered = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: title }, { timeout: 5000 });
  return rendered;
};
const region = (name: string) => screen.getByRole('region', { name });
const clickVertex = (container: HTMLElement, id: string) => {
  const node = container.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
  if (!node) throw new Error(`No se dibujó ${id}`);
  // Clic sin «mousedown»: en jsdom el arrastre de React Flow (d3-drag) no puede ejecutarse.
  fireEvent.click(node);
};

describe('Euler y Fleury', () => {
  beforeEach(() => {
    useEulerGraphStore.getState().loadExample('casa');
    useEulerGraphStore.setState({ past: [], future: [], selection: null });
  });

  it('clasifica el grafo, valida el inicio y completa el recorrido con Fleury', async () => {
    const { user } = await open('/simulaciones/euler-hamilton', 'Euler y Hamilton');
    const analysis = region('Análisis');
    expect(screen.getByTestId('euler-classification')).toHaveTextContent('Tiene camino euleriano (abierto)');
    expect(screen.getByTestId('euler-classification')).toHaveTextContent('Exactamente dos vértices tienen grado impar (B, C)');

    await user.selectOptions(within(analysis).getByLabelText('Vértice inicial'), 'A');
    await user.click(within(analysis).getByRole('button', { name: 'Comenzar recorrido' }));
    expect(within(analysis).getByRole('alert')).toHaveTextContent('A no sirve como inicio: el camino euleriano debe empezar en B o C.');

    await user.selectOptions(within(analysis).getByLabelText('Vértice inicial'), 'B');
    await user.click(within(analysis).getByRole('button', { name: 'Comenzar recorrido' }));
    expect(screen.getByTestId('fleury-current')).toHaveTextContent('B');
    expect(within(analysis).getByRole('list', { name: 'Aristas disponibles' }).children).toHaveLength(3);

    await user.click(within(analysis).getByRole('button', { name: 'Completar con Fleury' }));
    const result = screen.getByTestId('fleury-result');
    expect(result).toHaveTextContent('Camino euleriano completo');
    expect(result).toHaveTextContent('Se recorrieron las 6 aristas exactamente una vez, de B a C');
  });

  it('advierte al elegir un puente evitable y permite elegir otra arista', async () => {
    useEulerGraphStore
      .getState()
      .replaceGraph(buildGraph({ directed: false, weighted: false, vertices: [['A', 0, 0], ['B', 100, 0], ['C', 200, 0], ['D', 150, 100]], edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'B']] }), 'Colgante');
    const { user } = await open('/simulaciones/euler-hamilton', 'Euler y Hamilton');
    const analysis = region('Análisis');
    await user.selectOptions(within(analysis).getByLabelText('Vértice inicial'), 'B');
    await user.click(within(analysis).getByRole('button', { name: 'Comenzar recorrido' }));

    const options = within(analysis).getByRole('list', { name: 'Aristas disponibles' });
    await user.click(within(options).getByRole('button', { name: /A — B/ }));
    expect(within(analysis).getByRole('alert')).toHaveTextContent('Puente evitable: A — B');
    await user.click(within(analysis).getByRole('button', { name: 'Elegir otra arista' }));
    await user.click(within(options).getByRole('button', { name: /B — C/ }));
    expect(screen.getByTestId('fleury-current')).toHaveTextContent('C');
    await user.click(within(analysis).getByRole('button', { name: 'Completar con Fleury' }));
    expect(screen.getByTestId('fleury-result')).toHaveTextContent('Camino euleriano completo');
    expect(screen.getByTestId('fleury-trail')).toHaveTextContent('B→C→D→B→A');
  });

  it('Königsberg no es euleriano', async () => {
    useEulerGraphStore.getState().loadExample('konigsberg');
    await open('/simulaciones/euler-hamilton', 'Euler y Hamilton');
    expect(screen.getByTestId('euler-classification')).toHaveTextContent('No es euleriano');
    expect(screen.getByTestId('euler-classification')).toHaveTextContent('Hay 4 vértices de grado impar (A, B, C, D)');
  });
});

describe('Hamilton', () => {
  beforeEach(() => {
    useEulerGraphStore.getState().loadExample('casa');
    useEulerGraphStore.setState({ past: [], future: [], selection: null });
  });

  it('encuentra un ciclo y valida una ruta construida en el lienzo', async () => {
    const { user, container } = await open('/simulaciones/euler-hamilton', 'Euler y Hamilton');
    await user.click(screen.getByRole('tab', { name: 'Hamilton' }));
    const analysis = region('Análisis');
    await user.click(within(analysis).getByRole('button', { name: 'Buscar ciclo hamiltoniano' }));
    expect(screen.getByTestId('hamilton-result')).toHaveTextContent('Existe solución: se encontró un ciclo hamiltoniano');

    await user.click(within(analysis).getByRole('radio', { name: 'Camino hamiltoniano' }));
    await user.click(within(analysis).getByRole('button', { name: 'Construir ruta' }));
    await waitFor(() => expect(container.querySelector('.react-flow__node[data-id="v5"]')).not.toBeNull());
    for (const id of ['v1', 'v2', 'v1']) clickVertex(container, id); // A, B, A (repetido)
    expect(screen.getByTestId('route-check')).toHaveTextContent('Paso 3: A ya fue visitado');
    await user.click(within(analysis).getByRole('button', { name: 'Quitar último' }));
    for (const id of ['v4', 'v5', 'v3']) clickVertex(container, id); // D, E, C
    expect(screen.getByTestId('route-check')).toHaveTextContent('La ruta es un camino hamiltoniano válido');
  });

  it('demuestra por búsqueda exhaustiva que Petersen no tiene ciclo hamiltoniano', async () => {
    useEulerGraphStore.getState().loadExample('petersen');
    const { user } = await open('/simulaciones/euler-hamilton', 'Euler y Hamilton');
    await user.click(screen.getByRole('tab', { name: 'Hamilton' }));
    const analysis = region('Análisis');
    await user.click(within(analysis).getByRole('button', { name: 'Buscar ciclo hamiltoniano' }));
    expect(screen.getByTestId('hamilton-result')).toHaveTextContent('Se demostró que no existe ciclo hamiltoniano');
    expect(screen.getByTestId('hamilton-result')).toHaveTextContent('búsqueda exhaustiva');
  });
});

describe('isomorfismo', () => {
  beforeEach(() => {
    const pair = ISOMORPHISM_PAIRS[0];
    if (!pair) throw new Error('faltan pares');
    useIsoG1Store.getState().replaceGraph(pair.g1, 'G1');
    useIsoG2Store.getState().replaceGraph(pair.g2, 'G2');
  });

  it('encuentra una correspondencia y la verifica como propuesta', async () => {
    const { user } = await open('/simulaciones/isomorfismo', 'Isomorfismo');
    const comparison = region('Comparación');
    const rows = within(screen.getByTestId('invariants')).getAllByRole('row').slice(1);
    expect(rows.every((r) => r.textContent?.endsWith('Sí'))).toBe(true);

    await user.click(within(comparison).getByRole('button', { name: 'Comprobar isomorfismo' }));
    expect(screen.getByTestId('iso-result')).toHaveTextContent('G1 y G2 son isomorfos');
    await user.click(within(comparison).getByRole('button', { name: 'Usar como propuesta' }));
    expect(screen.getByTestId('mapping-check')).toHaveTextContent('La correspondencia es un isomorfismo');

    // Cambiar una imagen rompe la biyección.
    await user.selectOptions(within(comparison).getByLabelText('f(A)'), within(comparison).getByLabelText('f(B)').querySelector('option:checked')?.textContent ?? '');
    expect(screen.getByTestId('mapping-check')).toHaveTextContent('no es inyectiva');
  });

  it('K3,3 y el prisma: mismos grados, pero no isomorfos', async () => {
    const { user } = await open('/simulaciones/isomorfismo', 'Isomorfismo');
    await user.selectOptions(screen.getByLabelText('Par de ejemplo'), 'k33-prisma');
    await user.click(screen.getByRole('button', { name: 'Cargar par en G1 y G2' }));
    const degrees = within(screen.getByTestId('invariants')).getByRole('row', { name: /Secuencia de grados/ });
    expect(degrees).toHaveTextContent('Sí');
    await user.click(within(region('Comparación')).getByRole('button', { name: 'Comprobar isomorfismo' }));
    expect(screen.getByTestId('iso-result')).toHaveTextContent('G1 y G2 no son isomorfos');
    expect(screen.getByTestId('iso-result')).toHaveTextContent('triángulos');
  });
});
