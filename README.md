# Saved Tasks API: Saving Data & Testing Requests

**Author:** Amar Jadhav

The Tasks REST API from the CRUD lesson, now with file storage. Tasks are loaded from `data/tasks.json` when the server starts and saved back to the file after every POST, PUT and DELETE, so they survive a restart.

## Endpoints

| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/tasks` | 200, all tasks | - |
| GET | `/tasks/:id` | 200, one task | 400 invalid id, 404 not found |
| POST | `/tasks` | **201**, the new task (saved) | 400 invalid input or JSON |
| PUT | `/tasks/:id` | 200, the updated task (saved) | 400 invalid input, 404 not found |
| DELETE | `/tasks/:id` | 200, the deleted task (saved) | 400 invalid id, 404 not found |

A task looks like `{ "id": 1, "title": "Buy milk", "done": false }`. `title` is a required non-empty string; `done` is an optional boolean.

## How saving works
- **Start-up:** `loadTasks()` reads `data/tasks.json` with `fs/promises`. If the file is missing, it starts with an empty list and creates it. If the file holds invalid JSON, the server prints a clear error and stops, so your data is never overwritten.
- **After every change:** the change is applied to a copy of the tasks, written to `data/tasks.json.tmp`, and then renamed over `data/tasks.json`. A crash mid-write never leaves a half-written file, and memory changes only after the save succeeds.
- **One change at a time:** changes run through a small queue, so two requests arriving together can't overwrite each other's save.
- **Ids:** new ids continue from the highest id in the file, so they keep counting up after a restart.
- Set `TASKS_FILE=/path/to/file.json` to use a different data file (the tests use this).

The restart check, with real curl output, is in [REVIEW.md](REVIEW.md).

## Setup and run

Requires Node.js 22 or later.

```bash
npm install
npm start          # or: node tasks-api.js
```

## Testing the requests with requests.sh

`requests.sh` has one curl command for each of the five routes and prints each response with its status code.

1. Start the server in one terminal: `npm start`
2. In a second terminal (Git Bash on Windows, or any macOS/Linux terminal) run:

```bash
bash requests.sh
```

To test a server on another port: `BASE_URL=http://localhost:4000 bash requests.sh`.

The script really changes the data: it adds a task, marks task 1 as done and deletes task 2. Running it a second time returns `404` for the delete, because task 2 is already gone.

You can also send the same requests from **Thunder Client** in VS Code: create a request, pick the method, enter the URL, and for POST/PUT add a JSON body.

## Automated tests

```bash
npm test
```

`test/tasks-api.test.js` uses Node's built-in `node:test` runner against a temporary data file, so `data/tasks.json` is never touched. It checks every route and status code, that changes are written to the file, that tasks are still there after reloading, that parallel POSTs are all saved with unique ids, and that invalid input leaves the file unchanged.

## What I learned
- Reading and writing JSON files with `fs/promises` (`readFile`, `writeFile`, `rename`, `mkdir`)
- Loading data at start-up and saving after every change so it survives a restart
- Writing files safely: a temp file plus rename, and one write at a time
- Testing an API with curl, a reusable `requests.sh` script and Thunder Client
