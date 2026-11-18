import { useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Download, FileJson, FolderOpen, Image as ImageIcon, Save, Trash2, Upload } from 'lucide-react';
import { fileNameFor, normalizeName, parseGraphJson, serializeGraph } from '@/algorithms/graph/serialization';
import { graphToSvg } from '@/components/graph/svgExport';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Feedback } from '@/components/ui/Feedback';
import { inputClass, labelClass } from '@/components/ui/formClasses';
import { MAX_PROJECTS } from '@/stores/graphStore';
import { useActiveGraphStore } from '@/stores/graphStoreContext';
import type { Graph } from '@/types/graph';
import { downloadBlob, downloadText, svgToPngBlob } from '@/utils/download';

type Pending =
  | { type: 'overwrite'; name: string }
  | { type: 'open'; id: string; name: string }
  | { type: 'delete'; id: string; name: string }
  | { type: 'import'; graph: Graph; name: string; warnings: string[] }
  | null;

const dateFormat = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' });

interface ProjectPanelProps {
  /** Se llama cuando el grafo se reemplaza por uno importado o guardado (para reencuadrar la vista). */
  onGraphReplaced: () => void;
}

/** Guardado de proyectos en el navegador, exportación (JSON, SVG, PNG) e importación de JSON. */
export function ProjectPanel({ onGraphReplaced }: ProjectPanelProps) {
  const useStore = useActiveGraphStore();
  const graph = useStore((s) => s.graph);
  const name = useStore((s) => s.name);
  const projects = useStore((s) => s.projects);
  const { setName, saveProject, openProject, deleteProject, replaceGraph } = useStore.getState();
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const savedId = useId();
  const isEmpty = graph.vertices.length === 0;

  const report = (err: string | null, message: string) => {
    setError(err);
    setSuccess(err ? null : message);
    if (!err) setImportErrors([]);
  };

  const save = (projectName: string) => report(saveProject(projectName), `Proyecto «${normalizeName(projectName)}» guardado en este navegador.`);

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    const target = normalizeName(name);
    if (projects.some((p) => p.name === target)) setPending({ type: 'overwrite', name: target });
    else save(target);
  };

  const open = (id: string, projectName: string) => {
    report(openProject(id), `Se abrió el proyecto «${projectName}».`);
    onGraphReplaced();
  };

  const exportJson = () => {
    downloadText(fileNameFor(name, 'json'), serializeGraph(graph, name), 'application/json');
    report(null, 'Archivo JSON generado.');
  };
  const exportSvg = () => {
    downloadText(fileNameFor(name, 'svg'), graphToSvg(graph, name).svg, 'image/svg+xml');
    report(null, 'Imagen SVG generada.');
  };
  const exportPng = async () => {
    try {
      const { svg, width, height } = graphToSvg(graph, name);
      downloadBlob(fileNameFor(name, 'png'), await svgToPngBlob(svg, width, height));
      report(null, 'Imagen PNG generada.');
    } catch (err) {
      report(err instanceof Error ? err.message : 'No se pudo generar la imagen PNG.', '');
    }
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportErrors([]);
      return report('No se pudo leer el archivo.', '');
    }
    const result = parseGraphJson(text);
    if (!result.ok) {
      setSuccess(null);
      setError(`No se importó «${file.name}»:`);
      setImportErrors(result.errors);
      return;
    }
    if (isEmpty) applyImport(result.graph, result.name, result.warnings);
    else setPending({ type: 'import', graph: result.graph, name: result.name, warnings: result.warnings });
  };

  const applyImport = (imported: Graph, importedName: string, warnings: string[]) => {
    replaceGraph(imported, importedName);
    report(null, [`Se importó «${importedName}» (${imported.vertices.length} vértices, ${imported.edges.length} aristas).`, ...warnings].join(' '));
    onGraphReplaced();
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.type === 'overwrite') save(pending.name);
    if (pending.type === 'open') open(pending.id, pending.name);
    if (pending.type === 'delete') {
      deleteProject(pending.id);
      report(null, `Se eliminó el proyecto «${pending.name}».`);
    }
    if (pending.type === 'import') applyImport(pending.graph, pending.name, pending.warnings);
    setPending(null);
  };

  const dialog = (() => {
    switch (pending?.type) {
      case 'overwrite':
        return { title: '¿Sobrescribir el proyecto?', description: `Ya existe un proyecto llamado «${pending.name}». Se reemplazará por el grafo actual.`, label: 'Sobrescribir' };
      case 'open':
        return { title: '¿Abrir el proyecto?', description: `El grafo actual se reemplazará por «${pending.name}». Puede volver a él con «Deshacer».`, label: 'Abrir', tone: 'primary' as const };
      case 'delete':
        return { title: '¿Eliminar el proyecto guardado?', description: `Se borrará «${pending.name}» de este navegador. Esta acción no se puede deshacer.`, label: 'Eliminar' };
      case 'import':
        return {
          title: '¿Reemplazar el grafo actual?',
          description: `Se cargará «${pending.name}» (${pending.graph.vertices.length} vértices, ${pending.graph.edges.length} aristas). Puede volver al grafo actual con «Deshacer».`,
          label: 'Importar',
          tone: 'primary' as const,
        };
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-6">
      <form onSubmit={onSave} className="space-y-2">
        <label htmlFor={nameId} className={labelClass}>
          Nombre del proyecto
        </label>
        <input id={nameId} className={inputClass} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" icon={<Save aria-hidden className="size-4" />}>
          Guardar en el navegador
        </Button>
      </form>

      <section aria-labelledby={savedId} className="space-y-2">
        <h3 id={savedId} className="text-sm font-bold tracking-wide text-navy-panel uppercase">
          Proyectos guardados ({projects.length}/{MAX_PROJECTS})
        </h3>
        {projects.length === 0 ? (
          <p className="text-sm text-ink-secondary">Todavía no hay proyectos guardados en este navegador.</p>
        ) : (
          <ul className="divide-y divide-card-border rounded-lg border border-card-border bg-white/70">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-secondary">
                    {p.graph.vertices.length} vértices · {p.graph.edges.length} aristas · {dateFormat.format(new Date(p.savedAt))}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Abrir ${p.name}`}
                  onClick={() => (isEmpty ? open(p.id, p.name) : setPending({ type: 'open', id: p.id, name: p.name }))}
                  icon={<FolderOpen aria-hidden className="size-4" />}
                >
                  Abrir
                </Button>
                <Button variant="ghost" size="sm" aria-label={`Eliminar ${p.name}`} onClick={() => setPending({ type: 'delete', id: p.id, name: p.name })} icon={<Trash2 aria-hidden className="size-4" />}>
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink-secondary">Los proyectos se guardan solo en este navegador. Para llevarlos a otro equipo, use «Exportar JSON».</p>
      </section>

      <div className="space-y-2">
        <p className={labelClass}>Exportar e importar</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={exportJson} icon={<FileJson aria-hidden className="size-4" />}>
            Exportar JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={exportSvg} disabled={isEmpty} icon={<Download aria-hidden className="size-4" />}>
            Exportar SVG
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void exportPng()} disabled={isEmpty} icon={<ImageIcon aria-hidden className="size-4" />}>
            Exportar PNG
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()} icon={<Upload aria-hidden className="size-4" />}>
            Importar JSON
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="Archivo JSON del grafo" onChange={(e) => void onFile(e)} />
        </div>
      </div>

      <div className="space-y-1">
        <Feedback error={error} success={success} />
        {importErrors.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-danger">
            {importErrors.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        description={dialog?.description ?? ''}
        confirmLabel={dialog?.label ?? 'Confirmar'}
        tone={dialog && 'tone' in dialog ? dialog.tone : 'danger'}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
