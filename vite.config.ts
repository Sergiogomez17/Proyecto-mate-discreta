/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/**
 * Política de seguridad de contenido. Solo se aplica a la compilación de producción (el servidor de
 * desarrollo usa scripts en línea para la recarga en caliente). Los estilos en línea son necesarios
 * para el lienzo de grafos y las animaciones; `blob:` permite exportar imágenes PNG.
 * La misma política se envía como encabezado HTTP en Vercel (`vercel.json`).
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
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
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
