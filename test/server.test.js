const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { createServer } = require('../server');

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

async function close(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

test('sirve el frontend y reenvía solicitudes CRUD a Django', async () => {
  const received = [];
  const backend = http.createServer(async (request, response) => {
    const body = [];
    for await (const chunk of request) body.push(chunk);
    received.push({ method: request.method, url: request.url, body: Buffer.concat(body).toString() });
    response.writeHead(request.method === 'DELETE' ? 204 : 200, { 'content-type': 'application/json' });
    response.end(request.method === 'DELETE' ? undefined : JSON.stringify({ ok: true }));
  });
  const backendUrl = await listen(backend);
  const frontend = createServer(backendUrl);
  const frontendUrl = await listen(frontend);
  try {
    const page = await fetch(frontendUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Cada historia/);

    const list = await fetch(frontendUrl + '/api/libros/');
    assert.deepEqual(await list.json(), { ok: true });
    const create = await fetch(frontendUrl + '/api/canciones/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ titulo: 'Prueba' }) });
    assert.equal(create.status, 200);
    const remove = await fetch(frontendUrl + '/api/canciones/7/', { method: 'DELETE' });
    assert.equal(remove.status, 204);
    assert.deepEqual(received, [
      { method: 'GET', url: '/api/libros/', body: '' },
      { method: 'POST', url: '/api/canciones/', body: '{"titulo":"Prueba"}' },
      { method: 'DELETE', url: '/api/canciones/7/', body: '' },
    ]);
  } finally {
    await close(frontend);
    await close(backend);
  }
});

