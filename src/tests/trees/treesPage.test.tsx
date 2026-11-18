import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { useTreeStore } from '@/stores/treeStore';
import { renderApp } from '../renderApp';

const PATH = '/simulaciones/arboles-binarios';
const treeNodes = () => within(screen.getByRole('group', { name: /Árbol binario con/ })).getAllByRole('button');
const stat = (name: string) => screen.getByText(name, { selector: 'dt' }).nextElementSibling?.textContent;
/** El simulador se carga bajo demanda: se espera a que su página esté visible. */
const openModule = async () => {
  const rendered = renderApp(PATH);
  // La primera importación dinámica se compila en el momento: se da más margen que el segundo por defecto.
  await screen.findByRole('heading', { level: 1, name: 'Árboles binarios' }, { timeout: 5000 });
  return rendered;
};

describe('módulo de árboles binarios', () => {
  beforeEach(() => {
    useTreeStore.getState().loadExample('expresion');
    useTreeStore.getState().select(null);
  });
  afterEach(() => vi.useRealTimers());

  it('muestra el árbol de ejemplo y sus propiedades calculadas', async () => {
    await openModule();
    expect(treeNodes()).toHaveLength(7);
    expect(stat('Nodos')).toBe('7');
    expect(stat('Altura')).toBe('2');
    expect(stat('Raíz')).toBe('·');
    expect(screen.getByText(/Estructura válida/)).toBeInTheDocument();
  });

  it('agrega hijos a un nodo seleccionado y recalcula altura y niveles', async () => {
    const { user } = await openModule();
    await user.click(screen.getByRole('button', { name: /^Nodo a/ }));
    expect(screen.getByRole('button', { name: /^Nodo a, seleccionado/ })).toHaveAttribute('aria-pressed', 'true');

    const input = screen.getByLabelText('Etiqueta del nuevo hijo');
    await user.clear(input);
    await user.type(input, 'x');
    await user.click(screen.getByRole('button', { name: 'Hijo izquierdo' }));

    expect(screen.getByRole('status')).toHaveTextContent('Se agregó «x» como hijo izquierdo de «a».');
    expect(treeNodes()).toHaveLength(8);
    expect(stat('Altura')).toBe('3');
    expect(screen.getByRole('button', { name: 'Hijo izquierdo' })).toBeDisabled();
    // La siguiente etiqueta libre se propone automáticamente.
    expect(screen.getByLabelText('Etiqueta del nuevo hijo')).toHaveValue('A');
  });

  it('rechaza etiquetas repetidas con un mensaje claro', async () => {
    const { user } = await openModule();
    await user.click(screen.getByRole('button', { name: /^Nodo b/ }));
    const rename = screen.getByLabelText('Etiqueta');
    await user.clear(rename);
    await user.type(rename, 'a');
    await user.click(screen.getByRole('button', { name: 'Renombrar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe un nodo con la etiqueta «a»');
    expect(treeNodes().map((n) => n.getAttribute('aria-label'))).toContain('Nodo b, seleccionado');
  });

  it('elimina un nodo con su subárbol solo tras confirmar', async () => {
    const { user } = await openModule();
    await user.click(screen.getByRole('button', { name: /^Nodo \+/ }));
    await user.click(screen.getByRole('button', { name: 'Eliminar nodo' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('3 nodos (+, a, b)');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    expect(treeNodes()).toHaveLength(4);
    expect(stat('Nodos')).toBe('4');
  });

  it('reinicia el árbol tras confirmar y permite crear una raíz nueva', async () => {
    const { user } = await openModule();
    await user.click(screen.getByRole('button', { name: 'Reiniciar árbol' }));
    await user.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.getByText(/El árbol está vacío/, { selector: 'p.text-center' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear raíz' }));
    expect(treeNodes()).toHaveLength(1);
    expect(stat('Altura')).toBe('0');
  });

  it('recorre en inorden paso a paso hasta el resultado final', async () => {
    const { user } = await openModule();
    await user.click(screen.getByRole('tab', { name: 'Inorden' }));
    expect(screen.getByText('21 pasos · pulse «Iniciar» o «Paso siguiente»')).toBeInTheDocument();

    const next = screen.getByRole('button', { name: 'Paso siguiente' });
    await user.click(next);
    expect(screen.getByTestId('current-node')).toHaveTextContent('·');
    expect(screen.getByTestId('step-explanation')).toHaveTextContent('Se llama al recorrido en ·, la raíz del árbol.');

    for (let i = 0; i < 3; i++) await user.click(next); // entrar en +, entrar en a, registrar a
    expect(screen.getByTestId('current-node')).toHaveTextContent('a');
    expect(within(screen.getByTestId('sequence')).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['1a']);
    expect(screen.getByRole('button', { name: /^Nodo a.*visitado en el orden 1/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Paso anterior' }));
    expect(screen.getByText('Todavía no se ha registrado ningún nodo.')).toBeInTheDocument();

    while (!next.hasAttribute('disabled')) await user.click(next);
    expect(screen.getByTestId('final-result')).toHaveTextContent('a + b · c − d');
    expect(screen.getByText('Paso 21 de 21')).toBeInTheDocument();
  });

  it('reproduce automáticamente, se puede pausar y continuar', async () => {
    // Se simula solo setTimeout (el reloj del reproductor). Con temporizadores simulados se usa
    // fireEvent, que es síncrono: userEvent esperaría temporizadores que nunca avanzan.
    await openModule();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const click = (el: HTMLElement) => act(() => void fireEvent.click(el));
    // Cada tick programa el siguiente tras renderizarse, como en el navegador: se avanza de paso en paso.
    const advanceSteps = async (n: number) => {
      for (let i = 0; i < n; i++) await act(() => vi.advanceTimersByTimeAsync(1100));
    };
    await click(screen.getByRole('tab', { name: 'Por niveles' }));
    await click(screen.getByRole('button', { name: 'Iniciar' }));
    expect(screen.getByText('Paso 1 de 11')).toBeInTheDocument();
    expect(screen.getByText(/Cola \(frente → final\)/)).toHaveTextContent('·');

    await advanceSteps(2);
    expect(screen.getByText('Paso 3 de 11')).toBeInTheDocument();

    await click(screen.getByRole('button', { name: 'Pausar' }));
    await advanceSteps(5);
    expect(screen.getByText('Paso 3 de 11')).toBeInTheDocument();

    await click(screen.getByRole('button', { name: 'Continuar' }));
    await advanceSteps(12);
    expect(screen.getByTestId('final-result')).toHaveTextContent('· + − a b c d');
    expect(screen.getByRole('button', { name: 'Paso siguiente' })).toBeDisabled();
  });

  it('modificar el árbol reinicia el recorrido en curso', async () => {
    const { user } = await openModule();
    const next = screen.getByRole('button', { name: 'Paso siguiente' });
    await user.click(next);
    await user.click(next);
    await user.click(screen.getByRole('button', { name: /^Nodo c/ }));
    await user.click(screen.getByRole('button', { name: 'Hijo derecho' }));
    expect(screen.getByText('El recorrido aún no ha comenzado.')).toBeInTheDocument();
    expect(screen.getByText(/^24 pasos/)).toBeInTheDocument();
  });
});
