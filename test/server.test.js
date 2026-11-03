const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

// Use a temporary data file so the tests never touch data/applications.json
const tempDir = require('node:fs').mkdtempSync(path.join(os.tmpdir(), 'applications-api-'));
process.env.APPLICATIONS_FILE = path.join(tempDir, 'applications.json');

const { app, loadApplications, DATA_FILE } = require('../server');

const sampleApplications = [
  { id: 1, company: 'Infosys', role: 'Backend Developer Intern', status: 'applied' },
  { id: 2, company: 'Zoho', role: 'Node.js Developer', status: 'interview' },
  { id: 3, company: 'Razorpay', role: 'Software Engineer Intern', status: 'offer' },
];

let server;
let baseUrl;

before(async () => {
  await fs.writeFile(DATA_FILE, JSON.stringify(sampleApplications));
  await loadApplications();
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
    contentType: res.headers.get('content-type'),
    body: await res.json(),
  }));
}

async function readDataFile() {
  return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
}

test('GET /applications lists the applications loaded from the file as JSON', async () => {
  const res = await request('GET', '/applications');
  assert.equal(res.status, 200);
  assert.match(res.contentType, /application\/json/);
  assert.deepEqual(res.body, sampleApplications);
});

test('GET /applications/:id returns one application', async () => {
  const res = await request('GET', '/applications/2');
  assert.equal(res.status, 200);
  assert.equal(res.body.company, 'Zoho');
});

test('GET /applications/:id returns 404 for a missing id and 400 for an invalid id', async () => {
  assert.equal((await request('GET', '/applications/999')).status, 404);
  assert.equal((await request('GET', '/applications/abc')).status, 400);
  assert.equal((await request('GET', '/applications/0')).status, 400);
});

test('POST /applications creates an application with 201, default status, and saves it', async () => {
  const res = await request('POST', '/applications', { company: '  Freshworks ', role: 'API Developer Intern' });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { id: 4, company: 'Freshworks', role: 'API Developer Intern', status: 'applied' });
  assert.deepEqual((await readDataFile()).at(-1), res.body);
});

test('a new application is still there after reloading the file (restart)', async () => {
  await loadApplications();
  const res = await request('GET', '/applications/4');
  assert.equal(res.status, 200);
  assert.equal(res.body.company, 'Freshworks');
});

test('POST /applications returns 400 when the company is empty or missing', async () => {
  for (const company of ['', '   ', undefined, 42]) {
    const res = await request('POST', '/applications', { company, role: 'Intern' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /company/);
  }
});

test('POST /applications rejects other bad input with 400 and leaves the file unchanged', async () => {
  const savedBefore = await readDataFile();
  assert.equal((await request('POST', '/applications', { company: 'TCS', role: '' })).status, 400);
  assert.equal((await request('POST', '/applications', { company: 'TCS', role: 'Intern', status: 'hired' })).status, 400);
  assert.equal((await request('POST', '/applications', ['TCS'])).status, 400);
  assert.equal((await request('POST', '/applications', '{"company": "TCS"')).status, 400);
  assert.deepEqual(await readDataFile(), savedBefore);
});

test('PUT /applications/:id updates only the fields sent and saves', async () => {
  const res = await request('PUT', '/applications/1', { status: 'interview' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id: 1, company: 'Infosys', role: 'Backend Developer Intern', status: 'interview' });
  assert.equal((await readDataFile()).find((item) => item.id === 1).status, 'interview');
});

test('PUT /applications/:id returns 404 for a missing id and 400 for bad input', async () => {
  assert.equal((await request('PUT', '/applications/999', { status: 'offer' })).status, 404);
  assert.equal((await request('PUT', '/applications/1', { company: '' })).status, 400);
  assert.equal((await request('PUT', '/applications/1', { status: 'hired' })).status, 400);
  assert.equal((await request('PUT', '/applications/1', {})).status, 400);
});

test('DELETE /applications/:id removes the application from the file, then 404', async () => {
  const res = await request('DELETE', '/applications/3');
  assert.equal(res.status, 200);
  assert.equal(res.body.application.id, 3);
  assert.equal((await readDataFile()).some((item) => item.id === 3), false);
  assert.equal((await request('DELETE', '/applications/3')).status, 404);
});

test('parallel POST requests are all saved with unique ids', async () => {
  const companies = ['Swiggy', 'Zomato', 'Paytm', 'Flipkart', 'Meesho'];
  const results = await Promise.all(
    companies.map((company) => request('POST', '/applications', { company, role: 'Intern' })),
  );
  assert.equal(new Set(results.map((res) => res.body.id)).size, companies.length);
  const saved = await readDataFile();
  for (const company of companies) {
    assert.ok(saved.some((item) => item.company === company));
  }
});

test('unknown routes return a JSON 404', async () => {
  const res = await request('GET', '/jobs');
  assert.equal(res.status, 404);
  assert.match(res.contentType, /application\/json/);
});

test('loadApplications starts empty when the file is missing, without creating it', async () => {
  await fs.rm(DATA_FILE);
  assert.deepEqual(await loadApplications(), []);
  await assert.rejects(fs.access(DATA_FILE));
});

test('loadApplications throws a clear error for invalid JSON or a non-array file', async () => {
  await fs.writeFile(DATA_FILE, '{ not json');
  await assert.rejects(loadApplications(), /does not contain valid JSON/);
  await fs.writeFile(DATA_FILE, '{"id": 1}');
  await assert.rejects(loadApplications(), /must contain a JSON array/);
});
