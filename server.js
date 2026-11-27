const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT || 5173);
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function createServer(backendUrl = BACKEND_URL) {
  return http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      try {
        const target = new URL(request.url, backendUrl);
        const headers = { ...request.headers, host: target.host };
        delete headers.connection;
        const upstream = await fetch(target, {
          method: request.method,
          headers,
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : request,
          duplex: 'half',
          redirect: 'manual',
        });
        const responseHeaders = Object.fromEntries(upstream.headers);
        delete responseHeaders['content-encoding'];
        delete responseHeaders['content-length'];
        response.writeHead(upstream.status, responseHeaders);
        response.end(Buffer.from(await upstream.arrayBuffer()));
      } catch {
        response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ detail: 'No se pudo conectar con el backend. Comprueba que Django esté en ejecución.' }));
      }
      return;
    }

    const fileName = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.resolve(ROOT, '.' + decodeURIComponent(fileName));
    if (!filePath.startsWith(ROOT + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = await fs.readFile(filePath);
      response.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      response.end(content);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('No encontrado');
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => console.log(`Frontend: http://localhost:${PORT} | Backend: ${BACKEND_URL}`));
}

module.exports = { createServer };

