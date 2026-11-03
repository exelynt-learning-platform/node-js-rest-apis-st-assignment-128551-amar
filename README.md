# Tasks API: A CRUD REST API

**Author:** Amar Jadhav

A small REST API for to-do tasks built with Node.js and Express. Tasks are kept in an in-memory array that starts with three tasks and resets when the server restarts.

## Endpoints

| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/tasks` | 200, all tasks | - |
| GET | `/tasks/:id` | 200, one task | 400 invalid id, 404 not found |
| POST | `/tasks` | **201**, the new task | 400 missing/empty `title`, bad `done`, invalid JSON |
| PUT | `/tasks/:id` | 200, the updated task | 400 invalid input, 404 not found |
| DELETE | `/tasks/:id` | 200, the deleted task | 400 invalid id, 404 not found |

A task looks like `{ "id": 1, "title": "Buy milk", "done": false }`.
- `title`: required for POST; must be a non-empty string
- `done`: optional boolean, defaults to `false`
- PUT updates only the fields you send (`title` and/or `done`)

Every response, including errors, is JSON: `{ "error": "..." }`.
All requests and their responses are in [REVIEW.md](REVIEW.md).

## Setup and run

Requires Node.js 22 or later.

```bash
npm install
npm start          # or: node tasks-api.js
```

Try it:

```bash
curl http://localhost:3000/tasks
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Learn REST"}'
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"done":true}'
curl -X DELETE http://localhost:3000/tasks/1
```

## Automated tests

`test/tasks-api.test.js` uses Node's built-in test runner (`node:test`) and `fetch` to check every route, status code and error case. Nothing extra needs installing.

```bash
npm test
```

## What I learned
- How REST maps HTTP methods (GET, POST, PUT, DELETE) to actions on a resource
- Reading a JSON request body with `express.json()`
- Using an in-memory array as a simple data store
- Returning the right status codes: 200, 201, 400 and 404
- Validating input and returning clear JSON errors, including for invalid JSON
- Writing automated API tests with `node:test`
