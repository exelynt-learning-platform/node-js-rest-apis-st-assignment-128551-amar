const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../tasks-api');

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
});

function request(method, path, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return fetch(baseUrl + path, options).then(async (res) => ({
    status: res.status,
    body: await res.json(),
  }));
}

test('GET /tasks returns the three starting tasks', async () => {
  const res = await request('GET', '/tasks');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 3);
});

test('GET /tasks/:id returns one task, 404 if missing, 400 if invalid', async () => {
  assert.equal((await request('GET', '/tasks/1')).body.id, 1);
  assert.equal((await request('GET', '/tasks/99')).status, 404);
  assert.equal((await request('GET', '/tasks/abc')).status, 400);
});

test('POST /tasks creates a task with 201', async () => {
  const res = await request('POST', '/tasks', { title: '  Write tests  ' });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { id: 4, title: 'Write tests', done: false });
});

test('POST /tasks rejects bad input with 400', async () => {
  assert.equal((await request('POST', '/tasks', {})).status, 400);
  assert.equal((await request('POST', '/tasks', { title: '' })).status, 400);
  assert.equal((await request('POST', '/tasks', { title: 'x', done: 'yes' })).status, 400);
  assert.equal((await request('POST', '/tasks', ['not', 'an', 'object'])).status, 400);
  assert.equal((await request('POST', '/tasks', '{"title": "oops"')).status, 400);
});

test('PUT /tasks/:id updates only the fields sent', async () => {
  const res = await request('PUT', '/tasks/1', { done: true });
  assert.equal(res.status, 200);
  assert.equal(res.body.done, true);
  assert.equal(res.body.title, 'Buy milk for the chai stall');
  assert.equal((await request('PUT', '/tasks/1', {})).status, 400);
  assert.equal((await request('PUT', '/tasks/99', { done: true })).status, 404);
});

test('DELETE /tasks/:id removes the task, then 404', async () => {
  const res = await request('DELETE', '/tasks/3');
  assert.equal(res.status, 200);
  assert.equal(res.body.task.id, 3);
  assert.equal((await request('DELETE', '/tasks/3')).status, 404);
});

test('unknown routes return a JSON 404', async () => {
  assert.equal((await request('GET', '/projects')).status, 404);
});
