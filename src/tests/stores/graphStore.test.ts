import { beforeEach, describe, expect, it } from 'vitest';
import { GRAPH_EXAMPLES } from '@/algorithms/graph/examples';
import { MAX_PROJECTS, useGraphStore } from '@/stores/graphStore';

const state = () => useGraphStore.getState();
const labels = () => state().graph.vertices.map((v) => v.label);

describe('almacén del editor de grafos', () => {
  beforeEach(() => {
    useGraphStore.setState({ past: [], future: [], projects: [], selection: null });
    state().loadExample('casa');
    useGraphStore.setState({ past: [], future: [] });
  });

  it('agrega un vértice, lo selecciona y permite deshacer y rehacer', () => {
    expect(state().addVertex('F', { x: 0, y: 0 })).toBeNull();
    expect(state().selection).toEqual({ kind: 'vertex', id: 'v6' });
    expect(labels()).toContain('F');
    state().undo();
    expect(labels()).not.toContain('F');
    expect(state().selection).toBeNull(); // el vértice ya no existe
    state().redo();
    expect(labels()).toContain('F');
  });

  it('devuelve el error sin modificar el grafo ni el historial', () => {
    expect(state().addVertex('A', { x: 0, y: 0 })).toMatch(/Ya existe/);
    expect(state().addEdge('v1', 'v1', 1)).toMatch(/lazos/);
    expect(state().past).toHaveLength(0);
  });

  it('mover sin desplazamiento no crea un paso en el historial', () => {
    const v = state().graph.vertices[0];
    if (!v) throw new Error('sin vértices');
    state().moveVertex(v.id, v.position);
    expect(state().past).toHaveLength(0);
    state().moveVertex(v.id, { x: v.position.x + 10, y: v.position.y });
    expect(state().past).toHaveLength(1);
  });

  it('una edición nueva descarta lo que se podía rehacer', () => {
    state().setDirected(true);
    state().undo();
    expect(state().future).toHaveLength(1);
    state().setWeighted(true);
    expect(state().future).toHaveLength(0);
  });

  it('elimina un vértice con sus aristas y limpia la selección', () => {
    state().select({ kind: 'vertex', id: 'v2' });
    expect(state().removeVertex('v2')).toBeNull();
    expect(state().selection).toBeNull();
    expect(state().graph.edges.some((e) => e.source === 'v2' || e.target === 'v2')).toBe(false);
  });

  it('guarda, sobrescribe, abre y elimina proyectos', () => {
    const now = new Date('2026-03-01T10:00:00Z');
    expect(state().saveProject('Mi casa', now)).toBeNull();
    expect(state().projects).toHaveLength(1);
    state().addVertex('Z', { x: 0, y: 0 });
    expect(state().saveProject('Mi casa', now)).toBeNull(); // mismo nombre: sobrescribe
    expect(state().projects).toHaveLength(1);
    expect(state().projects[0]?.graph.vertices).toHaveLength(6);

    state().loadExample('completo');
    const id = state().projects[0]?.id ?? '';
    expect(state().openProject(id)).toBeNull();
    expect(state().name).toBe('Mi casa');
    expect(labels()).toContain('Z');
    state().undo(); // abrir un proyecto también se puede deshacer
    expect(state().graph.edges).toHaveLength(10);

    state().deleteProject(id);
    expect(state().projects).toHaveLength(0);
    expect(state().openProject(id)).toMatch(/ya no existe/);
  });

  it(`limita los proyectos guardados a ${MAX_PROJECTS}`, () => {
    for (let i = 0; i < MAX_PROJECTS; i++) expect(state().saveProject(`P${i}`)).toBeNull();
    expect(state().saveProject('Uno más')).toMatch(/máximo/);
    expect(state().saveProject('P3')).toBeNull(); // sobrescribir sigue permitido
  });

  it('persiste el grafo y descarta datos guardados inválidos al recuperarlos', async () => {
    state().addVertex('Q', { x: 1, y: 2 });
    const key = 'graphlab-uvg:graph-editor';
    const saved = JSON.parse(window.localStorage.getItem(key) ?? '{}') as { state: { graph: { vertices: unknown[] } } };
    expect(saved.state.graph.vertices).toHaveLength(6);

    window.localStorage.setItem(
      key,
      JSON.stringify({ state: { graph: { directed: false, weighted: false, vertices: [{ id: 'v1', label: '', position: { x: 0, y: 0 } }], edges: [] }, name: 'X', projects: [{ id: 'p', name: 'roto' }] }, version: 1 }),
    );
    await useGraphStore.persist.rehydrate();
    expect(state().graph.vertices).toHaveLength(6); // se conserva el grafo vigente
    expect(state().projects).toEqual([]);

    const valid = GRAPH_EXAMPLES.find((e) => e.id === 'konigsberg')?.graph;
    window.localStorage.setItem(key, JSON.stringify({ state: { graph: valid, name: 'Königsberg', projects: [] }, version: 1 }));
    await useGraphStore.persist.rehydrate();
    expect(state().name).toBe('Königsberg');
    expect(state().graph.edges).toHaveLength(7);
  });
});
