# REVIEW: Job Applications API

A real session recorded with curl in Git Bash against `node server.js` on http://localhost:3000, starting from the sample `data/applications.json`. Every response is pasted exactly as the API returned it, with its HTTP status code.

## 1. Start the server

```
$ node server.js
Job applications API running at http://localhost:3000
Loaded 3 applications from data\applications.json
```

## 2. The five routes

### GET /applications: list all applications

```bash
curl http://localhost:3000/applications
```

Response: **200**

```json
[
  {
    "id": 1,
    "company": "Infosys",
    "role": "Backend Developer Intern",
    "status": "applied"
  },
  {
    "id": 2,
    "company": "Zoho",
    "role": "Node.js Developer",
    "status": "interview"
  },
  {
    "id": 3,
    "company": "Razorpay",
    "role": "Software Engineer Intern",
    "status": "offer"
  }
]
```

### GET /applications/:id: one application

```bash
curl http://localhost:3000/applications/2
```

Response: **200**

```json
{
  "id": 2,
  "company": "Zoho",
  "role": "Node.js Developer",
  "status": "interview"
}
```

### POST /applications: create an application (201)

```bash
curl -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company":"Freshworks","role":"API Developer Intern"}'
```

Response: **201**

```json
{
  "id": 4,
  "company": "Freshworks",
  "role": "API Developer Intern",
  "status": "applied"
}
```

### PUT /applications/:id: update the status

```bash
curl -X PUT http://localhost:3000/applications/1 -H "Content-Type: application/json" -d '{"status":"interview"}'
```

Response: **200**

```json
{
  "id": 1,
  "company": "Infosys",
  "role": "Backend Developer Intern",
  "status": "interview"
}
```

### DELETE /applications/:id: delete an application

```bash
curl -X DELETE http://localhost:3000/applications/3
```

Response: **200**

```json
{
  "message": "Application 3 deleted",
  "application": {
    "id": 3,
    "company": "Razorpay",
    "role": "Software Engineer Intern",
    "status": "offer"
  }
}
```

## 3. Error cases

### Missing id (404)

```bash
curl http://localhost:3000/applications/99
```

Response: **404**

```json
{
  "error": "Application 99 not found"
}
```

### Update a missing id (404)

```bash
curl -X PUT http://localhost:3000/applications/99 -H "Content-Type: application/json" -d '{"status":"offer"}'
```

Response: **404**

```json
{
  "error": "Application 99 not found"
}
```

### Delete an id that was already deleted (404)

```bash
curl -X DELETE http://localhost:3000/applications/3
```

Response: **404**

```json
{
  "error": "Application 3 not found"
}
```

### Empty company (400)

```bash
curl -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company":"","role":"Intern"}'
```

Response: **400**

```json
{
  "error": "company is required and cannot be empty"
}
```

### Company with only spaces (400)

```bash
curl -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company":"   ","role":"Intern"}'
```

Response: **400**

```json
{
  "error": "company is required and cannot be empty"
}
```

### Missing role (400)

```bash
curl -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company":"TCS"}'
```

Response: **400**

```json
{
  "error": "role is required and cannot be empty"
}
```

### Unknown status (400)

```bash
curl -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company":"TCS","role":"Intern","status":"hired"}'
```

Response: **400**

```json
{
  "error": "status must be one of: applied, interview, offer, rejected"
}
```

### Clearing the company on update (400)

```bash
curl -X PUT http://localhost:3000/applications/1 -H "Content-Type: application/json" -d '{"company":""}'
```

Response: **400**

```json
{
  "error": "company is required and cannot be empty"
}
```

### Invalid id (400)

```bash
curl http://localhost:3000/applications/abc
```

Response: **400**

```json
{
  "error": "id must be a positive whole number"
}
```

### Invalid JSON body (400)

```bash
curl -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company": "TCS"'
```

Response: **400**

```json
{
  "error": "Request body is not valid JSON"
}
```

### Unknown route (404)

```bash
curl http://localhost:3000/jobs
```

Response: **404**

```json
{
  "error": "Route GET /jobs not found"
}
```

## 4. Saved to the file: still there after a restart

Before the restart, `data/applications.json` contains the new Freshworks application (id 4):

```bash
$ cat data/applications.json
[
  {
    "id": 1,
    "company": "Infosys",
    "role": "Backend Developer Intern",
    "status": "interview"
  },
  {
    "id": 2,
    "company": "Zoho",
    "role": "Node.js Developer",
    "status": "interview"
  },
  {
    "id": 4,
    "company": "Freshworks",
    "role": "API Developer Intern",
    "status": "applied"
  }
]
```

The server process was stopped and started again:

```
$ node server.js
Job applications API running at http://localhost:3000
Loaded 3 applications from data\applications.json
```

### GET /applications/4 after the restart

```bash
curl http://localhost:3000/applications/4
```

Response: **200**

```json
{
  "id": 4,
  "company": "Freshworks",
  "role": "API Developer Intern",
  "status": "applied"
}
```

### GET /applications after the restart

```bash
curl http://localhost:3000/applications
```

Response: **200**

```json
[
  {
    "id": 1,
    "company": "Infosys",
    "role": "Backend Developer Intern",
    "status": "interview"
  },
  {
    "id": 2,
    "company": "Zoho",
    "role": "Node.js Developer",
    "status": "interview"
  },
  {
    "id": 4,
    "company": "Freshworks",
    "role": "API Developer Intern",
    "status": "applied"
  }
]
```

Application 4 (Freshworks) and the status change to application 1 are still there, and application 3 is still deleted, because the server loaded everything back from `data/applications.json`.

## 5. Running requests.sh

```
$ bash requests.sh
1. GET /applications - list all applications
[{"id":1,"company":"Infosys","role":"Backend Developer Intern","status":"interview"},{"id":2,"company":"Zoho","role":"Node.js Developer","status":"interview"},{"id":4,"company":"Freshworks","role":"API Developer Intern","status":"applied"}]
Status: 200

2. GET /applications/1 - get one application
{"id":1,"company":"Infosys","role":"Backend Developer Intern","status":"interview"}
Status: 200

3. POST /applications - create an application (201)
{"id":5,"company":"Freshworks","role":"API Developer Intern","status":"applied"}
Status: 201

4. PUT /applications/1 - move application 1 to the interview stage
{"id":1,"company":"Infosys","role":"Backend Developer Intern","status":"interview"}
Status: 200

5. DELETE /applications/2 - delete application 2
{"message":"Application 2 deleted","application":{"id":2,"company":"Zoho","role":"Node.js Developer","status":"interview"}}
Status: 200

6. GET /applications/999 - missing id (404)
{"error":"Application 999 not found"}
Status: 404

7. POST /applications with an empty company (400)
{"error":"company is required and cannot be empty"}
Status: 400

```

## 6. After recording

`data/applications.json` was reset to the three sample applications (`git checkout -- data/applications.json`), so a fresh clone starts from the same data used at the top of this file.
