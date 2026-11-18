import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useGraphStore } from '@/stores/graphStore';
import { renderApp } from '../renderApp';

const PATH = '/simulaciones/grafos';

/** El editor se carga bajo demanda: se espera a que su página esté visible. */
const openModule = async () => {
  const rendered = renderApp(PATH);
  await screen.findByRole('heading', { level: 1, name: 'Teoría de grafos' }, { timeout: 5000 });
  return rendered;
};
const region = (name: string) => screen.getByRole('region', { name });
const results = () => region('Resultados');
const stat = (label: string) => within(results()).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
const form = (name: string) => screen.getByRole('form', { name });
const adjacencyRow = (label: string) =>
  within(results())
    .getAllByRole('listitem')
    .map((li) => li.textContent)
    .find((text) => text?.startsWith(`${label} →`));

describe('módulo de teoría de grafos', () => {
  beforeEach(() => {
    useGraphStore.setState({ projects: [], selection: null });
    useGraphStore.getState().loadExample('ciudades');
    useGraphStore.setState({ past: [], future: [] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('dibuja el grafo de ejemplo y calcula sus propiedades', async () => {
    const { container } = await openModule();
    // React Flow monta vértices y aristas justo después de la página (en una ejecución en frío, con retraso).
    await waitFor(() => expect(container.querySelectorAll('.react-flow__node')).toHaveLength(6));
    await waitFor(() => expect(container.querySelectorAll('.react-flow__edge')).toHaveLength(9));
    expect(stat('Vértices |V|')).toBe('6');
    expect(stat('Aristas |E|')).toBe('9');
    expect(stat('Componentes conexas')).toBe('1');
    expect(within(results()).getByText(/la suma de los grados es 18 = 2 · 9/)).toBeInTheDocument();
    expect(adjacencyRow('A')).toBe('A → B(4), C(2)');
  });

  it('agrega un vértice y una arista ponderada desde el panel de propiedades', async () => {
    const { user } = await openModule();
    const vertexForm = form('Agregar vértice');
    expect(within(vertexForm).getByLabelText('Nombre del nuevo vértice')).toHaveValue('G');
    await user.click(within(vertexForm).getByRole('button', { name: 'Agregar vértice' }));
    expect(within(vertexForm).getByRole('status')).toHaveTextContent('Se agregó el vértice «G».');
    // El nombre propuesto se actualiza al siguiente libre.
    expect(within(vertexForm).getByLabelText('Nombre del nuevo vértice')).toHaveValue('H');

    const edgeForm = form('Agregar arista');
    await user.selectOptions(within(edgeForm).getByLabelText('Extremo 1'), 'G');
    await user.selectOptions(within(edgeForm).getByLabelText('Extremo 2'), 'A');
    const weight = within(edgeForm).getByLabelText('Peso');
    await user.clear(weight);
    await user.type(weight, '7,5');
    await user.click(within(edgeForm).getByRole('button', { name: 'Agregar arista' }));
    expect(within(edgeForm).getByRole('status')).toHaveTextContent('Se agregó la arista G — A con peso 7,5.');

    expect(stat('Aristas |E|')).toBe('10');
    expect(adjacencyRow('G')).toBe('G → A(7,5)');
    expect(adjacencyRow('A')).toBe('A → B(4), C(2), G(7,5)');
  });

  it('rechaza lazos y pesos no numéricos con mensajes claros', async () => {
    const { user } = await openModule();
    const edgeForm = form('Agregar arista');
    await user.selectOptions(within(edgeForm).getByLabelText('Extremo 2'), 'A');
    await user.click(within(edgeForm).getByRole('button', { name: 'Agregar arista' }));
    expect(within(edgeForm).getByRole('alert')).toHaveTextContent('No se permiten lazos');

    await user.selectOptions(within(edgeForm).getByLabelText('Extremo 2'), 'F');
    const weight = within(edgeForm).getByLabelText('Peso');
    await user.clear(weight);
    await user.type(weight, 'diez');
    await user.click(within(edgeForm).getByRole('button', { name: 'Agregar arista' }));
    expect(within(edgeForm).getByRole('alert')).toHaveTextContent('«diez» no es un número válido.');
    expect(stat('Aristas |E|')).toBe('9');
  });

  it('selecciona un vértice en el lienzo, lo renombra y lo elimina tras confirmar', async () => {
    const { user, container } = await openModule();
    // React Flow monta los vértices justo después de la página: se espera a que estén.
    const node = await waitFor(() => {
      const found = container.querySelector<HTMLElement>('.react-flow__node[data-id="v1"]');
      if (!found) throw new Error('No se dibujó el vértice A');
      return found;
    });
    // Clic sin «mousedown»: en jsdom los eventos de user-event no traen `view`, que d3-drag
    // (el arrastre de React Flow) necesita. El arrastre real se verificó en el navegador.
    fireEvent.click(node);

    const props = region('Propiedades');
    expect(within(props).getByRole('heading', { name: 'Vértice A' })).toBeInTheDocument();
    expect(within(props).getByText('Vecinos').nextElementSibling).toHaveTextContent('B, C');

    const name = within(props).getByLabelText('Nombre del vértice');
    await user.clear(name);
    await user.type(name, 'Origen');
    await user.click(within(props).getByRole('button', { name: 'Renombrar' }));
    expect(within(props).getByRole('heading', { name: 'Vértice Origen' })).toBeInTheDocument();

    await user.click(within(props).getByRole('button', { name: 'Eliminar vértice' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('sus 2 aristas incidentes');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    expect(stat('Vértices |V|')).toBe('5');
    expect(stat('Aristas |E|')).toBe('7');

    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(stat('Vértices |V|')).toBe('6');
    expect(adjacencyRow('Origen')).toBe('Origen → B(4), C(2)');
  });

  it('al pulsar el peso de una arista la selecciona y permite cambiarlo', async () => {
    const { user } = await openModule();
    // Las etiquetas de peso se dibujan cuando React Flow ya midió los vértices.
    fireEvent.click(await screen.findByRole('button', { name: 'Peso 10 de la arista C — E' }));
    const props = region('Propiedades');
    expect(within(props).getByRole('heading', { name: 'Arista C — E' })).toBeInTheDocument();
    const weight = within(props).getByLabelText('Peso de la arista');
    expect(weight).toHaveValue('10');
    await user.clear(weight);
    await user.type(weight, '3');
    await user.click(within(props).getByRole('button', { name: 'Cambiar peso' }));
    expect(within(props).getByText('Peso actualizado a 3.')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'Peso 3 de la arista C — E' })).toBeInTheDocument();
    expect(adjacencyRow('C')).toBe('C → A(2), B(1), D(8), E(3)');

    await user.click(within(props).getByRole('button', { name: 'Eliminar arista' }));
    expect(screen.getByText(/Se eliminó la arista C — E/)).toBeInTheDocument();
    expect(stat('Aristas |E|')).toBe('8');
  });

  it('al activar «Dirigido» muestra grados de entrada y salida y componentes fuertes', async () => {
    const { user } = await openModule();
    await user.click(screen.getByRole('switch', { name: 'Dirigido' }));
    expect(screen.getByRole('switch', { name: 'Dirigido' })).toHaveAttribute('aria-checked', 'true');
    expect(stat('Arcos |E|')).toBe('9');
    expect(within(results()).getByRole('columnheader', { name: 'Entrada' })).toBeInTheDocument();
    expect(stat('Fuertemente conexas')).toBe('6');
    expect(adjacencyRow('F')).toBe('F → ∅');
  });

  it('importa un grafo JSON tras confirmar el reemplazo', async () => {
    const { user } = await openModule();
    const json = JSON.stringify({ name: 'Triángulo', vertices: ['X', 'Y', 'Z'], edges: [{ source: 'X', target: 'Y' }, { source: 'Y', target: 'Z' }] });
    await user.upload(screen.getByLabelText('Archivo JSON del grafo'), new File([json], 'triangulo.json', { type: 'application/json' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('«Triángulo» (3 vértices, 2 aristas)');
    await user.click(within(dialog).getByRole('button', { name: 'Importar' }));

    const project = region('Proyecto');
    expect(within(project).getByRole('status')).toHaveTextContent('Se importó «Triángulo» (3 vértices, 2 aristas).');
    expect(within(project).getByLabelText('Nombre del proyecto')).toHaveValue('Triángulo');
    expect(stat('Vértices |V|')).toBe('3');
    expect(adjacencyRow('Y')).toBe('Y → X, Z');
  });

  it('informa los errores de un archivo inválido sin cambiar el grafo', async () => {
    const { user } = await openModule();
    const json = JSON.stringify({ vertices: ['A', 'A'], edges: [{ source: 'A', target: 'A' }] });
    await user.upload(screen.getByLabelText('Archivo JSON del grafo'), new File([json], 'malo.json', { type: 'application/json' }));
    const project = region('Proyecto');
    expect(await within(project).findByRole('alert')).toHaveTextContent('No se importó «malo.json»');
    expect(within(project).getByText(/Ya existe un vértice llamado «A»/)).toBeInTheDocument();
    expect(stat('Vértices |V|')).toBe('6');
  });

  it('exporta el grafo como JSON válido', async () => {
    const { user } = await openModule();
    let exported: Blob | undefined;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      exported = blob;
      return 'blob:grafo';
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await user.click(screen.getByRole('button', { name: 'Exportar JSON' }));
    expect(click).toHaveBeenCalledTimes(1);
    const data = JSON.parse(await (exported as Blob).text()) as { format: string; name: string; vertices: unknown[]; edges: unknown[] };
    expect(data).toMatchObject({ format: 'graphlab-uvg/grafo', name: 'Red de ciudades (ponderado)' });
    expect(data.vertices).toHaveLength(6);
    expect(data.edges).toHaveLength(9);
  });

  it('guarda el proyecto en el navegador y lo vuelve a abrir', async () => {
    const { user } = await openModule();
    const project = region('Proyecto');
    const name = within(project).getByLabelText('Nombre del proyecto');
    await user.clear(name);
    await user.type(name, 'Tarea 1');
    await user.click(within(project).getByRole('button', { name: 'Guardar en el navegador' }));
    expect(within(project).getByRole('status')).toHaveTextContent('Proyecto «Tarea 1» guardado en este navegador.');
    expect(within(project).getByText('Tarea 1', { selector: 'p' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reiniciar grafo' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reiniciar' }));
    expect(within(results()).getByText(/El grafo está vacío/)).toBeInTheDocument();

    await user.click(within(project).getByRole('button', { name: 'Abrir Tarea 1' }));
    expect(stat('Vértices |V|')).toBe('6');
  });
});
