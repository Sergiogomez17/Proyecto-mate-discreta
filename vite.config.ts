/// <reference types="vitest/config" />
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { STATIC_PATHS } from './src/app/staticPaths';

/**
 * Ruta base del sitio. GitHub Pages lo publica en https://sergiogomez17.github.io/Proyecto-mate-discreta/,
 * así que todos los recursos y rutas cuelgan de `/Proyecto-mate-discreta/`. Para publicarlo en la raíz
 * de un dominio (por ejemplo, en Vercel), compile con la variable de entorno `BASE_PATH=/`.
 */
const BASE_PATH = process.env.BASE_PATH ?? '/Proyecto-mate-discreta/';

/**
 * GitHub Pages no reescribe rutas hacia `index.html` como un servidor de aplicaciones. Tras compilar:
 * - se copia `index.html` en la carpeta de cada ruta interna (`laboratorio/index.html`, …), de modo que
 *   recargar o abrir un enlace a cualquier módulo responde 200 y la aplicación muestra esa página;
 * - se copia también como `404.html`, que GitHub Pages sirve para direcciones desconocidas: así la
 *   aplicación arranca y muestra su propia página «Página no encontrada».
 * Los recursos usan rutas absolutas con la base, por lo que funcionan desde cualquier carpeta.
 */
function githubPagesRoutes(): Plugin {
  return {
    name: 'graphlab-github-pages-routes',
    apply: 'build',
    async writeBundle(options) {
      const outDir = options.dir ?? 'dist';
      const html = await readFile(join(outDir, 'index.html'), 'utf8');
      await writeFile(join(outDir, '404.html'), html);
      for (const path of STATIC_PATHS) {
        await mkdir(join(outDir, path), { recursive: true });
        await writeFile(join(outDir, path, 'index.html'), html);
      }
    },
  };
}

/**
 * Política de seguridad de contenido. Solo se aplica a la compilación de producción (el servidor de
 * desarrollo usa scripts en línea para la recarga en caliente). Los estilos en línea son necesarios
 * para el lienzo de grafos y las animaciones; `blob:` permite exportar imágenes PNG.
 * GitHub Pages no permite encabezados propios, así que la política viaja en esta etiqueta <meta>;
 * en Vercel, `vercel.json` también la envía como encabezado HTTP.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'graphlab-content-security-policy',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`),
  };
}

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss(), contentSecurityPolicy(), githubPagesRoutes()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // React y React Router cambian poco entre versiones: en un paquete aparte siguen en la caché
        // del navegador cuando se publica una versión nueva de la aplicación.
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'react';
          // Bibliotecas grandes que solo usan algunos módulos (se descargan al abrirlos).
          if (/node_modules[\\/](@xyflow|d3-[a-z-]+|classcat)[\\/]/.test(id)) return 'react-flow';
          if (/node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    // Las pruebas de interfaz recorren simulaciones completas en jsdom; en paralelo pueden superar 5 s.
    testTimeout: 20_000,
  },
});
