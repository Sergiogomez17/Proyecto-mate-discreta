import { useState } from 'react';
import { BookOpen, CircleHelp, Database, Milestone, Share2 } from 'lucide-react';
import { MODULES } from '@/app/modules';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Panel } from '@/components/ui/Panel';
import { HelpSection } from '@/modules/dashboard/HelpSection';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { STORAGE_PREFIX } from '@/utils/storage';
import { ALGORITHM_DOCS } from './algorithmDocs';

const PHASES = [
  { phase: 1, title: 'Base del proyecto', detail: 'Arquitectura, diseño global, panel principal, navegación y componentes reutilizables.' },
  { phase: 2, title: 'Árboles binarios', detail: 'Editor, propiedades y recorridos animados.' },
  { phase: 3, title: 'Editor de grafos', detail: 'Vértices, aristas, pesos, grados, matrices e importación y exportación.' },
  { phase: 4, title: 'Algoritmos', detail: 'Euler, Fleury, Hamilton, isomorfismo, Dijkstra, BFS y DFS.' },
  { phase: 5, title: 'Laboratorio académico', detail: 'Ejercicios, calificación y retroalimentación.' },
  { phase: 6, title: 'Calidad y despliegue', detail: 'Pruebas de interfaz, optimización, documentación y publicación.' },
];

type PhaseStatus = 'done' | 'in-progress' | 'pending';

/** Estado de cada fase; se actualiza al cerrar cada una. */
const PHASE_STATUS: Record<number, PhaseStatus> = { 1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done', 6: 'in-progress' };
const STATUS_LABEL: Record<PhaseStatus, string> = { done: 'Completada', 'in-progress': 'En curso', pending: 'Pendiente' };

/** Borra todas las claves de GraphLab del almacenamiento local. */
function clearAllData() {
  try {
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(`${STORAGE_PREFIX}:`));
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    /* almacenamiento no disponible: no hay nada guardado */
  }
}

export function HelpPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [cleared, setCleared] = useState(false);
  const resetPreferences = usePreferencesStore((s) => s.resetPreferences);

  return (
    <>
      <PageHeader
        eyebrow="Ayuda"
        title="Guía de uso de GraphLab"
        description="Cómo está organizada la plataforma, qué convenciones matemáticas sigue y dónde se guardan sus datos."
        icon={CircleHelp}
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Ayuda' }]}
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-10 sm:px-6 lg:px-8">
        <HelpSection collapsible={false} />

        <div className="grid gap-8 lg:grid-cols-2">
          <Panel title="Política de grafos" description="Convenciones que respetan todos los algoritmos" icon={Share2}>
            <ul className="space-y-3 text-sm leading-relaxed text-ink-secondary">
              <li>
                <strong className="text-ink">Lazos:</strong> no se permiten aristas de un vértice a sí mismo.
              </li>
              <li>
                <strong className="text-ink">Aristas paralelas:</strong> se permiten (multigrafos), por ejemplo para los puentes de Königsberg. Cada una cuenta
                para el grado y la matriz de adyacencia muestra su multiplicidad.
              </li>
              <li>
                <strong className="text-ink">Grafos dirigidos:</strong> u→v y v→u son arcos distintos. Se distinguen grado de entrada y de salida.
              </li>
              <li>
                <strong className="text-ink">Pesos:</strong> números reales finitos. Sin ponderación, cada arista pesa 1. Dijkstra no acepta pesos negativos.
              </li>
              <li>
                <strong className="text-ink">Cruces:</strong> que dos aristas se crucen en el dibujo no crea un vértice.
              </li>
              <li>
                <strong className="text-ink">Orden de vecinos:</strong> los recorridos exploran los vecinos por nombre, de forma determinista.
              </li>
              <li>
                <strong className="text-ink">Altura de un árbol:</strong> número de aristas de la raíz a la hoja más lejana (un solo nodo: altura 0).
              </li>
            </ul>
          </Panel>

          <Panel title="Estado del desarrollo" description="Plan por fases" icon={Milestone}>
            <ol className="space-y-3">
              {PHASES.map((p) => {
                const status = PHASE_STATUS[p.phase] ?? 'pending';
                const modules = MODULES.filter((m) => m.phase === p.phase).map((m) => m.title);
                return (
                  <li key={p.phase} className="surface-card rounded-lg p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-ink">
                        Fase {p.phase} · {p.title}
                      </span>
                      <Badge tone={status === 'done' ? 'success' : status === 'in-progress' ? 'warning' : 'neutral'}>{STATUS_LABEL[status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-secondary">{p.detail}</p>
                    {modules.length > 0 && <p className="mt-1 text-xs text-ink-secondary">Módulos: {modules.join(', ')}</p>}
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>

        <Panel id="algoritmos" title="Documentación de algoritmos" description="Idea, complejidad y convenciones de cada algoritmo implementado" icon={BookOpen}>
          <div className="grid gap-4 md:grid-cols-2">
            {ALGORITHM_DOCS.map((doc) => (
              <article key={doc.name} className="surface-card space-y-1.5 rounded-lg p-4 text-sm">
                <h3 className="font-semibold text-ink">{doc.name}</h3>
                <p className="text-xs text-ink-secondary">{doc.where}</p>
                <p className="text-ink">{doc.idea}</p>
                <p className="text-ink-secondary">
                  <strong className="text-ink">Complejidad:</strong> {doc.complexity}
                </p>
                {doc.notes && <p className="text-ink-secondary">{doc.notes}</p>}
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Datos guardados en este navegador" icon={Database}>
          <p className="text-sm text-ink-secondary">
            GraphLab no tiene servidor ni cuentas. En el almacenamiento local de este navegador se guardan: las preferencias (último módulo visitado y estado de
            la guía rápida), el grafo de trabajo de cada simulador, los proyectos guardados del editor de grafos y el historial del laboratorio de práctica. Para
            llevar un grafo a otro equipo, expórtelo en JSON.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              Restablecer preferencias
            </Button>
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Borrar todos los datos de GraphLab
            </Button>
            <p role="status" className="text-sm font-medium text-success">
              {cleared ? 'Preferencias restablecidas.' : ''}
            </p>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Restablecer preferencias?"
        description="Se borrarán el último módulo visitado y el estado de la guía rápida guardados en este navegador. Esta acción no se puede deshacer."
        confirmLabel="Restablecer"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          resetPreferences();
          setConfirmOpen(false);
          setCleared(true);
        }}
      />
      <ConfirmDialog
        open={confirmAll}
        title="¿Borrar todos los datos de GraphLab?"
        description="Se eliminarán de este navegador los grafos de todos los módulos, los proyectos guardados, el historial de práctica y las preferencias. La página se recargará con los ejemplos iniciales. Esta acción no se puede deshacer."
        confirmLabel="Borrar todo"
        onCancel={() => setConfirmAll(false)}
        onConfirm={() => {
          clearAllData();
          // Se recarga para que ningún módulo vuelva a guardar los datos que tenía en memoria.
          window.location.reload();
        }}
      />
    </>
  );
}
