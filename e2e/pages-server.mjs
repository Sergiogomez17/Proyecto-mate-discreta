// Servidor estático que imita a GitHub Pages para las pruebas de punta a punta.
// Uso: node e2e/pages-server.mjs [puerto]   (sirve la carpeta dist/ en http://localhost:<puerto>/Proyecto-mate-discreta/)
//
// Igual que GitHub Pages:
// - solo hay archivos estáticos: no se reescribe ninguna ruta hacia index.html;
// - una carpeta pedida sin barra final se redirige (301) a la misma dirección con barra;
// - una carpeta con barra final sirve su index.html;
// - una dirección inexistente responde 404 con el contenido de 404.html.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.argv[2] ?? 4173);
const BASE = '/Proyecto-mate-discreta';
const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.map': 'application/json',
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function send(res, status, path) {
  const body = await readFile(path);
  res.writeHead(status, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === BASE) {
      res.writeHead(301, { Location: `${BASE}/${url.search}` });
      return res.end();
    }
    if (!pathname.startsWith(`${BASE}/`)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Fuera del sitio publicado.');
    }
    const file = normalize(join(ROOT, pathname.slice(BASE.length)));
    if (!file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep) && file !== ROOT.replace(/[\\/]$/, '')) {
      res.writeHead(403);
      return res.end();
    }
    if (await isDirectory(file)) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: `${pathname}/${url.search}` });
        return res.end();
      }
      const index = join(file, 'index.html');
      if (await isFile(index)) return send(res, 200, index);
    } else if (await isFile(file)) {
      return send(res, 200, file);
    }
    return send(res, 404, join(ROOT, '404.html'));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(error));
  }
});

server.listen(PORT, () => {
  console.log(`GitHub Pages simulado: http://localhost:${PORT}${BASE}/`);
});
