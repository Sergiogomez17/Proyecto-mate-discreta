import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Copy, FileJson, Upload } from 'lucide-react';
import { fileNameFor, parseGraphJson, serializeGraph } from '@/algorithms/graph/serialization';
import { Button } from '@/components/ui/Button';
import { useGraphStore } from '@/stores/graphStore';
import { downloadText } from '@/utils/download';
import type { GraphWorkspaceState } from './useGraphWorkspace';

interface GraphSourcePanelProps {
  ws: GraphWorkspaceState;
  disabled?: boolean;
  /** Prefijo para distinguir controles si hay varios grafos en la página (por ejemplo, «G1»). */
  name?: string;
}

/**
 * Origen del grafo de un simulador: copiar el grafo del editor de grafos, importar o exportar JSON.
 * Así el docente construye el grafo una vez y lo analiza en cualquier módulo.
 */
export function GraphSourcePanel({ ws, disabled = false, name }: GraphSourcePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const suffix = name ? ` (${name})` : '';

  const copyFromEditor = () => {
    const { graph, name: editorName } = useGraphStore.getState();
    if (graph.vertices.length === 0) {
      ws.fail('El editor de grafos está vacío: construya allí un grafo o cargue un ejemplo aquí.');
      return;
    }
    ws.replaceGraph(graph, editorName);
    setErrors([]);
    ws.info(`Se copió «${editorName}» del editor de grafos (${graph.vertices.length} vértices, ${graph.edges.length} aristas). Puede volver al anterior con «Deshacer».`);
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = parseGraphJson(await file.text());
    if (!result.ok) {
      setErrors(result.errors);
      ws.fail(`No se importó «${file.name}».`);
      return;
    }
    setErrors([]);
    ws.replaceGraph(result.graph, result.name);
    ws.info([`Se importó «${result.name}». Puede volver al grafo anterior con «Deshacer».`, ...result.warnings].join(' '));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={copyFromEditor} disabled={disabled} icon={<Copy aria-hidden className="size-4" />}>
          Usar el grafo del editor{suffix}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={disabled} icon={<Upload aria-hidden className="size-4" />}>
          Importar JSON{suffix}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const { graph, name: graphName } = ws.useStore.getState();
            downloadText(fileNameFor(graphName, 'json'), serializeGraph(graph, graphName), 'application/json');
          }}
          icon={<FileJson aria-hidden className="size-4" />}
        >
          Exportar JSON{suffix}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-label={`Archivo JSON del grafo${suffix}`}
          onChange={(e) => void onFile(e)}
        />
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-danger">
          {errors.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
