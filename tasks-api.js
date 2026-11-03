const http = require('node:http');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory store: data resets when the server restarts
const tasks = [
  { id: 1, title: 'Buy milk for the chai stall', done: false },
  { id: 2, title: 'Finish the Express routes lesson', done: true },
  { id: 3, title: 'Push the Tasks API to GitHub', done: false },
];
let nextId = tasks.length + 1;

app.use(express.json());

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// Returns a positive integer id from the URL, or null if it is not valid
function parseId(value) {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

function findTaskIndex(id) {
  return tasks.findIndex((task) => task.id === id);
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
  const index = findTaskIndex(req.taskId);
  if (index === -1) {
    return sendError(res, 404, `Task ${req.taskId} not found`);
  }
  res.json(tasks[index]);
});

// POST /tasks - create a task and return it with 201
app.post('/tasks', (req, res) => {
  const validationError = validateTaskInput(req.body, { requireTitle: true });
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const newTask = {
    id: nextId++,
    title: req.body.title.trim(),
    done: req.body.done ?? false,
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT /tasks/:id - update the title and/or done status
app.put('/tasks/:id', (req, res) => {
  const index = findTaskIndex(req.taskId);
  if (index === -1) {
    return sendError(res, 404, `Task ${req.taskId} not found`);
  }

  const validationError = validateTaskInput(req.body, { requireTitle: false });
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const { title, done } = req.body;
  const updatedTask = {
    ...tasks[index],
    ...(title !== undefined && { title: title.trim() }),
    ...(done !== undefined && { done }),
  };
  tasks[index] = updatedTask;
  res.json(updatedTask);
});

// DELETE /tasks/:id - remove a task and return it
app.delete('/tasks/:id', (req, res) => {
  const index = findTaskIndex(req.taskId);
  if (index === -1) {
    return sendError(res, 404, `Task ${req.taskId} not found`);
  }

  const [deletedTask] = tasks.splice(index, 1);
  res.json({ message: `Task ${deletedTask.id} deleted`, task: deletedTask });
});

// Unknown routes get a JSON 404
app.use((req, res) => {
  sendError(res, 404, `Route ${req.method} ${req.path} not found`);
});

// Invalid JSON bodies and unexpected errors return JSON instead of an HTML page
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return sendError(res, 400, 'Request body is not valid JSON');
  }
  console.error(error);
  sendError(res, 500, 'Something went wrong');
});

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
  console.log(`Tasks API running at http://localhost:${PORT}`);
});
