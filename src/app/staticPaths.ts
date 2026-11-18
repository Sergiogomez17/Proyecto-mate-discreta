/**
 * Rutas internas de la aplicación (sin barra inicial).
 *
 * GitHub Pages es un servidor de archivos estáticos: al recargar `…/laboratorio` busca la carpeta
 * `laboratorio/`. Por eso la compilación crea una copia de `index.html` en cada una de estas rutas
 * (ver `vite.config.ts`), y la aplicación arranca en la página pedida con respuesta 200.
 *
 * Este archivo no importa nada: lo usa también la configuración de Vite. Una prueba comprueba que
 * coincide con el registro de módulos (`modules.ts`).
 */
export const STATIC_PATHS = [
  'simulaciones',
  'ayuda',
  'laboratorio',
  'simulaciones/arboles-binarios',
  'simulaciones/grafos',
  'simulaciones/euler-hamilton',
  'simulaciones/isomorfismo',
  'simulaciones/dijkstra',
  'simulaciones/bfs-dfs',
] as const;
