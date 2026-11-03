const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

// Use a temporary data file so the tests never touch data/tasks.json
const tempDir = require('node:fs').mkdtempSync(path.join(os.tmpdir(), 'tasks-api-'));
process.env.TASKS_FILE = path.join(tempDir, 'tasks.json');

const { app, loadTasks, DATA_FILE } = require('../tasks-api');

const startingTasks = [
  { id: 1, title: 'Buy milk for the chai stall', done: false },
  { id: 2, title: 'Finish the Express routes lesson', done: true },
  { id: 3, title: 'Push the Tasks API to GitHub', done: false },
];

let server;
let baseUrl;

before(async () => {
  await fs.writeFile(DATA_FILE, JSON.stringify(startingTasks));
  await loadTasks();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  server.close();
  await fs.rm(tempDir, { recursive: true, force: true });
});

function request(method, urlPath, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return fetch(baseUrl + urlPath, options).then(async (res) => ({
    status: res.status,
    body: await res.json(),
  }));
}

async function readDataFile() {
  return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
}

test('GET /tasks returns the tasks loaded from the file', async () => {
  const res = await request('GET', '/tasks');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, startingTasks);
});

test('GET /tasks/:id returns one task, 404 if missing, 400 if invalid', async () => {
  assert.equal((await request('GET', '/tasks/1')).body.id, 1);
  assert.equal((await request('GET', '/tasks/99')).status, 404);
  assert.equal((await request('GET', '/tasks/abc')).status, 400);
});

test('POST /tasks creates a task with 201 and saves it to the file', async () => {
  const res = await request('POST', '/tasks', { title: '  Write tests  ' });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { id: 4, title: 'Write tests', done: false });
  assert.deepEqual((await readDataFile()).at(-1), res.body);
});

test('a created task is still there after reloading the file (restart)', async () => {
  await loadTasks();
  const res = await request('GET', '/tasks/4');
  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'Write tests');
});

test('POST /tasks rejects bad input with 400 and does not change the file', async () => {
  const before = await readDataFile();
  assert.equal((await request('POST', '/tasks', {})).status, 400);
  assert.equal((await request('POST', '/tasks', { title: '' })).status, 400);
  assert.equal((await request('POST', '/tasks', { title: 'x', done: 'yes' })).status, 400);
  assert.equal((await request('POST', '/tasks', ['not', 'an', 'object'])).status, 400);
  assert.equal((await request('POST', '/tasks', '{"title": "oops"')).status, 400);
  assert.deepEqual(await readDataFile(), before);
});

test('PUT /tasks/:id updates only the fields sent and saves', async () => {
  const res = await request('PUT', '/tasks/1', { done: true });
  assert.equal(res.status, 200);
  assert.equal(res.body.done, true);
  assert.equal(res.body.title, 'Buy milk for the chai stall');
  assert.equal((await readDataFile()).find((task) => task.id === 1).done, true);
  assert.equal((await request('PUT', '/tasks/1', {})).status, 400);
  assert.equal((await request('PUT', '/tasks/99', { done: true })).status, 404);
});

test('DELETE /tasks/:id removes the task from the file, then 404', async () => {
  const res = await request('DELETE', '/tasks/3');
  assert.equal(res.status, 200);
  assert.equal(res.body.task.id, 3);
  assert.equal((await readDataFile()).some((task) => task.id === 3), false);
  assert.equal((await request('DELETE', '/tasks/3')).status, 404);
});

test('parallel POST requests are all saved with unique ids', async () => {
  const titles = ['One', 'Two', 'Three', 'Four', 'Five'];
  const results = await Promise.all(titles.map((title) => request('POST', '/tasks', { title })));
  const ids = results.map((res) => res.body.id);
  assert.equal(new Set(ids).size, titles.length);
  const saved = await readDataFile();
  for (const title of titles) {
    assert.ok(saved.some((task) => task.title === title));
  }
});

test('new ids continue from the highest saved id after a restart', async () => {
  await loadTasks();
  const maxId = Math.max(...(await readDataFile()).map((task) => task.id));
  const res = await request('POST', '/tasks', { title: 'After restart' });
  assert.equal(res.body.id, maxId + 1);
});

test('unknown routes return a JSON 404', async () => {
  assert.equal((await request('GET', '/projects')).status, 404);
});
