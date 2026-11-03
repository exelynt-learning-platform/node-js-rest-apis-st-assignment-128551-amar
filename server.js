const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.APPLICATIONS_FILE || path.join(__dirname, 'data', 'applications.json');
const VALID_STATUSES = ['applied', 'interview', 'offer', 'rejected'];

// Applications are loaded from DATA_FILE at start-up and saved after every change
let applications = [];

// Every change goes through this queue, so two requests never write the file at the same time
let changeQueue = Promise.resolve();

app.use(express.json());

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// Reads applications from the JSON file into memory. Read-only: it never writes to disk.
// A missing file means "no applications yet" (the file is created on the first save).
// A file with invalid JSON, or JSON that is not an array, throws so the server can stop safely.
async function loadApplications() {
  let fileContents;
  try {
    fileContents = await fs.readFile(DATA_FILE, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      applications = [];
      return applications;
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(fileContents);
  } catch (error) {
    throw new Error(`${DATA_FILE} does not contain valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${DATA_FILE} must contain a JSON array of applications`);
  }

  applications = parsed;
  return applications;
}

// Writes to a temporary file first, then renames it, so a crash never leaves a half-written file
async function saveApplications(applicationList) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(applicationList, null, 2) + '\n', 'utf8');
  await fs.rename(tempFile, DATA_FILE);
}

// Applies a change to a copy of the list, saves it, and only then keeps it in memory
function changeApplications(applyChange) {
  const run = changeQueue.then(async () => {
    const draft = structuredClone(applications);
    const result = applyChange(draft);
    if (result.changed) {
      await saveApplications(draft);
      applications = draft;
    }
    return result;
  });
  changeQueue = run.catch(() => {});
  return run;
}

function getNextId(applicationList) {
  return applicationList.reduce((maxId, application) => Math.max(maxId, application.id), 0) + 1;
}

// Returns a positive integer id from the URL, or null if it is not valid
function parseId(value) {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// Checks company, role and status. For PUT (isUpdate) every field is optional but at least one is needed.
function validateApplicationInput(body, { isUpdate }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }

  const { company, role, status } = body;

  if ((!isUpdate || company !== undefined) && !isNonEmptyString(company)) {
    return 'company is required and cannot be empty';
  }
  if ((!isUpdate || role !== undefined) && !isNonEmptyString(role)) {
    return 'role is required and cannot be empty';
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return `status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (isUpdate && company === undefined && role === undefined && status === undefined) {
    return 'Provide company, role and/or status to update';
  }
  return null;
}

// Runs before every /:id route and rejects ids that are not positive whole numbers
app.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return sendError(res, 400, 'id must be a positive whole number');
  }
  req.applicationId = id;
  next();
});

// GET /applications - list all applications
app.get('/applications', (req, res) => {
  res.json(applications);
});

// GET /applications/:id - one application, or 404 if it does not exist
app.get('/applications/:id', (req, res) => {
  const application = applications.find((item) => item.id === req.applicationId);
  if (!application) {
    return sendError(res, 404, `Application ${req.applicationId} not found`);
  }
  res.json(application);
});

// POST /applications - create an application, save it and return it with 201
app.post('/applications', async (req, res) => {
  const validationError = validateApplicationInput(req.body, { isUpdate: false });
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const { application } = await changeApplications((draft) => {
    const newApplication = {
      id: getNextId(draft),
      company: req.body.company.trim(),
      role: req.body.role.trim(),
      status: req.body.status ?? 'applied',
    };
    draft.push(newApplication);
    return { changed: true, application: newApplication };
  });

  res.status(201).json(application);
});

// PUT /applications/:id - update company, role and/or status, then save
app.put('/applications/:id', async (req, res) => {
  const validationError = validateApplicationInput(req.body, { isUpdate: true });
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const { company, role, status } = req.body;
  const { changed, application } = await changeApplications((draft) => {
    const index = draft.findIndex((item) => item.id === req.applicationId);
    if (index === -1) {
      return { changed: false };
    }
    draft[index] = {
      ...draft[index],
      ...(company !== undefined && { company: company.trim() }),
      ...(role !== undefined && { role: role.trim() }),
      ...(status !== undefined && { status }),
    };
    return { changed: true, application: draft[index] };
  });

  if (!changed) {
    return sendError(res, 404, `Application ${req.applicationId} not found`);
  }
  res.json(application);
});

// DELETE /applications/:id - remove an application, save, and return what was deleted
app.delete('/applications/:id', async (req, res) => {
  const { changed, application } = await changeApplications((draft) => {
    const index = draft.findIndex((item) => item.id === req.applicationId);
    if (index === -1) {
      return { changed: false };
    }
    const [deletedApplication] = draft.splice(index, 1);
    return { changed: true, application: deletedApplication };
  });

  if (!changed) {
    return sendError(res, 404, `Application ${req.applicationId} not found`);
  }
  res.json({ message: `Application ${application.id} deleted`, application });
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
    await loadApplications();
  } catch (error) {
    console.error(`Could not start: ${error.message}`);
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
    console.log(`Job applications API running at http://localhost:${PORT}`);
    console.log(`Loaded ${applications.length} applications from ${path.relative(process.cwd(), DATA_FILE)}`);
  });
}

// Start the server only when this file is run directly (tests import the app instead)
if (require.main === module) {
  startServer();
}

module.exports = { app, loadApplications, DATA_FILE, VALID_STATUSES };
