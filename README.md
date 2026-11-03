# Job Applications API

**Author:** Amar Jadhav

A tiny REST API for tracking internship and job applications, built with **Node.js 22** and **Express**. Every application is saved to `data/applications.json` with `fs/promises`, so your list is still there after a restart.

## What I built

Each application has an `id`, a `company`, a `role` and a `status` (`applied`, `interview`, `offer` or `rejected`).

| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/applications` | **200**, all applications | - |
| GET | `/applications/:id` | **200**, one application | 400 invalid id, **404** missing id |
| POST | `/applications` | **201**, the new application | **400** empty company, empty role, unknown status, invalid JSON |
| PUT | `/applications/:id` | **200**, the updated application | 400 invalid input, 404 missing id |
| DELETE | `/applications/:id` | **200**, the deleted application | 400 invalid id, 404 missing id |

- **POST** needs `company` and `role` (non-empty text). `status` is optional and defaults to `applied`.
- **PUT** updates only the fields you send, for example `{ "status": "offer" }`.
- Every response is JSON, including errors, which look like `{ "error": "company is required and cannot be empty" }`.

### How the data is saved
- **Start-up:** `loadApplications()` reads `data/applications.json`. It only reads and never writes. A missing file means "no applications yet". If the file holds invalid JSON, the server prints a clear error and stops, so your data is never overwritten.
- **After every POST, PUT and DELETE:** the change is applied to a copy of the list and written to a temporary file, which is then renamed over `data/applications.json`. Memory is updated only after the save succeeds, and a crash never leaves a half-written file.
- **One change at a time:** changes go through a small queue, so two requests arriving together can't overwrite each other.
- New ids continue from the highest saved id.

## Files

| File | Purpose |
|---|---|
| `server.js` | The Express API and file storage |
| `data/applications.json` | Sample data with three applications |
| `requests.sh` | One curl command for every route, plus a 404 and a 400 example |
| `REVIEW.md` | A real session: every request and its response, including the restart check |
| `test/server.test.js` | Automated tests with Node's built-in `node:test` |

## Setup

Requirements: Node.js 22 or later, plus Git Bash (on Windows) or any macOS/Linux terminal to run `requests.sh`.

```bash
git clone https://github.com/exelynt-learning-platform/node-js-rest-apis-st-assignment-128551-amar.git
cd node-js-rest-apis-st-assignment-128551-amar
npm install
npm start
```

The server prints:

```
Job applications API running at http://localhost:3000
Loaded 3 applications from data/applications.json
```

Use `PORT=4000 npm start` to run on another port.

## Trying the requests

With the server running, open a second terminal:

```bash
bash requests.sh
```

It sends a GET, POST, PUT and DELETE request, plus a missing id and an empty company, and prints each response with its status code. It really changes `data/applications.json`; run `git checkout -- data/applications.json` to get the sample data back.

Single requests:

```bash
curl http://localhost:3000/applications
curl -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company":"Freshworks","role":"API Developer Intern"}'
curl -X PUT http://localhost:3000/applications/1 -H "Content-Type: application/json" -d '{"status":"offer"}'
curl -X DELETE http://localhost:3000/applications/2
```

You can send the same requests from **Thunder Client** in VS Code.

## Tests

```bash
npm test
```

There are 14 tests, run against a temporary data file so `data/applications.json` is never touched. They cover every route and status code (200, 201, 400, 404), that changes are written to the file and still there after reloading, that parallel requests are all saved with unique ids, and that a missing or broken data file is handled safely.

## What I learned
- Designing a REST resource: one URL (`/applications`), with HTTP methods for list, read, create, update and delete
- Choosing the right status codes: **201** for created, **404** for a missing id, **400** for invalid input
- Reading route parameters and JSON bodies in Express, and validating them with clear error messages
- Saving data with `fs/promises` so it survives a restart, and writing files safely with a temp file plus rename and one write at a time
- Testing an API three ways: curl and `requests.sh`, Thunder Client, and automated `node:test` tests
- Working on a feature branch, committing in small steps and merging through a pull request
