# REVIEW: Saved Tasks API

Everything below was run with curl in Git Bash against `node tasks-api.js` on http://localhost:3000. Responses are pasted exactly as returned.

## 1. Start the server and list the tasks loaded from data/tasks.json

```
$ node tasks-api.js
Tasks API running at http://localhost:3000 (data file: data	asks.json)
```

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

## 2. Add a new task

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Learn fs/promises"}'
```

Response: **201**

```json
{
  "id": 4,
  "title": "Learn fs/promises",
  "done": false
}
```

The task is now saved in the file:

```bash
$ tail -6 data/tasks.json
  {
    "id": 4,
    "title": "Learn fs/promises",
    "done": false
  }
]
```

## 3. Restart the server

Stopped the server process and started it again:

```
$ node tasks-api.js
Tasks API running at http://localhost:3000 (data file: data	asks.json)
```

## 4. The added task is still there after the restart

```bash
curl http://localhost:3000/tasks/4
```

Response: **200**

```json
{
  "id": 4,
  "title": "Learn fs/promises",
  "done": false
}
```

Task 4 ("Learn fs/promises") survived the restart because it was loaded back from `data/tasks.json`.

## 5. Running requests.sh (one curl command for each of the five routes)

```
$ bash requests.sh
1. GET /tasks - list all tasks
[{"id":1,"title":"Buy milk for the chai stall","done":false},{"id":2,"title":"Finish the Express routes lesson","done":true},{"id":3,"title":"Push the Tasks API to GitHub","done":false},{"id":4,"title":"Learn fs/promises","done":false}]
Status: 200

2. POST /tasks - create a task
{"id":5,"title":"Test the API with requests.sh","done":false}
Status: 201

3. GET /tasks/1 - get one task
{"id":1,"title":"Buy milk for the chai stall","done":false}
Status: 200

4. PUT /tasks/1 - mark task 1 as done
{"id":1,"title":"Buy milk for the chai stall","done":true}
Status: 200

5. DELETE /tasks/2 - delete task 2
{"message":"Task 2 deleted","task":{"id":2,"title":"Finish the Express routes lesson","done":true}}
Status: 200

```

