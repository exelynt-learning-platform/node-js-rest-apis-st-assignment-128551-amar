# REVIEW: Tasks API

Requests made with curl against `node tasks-api.js` on http://localhost:3000, in this order, starting from a fresh server. Each response is pasted exactly as returned, with its HTTP status code.

## Main routes

### GET /tasks: list all tasks

```bash
curl http://localhost:3000/tasks
```

Response: **200**

```json
[
  {
    "id": 1,
    "title": "Buy milk for the chai stall",
    "done": false
  },
  {
    "id": 2,
    "title": "Finish the Express routes lesson",
    "done": true
  },
  {
    "id": 3,
    "title": "Push the Tasks API to GitHub",
    "done": false
  }
]
```

### GET /tasks/:id: one task

```bash
curl http://localhost:3000/tasks/2
```

Response: **200**

```json
{
  "id": 2,
  "title": "Finish the Express routes lesson",
  "done": true
}
```

### POST /tasks: create a task

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Practise curl commands"}'
```

Response: **201**

```json
{
  "id": 4,
  "title": "Practise curl commands",
  "done": false
}
```

### PUT /tasks/:id: update a task

```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"done":true}'
```

Response: **200**

```json
{
  "id": 1,
  "title": "Buy milk for the chai stall",
  "done": true
}
```

### DELETE /tasks/:id: delete a task

```bash
curl -X DELETE http://localhost:3000/tasks/3
```

Response: **200**

```json
{
  "message": "Task 3 deleted",
  "task": {
    "id": 3,
    "title": "Push the Tasks API to GitHub",
    "done": false
  }
}
```

### GET /tasks: list after the changes

```bash
curl http://localhost:3000/tasks
```

Response: **200**

```json
[
  {
    "id": 1,
    "title": "Buy milk for the chai stall",
    "done": true
  },
  {
    "id": 2,
    "title": "Finish the Express routes lesson",
    "done": true
  },
  {
    "id": 4,
    "title": "Practise curl commands",
    "done": false
  }
]
```

## Error cases

### GET a task that does not exist (404)

```bash
curl http://localhost:3000/tasks/99
```

Response: **404**

```json
{
  "error": "Task 99 not found"
}
```

### PUT a task that does not exist (404)

```bash
curl -X PUT http://localhost:3000/tasks/99 -H "Content-Type: application/json" -d '{"done":true}'
```

Response: **404**

```json
{
  "error": "Task 99 not found"
}
```

### DELETE a task that was already deleted (404)

```bash
curl -X DELETE http://localhost:3000/tasks/3
```

Response: **404**

```json
{
  "error": "Task 3 not found"
}
```

### Invalid id (400)

```bash
curl http://localhost:3000/tasks/abc
```

Response: **400**

```json
{
  "error": "id must be a positive whole number"
}
```

### POST without a title (400)

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"done":false}'
```

Response: **400**

```json
{
  "error": "title is required"
}
```

### POST with an empty title (400)

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"   "}'
```

Response: **400**

```json
{
  "error": "title must be a non-empty string"
}
```

### PUT with a non-boolean done (400)

```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"done":"yes"}'
```

Response: **400**

```json
{
  "error": "done must be true or false"
}
```

### PUT with nothing to update (400)

```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{}'
```

Response: **400**

```json
{
  "error": "Provide title and/or done to update"
}
```

### POST with invalid JSON (400)

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title": "oops"'
```

Response: **400**

```json
{
  "error": "Request body is not valid JSON"
}
```

### POST with a JSON array instead of an object (400)

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '["Practise curl"]'
```

Response: **400**

```json
{
  "error": "Request body must be a JSON object"
}
```

### Unknown route (404)

```bash
curl http://localhost:3000/projects
```

Response: **404**

```json
{
  "error": "Route GET /projects not found"
}
```

