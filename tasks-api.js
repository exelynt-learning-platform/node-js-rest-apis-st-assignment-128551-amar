const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.TASKS_FILE || path.join(__dirname, 'data', 'tasks.json');

// Tasks are loaded from DATA_FILE at start-up and saved after every change
let tasks = [];

// Every change goes through this queue, so two requests never write the file at the same time
let changeQueue = Promise.resolve();

app.use(express.json());

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// Reads tasks from the JSON file. A missing file starts an empty list; a broken file stops the server.
async function loadTasks() {
  try {
    const fileContents = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(fileContents);
    if (!Array.isArray(parsed)) {
      throw new Error('the file must contain a JSON array of tasks');
    }
    tasks = parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      tasks = [];
      await saveTasks(tasks);
    } else {
      throw new Error(`Could not load ${DATA_FILE}: ${error.message}`);
    }
  }
  return tasks;
}

// Writes to a temporary file first, then renames it, so a crash never leaves a half-written file
async function saveTasks(taskList) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(taskList, null, 2) + '\n', 'utf8');
  await fs.rename(tempFile, DATA_FILE);
}

// Runs a change on a copy of the tasks, saves it, and only then keeps it in memory
function changeTasks(applyChange) {
  const run = changeQueue.then(async () => {
    const draft = structuredClone(tasks);
    const result = applyChange(draft);
    if (result.changed) {
      await saveTasks(draft);
      tasks = draft;
    }
    return result;
  });
  changeQueue = run.catch(() => {});
  return run;
}

function getNextId(taskList) {
  return taskList.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1;
}

// Returns a positive integer id from the URL, or null if it is not valid
function parseId(value) {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

// Checks title and done. When requireTitle is false, missing fields are allowed (used by PUT).
function validateTaskInput(body, { requireTitle }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }

  const { title, done } = body;

  if (title === undefined && requireTitle) {
    return 'title is required';
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return 'title must be a non-empty string';
  }
  if (done !== undefined && typeof done !== 'boolean') {
    return 'done must be true or false';
  }
  if (!requireTitle && title === undefined && done === undefined) {
    return 'Provide title and/or done to update';
  }
  return null;
}

// Runs before the /:id routes and rejects ids that are not positive whole numbers
app.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return sendError(res, 400, 'id must be a positive whole number');
  }
  req.taskId = id;
  next();
});

// GET /tasks - list all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// GET /tasks/:id - one task, or 404 if it does not exist
app.get('/tasks/:id', (req, res) => {
  const task = tasks.find((item) => item.id === req.taskId);
  if (!task) {
    return sendError(res, 404, `Task ${req.taskId} not found`);
  }
  res.json(task);
});

// POST /tasks - create a task, save it and return it with 201
app.post('/tasks', async (req, res) => {
  const validationError = validateTaskInput(req.body, { requireTitle: true });
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const { task } = await changeTasks((draft) => {
    const newTask = {
      id: getNextId(draft),
      title: req.body.title.trim(),
      done: req.body.done ?? false,
    };
    draft.push(newTask);
    return { changed: true, task: newTask };
  });

  res.status(201).json(task);
});

// PUT /tasks/:id - update the title and/or done status, then save
app.put('/tasks/:id', async (req, res) => {
  const validationError = validateTaskInput(req.body, { requireTitle: false });
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const { title, done } = req.body;
  const { changed, task } = await changeTasks((draft) => {
    const index = draft.findIndex((item) => item.id === req.taskId);
    if (index === -1) {
      return { changed: false };
    }
    draft[index] = {
      ...draft[index],
      ...(title !== undefined && { title: title.trim() }),
      ...(done !== undefined && { done }),
    };
    return { changed: true, task: draft[index] };
  });

  if (!changed) {
    return sendError(res, 404, `Task ${req.taskId} not found`);
  }
  res.json(task);
});

// DELETE /tasks/:id - remove a task, save, and return the deleted task
app.delete('/tasks/:id', async (req, res) => {
  const { changed, task } = await changeTasks((draft) => {
    const index = draft.findIndex((item) => item.id === req.taskId);
    if (index === -1) {
      return { changed: false };
    }
    const [deletedTask] = draft.splice(index, 1);
    return { changed: true, task: deletedTask };
  });

  if (!changed) {
    return sendError(res, 404, `Task ${req.taskId} not found`);
  }
  res.json({ message: `Task ${task.id} deleted`, task });
});

// Unknown routes get a JSON 404
app.use((req, res) => {
  sendError(res, 404, `Route ${req.method} ${req.path} not found`);
});

// Invalid JSON bodies and unexpected errors (for example a failed file write) return JSON
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return sendError(res, 400, 'Request body is not valid JSON');
  }
  console.error(error);
  sendError(res, 500, 'Something went wrong');
});

async function startServer() {
  try {
    await loadTasks();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const server = http.createServer(app);

  // Attach the error listener before listening so startup errors are always caught
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other server or set a different PORT.`);
    } else {
      console.error('Server failed to start:', error.message);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`Tasks API running at http://localhost:${PORT} (data file: ${path.relative(process.cwd(), DATA_FILE)})`);
  });
}

// Start the server only when this file is run directly (tests import the app instead)
if (require.main === module) {
  startServer();
}

module.exports = { app, loadTasks, DATA_FILE };
