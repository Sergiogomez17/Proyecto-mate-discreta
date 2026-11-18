import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeftRight, CornerDownLeft, CornerDownRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { MAX_LABEL_LENGTH, subtreeIds, suggestLabel } from '@/algorithms/tree/editing';
import { computeProperties } from '@/algorithms/tree/properties';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Feedback } from '@/components/ui/Feedback';
import { inputClass } from '@/components/ui/formClasses';
import { useTreeStore } from '@/stores/treeStore';

export function NodeEditor() {
  const tree = useTreeStore((s) => s.tree);
  const selectedId = useTreeStore((s) => s.selectedId);
  // La clave reinicia los campos al cambiar de nodo seleccionado.
  return <NodeEditorContent key={`${selectedId ?? 'ninguno'}-${tree.rootId ?? 'vacio'}`} />;
}

function NodeEditorContent() {
  const tree = useTreeStore((s) => s.tree);
  const selectedId = useTreeStore((s) => s.selectedId);
  const actions = useTreeStore.getState();
  const select = useTreeStore((s) => s.select);
  const props = useMemo(() => computeProperties(tree), [tree]);
  const node = selectedId ? tree.nodes[selectedId] : undefined;
  const info = selectedId ? props.info.get(selectedId) : undefined;

  const [rename, setRename] = useState(node?.label ?? '');
  const [newLabel, setNewLabel] = useState(() => suggestLabel(tree));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameId = useId();
  const newLabelId = useId();
  const rootId = useId();

  const report = (err: string | null, message: string) => {
    setError(err);
    setSuccess(err ? null : message);
    return err === null;
  };

  // Árbol vacío: crear la raíz.
  if (tree.rootId === null) {
    const onCreate = (event: FormEvent) => {
      event.preventDefault();
      report(actions.createRoot(newLabel), `Raíz «${newLabel.trim()}» creada.`);
    };
    return (
      <form onSubmit={onCreate} className="space-y-3">
        <p className="text-sm text-ink-secondary">El árbol está vacío. Comience creando la raíz.</p>
        <label htmlFor={rootId} className="block text-sm font-semibold text-ink">
          Etiqueta de la raíz
        </label>
        <input id={rootId} className={inputClass} value={newLabel} maxLength={MAX_LABEL_LENGTH} onChange={(e) => setNewLabel(e.target.value)} />
        <Button type="submit" icon={<Plus aria-hidden className="size-4" />}>
          Crear raíz
        </Button>
        <Feedback error={error} success={success} />
      </form>
    );
  }

  if (!node || !info || !selectedId) {
    return (
      <div className="space-y-3 text-sm text-ink-secondary">
        <p>Seleccione un nodo en el dibujo (clic, o Tab y Enter) para editarlo y agregarle hijos.</p>
        <Button variant="secondary" onClick={() => select(tree.rootId)}>
          Seleccionar la raíz
        </Button>
      </div>
    );
  }

  const labelOf = (id: string | null) => (id ? (tree.nodes[id]?.label ?? '—') : '—');
  const toRemove = subtreeIds(tree, selectedId);

  const onRename = (event: FormEvent) => {
    event.preventDefault();
    if (rename.trim() === node.label) return report(null, 'La etiqueta no cambió.');
    report(actions.rename(selectedId, rename), `Nodo renombrado a «${rename.trim()}».`);
  };

  const onAdd = (side: 'left' | 'right') => {
    const label = newLabel.trim();
    const ok = report(actions.addChild(selectedId, side, newLabel), `Se agregó «${label}» como hijo ${side === 'left' ? 'izquierdo' : 'derecho'} de «${node.label}».`);
    // Se propone de inmediato la siguiente etiqueta libre.
    if (ok) setNewLabel(suggestLabel(useTreeStore.getState().tree));
  };

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-secondary">Nodo</dt>
        <dd className="font-semibold text-ink">{node.label}</dd>
        <dt className="text-ink-secondary">Tipo</dt>
        <dd className="text-ink">{info.isRoot ? (info.isLeaf ? 'Raíz y hoja' : 'Raíz') : info.isLeaf ? 'Hoja' : 'Interno'}</dd>
        <dt className="text-ink-secondary">Profundidad (nivel)</dt>
        <dd className="text-ink">{info.depth}</dd>
        <dt className="text-ink-secondary">Padre</dt>
        <dd className="text-ink">{labelOf(info.parentId)}</dd>
        <dt className="text-ink-secondary">Hijo izquierdo</dt>
        <dd className="text-ink">{labelOf(node.left)}</dd>
        <dt className="text-ink-secondary">Hijo derecho</dt>
        <dd className="text-ink">{labelOf(node.right)}</dd>
        <dt className="text-ink-secondary">Grado (hijos)</dt>
        <dd className="text-ink">{info.childCount}</dd>
      </dl>

      <form onSubmit={onRename} className="space-y-2">
        <label htmlFor={renameId} className="block text-sm font-semibold text-ink">
          Etiqueta
        </label>
        <div className="flex gap-2">
          <input id={renameId} className={inputClass} value={rename} maxLength={MAX_LABEL_LENGTH} onChange={(e) => setRename(e.target.value)} />
          <Button type="submit" variant="secondary" icon={<Pencil aria-hidden className="size-4" />}>
            Renombrar
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <label htmlFor={newLabelId} className="block text-sm font-semibold text-ink">
          Etiqueta del nuevo hijo
        </label>
        <input id={newLabelId} className={inputClass} value={newLabel} maxLength={MAX_LABEL_LENGTH} onChange={(e) => setNewLabel(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onAdd('left')} disabled={node.left !== null} icon={<CornerDownLeft aria-hidden className="size-4" />} title={node.left !== null ? 'Ya tiene hijo izquierdo' : undefined}>
            Hijo izquierdo
          </Button>
          <Button onClick={() => onAdd('right')} disabled={node.right !== null} icon={<CornerDownRight aria-hidden className="size-4" />} title={node.right !== null ? 'Ya tiene hijo derecho' : undefined}>
            Hijo derecho
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-card-border pt-4">
        <Button
          variant="secondary"
          disabled={node.left === null && node.right === null}
          onClick={() => report(actions.swapChildren(selectedId), `Se intercambiaron los hijos de «${node.label}».`)}
          icon={<ArrowLeftRight aria-hidden className="size-4" />}
        >
          Intercambiar hijos
        </Button>
        <Button variant="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 aria-hidden className="size-4" />}>
          Eliminar nodo
        </Button>
      </div>

      <Feedback error={error} success={success} />

      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar «${node.label}»?`}
        description={
          toRemove.length === 1
            ? `Se eliminará el nodo «${node.label}».`
            : `Se eliminará «${node.label}» junto con su subárbol: ${toRemove.length} nodos (${toRemove.map(labelOf).join(', ')}). En un árbol binario, sus descendientes no pueden quedar sin padre.`
        }
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          actions.removeSubtree(selectedId);
        }}
      />
    </div>
  );
}
